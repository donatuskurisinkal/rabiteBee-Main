import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { DataTable } from "@/components/admin/DataTable";
import { ConfirmationDialog } from "@/components/admin/ConfirmationDialog";
import { MenuItemForm } from "@/components/admin/menu-items/MenuItemForm";
import { menuItemColumns, MenuItem } from "@/components/admin/menu-items/menuItemColumns";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/hooks/use-tenant";
import { Select, SelectContent, SelectTrigger, SelectValue, SelectItem } from "@/components/ui/select";
import { ensureStorageBucket } from "@/utils/storageHelpers";
import { toast } from "sonner";

export default function MenuItems() {
  const { toast } = useToast();
  const { selectedTenant } = useTenant();
  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [selectedRestaurant, setSelectedRestaurant] = useState<string>("all");
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; item: MenuItem | null; }>({
    open: false,
    item: null
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bucketStatus, setBucketStatus] = useState<'checking' | 'ready' | 'error'>('checking');

  // Initialize the menu-items bucket when the component mounts
  useEffect(() => {
    const initMenuItemsBucket = async () => {
      try {
        console.log("Initializing menu-items bucket...");
        setBucketStatus('checking');
        
        // Try multiple times to ensure bucket is checked
        for (let attempt = 1; attempt <= 2; attempt++) {
          console.log(`Attempt ${attempt} to check menu-items bucket`);
          
          const success = await ensureStorageBucket("menu-items");
          
          if (success) {
            console.log("menu-items bucket exists or was created successfully");
            setBucketStatus('ready');
            return;
          }
          
          // Wait a bit before retrying
          if (attempt < 2) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
        
        // If we get here, likely a permissions issue
        console.warn("Could not confirm menu-items bucket status. Will still attempt uploads.");
        // We mark as ready anyway since we'll attempt uploads
        setBucketStatus('ready');
        
      } catch (error) {
        console.error("Error checking menu-items bucket:", error);
        // Even if there's an error, we'll still allow uploads to try
        setBucketStatus('ready');
      }
    };
    
    initMenuItemsBucket();
  }, []);

  // Show toast warning if bucket status is error
  useEffect(() => {
    if (bucketStatus === 'error') {
      toast({
        variant: "destructive",
        title: "Storage Access Warning",
        description: "Unable to confirm storage bucket access. Uploads may still work if the bucket exists."
      });
    }
  }, [bucketStatus, toast]);

  // Fetch restaurants
  const { data: restaurants = [] } = useQuery({
    queryKey: ['restaurants', selectedTenant?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('restaurants')
        .select('id, name')
        .order('name');
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch menu items based on selected restaurant
  const { data: menuItems = [], isLoading, refetch } = useQuery({
    queryKey: ['menu-items', selectedTenant?.id, selectedRestaurant],
    queryFn: async () => {
      let query = supabase
        .from('menu_items')
        .select('*')
        .order('created_at');

      if (selectedRestaurant && selectedRestaurant !== 'all') {
        query = query.eq('restaurant_id', selectedRestaurant);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as MenuItem[];
    }
  });

  const handleSubmit = async (values: any) => {
    try {
      setIsSubmitting(true);
      if (editingItem) {
        // Update menu item
        const { error: menuItemError } = await supabase
          .from('menu_items')
          .update({
            name: values.name,
            description: values.description,
            subtitle: values.subtitle,
            price: values.price,
            offer_price: values.offer_price,
            discount_percent: values.discount_percent,
            category_id: values.category_id,
            restaurant_id: values.restaurant_id,
            is_veg: values.is_veg,
            is_customisable: values.is_customisable,
            is_popular: values.is_popular,
            is_sold_out: values.is_sold_out,
            available: values.available,
            preparation_time: values.preparation_time,
            quantity_label: values.quantity_label,
            rating_value: values.rating_value,
            rating_count: values.rating_count,
            availability_window: values.availability_window,
            unavailable_reason: values.unavailable_reason,
            image_url: values.image_url,
            product_tags: values.product_tags,
            iscombo: values.iscombo,
            combo_description: values.combo_description,
          })
          .eq('id', editingItem.id);

        if (menuItemError) throw menuItemError;

        // Update add-ons
        if (values.is_customisable) {
          // Delete existing add-ons
          const { error: deleteError } = await supabase
            .from('item_addons')
            .delete()
            .eq('menu_item_id', editingItem.id);

          if (deleteError) throw deleteError;

          // Insert new add-ons
          if (values.addons?.length > 0) {
            const { error: addonsError } = await supabase
              .from('item_addons')
              .insert(
                values.addons.map((addon: any) => ({
                  ...addon,
                  menu_item_id: editingItem.id,
                }))
              );

            if (addonsError) throw addonsError;
          }
        }

        toast({
          title: "Menu item updated",
          description: "The menu item has been updated successfully.",
        });
      } else {
        // Create new menu item
        const { data: newItem, error: menuItemError } = await supabase
          .from('menu_items')
          .insert([{
            name: values.name,
            description: values.description,
            subtitle: values.subtitle,
            price: values.price,
            offer_price: values.offer_price,
            discount_percent: values.discount_percent,
            category_id: values.category_id,
            restaurant_id: values.restaurant_id,
            is_veg: values.is_veg,
            is_customisable: values.is_customisable,
            is_popular: values.is_popular,
            is_sold_out: values.is_sold_out,
            available: values.available,
            preparation_time: values.preparation_time,
            quantity_label: values.quantity_label,
            rating_value: values.rating_value,
            rating_count: values.rating_count,
            availability_window: values.availability_window,
            unavailable_reason: values.unavailable_reason,
            image_url: values.image_url,
            product_tags: values.product_tags,
            iscombo: values.iscombo,
            combo_description: values.combo_description,
          }])
          .select()
          .single();

        if (menuItemError) throw menuItemError;

        // Insert add-ons if the item is customisable
        if (values.is_customisable && values.addons?.length > 0) {
          const { error: addonsError } = await supabase
            .from('item_addons')
            .insert(
              values.addons.map((addon: any) => ({
                ...addon,
                menu_item_id: newItem.id,
              }))
            );

          if (addonsError) throw addonsError;
        }

        toast({
          title: "Menu item created",
          description: "The menu item has been created successfully.",
        });
      }

      setFormOpen(false);
      refetch();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog.item) return;

    try {
      // First delete addons
      await supabase
        .from('item_addons')
        .delete()
        .eq('menu_item_id', deleteDialog.item.id);
        
      // Then delete the menu item
      const { error } = await supabase
        .from('menu_items')
        .delete()
        .eq('id', deleteDialog.item.id);

      if (error) throw error;

      toast({
        title: "Menu item deleted",
        description: `${deleteDialog.item?.name} has been deleted successfully.`,
      });

      refetch();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error deleting menu item",
        description: error.message,
      });
    } finally {
      setDeleteDialog({ open: false, item: null });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Menu Items</h1>
        <p className="text-muted-foreground">
          Manage restaurant menu items and their details.
          {bucketStatus === 'error' && (
            <span className="ml-1 text-yellow-500">
              (⚠️ Storage initialization issue - image uploads may still work if bucket exists)
            </span>
          )}
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Menu Items List</CardTitle>
            <Select 
              value={selectedRestaurant} 
              onValueChange={setSelectedRestaurant}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select Restaurant" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Restaurants</SelectItem>
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
          <DataTable
            columns={menuItemColumns}
            data={menuItems}
            onEdit={(item) => {
              setEditingItem(item);
              setFormOpen(true);
            }}
            onDelete={(item) => {
              setDeleteDialog({ open: true, item });
            }}
            onAdd={() => {
              setEditingItem(null);
              setFormOpen(true);
            }}
            isLoading={isLoading}
            searchPlaceholder="Search menu items..."
            permissions={{
              canAdd: true,
              canEdit: true,
              canDelete: true,
            }}
          />
        </CardContent>
      </Card>

      <MenuItemForm
        restaurantId={selectedRestaurant !== "all" ? selectedRestaurant : ""}
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleSubmit}
        menuItem={editingItem}
        isSubmitting={isSubmitting}
      />

      <ConfirmationDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}
        title="Delete Menu Item"
        description={`Are you sure you want to delete ${deleteDialog.item?.name}? This cannot be undone.`}
        onConfirm={handleDelete}
      />
    </div>
  );
}
