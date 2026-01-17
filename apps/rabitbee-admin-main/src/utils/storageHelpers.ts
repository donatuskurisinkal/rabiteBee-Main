import { supabase } from "@/integrations/supabase/client";

/**
 * Creates a storage bucket if it doesn't exist
 * @param bucketName The name of the bucket to create
 */
export const ensureStorageBucket = async (bucketName: string): Promise<boolean> => {
  // Client-side cannot manage buckets; assume provisioned and rely on policies
  console.log(`Skipping bucket admin check for '${bucketName}' (client-side)`);
  return true;
};

/**
 * Determines if a file is a JSON (likely Lottie) file
 * @param file The file to check
 */
export const isLottieFile = (file: File): boolean => {
  // Check both MIME type and filename extension since some browsers may not report JSON MIME type correctly
  return (
    file.type === 'application/json' || 
    file.type === 'text/plain' && file.name.endsWith('.json') ||
    file.name.endsWith('.json') ||
    file.name.endsWith('.lottie')
  );
};

/**
 * Determines the asset type based on the file
 * @param file The file to check
 */
export const getAssetType = (file: File): 'image' | 'lottie' => {
  return isLottieFile(file) ? 'lottie' : 'image';
};

/**
 * Generates a folder path for menu item images in the format 'tenant/product/[image]'
 * @param tenantId The tenant ID
 * @param categoryId Optional category ID
 * @returns A folder path string
 */
export const generateMenuItemPath = (tenantId: string | undefined, categoryId?: string): string => {
  if (!tenantId) {
    // Default to 'uncategorized' if no tenant ID is provided
    return categoryId ? `uncategorized/${categoryId}` : 'uncategorized';
  }
  
  return categoryId ? `${tenantId}/${categoryId}` : tenantId;
};
