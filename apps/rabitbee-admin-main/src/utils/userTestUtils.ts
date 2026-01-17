
import { supabase } from "@/integrations/supabase/client";
import config from "@/config";

interface UserStageResults {
  stage: string;
  success: boolean;
  error?: any;
  data?: any;
}

/**
 * Tests the entire user creation process
 */
export async function testUserCreation(
  username: string,
  password: string,
  firstName: string,
  lastName: string,
  roleId: string,
  roleName: string,
  tenantId?: string | null
): Promise<UserStageResults> {
  console.log("Starting user creation test...");
  
  try {
    console.log("Creating user with:", {
      username,
      password: "********", // Don't log the actual password
      firstName,
      lastName,
      roleId,
      roleName,
      tenantId
    });
    
    // Call the edge function to create the user
    const response = await fetch(`${config.supabase.url}/functions/v1/create-user`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${config.supabase.anonKey}`
      },
      body: JSON.stringify({
        username,
        email: `${username}@example.com`,
        password,
        first_name: firstName,
        last_name: lastName,
        role_id: roleId,
        role: roleName,
        tenant_id: tenantId // Pass tenant_id to the edge function
      })
    });
    
    const result = await response.json();
    console.log("User creation result:", result);
    
    if (!response.ok || result.error) {
      return {
        stage: "edge-function",
        success: false,
        error: result.error || "Unknown error in create-user function"
      };
    }
    
    return {
      stage: "complete",
      success: true,
      data: result
    };
  } catch (error) {
    console.error("Error in testUserCreation:", error);
    return {
      stage: "unknown",
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}
