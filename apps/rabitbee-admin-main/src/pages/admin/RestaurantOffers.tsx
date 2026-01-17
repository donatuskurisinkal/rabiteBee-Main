
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { DataTable } from "@/components/admin/DataTable";
import { ConfirmationDialog } from "@/components/admin/ConfirmationDialog";
import { OfferForm } from "@/components/admin/restaurant-offers/OfferForm";
import { createOfferColumns } from "@/components/admin/restaurant-offers/offerColumns";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useTenant } from "@/contexts/TenantContext";
import { Select, SelectContent, SelectTrigger, SelectValue, SelectItem } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

export default function RestaurantOffers() {
  const { toast: legacyToast } = useToast();
  const { selectedTenant } = useTenant();
  const [formOpen, setFormOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<any>(null);
  const [selectedRestaurant, setSelectedRestaurant] = useState<string>("");
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; offer: any | null; }>({
    open: false,
    offer: null
  });

  // Fetch restaurants
  const { data: restaurants = [], isLoading: restaurantsLoading } = useQuery({
    queryKey: ['restaurants', selectedTenant?.id],
    queryFn: async () => {
      console.log("Fetching restaurants for tenant:", selectedTenant?.id);
      const { data, error } = await supabase
        .from('restaurants')
        .select('id, name')
        .order('name');
      
      if (error) {
        console.error("Error fetching restaurants:", error);
        throw error;
      }
      console.log("Fetched restaurants:", data);
      return data;
    }
  });

  // Auto-select first restaurant if none selected
  useEffect(() => {
    if (restaurants.length > 0 && !selectedRestaurant) {
      console.log("Auto-selecting first restaurant:", restaurants[0].id);
      setSelectedRestaurant(restaurants[0].id);
    }
  }, [restaurants, selectedRestaurant]);

  // Fetch offers based on selected restaurant
  const { data: offers = [], isLoading: offersLoading, refetch } = useQuery({
    queryKey: ['restaurant-offers', selectedTenant?.id, selectedRestaurant],
    queryFn: async () => {
      console.log("Fetching offers for restaurant:", selectedRestaurant);
      let query = supabase
        .from('restaurant_offers')
        .select('*')
        .order('created_at', { ascending: false });

      if (selectedRestaurant) {
        query = query.eq('restaurant_id', selectedRestaurant);
      }
      
      const { data, error } = await query;
      if (error) {
        console.error("Error fetching offers:", error);
        throw error;
      }
      console.log("Fetched offers:", data);
      return data;
    },
    enabled: !!selectedRestaurant
  });

  const handleDelete = async () => {
    if (!deleteDialog.offer) return;

    try {
      console.log("Deleting offer:", deleteDialog.offer.id);
      
      // Delete the image from storage if it exists
      if (deleteDialog.offer.image_url) {
        const imagePath = deleteDialog.offer.image_url.split('/').pop();
        if (imagePath) {
          console.log("Deleting image:", imagePath);
          await supabase.storage
            .from('restaurant-offers')
            .remove([imagePath]);
        }
      }

      // Delete the offer record
      const { error } = await supabase
        .from('restaurant_offers')
        .delete()
        .eq('id', deleteDialog.offer.id);

      if (error) {
        console.error("Error deleting offer:", error);
        throw error;
      }

      toast(`${deleteDialog.offer.title} has been deleted successfully.`);
      refetch();
    } catch (error: any) {
      console.error("Delete error:", error);
      toast.error(`Error deleting offer: ${error.message}`);
    } finally {
      setDeleteDialog({ open: false, offer: null });
    }
  };

  const columns = createOfferColumns();
  const isLoading = restaurantsLoading || offersLoading;

  if (!selectedRestaurant && !restaurantsLoading && restaurants.length > 0) {
    console.log("Setting initial restaurant:", restaurants[0].id);
    setSelectedRestaurant(restaurants[0].id);
  }

  if (restaurantsLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Restaurant Offers</h1>
          <p className="text-muted-foreground">
            Loading restaurants...
          </p>
        </div>
      </div>
    );
  }

  if (!selectedRestaurant && restaurants.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Restaurant Offers</h1>
          <p className="text-muted-foreground">
            No restaurants available. Please create a restaurant first.
          </p>
        </div>
      </div>
    );
  }

  if (!selectedRestaurant) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Restaurant Offers</h1>
          <p className="text-muted-foreground">
            Select a restaurant to manage its offers.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Select Restaurant</CardTitle>
          </CardHeader>
          <CardContent>
            <Select onValueChange={setSelectedRestaurant}>
              <SelectTrigger className="w-[300px]">
                <SelectValue placeholder="Select a restaurant" />
              </SelectTrigger>
              <SelectContent>
                {restaurants.map((restaurant) => (
                  <SelectItem key={restaurant.id} value={restaurant.id}>
                    {restaurant.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Restaurant Offers</h1>
        <p className="text-muted-foreground">
          Manage restaurant offers and promotions.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Offers List</CardTitle>
            <Select value={selectedRestaurant} onValueChange={setSelectedRestaurant}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select Restaurant" />
              </SelectTrigger>
              <SelectContent>
                {restaurants.map((restaurant) => (
                  <SelectItem key={restaurant.id} value={restaurant.id}>
                    {restaurant.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[calc(100vh-300px)]">
            <DataTable
              columns={columns}
              data={offers}
              onEdit={(offer) => {
                console.log("Editing offer:", offer);
                setEditingOffer(offer);
                setFormOpen(true);
              }}
              onDelete={(offer) => {
                console.log("Delete requested for offer:", offer);
                setDeleteDialog({ open: true, offer });
              }}
              onAdd={() => {
                console.log("Adding new offer for restaurant:", selectedRestaurant);
                setEditingOffer(null);
                setFormOpen(true);
              }}
              isLoading={isLoading}
              searchPlaceholder="Search offers..."
              permissions={{
                canAdd: true,
                canEdit: true,
                canDelete: true,
              }}
            />
          </ScrollArea>
        </CardContent>
      </Card>

      <OfferForm
        open={formOpen}
        onOpenChange={setFormOpen}
        offer={editingOffer}
        onSaved={() => {
          console.log("Offer saved, refreshing data");
          refetch();
        }}
        restaurantId={selectedRestaurant}
      />

      <ConfirmationDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}
        title="Delete Offer"
        description={`Are you sure you want to delete ${deleteDialog.offer?.title}? This action cannot be undone.`}
        onConfirm={handleDelete}
      />
    </div>
  );
}
