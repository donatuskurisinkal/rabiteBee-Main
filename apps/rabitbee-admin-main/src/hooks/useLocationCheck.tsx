
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function useLocationCheck() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  /**
   * Check if user coordinates are within any tenant's radius
   * @param latitude User's latitude
   * @param longitude User's longitude
   * @param userId Optional user ID to update the tenant_id if matching tenant is found
   */
  const checkLocation = async (latitude: number, longitude: number, userId?: string) => {
    try {
      setIsLoading(true);
      console.log(`Checking location for coordinates: Lat ${latitude}, Lng ${longitude}`);

      const { data, error } = await supabase.functions.invoke("check-user-location", {
        body: {
          latitude,
          longitude,
          userId
        },
        // Explicitly set headers to not include authorization if the function doesn't need it
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (error) {
        console.error("Error checking location:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message || "Failed to check location",
        });
        return { success: false, error };
      }

      console.log("Location check response:", data);
      
      if (data.inTenantRadius) {
        toast({
          title: "Location Match Found",
          description: `You are within ${data.tenant.name}'s service area`,
        });
      } else {
        toast({
          variant: "destructive",
          title: "No Tenant Match",
          description: "You are not within any tenant's service area",
        });
      }
      
      return { success: true, data };
    } catch (error) {
      console.error("Exception checking location:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Something went wrong while checking your location",
      });
      return { success: false, error };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    checkLocation
  };
}
