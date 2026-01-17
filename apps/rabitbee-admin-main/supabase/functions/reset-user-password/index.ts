import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.22.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    const { username, first_name, last_name, role_id, tenant_id } = await req.json();

    if (!username) {
      return new Response(
        JSON.stringify({ error: 'Username is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const email = `${username}@example.com`;
    const newPassword = `${username}123`;

    // Check if auth user exists
    const { data: { users: authUsers } } = await supabaseAdmin.auth.admin.listUsers();
    const existingAuthUser = authUsers?.find(u => u.email === email);

    let authUserId: string;

    if (existingAuthUser) {
      // Update existing auth user's password
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        existingAuthUser.id,
        { password: newPassword }
      );

      if (updateError) {
        return new Response(
          JSON.stringify({ error: `Failed to update password: ${updateError.message}` }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }
      
      authUserId = existingAuthUser.id;
    } else {
      // Create new auth user
      const { data: authData, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: newPassword,
        email_confirm: true,
        user_metadata: {
          first_name: first_name || username,
          last_name: last_name || '',
          username: username,
        }
      });

      if (createError) {
        return new Response(
          JSON.stringify({ error: `Failed to create auth user: ${createError.message}` }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }

      authUserId = authData.user!.id;
    }

    // Check if public.users record exists
    const { data: existingUserData } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('username', username)
      .maybeSingle();

    if (!existingUserData) {
      // Get role name from role_id if provided
      let roleName = 'Service Provider';
      if (role_id) {
        const { data: roleData } = await supabaseAdmin
          .from('roles')
          .select('name')
          .eq('id', role_id)
          .single();
        
        if (roleData) {
          roleName = roleData.name;
        }
      }

      // Create public.users record
      const { error: insertError } = await supabaseAdmin
        .from('users')
        .insert({
          id: authUserId,
          username,
          first_name: first_name || username,
          last_name: last_name || '',
          role: roleName,
          role_id: role_id || '33da7469-7dab-4c44-9e28-0e5ca80759a5',
          is_verified: true,
          isActive: true,
          tenant_id: tenant_id || 'cda9bd96-2f5f-4298-ae61-e599c071db2c',
          phone: ''
        });

      if (insertError) {
        // If insert failed, delete the auth user we just created
        await supabaseAdmin.auth.admin.deleteUser(authUserId);
        return new Response(
          JSON.stringify({ error: `Failed to create user record: ${insertError.message}` }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }
    } else if (existingUserData.id !== authUserId) {
      // IDs don't match, need to sync
      const { error: deleteOldError } = await supabaseAdmin
        .from('users')
        .delete()
        .eq('id', existingUserData.id);

      if (deleteOldError) {
        console.error('Failed to delete old user record:', deleteOldError);
      }

      const { error: insertNewError } = await supabaseAdmin
        .from('users')
        .insert({
          ...existingUserData,
          id: authUserId
        });

      if (insertNewError) {
        return new Response(
          JSON.stringify({ error: 'Failed to sync user data' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        username,
        email,
        password: newPassword,
        message: 'User created/password reset successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Unknown error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
