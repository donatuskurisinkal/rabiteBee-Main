
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTenant } from "./use-tenant";

export type TenantBanner = {
  id: string;
  name: string;
  imageUrl: string;
  description: string | null;
  secondaryDescription: string | null;
  assetType: "image" | "lottie";
  isActive: boolean;
  displayOrder: number;
  screenId: string;
  screenName: string;
};

interface UseTenantBannersOptions {
  onlyActive?: boolean;
  screenId?: string | null;
}

export function useTenantBanners(options: UseTenantBannersOptions = {}) {
  const { selectedTenant } = useTenant();
  const { onlyActive = true, screenId = null } = options;
  const [isLoading, setIsLoading] = useState(false);

  const fetchBanners = async (): Promise<TenantBanner[]> => {
    if (!selectedTenant?.id) {
      return [];
    }

    try {
      setIsLoading(true);
      
      const { data, error } = await supabase.functions.invoke('get-tenant-banners', {
        body: {
          tenantId: selectedTenant.id,
          onlyActive
        }
      });

      if (error) throw error;
      
      // Filter by screenId if provided
      let banners = data as TenantBanner[];
      if (screenId) {
        banners = banners.filter(banner => banner.screenId === screenId);
      }
      
      return banners;
    } catch (error) {
      console.error("Error fetching tenant banners:", error);
      toast.error("Failed to load banners");
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  return useQuery({
    queryKey: ["tenant-banners", selectedTenant?.id, onlyActive, screenId],
    queryFn: fetchBanners,
    enabled: !!selectedTenant?.id
  });
}
