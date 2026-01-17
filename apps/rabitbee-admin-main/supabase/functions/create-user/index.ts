
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.22.0"

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
    // Create a Supabase client with the Admin key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    const body = await req.json();
    const { email, password, userMetadata, username, first_name, last_name, role_id, role, phone, is_verified, isActive, tenant_id } = body;

    if (!email || !password || !username || !first_name || !last_name || !role_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log('REQUEST BODY:', JSON.stringify(body, null, 2));

    // Check if username already exists - improved error handling
    try {
      console.log('Checking if username exists:', username);
      const { data: existingUsers, error: usernameCheckError } = await supabaseAdmin
        .from("users")
        .select("username")
        .eq("username", username);

      if (usernameCheckError) {
        console.error('Error checking username:', usernameCheckError);
        return new Response(
          JSON.stringify({ error: `Failed to check username: ${usernameCheckError.message}` }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }

      if (existingUsers && existingUsers.length > 0) {
        return new Response(
          JSON.stringify({ error: 'Username already exists' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }
    } catch (err) {
      console.error('Error in username check:', err);
      return new Response(
        JSON.stringify({ error: `Failed to check username: ${err.message || err}` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Check if email already exists
    try {
      console.log('Checking if email exists:', email);
      // This is a workaround since we can't directly query auth.users
      const { count, error: emailCheckError } = await supabaseAdmin
        .from("users")
        .select("id", { count: 'exact', head: true })
        .eq("username", email.split('@')[0]);
        
      if (emailCheckError) {
        console.error('Error in email check:', emailCheckError);
      } else if (count && count > 0) {
        return new Response(
          JSON.stringify({ error: 'Email already exists' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }
    } catch (err) {
      console.error('Error in email check:', err);
    }

    // Get the role name from the role_id to ensure we have the correct value
    console.log('Fetching role details for role_id:', role_id);
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from("roles")
      .select("name")
      .eq("id", role_id)
      .single();
    
    if (roleError || !roleData) {
      console.error('Error fetching role details:', roleError);
      return new Response(
        JSON.stringify({ error: `Failed to fetch role details: ${roleError?.message || 'Role not found'}` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }
    
    // CRITICAL: Always use the exact role name from the database
    const roleName = roleData.name;
    console.log('Using role name from database:', roleName);

    // Check role constraint
    console.log('Getting information about users table constraints...');
    try {
      // Try to get constraints information
      const { data: constraints, error: constraintsError } = await supabaseAdmin
        .rpc('get_check_constraints', { table_name_param: 'users' });
      
      if (constraintsError && constraintsError.message !== 'function get_check_constraints(table_name_param) does not exist') {
        console.error('Error getting constraints:', constraintsError);
      } else if (constraints) {
        console.log('Check constraints for users table:', constraints);
      }
    } catch (err) {
      console.log('Error checking table constraints:', err);
    }

    console.log('Creating new auth user...');
    // Create user in auth.users
    const { data: authUser, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: userMetadata || {
        first_name,
        last_name,
        username,
        tenant_id // Include tenant_id in user metadata
      }
    });

    if (createUserError || !authUser?.user) {
      console.error('Error creating auth user:', createUserError);
      return new Response(
        JSON.stringify({ error: createUserError?.message || 'Failed to create user' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const userId = authUser.user.id;
    console.log('Auth user created successfully with ID:', userId);

    // Insert the user into the public.users table with exact fields
    try {
      console.log('Inserting user data into public.users table...');
      
      const userData = {
        id: userId,
        username,
        first_name,
        last_name,
        role_id,
        role: roleName, // Always use the role name from the database
        phone,
        is_verified: is_verified !== undefined ? is_verified : true, // Default to true to avoid login issues
        isActive: isActive === undefined ? true : isActive,
        tenant_id: tenant_id || null // Include tenant_id in the user data
      };
      
      console.log('User data to insert:', JSON.stringify(userData, null, 2));
      
      const { error: insertError } = await supabaseAdmin
        .from("users")
        .insert(userData);

      if (insertError) {
        console.error('Error inserting user record:', insertError);
        
        // If the insert fails, clean up by deleting the auth user
        await supabaseAdmin.auth.admin.deleteUser(userId);
        
        return new Response(
          JSON.stringify({ error: `Failed to create user profile: ${insertError.message}` }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }
      
      console.log('User record inserted successfully');
    } catch (insertErr) {
      console.error('Exception during user record insertion:', insertErr);
      
      // Clean up auth user on error
      await supabaseAdmin.auth.admin.deleteUser(userId);
      
      return new Response(
        JSON.stringify({ error: `Failed to create user profile: ${insertErr.message || insertErr}` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    console.log('User creation completed successfully');
    return new Response(
      JSON.stringify({ 
        success: true, 
        user: { 
          id: userId,
          email,
          username,
          first_name,
          last_name,
          role: roleName,
          role_id,
          tenant_id,
          is_verified: is_verified !== undefined ? is_verified : true
        } 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('Error in create-user function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Unknown error',
        details: error.toString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
})
