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

    const username = 'aronk';
    const email = `${username}@example.com`;
    const password = `${username}123`;
    const roleId = '33da7469-7dab-4c44-9e28-0e5ca80759a5'; // Service Provider role
    const tenantId = 'cda9bd96-2f5f-4298-ae61-e599c071db2c';

    // Create auth user
    const { data: authData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        first_name: 'Aron',
        last_name: 'K',
        username: username,
      }
    });

    if (createError) {
      console.error('Failed to create auth user:', createError);
      return new Response(
        JSON.stringify({ error: `Failed to create auth user: ${createError.message}` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    if (!authData.user) {
      return new Response(
        JSON.stringify({ error: 'No user returned from auth creation' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Create public.users entry
    const { error: insertError } = await supabaseAdmin
      .from('users')
      .insert({
        id: authData.user.id,
        username,
        first_name: 'Aron',
        last_name: 'K',
        role: 'Service Provider',
        role_id: roleId,
        is_verified: true,
        isActive: true,
        tenant_id: tenantId,
        phone: ''
      });

    if (insertError) {
      console.error('Failed to create public.users entry:', insertError);
      // Cleanup: delete the auth user we just created
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return new Response(
        JSON.stringify({ error: `Failed to create user profile: ${insertError.message}` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        user_id: authData.user.id,
        username,
        email,
        password,
        message: 'User created successfully. You can now login with: aronk / aronk123'
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