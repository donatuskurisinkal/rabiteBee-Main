
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.22.0"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Types for better code organization
type AdminUserCredentials = {
  username: string;
  password: string;
}

// Function to handle CORS preflight requests
function handleCorsPreflightRequest() {
  return new Response('ok', { headers: corsHeaders });
}

// Function to initialize the Supabase admin client
function initializeSupabaseAdmin() {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { persistSession: false } }
  );
}

// Function to ensure admin user exists in auth.users
async function ensureAuthUserExists(supabaseAdmin, adminCredentials: AdminUserCredentials) {
  const { username: adminUsername, password: adminPassword } = adminCredentials;
  console.log("Checking if admin user exists in auth.users");
  
  // For username-based login, we use the email field with username@example.com format
  const adminEmail = `${adminUsername}@example.com`;
  
  const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();
  
  if (authError) {
    console.error('Error checking for existing auth user:', authError);
    throw authError;
  }

  const existingAuthUser = authUsers?.users.find(user => user.email === adminEmail);
  let userId;

  if (!existingAuthUser) {
    console.log("No admin user found in auth.users, creating one");
    
    const { data: authUser, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
      user_metadata: {
        first_name: 'Super',
        last_name: 'Admin',
        username: adminUsername
      }
    });

    if (createUserError) {
      console.error('Error creating admin auth user:', createUserError);
      throw createUserError;
    }

    if (authUser?.user) {
      console.log(`Successfully created auth user with ID: ${authUser.user.id}`);
      userId = authUser.user.id;
    }
  } else {
    console.log(`Admin user already exists with ID: ${existingAuthUser.id}`);
    userId = existingAuthUser.id;
    
    // Reset admin password to ensure we know what it is
    const { error: resetError } = await supabaseAdmin.auth.admin.updateUserById(
      existingAuthUser.id, 
      { password: adminPassword }
    );

    if (resetError) {
      console.error('Error resetting admin password:', resetError);
      throw resetError;
    }
  }
  
  return userId;
}

// Function to ensure admin role exists
async function ensureAdminRoleExists(supabaseAdmin) {
  console.log("Checking if admin role exists");
  
  const { data: roles, error: rolesQueryError } = await supabaseAdmin
    .from('roles')
    .select('id')
    .eq('name', 'admin')
    .limit(1);

  if (rolesQueryError) {
    console.error('Error querying admin role:', rolesQueryError);
    throw rolesQueryError;
  }

  let adminRoleId;

  if (!roles || roles.length === 0) {
    console.log("Admin role does not exist, creating it");
    const { data: newRole, error: createRoleError } = await supabaseAdmin
      .from('roles')
      .insert({ 
        name: 'admin',
        is_system_role: true
      })
      .select('id')
      .single();

    if (createRoleError) {
      console.error('Error creating admin role:', createRoleError);
      throw createRoleError;
    }
    
    adminRoleId = newRole.id;
    console.log(`Created admin role with ID: ${adminRoleId}`);
  } else {
    adminRoleId = roles[0].id;
    console.log(`Found existing admin role with ID: ${adminRoleId}`);
  }

  return adminRoleId;
}

// Function to ensure user exists in public.users table
async function ensureUserInPublicTable(supabaseAdmin, userId, adminRoleId) {
  console.log("Checking if admin user exists in public.users table");
  
  const { data: existingUsers, error: queryError } = await supabaseAdmin
    .from('users')
    .select('id, is_verified, role_id')
    .eq('id', userId)
    .limit(1);

  if (queryError) {
    console.error('Error checking for existing user in users table:', queryError);
    throw queryError;
  }

  try {
    if (!existingUsers || existingUsers.length === 0) {
      console.log("Admin user does not exist in public.users, adding them");
      
      // Direct insert without users_count field
      const { error: insertError } = await supabaseAdmin
        .from('users')
        .insert({
          id: userId,
          username: 'superadmin',
          first_name: 'Super',
          last_name: 'Admin',
          role: 'admin',
          role_id: adminRoleId,
          is_verified: true,
          isActive: true
        });
  
      if (insertError) {
        // If there's an error, log it and try a more direct approach
        console.error('Error inserting user record:', insertError);
        
        // Fall back to using raw SQL to avoid the trigger if that's the issue
        const { error: sqlError } = await supabaseAdmin.rpc('insert_admin_user', {
          user_id: userId,
          role_id: adminRoleId
        });
        
        if (sqlError) {
          console.error('Error with fallback SQL insert:', sqlError);
          throw sqlError;
        }
      }
      
      console.log("Successfully added admin user to public.users table");
    } else {
      const existingUser = existingUsers[0];
      
      if (!existingUser.is_verified || existingUser.role_id !== adminRoleId) {
        console.log("Updating admin user in public.users table");
        
        const { error: updateError } = await supabaseAdmin
          .from('users')
          .update({ 
            is_verified: true,
            role_id: adminRoleId,
            role: 'admin',
            username: 'superadmin'
          })
          .eq('id', userId);
  
        if (updateError) {
          console.error('Error updating user record:', updateError);
          throw updateError;
        }
        
        console.log("Successfully updated admin user in public.users table");
      } else {
        console.log("Admin user is already properly set up in public.users table");
      }
    }
  } catch (error) {
    console.error('Exception in ensureUserInPublicTable:', error);
    throw error;
  }
}

// Function to ensure proper permissions for admin role
async function ensureAdminPermissions(supabaseAdmin, adminRoleId) {
  console.log("Setting up admin role permissions");
  
  // Check if 'manage_all' permission exists
  const { data: permissions, error: permissionsError } = await supabaseAdmin
    .from('permissions')
    .select('id')
    .eq('key', 'manage_all')
    .limit(1);

  if (permissionsError) {
    console.error('Error checking for manage_all permission:', permissionsError);
    throw permissionsError;
  }

  let manageAllPermissionId;

  if (!permissions || permissions.length === 0) {
    // Create manage_all permission
    console.log("Creating manage_all permission");
    const { data: newPermission, error: createPermissionError } = await supabaseAdmin
      .from('permissions')
      .insert({ 
        key: 'manage_all', 
        label: 'Manage All' 
      })
      .select('id')
      .single();

    if (createPermissionError) {
      console.error('Error creating manage_all permission:', createPermissionError);
      throw createPermissionError;
    }
    
    manageAllPermissionId = newPermission.id;
  } else {
    manageAllPermissionId = permissions[0].id;
  }

  // Check if admin role already has the permission
  const { data: existingRolePerms, error: rolePermsError } = await supabaseAdmin
    .from('role_permissions')
    .select('id')
    .eq('role_id', adminRoleId)
    .eq('permission_id', manageAllPermissionId)
    .limit(1);

  if (rolePermsError) {
    console.error('Error checking role permissions:', rolePermsError);
    throw rolePermsError;
  }

  // If permission is not assigned, add it
  if (!existingRolePerms || existingRolePerms.length === 0) {
    console.log("Assigning manage_all permission to admin role");
    const { error: assignPermError } = await supabaseAdmin
      .from('role_permissions')
      .insert({ 
        role_id: adminRoleId,
        permission_id: manageAllPermissionId
      });

    if (assignPermError) {
      console.error('Error assigning permission to role:', assignPermError);
      throw assignPermError;
    }
    
    console.log("Successfully assigned manage_all permission to admin role");
  } else {
    console.log("Admin role already has manage_all permission");
  }
}

// Main handler function
async function handleCreateAdminUserRequest() {
  try {
    console.log("Starting admin user creation process");
    
    // Create a Supabase client with the Admin key
    const supabaseAdmin = initializeSupabaseAdmin();

    // Admin credentials
    const adminUsername = 'superadmin';
    const adminPassword = 'SuperAdmin123!';
    const credentials = { username: adminUsername, password: adminPassword };

    // Step 1: Ensure the admin user exists in auth.users
    const userId = await ensureAuthUserExists(supabaseAdmin, credentials);

    // Step 2: Ensure admin role exists
    const adminRoleId = await ensureAdminRoleExists(supabaseAdmin);

    // Step 3: Check if the user exists in the public.users table
    await ensureUserInPublicTable(supabaseAdmin, userId, adminRoleId);

    // Step 4: Ensure the admin role has proper permissions
    await ensureAdminPermissions(supabaseAdmin, adminRoleId);

    // Return success message with admin credentials
    console.log("Admin user setup completed successfully");
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Admin user created/verified successfully', 
        user: adminUsername,
        password: adminPassword
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in create-admin-user function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.toString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
}

// Add a helper RPC function that we'll create in the database to bypass triggers
async function createRpcFunction(supabaseAdmin) {
  try {
    // This function just ensures the RPC function exists in the database
    console.log('Checking if insert_admin_user RPC function exists');
    
    // We'll skip the actual creation since it's already done in SQL file
  } catch (error) {
    console.error('Error creating RPC function:', error);
    // Continue execution - this is a best effort operation
  }
}

// Main server function
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest();
  }

  // First try to set up the helper function (if it doesn't exist already)
  const supabaseAdmin = initializeSupabaseAdmin();
  await createRpcFunction(supabaseAdmin);

  return handleCreateAdminUserRequest();
})
