
import { supabase } from "@/integrations/supabase/client";

/**
 * Get the headers to include the tenant ID for API requests
 * @param tenantId The ID of the tenant to include in the header
 * @returns Object with headers to be spread into Supabase API calls
 */
export const getTenantHeaders = (tenantId: string | null | undefined) => {
  if (!tenantId) return {};
  
  // Return headers object that can be spread into Supabase API calls
  return {
    headers: {
      'x-tenant-id': tenantId,
    }
  };
};

/**
 * Add tenant filter to a Supabase query
 * @param query The Supabase query to modify
 * @param tenantId The tenant ID to filter by
 * @returns Modified query with tenant filter applied
 */
export const addTenantFilter = (query: any, tenantId: string | null | undefined) => {
  if (!tenantId) return query;
  
  // Add tenant filter - either matching the tenant_id or null (global records)
  return query.or(`tenant_id.eq.${tenantId},tenant_id.is.null`);
};

/**
 * Get the tenant ID to use for a new record
 * @param selectedTenantId The currently selected tenant ID (for admin)
 * @returns Tenant ID to use for new records
 */
export const getTenantIdForRecord = (selectedTenantId: string | null | undefined) => {
  return selectedTenantId || null;
};

/**
 * Apply tenant filter specifically for slot overrides
 */
export const addSlotOverrideTenantFilter = (query: any, tenantId: string | null | undefined) => {
  if (!tenantId) return query;
  
  // For slot overrides, we want exact tenant match (no global records)
  return query.eq('tenant_id', tenantId);
};
