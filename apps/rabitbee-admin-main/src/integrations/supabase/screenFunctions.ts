
import { supabase } from "./client";
import type { Screen, ScreenWithCount, BannerWithScreen } from "./screen-types";

/**
 * Get all screens without pagination
 */
export async function getAllScreens(tenantId: string | null = null): Promise<Screen[]> {
  try {
    let query = supabase
      .from("screens")
      .select("*")
      .order("name");
    
    if (tenantId) {
      query = query.eq("tenant_id", tenantId);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    return data as Screen[] || [];
  } catch (error) {
    console.error("Error in getAllScreens:", error);
    throw error;
  }
}

/**
 * Get screens with pagination
 */
export async function getScreensPaginated(
  page: number = 1, 
  pageSize: number = 10,
  tenantId: string | null = null
): Promise<ScreenWithCount[]> {
  try {
    // First get the total count
    let countQuery = supabase
      .from("screens")
      .select("*", { count: "exact", head: true });
      
    if (tenantId) {
      countQuery = countQuery.eq("tenant_id", tenantId);
    }
    
    const { count, error: countError } = await countQuery;
    
    if (countError) throw countError;
    
    // Then get the actual page data
    let dataQuery = supabase
      .from("screens")
      .select("*")
      .range((page - 1) * pageSize, page * pageSize - 1)
      .order("display_order", { ascending: true })
      .order("name");
      
    if (tenantId) {
      dataQuery = dataQuery.eq("tenant_id", tenantId);
    }
    
    const { data, error } = await dataQuery;
    
    if (error) throw error;
    
    // Add the total count to each row for convenience
    return (data || []).map(screen => ({
      ...screen,
      total_count: count || 0
    })) as ScreenWithCount[];
  } catch (error) {
    console.error("Error in getScreensPaginated:", error);
    throw error;
  }
}

/**
 * Create a new screen
 */
export async function createScreen(
  name: string,
  isActive: boolean = true,
  isMaintenanceMode: boolean = false,
  displayOrder: number = 0,
  tenantId: string | null = null
): Promise<string> {
  try {
    const { data, error } = await supabase
      .from("screens")
      .insert({ 
        name, 
        is_active: isActive,
        is_maintenance_mode: isMaintenanceMode,
        display_order: displayOrder,
        tenant_id: tenantId
      })
      .select("id")
      .single();
    
    if (error) throw error;
    return data.id;
  } catch (error) {
    console.error("Error in createScreen:", error);
    throw error;
  }
}

/**
 * Update an existing screen
 */
export async function updateScreen(
  id: string, 
  name: string, 
  isActive: boolean,
  isMaintenanceMode: boolean,
  displayOrder: number,
  tenantId: string | null = null
): Promise<boolean> {
  try {
    console.log("Updating screen:", { id, name, isActive, isMaintenanceMode, displayOrder, tenantId });
    
    // First check if screen exists
    const { data: existingScreen, error: checkError } = await supabase
      .from("screens")
      .select("id")
      .eq("id", id)
      .single();
    
    if (checkError) {
      console.error("Error checking if screen exists:", checkError);
      throw new Error(`Screen with ID ${id} not found`);
    }
    
    // Then update it
    const { error } = await supabase
      .from("screens")
      .update({ 
        name, 
        is_active: isActive,
        is_maintenance_mode: isMaintenanceMode,
        display_order: displayOrder,
        tenant_id: tenantId
      })
      .eq("id", id);
    
    if (error) {
      console.error("Supabase update error:", error);
      throw error;
    }
    
    console.log("Screen updated successfully");
    return true;
  } catch (error) {
    console.error("Error in updateScreen:", error);
    throw error;
  }
}

/**
 * Update only the status of a screen
 */
export async function updateScreenStatus(
  id: string, 
  isActive: boolean
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("screens")
      .update({ is_active: isActive })
      .eq("id", id);
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error in updateScreenStatus:", error);
    throw error;
  }
}

/**
 * Delete a screen
 */
export async function deleteScreen(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("screens")
      .delete()
      .eq("id", id);
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error in deleteScreen:", error);
    throw error;
  }
}

/**
 * Get banners with pagination and optional screen filtering
 */
export async function getBannersPaginated(
  page: number = 1, 
  pageSize: number = 10,
  screenId: string | null = null,
  tenantId: string | null = null
): Promise<BannerWithScreen[]> {
  try {
    // Build the query
    let query = supabase
      .from("banners")
      .select(`
        *,
        screens:screen_id (name)
      `);
    
    // Add screen filter if provided
    if (screenId) {
      query = query.eq("screen_id", screenId);
    }
    
    // Add tenant filter - include global (null) and tenant-specific banners
    if (tenantId) {
      // Include banners where tenant_id matches OR is null (global)
      query = query.or(`tenant_id.is.null,tenant_id.eq.${tenantId}`);
    } else {
      query = query.is("tenant_id", null);
    }
    
    // Get count first
    let countQuery = supabase.from("banners").select("*", { count: "exact", head: true });
    
    if (screenId) {
      countQuery = countQuery.eq("screen_id", screenId);
    }
    
    if (tenantId) {
      // Ensure count uses the same OR condition as data query
      countQuery = countQuery.or(`tenant_id.is.null,tenant_id.eq.${tenantId}`);
    } else {
      countQuery = countQuery.is("tenant_id", null);
    }
      
    const { count, error: countError } = await countQuery;
    
    if (countError) throw countError;
    
    // Then get the paginated data
    const { data, error } = await query
      .order("display_order", { ascending: true })
      .range((page - 1) * pageSize, page * pageSize - 1);
    
    if (error) throw error;
    
    // Map to expected format
    return (data || []).map(item => ({
      ...item,
      screen_name: item.screens?.name || "",
      total_count: count || 0
    })) as BannerWithScreen[];
  } catch (error) {
    console.error("Error in getBannersPaginated:", error);
    throw error;
  }
}
