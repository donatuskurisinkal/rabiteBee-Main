
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get tenantId from URL params
    const url = new URL(req.url);
    const tenantId = url.searchParams.get('tenantId');

    if (!tenantId) {
      throw new Error('tenantId is required');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Format date as YYYY-MM-DD using native JavaScript
    const date = new Date();
    const today = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

    // Fetch vehicle types with their models for specific tenant
    const { data: vehicleTypes, error: vehicleTypesError } = await supabaseClient
      .from('wash_vehicle_types')
      .select(`
        id,
        name,
        icon_url,
        models:wash_vehicle_models(
          id,
          name,
          is_active
        )
      `)
      .eq('tenant_id', tenantId);

    if (vehicleTypesError) throw vehicleTypesError;

    // Fetch all vehicle models and map id -> name
    const { data: vehicleModels, error: vehicleModelsError } = await supabaseClient
      .from('wash_vehicle_models')
      .select('id, name')
      .eq('tenant_id', tenantId);

    if (vehicleModelsError) throw vehicleModelsError;

    const vehicleModelMap: Record<string, string> = {};
    for (const m of vehicleModels ?? []) {
      vehicleModelMap[m.id] = m.name;
    }

    // Fetch wash types for specific tenant
    const { data: washTypes, error: washTypesError } = await supabaseClient
      .from('wash_types')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('is_active', true);

    if (washTypesError) throw washTypesError;

    // Group wash types by vehicle_model_id
    const washTypesByModel: Record<string, any[]> = {};
    for (const wt of washTypes ?? []) {
      const modelId = wt.vehicle_model_id || 'no-model';
      if (!washTypesByModel[modelId]) {
        washTypesByModel[modelId] = [];
      }
      washTypesByModel[modelId].push({
        id: wt.id,
        name: wt.name,
        description: wt.description,
        base_price: wt.base_price,
        offer_price: wt.offer_price,
        discount_percent: wt.discount_percent,
        gst_percent: wt.gst_percent,
        service_charge: wt.service_charge,
        is_active: wt.is_active,
      });
    }

    // Format wash_types array as requested, grouped by vehicle_model_id
    const formattedWashTypes = Object.entries(washTypesByModel).map(([modelId, washOptions]) => ({
      vehicle_model_id: modelId === 'no-model' ? null : modelId,
      vehicle_model_name: modelId === 'no-model' ? null : (vehicleModelMap[modelId] || null),
      wash_options: washOptions,
    }));

    console.log(`Checking time slots for tenant ${tenantId} and date ${today}`);
    
    // Fetch time slots with slot overrides for today's date
    const { data: timeSlots, error: timeSlotsError } = await supabaseClient
      .from('wash_time_slots')
      .select(`
        id,
        start_time,
        end_time,
        max_bookings,
        slot_overrides:slot_overrides!slot_id(
          max_bookings,
          override_date
        ),
        status:wash_daily_time_slot_statuses(
          booked_count
        )
      `)
      .eq('tenant_id', tenantId)
      .eq('is_active', true);

    if (timeSlotsError) {
      console.error('Error fetching time slots:', timeSlotsError);
      throw timeSlotsError;
    }
    
    console.log(`Found ${timeSlots?.length || 0} active time slots`);

    // Check if daily status records exist for today
    const { data: dailyStatuses, error: dailyStatusesError } = await supabaseClient
      .from('wash_daily_time_slot_statuses')
      .select('*')
      .eq('booking_date', today)
      .eq('tenant_id', tenantId);
      
    if (dailyStatusesError) {
      console.error('Error fetching daily statuses:', dailyStatusesError);
      throw dailyStatusesError;
    }
    
    console.log(`Found ${dailyStatuses?.length || 0} daily status records for date ${today}`);

    // Format the time slots with effective max_bookings
    let formattedTimeSlots = [];
    
    if (timeSlots && timeSlots.length > 0) {
      formattedTimeSlots = timeSlots.map(slot => {
        // Check if there's a slot override for today's date
        const todayOverride = slot.slot_overrides?.find(
          override => override.override_date === today
        );
        
        // Use override max_bookings if available, otherwise use default
        const effectiveMaxBookings = todayOverride ? todayOverride.max_bookings : slot.max_bookings;
        
        // Get booked count from status or daily status records
        let bookedCount = 0;
        if (slot.status && slot.status.length > 0) {
          bookedCount = slot.status[0]?.booked_count || 0;
        } else {
          // Fallback to daily status records
          const dailyStatus = dailyStatuses?.find(status => status.time_slot_id === slot.id);
          bookedCount = dailyStatus?.booked_count || 0;
        }
        
        return {
          id: slot.id,
          start_time: slot.start_time,
          end_time: slot.end_time,
          max_bookings: effectiveMaxBookings,
          booked_count: bookedCount,
          is_available: bookedCount < effectiveMaxBookings
        };
      });
    }
    
    console.log(`Returning ${formattedTimeSlots.length} formatted time slots with effective max_bookings`);

    const response = {
      vehicle_types: vehicleTypes,
      wash_types: formattedWashTypes,
      time_slots: formattedTimeSlots
    };

    return new Response(
      JSON.stringify(response),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});
