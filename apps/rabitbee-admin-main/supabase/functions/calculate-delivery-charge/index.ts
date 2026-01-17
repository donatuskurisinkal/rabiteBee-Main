
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.23.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create a Supabase client with the Auth context of the function
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    // Parse request body
    const { distanceKm, timestamp, tenantId } = await req.json();

    if (typeof distanceKm !== 'number' || distanceKm <= 0) {
      return new Response(
        JSON.stringify({ error: "Invalid distance parameter" }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const now = timestamp ? new Date(timestamp) : new Date();
    
    if (isNaN(now.getTime())) {
      return new Response(
        JSON.stringify({ error: "Invalid timestamp" }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Calculate the delivery charge
    const charge = await calculateDeliveryCharge(supabaseClient, distanceKm, now, tenantId);

    // Return the calculated charge
    return new Response(
      JSON.stringify({ charge }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("Error calculating delivery charge:", error);
    
    return new Response(
      JSON.stringify({ 
        error: "Failed to calculate delivery charge", 
        details: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 500 
      }
    );
  }
});

async function calculateDeliveryCharge(
  supabase: any,
  distanceKm: number,
  now: Date,
  tenantId: string | null
): Promise<number> {
  let total = 0;
  const today = now.toISOString().slice(0, 10); // 'YYYY-MM-DD'
  const timeOnly = now.toTimeString().slice(0, 8); // 'HH:MM:SS'
  const weekday = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][now.getDay()];
  const nowISOString = now.toISOString();

  // 1️⃣ Base fare lookup - improved logic
  try {
    let query = supabase
      .from('distance_brackets')
      .select('*')
      .lte('min_km', distanceKm)
      .is('is_active', true);

    // Add tenant filter if provided
    if (tenantId) {
      query = query.eq('tenant_id', tenantId);
    }

    const { data: brackets, error } = await query;

    if (error) throw error;

    // Find the matching bracket based on min_km and max_km
    const matchedBracket = brackets.find((b: any) =>
      distanceKm >= b.min_km &&
      (b.max_km === null || distanceKm < b.max_km)
    );

    if (!matchedBracket) {
      console.log("No matching distance bracket found, using default rate");
      total = distanceKm * 10; // Default rate if no bracket found
    } else {
      total = matchedBracket.flat_fare;
    }
  } catch (error) {
    console.error("Error getting distance bracket:", error);
    total = distanceKm * 10; // Default fallback
  }

  // 2️⃣ Holiday surcharge
  try {
    const { data: holiday } = await supabase
      .from('holidays')
      .select('id')
      .eq('date', today)
      .eq('is_active', true)
      .maybeSingle();

    if (holiday) {
      let surchargeQuery = supabase
        .from('holiday_surcharges')
        .select('extra_flat, multiplier')
        .eq('holiday_id', holiday.id);

      if (tenantId) {
        // Try to find tenant-specific surcharge first
        const { data: tenantSurcharge } = await surchargeQuery
          .eq('tenant_id', tenantId)
          .maybeSingle();

        if (tenantSurcharge) {
          if (tenantSurcharge.extra_flat != null) total += tenantSurcharge.extra_flat;
          if (tenantSurcharge.multiplier > 1) total *= tenantSurcharge.multiplier;
        } else {
          // Fallback to global surcharge
          const { data: globalSurcharge } = await surchargeQuery
            .is('tenant_id', null)
            .maybeSingle();

          if (globalSurcharge) {
            if (globalSurcharge.extra_flat != null) total += globalSurcharge.extra_flat;
            if (globalSurcharge.multiplier > 1) total *= globalSurcharge.multiplier;
          }
        }
      } else {
        // No tenant ID, just get any applicable surcharge
        const { data: surcharge } = await surchargeQuery.maybeSingle();
        
        if (surcharge) {
          if (surcharge.extra_flat != null) total += surcharge.extra_flat;
          if (surcharge.multiplier > 1) total *= surcharge.multiplier;
        }
      }
    }
  } catch (error) {
    console.error("Error applying holiday surcharge:", error);
    // Continue without holiday surcharge
  }

  // 3️⃣ Peak-hour surcharge
  try {
    let peakQuery = supabase
      .from('peak_hours')
      .select('multiplier')
      .eq('day_of_week', weekday)
      .eq('is_active', true)
      .lte('start_time', timeOnly)
      .gte('end_time', timeOnly);

    if (tenantId) {
      // Try tenant-specific first
      const { data: tenantPeak } = await peakQuery
        .eq('tenant_id', tenantId)
        .maybeSingle();

      if (tenantPeak && tenantPeak.multiplier > 1) {
        total *= tenantPeak.multiplier;
      } else {
        // Fallback to global
        const { data: globalPeak } = await peakQuery
          .is('tenant_id', null)
          .maybeSingle();

        if (globalPeak && globalPeak.multiplier > 1) {
          total *= globalPeak.multiplier;
        }
      }
    } else {
      // No tenant ID specified
      const { data: peak } = await peakQuery.maybeSingle();
      if (peak && peak.multiplier > 1) {
        total *= peak.multiplier;
      }
    }
  } catch (error) {
    console.error("Error applying peak hour rate:", error);
    // Continue without peak hour multiplier
  }

  // 4️⃣ Active surge pricing
  try {
    let surgeQuery = supabase
      .from('surge_pricing')
      .select('extra_charge_amount, id')
      .eq('is_active', true)
      .lte('start_time', nowISOString)
      .gte('end_time', nowISOString);

    if (tenantId) {
      // First check for tenant-specific surge pricing
      const { data: tenantSurges } = await surgeQuery
        .eq('tenant_id', tenantId);

      if (tenantSurges && tenantSurges.length > 0) {
        // Check for area zone applicability if surge has zones
        for (const surge of tenantSurges) {
          const { data: zoneCount } = await supabase
            .from('surge_pricing_area_zones')
            .select('count', { count: 'exact', head: true })
            .eq('surge_pricing_id', surge.id);

          // If no zones linked, surge applies everywhere
          if (!zoneCount || zoneCount.count === 0) {
            total += surge.extra_charge_amount;
            break; // Apply first matching surge
          } else {
            // If zones exist, we'd need location data to check if applies
            // This is simplified - in a real app, you'd need to check if user is in a zone
            // For now, just apply if there are zones (this should be refined with location check)
            total += surge.extra_charge_amount;
            break; // Apply first matching surge
          }
        }
      } else {
        // Fallback to global surge pricing
        const { data: globalSurges } = await surgeQuery
          .is('tenant_id', null);
          
        if (globalSurges && globalSurges.length > 0) {
          total += globalSurges[0].extra_charge_amount;
        }
      }
    } else {
      // No tenant ID specified
      const { data: surges } = await surgeQuery;
      if (surges && surges.length > 0) {
        total += surges[0].extra_charge_amount;
      }
    }
  } catch (error) {
    console.error("Error applying surge price:", error);
    // Continue without surge pricing
  }

  // Round to 2 decimal places
  return Math.round(total * 100) / 100;
}
