
import { useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from 'date-fns';

interface TimeSlotStatus {
  id: string;
  booking_date: string;
  time_slot_id: string;
  booked_count: number;
  max_bookings: number;
  is_available: boolean;
  tenant_id: string | null;
}

interface SlotOverride {
  id: string;
  slot_id: string;
  override_date: string;
  max_bookings: number;
  is_active: boolean;
  tenant_id: string | null;
}

export function useWashTimeSlotAvailability() {
  const { selectedTenant } = useTenant();
  const queryClient = useQueryClient();

  // Fetch daily time slot status with override consideration
  const fetchTimeSlotStatus = async (date: Date, timeSlotId: string): Promise<TimeSlotStatus> => {
    // First check if there's an active slot override for this date and slot
    const { data: slotOverride } = await supabase
      .from('slot_overrides')
      .select('*')
      .eq('override_date', format(date, 'yyyy-MM-dd'))
      .eq('slot_id', timeSlotId)
      .eq('tenant_id', selectedTenant?.id)
      .eq('is_active', true) // Only consider active overrides
      .maybeSingle();

    // Get or create the daily time slot status record
    const { data, error } = await supabase
      .from('wash_daily_time_slot_statuses')
      .select('*')
      .eq('booking_date', format(date, 'yyyy-MM-dd'))
      .eq('time_slot_id', timeSlotId)
      .eq('tenant_id', selectedTenant?.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // If no record exists, get the default max_bookings from time slot
        const timeSlot = await supabase
          .from('wash_time_slots')
          .select('max_bookings')
          .eq('id', timeSlotId)
          .single();

        // Use override max_bookings if available, otherwise use default
        const maxBookings = slotOverride?.max_bookings || timeSlot.data?.max_bookings || 10;

        return {
          id: '',
          booking_date: format(date, 'yyyy-MM-dd'),
          time_slot_id: timeSlotId,
          booked_count: 0,
          max_bookings: maxBookings,
          is_available: true,
          tenant_id: selectedTenant?.id || null
        };
      }
      throw error;
    }

    // If there's an active override, use its max_bookings, otherwise use the stored value
    const effectiveMaxBookings = slotOverride?.max_bookings || data.max_bookings;

    return {
      ...data,
      max_bookings: effectiveMaxBookings,
      is_available: data.booked_count < effectiveMaxBookings
    };
  };

  // Check time slot availability
  const checkTimeSlotAvailability = (date: Date, timeSlotId: string) => {
    return useQuery({
      queryKey: ['time-slot-availability', date, timeSlotId, selectedTenant?.id],
      queryFn: () => fetchTimeSlotStatus(date, timeSlotId),
      select: (data: TimeSlotStatus) => data.is_available
    });
  };

  // Get complete time slot status (including override info)
  const getTimeSlotStatus = (date: Date, timeSlotId: string) => {
    return useQuery({
      queryKey: ['time-slot-status', date, timeSlotId, selectedTenant?.id],
      queryFn: () => fetchTimeSlotStatus(date, timeSlotId)
    });
  };

  // Increment booked count when a booking is made
  const incrementBookedCount = useMutation({
    mutationFn: async ({ date, timeSlotId }: { date: Date, timeSlotId: string }) => {
      const { data, error } = await supabase.rpc('increment_time_slot_booked_count', {
        p_booking_date: format(date, 'yyyy-MM-dd'),
        p_time_slot_id: timeSlotId,
        p_tenant_id: selectedTenant?.id
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-slot-availability'] });
      queryClient.invalidateQueries({ queryKey: ['time-slot-status'] });
    }
  });

  // Decrement booked count when a booking is cancelled
  const decrementBookedCount = useMutation({
    mutationFn: async ({ date, timeSlotId }: { date: Date, timeSlotId: string }) => {
      const { data, error } = await supabase.rpc('decrement_time_slot_booked_count', {
        p_booking_date: format(date, 'yyyy-MM-dd'),
        p_time_slot_id: timeSlotId,
        p_tenant_id: selectedTenant?.id
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-slot-availability'] });
      queryClient.invalidateQueries({ queryKey: ['time-slot-status'] });
    }
  });

  return {
    checkTimeSlotAvailability,
    getTimeSlotStatus,
    incrementBookedCount,
    decrementBookedCount
  };
}
