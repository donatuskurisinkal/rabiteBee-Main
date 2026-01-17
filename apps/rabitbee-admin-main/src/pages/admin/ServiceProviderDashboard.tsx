import { useEffect, useState } from "react";
import { useParams, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import { ServiceProviderOrders } from "@/components/admin/service-provider/ServiceProviderOrders";
import { ServiceProviderEarnings } from "@/components/admin/service-provider/ServiceProviderEarnings";
import { ServiceProviderAnalytics } from "@/components/admin/service-provider/ServiceProviderAnalytics";
import { ServiceProviderProfile } from "@/components/admin/service-provider/ServiceProviderProfile";

interface ServiceProvider {
  id: string;
  name: string;
  restaurant_id: string;
  email: string;
  phone_number: string;
  is_active: boolean;
}

const ServiceProviderDashboard = () => {
  const { providerId } = useParams<{ providerId: string }>();
  const { user } = useAuth();
  const [provider, setProvider] = useState<ServiceProvider | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    const fetchProviderData = async () => {
      if (!user) return;

      try {
        // Get service provider by user ID
        const { data, error } = await supabase
          .rpc('get_service_provider_by_user_id', { p_user_id: user.id });

        if (error) throw error;

        if (data && data.length > 0) {
          const providerData = data[0];
          
          // Check if the provider ID matches (if provided in URL)
          if (providerId && providerData.id !== providerId) {
            setHasAccess(false);
          } else {
            setProvider(providerData);
            setHasAccess(true);
          }
        } else {
          setHasAccess(false);
        }
      } catch (error) {
        console.error("Error fetching provider data:", error);
        setHasAccess(false);
      } finally {
        setLoading(false);
      }
    };

    fetchProviderData();
  }, [user, providerId]);

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-lg">Loading dashboard...</span>
      </div>
    );
  }

  if (!hasAccess || !provider) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-premium-gradient p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Card className="bg-gradient-to-r from-primary/20 to-primary/10 border-primary/20">
            <CardHeader>
              <CardTitle className="text-3xl font-bold text-primary">
                {provider.name}
              </CardTitle>
              <p className="text-muted-foreground">Service Provider Dashboard</p>
            </CardHeader>
          </Card>
        </div>

        {/* Dashboard Tabs */}
        <Tabs defaultValue="orders" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto">
            <TabsTrigger value="orders">Active Orders</TabsTrigger>
            <TabsTrigger value="earnings">Earnings</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
          </TabsList>

          <TabsContent value="orders" className="space-y-6">
            <ServiceProviderOrders 
              providerId={provider.id} 
              restaurantId={provider.restaurant_id} 
            />
          </TabsContent>

          <TabsContent value="earnings" className="space-y-6">
            <ServiceProviderEarnings 
              providerId={provider.id} 
              restaurantId={provider.restaurant_id} 
            />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <ServiceProviderAnalytics 
              providerId={provider.id} 
              restaurantId={provider.restaurant_id} 
            />
          </TabsContent>

          <TabsContent value="profile" className="space-y-6">
            <ServiceProviderProfile provider={provider} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ServiceProviderDashboard;
