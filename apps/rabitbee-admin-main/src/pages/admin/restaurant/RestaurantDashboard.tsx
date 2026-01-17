import { useState, useEffect } from "react";
import { useParams, Navigate, Routes, Route } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { RestaurantSidebar } from "@/components/admin/restaurant/RestaurantSidebar";
import RestaurantOrders from "./tabs/RestaurantOrders";
import RestaurantMenu from "./tabs/RestaurantMenu";
import RestaurantAnalytics from "./tabs/RestaurantAnalytics";
import RestaurantStaff from "./tabs/RestaurantStaff";
import RestaurantSettings from "./tabs/RestaurantSettings";

export default function RestaurantDashboard() {
  const { restaurantId } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const [restaurant, setRestaurant] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    if (!restaurantId) return;
    
    const loadRestaurant = async () => {
      try {
        setLoading(true);
        
        // Fetch restaurant details
        const { data: restaurantData, error: restaurantError } = await supabase
          .from('restaurants')
          .select('*')
          .eq('id', restaurantId)
          .single();

        if (restaurantError) throw restaurantError;

        setRestaurant(restaurantData);
        
        // Check if user has access (admin, service_provider with restaurant, or same tenant)
        const { data: userData } = await supabase
          .from('users')
          .select('tenant_id, role, restaurant_id')
          .eq('id', user?.id)
          .single();

        const hasPermission = 
          userData?.role === 'admin' || 
          userData?.role === 'service_provider' ||
          userData?.restaurant_id === restaurantId ||
          userData?.tenant_id === restaurantData.tenant_id;

        setHasAccess(hasPermission);

        if (!hasPermission) {
          toast({
            title: "Access Denied",
            description: "You don't have permission to access this restaurant dashboard",
            variant: "destructive",
          });
        }
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadRestaurant();
  }, [restaurantId, user, toast]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!hasAccess) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <RestaurantSidebar restaurant={restaurant} />
        
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="glass-card border-b sticky top-0 z-10 backdrop-blur-lg h-14 flex items-center px-4">
            <SidebarTrigger />
            <div className="ml-4">
              <h1 className="text-lg font-semibold">Restaurant Dashboard</h1>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 p-6">
            <Routes>
              <Route index element={<Navigate to={`/restaurant/${restaurantId}/orders`} replace />} />
              <Route path="orders" element={<RestaurantOrders restaurantId={restaurantId!} />} />
              <Route path="menu" element={<RestaurantMenu restaurantId={restaurantId!} />} />
              <Route path="analytics" element={<RestaurantAnalytics restaurantId={restaurantId!} />} />
              <Route path="staff" element={<RestaurantStaff restaurantId={restaurantId!} />} />
              <Route path="settings" element={<RestaurantSettings restaurant={restaurant} onUpdate={setRestaurant} />} />
            </Routes>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
