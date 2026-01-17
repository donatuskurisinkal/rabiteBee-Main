import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { DataTable } from "@/components/admin/DataTable";
import { ConfirmationDialog } from "@/components/admin/ConfirmationDialog";
import { RestaurantForm } from "@/components/admin/restaurants/RestaurantForm";
import { createRestaurantColumns } from "@/components/admin/restaurants/restaurantColumns";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useTenant } from "@/hooks/use-tenant";
import { ensureStorageBucket } from "@/utils/storageHelpers";

interface Restaurant {
  id: string;
  name: string;
  description?: string;
  address?: string;
  logo_url?: string;
  cover_image_url?: string;
  is_open: boolean;
  rating: number;
  rating_count: number;
  opening_time: string;
  closing_time: string;
  min_order_value: number;
  delivery_fee: number;
  prep_time_mins: number;
  isActive: boolean;
  created_at: string;
  latitude?: number;
  longitude?: number;
  tags?: string[];
  food_type: string;
  is_sold_out: boolean;
  subtitle?: string;
  availability_window: string;
}

export default function Restaurants() {
  const { toast } = useToast();
  const { selectedTenant } = useTenant();
  const [formOpen, setFormOpen] = useState(false);
  const [editingRestaurant, setEditingRestaurant] = useState<Restaurant | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; restaurant: Restaurant | null; }>({
    open: false,
    restaurant: null
  });

  // Initialize the storage bucket when the page loads
  useEffect(() => {
    const initStorage = async () => {
      try {
        await ensureStorageBucket("restaurants");
      } catch (error) {
        console.error("Failed to initialize storage bucket:", error);
      }
    };
    
    initStorage();
  }, []);

  const { data: restaurants = [], isLoading, refetch } = useQuery({
    queryKey: ['restaurants', selectedTenant?.id],
    queryFn: async () => {
      let query = supabase
        .from('restaurants')
        .select('*')
        .order('name');
      
      if (selectedTenant) {
        query = query.eq('tenant_id', selectedTenant.id);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      // Map 'isactive' from database to 'isActive' in our component
      return data.map(restaurant => ({
        ...restaurant,
        isActive: restaurant.isactive
      }));
    }
  });

  const handleDelete = async () => {
    if (!deleteDialog.restaurant) return;

    try {
      const { error } = await supabase
        .from('restaurants')
        .delete()
        .eq('id', deleteDialog.restaurant.id);

      if (error) throw error;

      // Delete associated images if they exist
      if (deleteDialog.restaurant.logo_url) {
        const logoPath = deleteDialog.restaurant.logo_url.split('/').pop();
        if (logoPath) {
          await supabase.storage
            .from('restaurants')
            .remove([`${deleteDialog.restaurant.id}/${logoPath}`]);
        }
      }

      if (deleteDialog.restaurant.cover_image_url) {
        const coverPath = deleteDialog.restaurant.cover_image_url.split('/').pop();
        if (coverPath) {
          await supabase.storage
            .from('restaurants')
            .remove([`${deleteDialog.restaurant.id}/${coverPath}`]);
        }
      }

      toast({
        title: "Restaurant deleted",
        description: `${deleteDialog.restaurant.name} has been deleted successfully.`,
      });

      refetch();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error deleting restaurant",
        description: error.message,
      });
    } finally {
      setDeleteDialog({ open: false, restaurant: null });
    }
  };

  const handleEdit = (restaurant: Restaurant) => {
    console.log("Edit restaurant:", restaurant);
    setEditingRestaurant(restaurant);
    setFormOpen(true);
  };

  const handleAdd = () => {
    setEditingRestaurant(null);
    setFormOpen(true);
  };

  const columns = createRestaurantColumns();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold tracking-tight">Restaurant Management</h1>
        <p className="text-muted-foreground">
          Manage restaurants and their details in the system.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Restaurants List</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={restaurants}
            columns={columns}
            onEdit={handleEdit}
            onDelete={(restaurant) => {
              setDeleteDialog({ open: true, restaurant });
            }}
            onAdd={handleAdd}
            isLoading={isLoading}
            searchPlaceholder="Search restaurants..."
            permissions={{
              canAdd: true,
              canEdit: true,
              canDelete: true,
            }}
          />
        </CardContent>
      </Card>

      <RestaurantForm
        open={formOpen}
        onOpenChange={setFormOpen}
        restaurant={editingRestaurant}
        onSaved={refetch}
      />

      <ConfirmationDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}
        title="Delete Restaurant"
        description={`Are you sure you want to delete ${deleteDialog.restaurant?.name}? This will also delete all categories and menu items associated with this restaurant.`}
        onConfirm={handleDelete}
      />
    </div>
  );
}
