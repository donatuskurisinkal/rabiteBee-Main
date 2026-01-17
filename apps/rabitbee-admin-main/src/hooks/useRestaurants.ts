import { useState, useCallback, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from '@/hooks/use-tenant';
import { useToast } from "@/hooks/use-toast";

interface Restaurant {
  id: string;
  name: string;
  description?: string;
  logo_url?: string;
  rating: number;
  rating_count: number;
  isOpen: boolean;
  tags?: string[];
  address?: string;
  food_type: string;
  isActive: boolean;
  opening_time: string;
  closing_time: string;
  min_order_value: number;
  delivery_fee: number;
  prep_time_mins: number;
  created_at: string;
  latitude?: number;
  longitude?: number;
}

interface PaginationState {
  hasMore: boolean;
  nextCursor: string | null;
  loading: boolean;
}

interface UseRestaurantsParams {
  foodType?: string;
  keyword?: string;
  pageSize?: number;
  sortOrder?: 'asc' | 'desc';
}

interface RequestBody {
  tenantId: string;
  foodType: string;
  pageSize: number;
  sortOrder: 'asc' | 'desc';
  keyword?: string;
  cursor?: string | null;
}

export function useRestaurants({
  foodType = 'All',
  keyword = '',
  pageSize = 10,
  sortOrder = 'desc'
}: UseRestaurantsParams = {}) {
  const { toast } = useToast();
  const { selectedTenant } = useTenant();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    hasMore: false,
    nextCursor: null,
    loading: false,
  });

  // Function to fetch restaurants
  const fetchRestaurants = useCallback(async (reset = false) => {
    if (!selectedTenant) return;
    
    try {
      setPagination(prev => ({ ...prev, loading: true }));
      console.log("Fetching restaurants with tenant:", selectedTenant.id);
      
      // Prepare the request body
      const requestBody: RequestBody = {
        tenantId: selectedTenant.id,
        foodType: foodType,
        pageSize: pageSize,
        sortOrder: sortOrder
      };
      
      if (keyword) requestBody.keyword = keyword;
      if (!reset && pagination.nextCursor) requestBody.cursor = pagination.nextCursor;

      console.log("Sending request with body:", requestBody);

      // Call the edge function with POST method
      const { data, error } = await supabase.functions.invoke('get-restaurants', {
        method: 'POST',
        body: requestBody
      });

      if (error) {
        console.error("Edge function error:", error);
        throw error;
      }

      console.log("Edge function response:", data);

      // Update state with the response
      if (reset) {
        setRestaurants(data.restaurants || []);
      } else {
        setRestaurants(prev => [...prev, ...(data.restaurants || [])]);
      }
      
      setPagination({
        hasMore: data.pagination?.hasMore || false,
        nextCursor: data.pagination?.nextCursor || null,
        loading: false
      });
      
    } catch (error: any) {
      console.error('Error fetching restaurants:', error);
      toast({
        variant: "destructive",
        title: "Error loading restaurants",
        description: error.message || "Failed to load restaurants. Please try again.",
      });
      setPagination(prev => ({ ...prev, loading: false }));
    }
  }, [selectedTenant, foodType, keyword, pageSize, sortOrder, pagination.nextCursor, toast]);

  // Initial load
  useEffect(() => {
    if (selectedTenant) {
      console.log("Initial load for tenant:", selectedTenant.id);
      fetchRestaurants(true);
    }
  }, [selectedTenant, foodType, keyword, sortOrder, pageSize, fetchRestaurants]); // Refetch when these dependencies change

  // Function to load more restaurants
  const loadMore = useCallback(() => {
    if (!pagination.loading && pagination.hasMore) {
      fetchRestaurants();
    }
  }, [pagination.loading, pagination.hasMore, fetchRestaurants]);

  // Function to refresh the restaurants list
  const refresh = useCallback(() => {
    fetchRestaurants(true);
  }, [fetchRestaurants]);

  return {
    restaurants,
    loading: pagination.loading,
    hasMore: pagination.hasMore,
    loadMore,
    refresh
  };
}
