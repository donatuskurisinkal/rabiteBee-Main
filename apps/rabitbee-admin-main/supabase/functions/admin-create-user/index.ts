
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.22.0";
import { jwtDecode } from "https://esm.sh/jwt-decode@4.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log("Admin create user function called");
    
    // Create a Supabase client with the admin key
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    
    console.log("Supabase URL:", supabaseUrl ? "Present" : "Missing");
    console.log("Supabase Service Role Key:", supabaseServiceRoleKey ? "Present" : "Missing");
    
    const supabaseAdmin = createClient(
      supabaseUrl,
      supabaseServiceRoleKey,
      { auth: { persistSession: false } }
    );

    // Get the authorization header from the request
    const authHeader = req.headers.get('Authorization');
    
    console.log("Authorization header present:", !!authHeader);
    
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    // Extract the JWT token from the Authorization header
    const token = authHeader.replace('Bearer ', '');
    console.log("Token extracted from Authorization header");
    
    // Decode the JWT token to get the user ID (sub claim)
    let userId = '';
    try {
      const decoded: any = jwtDecode(token);
      userId = decoded.sub; // sub claim contains the user ID
      console.log("User ID extracted from token:", userId);
    } catch (err) {
      console.error("JWT decode failed:", err);
      return new Response(
        JSON.stringify({ error: 'Invalid token format' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }
    
    if (!userId) {
      console.error("No user ID found in token");
      return new Response(
        JSON.stringify({ error: 'Invalid token: no user ID found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }
    
    // Verify the user exists and has admin role
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('role, role_id')
      .eq('id', userId)
      .single();
    
    if (userError || !userData) {
      console.error("Error fetching user from DB:", userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Invalid user ID' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    console.log("User role data:", userData);
    
    if (!userData || (userData.role !== 'admin' && userData.role !== 'Admin')) {
      console.error("User is not admin. Role is:", userData?.role);
      return new Response(
        JSON.stringify({ error: 'Forbidden: Admin privileges required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      );
    }

    console.log("Admin privileges confirmed, proceeding with user creation");

    // Get the request body
    const body = await req.json();
    console.log("Request body:", body);
    
    const { 
      username, 
      first_name, 
      last_name, 
      email, 
      phone,
      role_id, 
      is_active, 
      tenant_id 
    } = body;

    // Validate required fields
    if (!username || !email || !role_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Find role details to get role name
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from("roles")
      .select("name")
      .eq("id", role_id)
      .single();

    if (roleError || !roleData) {
      console.error("Error fetching role:", roleError);
      return new Response(
        JSON.stringify({ error: 'Invalid role ID' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log("Role found:", roleData);

    // Generate random password with special characters, numbers, and uppercase letters
    const generateSecurePassword = () => {
      // Generate a base with lowercase letters and numbers
      const base = Math.random().toString(36).slice(2, 10);
      // Add an uppercase letter
      const upperCase = String.fromCharCode(65 + Math.floor(Math.random() * 26));
      // Add a number
      const number = Math.floor(Math.random() * 10);
      // Add a special character
      const specialChars = '!@#$%^&*()';
      const specialChar = specialChars.charAt(Math.floor(Math.random() * specialChars.length));
      
      // Combine all parts and shuffle
      return shuffleString(`${base}${upperCase}${number}${specialChar}`);
    };

    // Simple string shuffle function
    const shuffleString = (str: string) => {
      const arr = str.split('');
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr.join('');
    };

    const randomPassword = generateSecurePassword();
    console.log("Generated temporary password for new user");

    // Create user in auth.users with a temporary password
    const { data: authData, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: randomPassword,
      email_confirm: true,
      user_metadata: {
        first_name: first_name || '',
        last_name: last_name || '',
        username,
      }
    });

    if (createUserError || !authData?.user) {
      console.error("Error creating auth user:", createUserError);
      return new Response(
        JSON.stringify({ error: createUserError?.message || 'Failed to create user' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log("Auth user created successfully:", authData.user.id);

    // Create user profile in public.users table
    const { error: profileError } = await supabaseAdmin
      .from('users')
      .insert({
        id: authData.user.id,
        username,
        first_name: first_name || '',
        last_name: last_name || '',
        role: roleData.name,
        role_id,
        phone,
        is_verified: true,
        isActive: is_active === undefined ? true : is_active,
        tenant_id: tenant_id || null,
      });

    if (profileError) {
      console.error("Error creating user profile:", profileError);
      
      // If profile creation fails, clean up by deleting the auth user
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      
      return new Response(
        JSON.stringify({ error: profileError.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log("User profile created successfully");

    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: authData.user.id,
          email,
          username,
          first_name: first_name || '',
          last_name: last_name || '',
          role: roleData.name,
          role_id,
          phone,
          tenant_id,
          is_verified: true,
          isActive: is_active === undefined ? true : is_active,
          temp_password: randomPassword
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('Error in admin-create-user function:', error);
    
    return new Response(
      JSON.stringify({ error: error.message || 'Unknown error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
