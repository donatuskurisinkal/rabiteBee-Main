import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { Loader2, Users } from "lucide-react";

const profileSchema = z.object({
  phone_number: z.string().trim().regex(/^[0-9+\-\s()]*$/, "Invalid phone number format").max(20, "Phone number too long"),
  restaurant_id: z.string().uuid("Invalid restaurant").optional().nullable(),
});

interface ServiceProviderProfileProps {
  provider: {
    id: string;
    name: string;
    email: string;
    phone_number: string;
    is_active: boolean;
    restaurant_id?: string;
  };
}

interface Restaurant {
  id: string;
  name: string;
}

export const ServiceProviderProfile = ({ provider }: ServiceProviderProfileProps) => {
  const [phoneNumber, setPhoneNumber] = useState(provider.phone_number || '');
  const [restaurantId, setRestaurantId] = useState<string | null>(provider.restaurant_id || null);
  const [tenants, setTenants] = useState<{ id: string; name: string }[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState<string>('');
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [serviceProviders, setServiceProviders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingTenants, setLoadingTenants] = useState(true);
  const [loadingRestaurants, setLoadingRestaurants] = useState(false);
  const [loadingServiceProviders, setLoadingServiceProviders] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();

  // Fetch tenants on mount
  useEffect(() => {
    const fetchTenants = async () => {
      try {
        setLoadingTenants(true);
        const { data, error } = await supabase
          .from('tenants')
          .select('id, name')
          .eq('is_active', true)
          .order('name');

        if (error) throw error;
        setTenants(data || []);
      } catch (error) {
        console.error('Error fetching tenants:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load tenants"
        });
      } finally {
        setLoadingTenants(false);
      }
    };

    fetchTenants();
  }, [toast]);

  // Fetch restaurants and service providers when tenant is selected
  useEffect(() => {
    if (!selectedTenantId) {
      setRestaurants([]);
      setServiceProviders([]);
      return;
    }

    const fetchRestaurants = async () => {
      try {
        setLoadingRestaurants(true);
        const { data, error } = await supabase
          .from('restaurants')
          .select('id, name')
          .eq('tenant_id', selectedTenantId)
          .eq('isactive', true)
          .order('name');

        if (error) throw error;
        setRestaurants(data || []);
      } catch (error) {
        console.error('Error fetching restaurants:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load restaurants"
        });
      } finally {
        setLoadingRestaurants(false);
      }
    };

    const fetchServiceProviders = async () => {
      try {
        setLoadingServiceProviders(true);
        const { data, error } = await supabase
          .from('service_providers')
          .select(`
            id, 
            name, 
            email, 
            restaurant_id,
            restaurants (name)
          `)
          .eq('tenant_id', selectedTenantId)
          .eq('is_active', true)
          .order('name');

        if (error) throw error;
        setServiceProviders(data || []);
      } catch (error) {
        console.error('Error fetching service providers:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load service providers"
        });
      } finally {
        setLoadingServiceProviders(false);
      }
    };

    fetchRestaurants();
    fetchServiceProviders();
  }, [selectedTenantId, toast]);

  const handleUpdate = async () => {
    setLoading(true);
    setErrors({});

    try {
      // Validate input
      const validated = profileSchema.parse({
        phone_number: phoneNumber,
        restaurant_id: restaurantId,
      });

      const { error } = await supabase
        .from('service_providers')
        .update({ 
          phone_number: validated.phone_number,
          restaurant_id: validated.restaurant_id 
        })
        .eq('id', provider.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Profile updated successfully"
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0].toString()] = err.message;
          }
        });
        setErrors(fieldErrors);
        toast({
          variant: "destructive",
          title: "Validation Error",
          description: "Please check your input"
        });
      } else {
        console.error('Error updating profile:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to update profile"
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Select Tenant & Restaurant</CardTitle>
          <CardDescription>Choose your tenant and associated restaurant</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tenant">Tenant</Label>
            {loadingTenants ? (
              <div className="flex items-center justify-center p-3 border rounded-md">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                <span className="text-sm text-muted-foreground">Loading tenants...</span>
              </div>
            ) : (
              <Select 
                value={selectedTenantId} 
                onValueChange={setSelectedTenantId}
              >
                <SelectTrigger id="tenant">
                  <SelectValue placeholder="Select a tenant to view restaurants" />
                </SelectTrigger>
                <SelectContent>
                  {tenants.map((tenant) => (
                    <SelectItem key={tenant.id} value={tenant.id}>
                      {tenant.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {selectedTenantId && (
            <>
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" value={provider.name} disabled />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" value={provider.email || ''} disabled />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input 
                  id="phone" 
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="Enter phone number"
                  disabled={loading}
                />
                {errors.phone_number && (
                  <p className="text-sm text-destructive">{errors.phone_number}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="restaurant">Restaurant</Label>
                {loadingRestaurants ? (
                  <div className="flex items-center justify-center p-3 border rounded-md">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    <span className="text-sm text-muted-foreground">Loading restaurants...</span>
                  </div>
                ) : restaurants.length === 0 ? (
                  <p className="text-sm text-muted-foreground p-3 border rounded-md">
                    No restaurants found for this tenant
                  </p>
                ) : (
                  <Select 
                    value={restaurantId || undefined} 
                    onValueChange={setRestaurantId}
                    disabled={loading}
                  >
                    <SelectTrigger id="restaurant">
                      <SelectValue placeholder="Select a restaurant" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {restaurants.map((restaurant) => (
                        <SelectItem key={restaurant.id} value={restaurant.id}>
                          {restaurant.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {errors.restaurant_id && (
                  <p className="text-sm text-destructive">{errors.restaurant_id}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Input 
                  id="status" 
                  value={provider.is_active ? 'Active' : 'Inactive'} 
                  disabled 
                />
              </div>

              <Button 
                onClick={handleUpdate} 
                disabled={loading || loadingRestaurants}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update Profile'
                )}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {selectedTenantId && serviceProviders.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Service Providers
            </CardTitle>
            <CardDescription>Other service providers in this tenant</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingServiceProviders ? (
              <div className="flex items-center justify-center p-3">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                <span className="text-sm text-muted-foreground">Loading service providers...</span>
              </div>
            ) : (
              <div className="space-y-3">
                {serviceProviders.map((sp) => (
                  <div
                    key={sp.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div>
                      <p className="font-medium">{sp.name}</p>
                      <p className="text-sm text-muted-foreground">{sp.email}</p>
                    </div>
                    {sp.restaurants?.name && (
                      <Badge variant="secondary">{sp.restaurants.name}</Badge>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
