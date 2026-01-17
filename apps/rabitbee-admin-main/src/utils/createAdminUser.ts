
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AdminUserResponse {
  success: boolean;
  message?: string;
  user?: string;
  password?: string;
  error?: any;
  data?: any;
}

export async function createAdminUser(retryCount = 0, maxRetries = 3): Promise<AdminUserResponse> {
  try {
    console.log(`Attempting to create admin user (attempt ${retryCount + 1}/${maxRetries + 1})`);
    const { data, error } = await supabase.functions.invoke('create-admin-user');
    
    if (error) {
      console.error('Error creating admin user:', error);
      
      // Check if we should retry
      if (retryCount < maxRetries) {
        console.log(`Retrying admin user creation in ${(retryCount + 1) * 2} seconds...`);
        // Wait longer between each retry attempt
        return new Promise(resolve => {
          setTimeout(async () => {
            const result = await createAdminUser(retryCount + 1, maxRetries);
            resolve(result);
          }, (retryCount + 1) * 2000); // Increase wait time with each retry
        });
      }
      
      return { success: false, error, data: null };
    }
    
    console.log("Admin user creation response:", data);
    
    return { 
      success: true, 
      data,
      error: null 
    };
  } catch (error) {
    console.error('Exception creating admin user:', error);
    
    // Check if we should retry
    if (retryCount < maxRetries) {
      console.log(`Retrying admin user creation in ${(retryCount + 1) * 2} seconds...`);
      return new Promise(resolve => {
        setTimeout(async () => {
          const result = await createAdminUser(retryCount + 1, maxRetries);
          resolve(result);
        }, (retryCount + 1) * 2000); // Increase wait time with each retry
      });
    }
    
    return { success: false, error, data: null };
  }
}
