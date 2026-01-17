
import { useEffect } from 'react';
import { useQuery, UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import { PostgrestFilterBuilder } from '@supabase/postgrest-js';
import { useTenant } from '@/contexts/TenantContext';
import { addTenantFilter } from '@/utils/tenantHeaders';

/**
 * A hook for performing tenant-aware queries
 * @param queryKey The key for this query
 * @param queryFn Function that returns a Supabase query
 * @param options Additional options for useQuery
 * @returns Query result with tenant-aware filtering
 */
export function useTenantQuery<TData = any, TError = Error>(
  queryKey: string[],
  queryFn: (tenantId: string | null | undefined) => PostgrestFilterBuilder<any, any, any>,
  options?: Omit<UseQueryOptions<TData, TError, TData>, 'queryKey' | 'queryFn'>
): UseQueryResult<TData, TError> {
  const { selectedTenant } = useTenant();

  // Create a query with the tenant ID included in the key for proper caching
  return useQuery<TData, TError>({
    queryKey: [...queryKey, selectedTenant?.id || 'no-tenant'],
    queryFn: async () => {
      // Apply tenant filter and execute the query
      const query = addTenantFilter(queryFn(selectedTenant?.id), selectedTenant?.id);
      const { data, error } = await query;
      
      if (error) throw error;
      return data as TData;
    },
    ...options,
  });
}
