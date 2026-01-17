
import { supabase } from "@/integrations/supabase/client";

/**
 * Calculates delivery charge based on distance, current time, and tenant
 * 
 * @param distanceKm - Distance in kilometers
 * @param timestamp - Optional timestamp to override current time (for testing)
 * @param tenantId - Optional tenant ID to filter rules
 * @returns The calculated delivery charge
 */
export async function calculateDeliveryCharge(
  distanceKm: number, 
  timestamp?: Date | string,
  tenantId?: string
): Promise<number> {
  try {
    const { data, error } = await supabase.functions.invoke('calculate-delivery-charge', {
      body: {
        distanceKm,
        timestamp: timestamp ? new Date(timestamp).toISOString() : new Date().toISOString(),
        tenantId: tenantId || null
      }
    });

    if (error) {
      console.error('Error calculating delivery charge:', error);
      throw error;
    }

    return data.charge;
  } catch (error) {
    console.error('Failed to calculate delivery charge:', error);
    // Return a fallback calculation in case of error
    return Math.round(distanceKm * 10 * 100) / 100;
  }
}
