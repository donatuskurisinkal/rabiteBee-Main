
import { useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from 'date-fns';

interface SlotOverride {
  id: string;
  slot_id: string;
  override_date: string;
  max_bookings: number;
  is_active: boolean;
  tenant_id: string | null;
}

export function useSlotOverrides() {
  const { selectedTenant } = useTenant();
  const queryClient = useQueryClient();

  // Get slot override for a specific date and slot
  const getSlotOverride = async (date: Date, timeSlotId: string): Promise<SlotOverride | null> => {
    const { data, error } = await supabase
      .from('slot_overrides')
      .select('*')
      .eq('override_date', format(date, 'yyyy-MM-dd'))
      .eq('slot_id', timeSlotId)
      .eq('tenant_id', selectedTenant?.id)
      .eq('is_active', true) // Only get active overrides
      .maybeSingle();

    if (error) throw error;
    return data;
  };

  // Check if there's an override for a specific date and slot
  const checkSlotOverride = (date: Date, timeSlotId: string) => {
    return useQuery({
      queryKey: ['slot-override', date, timeSlotId, selectedTenant?.id],
      queryFn: () => getSlotOverride(date, timeSlotId),
    });
  };

  // Get all overrides for a tenant
  const getAllSlotOverrides = () => {
    return useQuery({
      queryKey: ['all-slot-overrides', selectedTenant?.id],
      queryFn: async () => {
        let query = supabase
          .from('slot_overrides')
          .select(`
            *,
            time_slot:slot_id(start_time, end_time)
          `);
        
        if (selectedTenant?.id) {
          query = query.eq('tenant_id', selectedTenant.id);
        }
        
        const { data, error } = await query.order('override_date', { ascending: false });
        
        if (error) throw error;
        return data;
      },
    });
  };

  // Create slot override
  const createSlotOverride = useMutation({
    mutationFn: async (override: Omit<SlotOverride, 'id'>) => {
      const { data, error } = await supabase
        .from('slot_overrides')
        .insert({
          ...override,
          tenant_id: selectedTenant?.id || null
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['slot-override'] });
      queryClient.invalidateQueries({ queryKey: ['all-slot-overrides'] });
      queryClient.invalidateQueries({ queryKey: ['time-slot-availability'] });
    }
  });

  // Update slot override
  const updateSlotOverride = useMutation({
    mutationFn: async ({ id, ...override }: Partial<SlotOverride> & { id: string }) => {
      const { data, error } = await supabase
        .from('slot_overrides')
        .update(override)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['slot-override'] });
      queryClient.invalidateQueries({ queryKey: ['all-slot-overrides'] });
      queryClient.invalidateQueries({ queryKey: ['time-slot-availability'] });
    }
  });

  // Delete slot override
  const deleteSlotOverride = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('slot_overrides')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['slot-override'] });
      queryClient.invalidateQueries({ queryKey: ['all-slot-overrides'] });
      queryClient.invalidateQueries({ queryKey: ['time-slot-availability'] });
    }
  });

  return {
    checkSlotOverride,
    getAllSlotOverrides,
    createSlotOverride,
    updateSlotOverride,
    deleteSlotOverride
  };
}
