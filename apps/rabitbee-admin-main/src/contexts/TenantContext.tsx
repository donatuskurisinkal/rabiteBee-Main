
import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Tenant {
  id: string;
  name: string;
  logo_url?: string | null;
  is_active: boolean;
}

interface TenantContextType {
  selectedTenant: Tenant | null;
  setSelectedTenant: (tenant: Tenant | null) => void;
  tenants: Tenant[];
  isLoading: boolean;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export const TenantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Set the tenant ID in supabase headers whenever it changes
  useEffect(() => {
    if (selectedTenant) {
      // Set the tenant ID in local storage for persistence
      localStorage.setItem("selectedTenantId", selectedTenant.id);
      localStorage.setItem("selectedTenantName", selectedTenant.name);
      
      // Update Supabase headers to include the tenant ID
      // Use custom headers for all future requests
      supabase.auth.getSession().then(({ data }) => {
        // Apply the custom header to all future requests
        supabase.functions.setAuth(data.session?.access_token || null);

        // For database queries, we need to use customHeaders in each request
        // We'll handle this in individual queries when needed
      });
    } else {
      localStorage.removeItem("selectedTenantId");
      localStorage.removeItem("selectedTenantName");
    }
  }, [selectedTenant]);

  // Fetch available tenants
  useEffect(() => {
    const fetchTenants = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("tenants")
          .select("id, name, logo_url, is_active")
          .eq("is_active", true)
          .order("name");

        if (error) throw error;

        if (data && data.length > 0) {
          setTenants(data);
          
          // Try to restore previously selected tenant from local storage
          const storedTenantId = localStorage.getItem("selectedTenantId");
          if (storedTenantId) {
            const storedTenant = data.find(t => t.id === storedTenantId);
            if (storedTenant) {
              setSelectedTenant(storedTenant);
            } else {
              // If stored tenant not found, select first tenant
              setSelectedTenant(data[0]);
            }
          } else {
            // No stored tenant, select first tenant
            setSelectedTenant(data[0]);
          }
        }
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Failed to load tenants",
          description: error.message,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchTenants();
  }, [toast]);

  return (
    <TenantContext.Provider value={{ selectedTenant, setSelectedTenant, tenants, isLoading }}>
      {children}
    </TenantContext.Provider>
  );
};

// Expose the context for optional usage
const useTenantContext = () => {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error("useTenant must be used within a TenantProvider");
  }
  return context;
};

export const useTenant = Object.assign(useTenantContext, { Context: TenantContext });
