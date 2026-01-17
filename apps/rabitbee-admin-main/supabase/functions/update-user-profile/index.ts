
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.22.0";

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
    const { 
      userId, 
      firstName, 
      lastName, 
      address, 
      latitude, 
      longitude, 
      tag = 'home', 
      isDefault = false,
      addressId, // If provided, will update existing address rather than creating new one
      roleId // If provided, will assign this roleId, otherwise will look for customer role
    } = body;

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'User ID is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Start a transaction for updating both profile and address
    let userResult = null;
    let addressResult = null;
    let error = null;

    // 1. Check if user exists in the users table
    const { data: existingUser, error: checkUserError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    
    if (checkUserError) {
      console.error('Error checking if user exists:', checkUserError);
      error = checkUserError;
    }
    
    // 2. If user doesn't exist, get the Customer role ID and create user
    if (!existingUser && !error) {
      let customerRoleId = roleId;
      
      // If roleId not provided, find the Customer role
      if (!customerRoleId) {
        const { data: roleData, error: roleError } = await supabaseAdmin
          .from('roles')
          .select('id')
          .eq('name', 'Customer')
          .maybeSingle();
        
        if (roleError) {
          console.error('Error fetching Customer role:', roleError);
          error = roleError;
        } else if (!roleData) {
          console.error('Customer role not found');
          error = { message: 'Customer role not found' };
        } else {
          customerRoleId = roleData.id;
        }
      }
      
      // Create new user entry with the Customer role
      if (customerRoleId && !error) {
        const userData = {
          id: userId,
          username: userId.substring(0, 8), // Generate a username based on userId
          first_name: firstName || '',
          last_name: lastName || '',
          role_id: customerRoleId,
          role: 'Customer',
          isActive: true,
          is_verified: true
        };
        
        console.log('Creating new user with data:', userData);
        
        const { data: newUser, error: createUserError } = await supabaseAdmin
          .from('users')
          .insert(userData)
          .select();
        
        if (createUserError) {
          console.error('Error creating user:', createUserError);
          error = createUserError;
        } else {
          userResult = newUser && newUser.length > 0 ? newUser[0] : null;
          console.log('User created successfully:', userResult);
        }
      }
    } 
    // 3. If user exists, update profile information if firstName or lastName provided
    else if (!error) {
      if (firstName !== undefined || lastName !== undefined) {
        const updateData = {};
        if (firstName !== undefined) updateData.first_name = firstName;
        if (lastName !== undefined) updateData.last_name = lastName;

        const { data, error: userError } = await supabaseAdmin
          .from('users')
          .update(updateData)
          .eq('id', userId)
          .select();

        if (userError) {
          error = userError;
          console.error('Error updating user profile:', userError);
        } else {
          userResult = data && data.length > 0 ? data[0] : null;
          console.log('User profile updated successfully:', data);
        }
      } else {
        userResult = existingUser;
      }
    }

    // 4. Handle address update/creation if address details are provided
    if (address && error === null) {
      // Ensure tag is lowercase to match the enum values in the database
      const normalizedTag = (address.tag?.toLowerCase() || tag?.toLowerCase()) as 'home' | 'work' | 'other';
      
      const addressData = {
        user_id: userId,
        address: address.address || address,
        latitude: address.latitude || latitude,
        longitude: address.longitude || longitude,
        tag: normalizedTag,
        is_default: address.isDefault !== undefined ? address.isDefault : isDefault
      };

      console.log('Creating/updating address with data:', addressData);

      let addressOperation;
      
      if (address.id || addressId) {
        // Update existing address
        const addrId = address.id || addressId;
        addressOperation = supabaseAdmin
          .from('user_addresses')
          .update(addressData)
          .eq('id', addrId)
          .eq('user_id', userId) // Safety check
          .select();
        
        console.log('Updating existing address:', addrId);
      } else {
        // Create new address
        addressOperation = supabaseAdmin
          .from('user_addresses')
          .insert(addressData)
          .select();
        
        console.log('Creating new address for user:', userId);
      }

      const { data: addrData, error: addrError } = await addressOperation;

      if (addrError) {
        error = addrError;
        console.error('Error managing address:', addrError);
      } else {
        addressResult = addrData;
        console.log('Address operation successful:', addrData);
      }
    }

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        user: userResult, 
        address: addressResult 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('Error in update-user-profile function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.toString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
