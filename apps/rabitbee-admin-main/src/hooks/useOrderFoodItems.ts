
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useTenant } from '@/hooks/use-tenant';

interface OrderFoodItem {
  id?: string;
  order_id: string;
  menu_item_id: string;
  restaurant_id: string;
  quantity: number;
  price: number;
  notes?: string;
  addons?: any;
  menu_items?: {
    id: string;
    name: string;
    price: number;
    image_url?: string;
    description?: string;
    offer_price?: number;
    is_customisable?: boolean;
  };
}

interface GetOrderFoodItemsParams {
  orderId: string;
}

interface SaveOrderFoodItemResponse {
  success: boolean;
  message: string;
  data?: any;
}

export function useOrderFoodItems() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { selectedTenant } = useTenant();

  /**
   * Add a new order food item
   */
  const saveOrderFoodItem = async (item: OrderFoodItem): Promise<SaveOrderFoodItemResponse> => {
    try {
      setIsLoading(true);
      setError(null);

      // Prepare the data for insertion
      const itemToSave = {
        ...item,
        tenant_id: selectedTenant?.id
      };

      const { data, error: insertError } = await supabase
        .from('order_food_items')
        .insert(itemToSave)
        .select()
        .single();

      if (insertError) {
        console.error('Error saving order food item:', insertError);
        setError(insertError.message || 'Failed to save order food item');
        toast({
          title: "Error",
          description: "Failed to save order food item",
          variant: "destructive",
        });
        return {
          success: false,
          message: insertError.message || 'Failed to save order food item'
        };
      }

      toast({
        title: "Success",
        description: "Order food item saved successfully",
        variant: "default",
      });

      return {
        success: true,
        message: 'Order food item saved successfully',
        data
      };
    } catch (err: any) {
      console.error('Unexpected error saving order food item:', err);
      setError(err.message || 'An unexpected error occurred');
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
      return {
        success: false,
        message: err.message || 'An unexpected error occurred'
      };
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Update an existing order food item
   */
  const updateOrderFoodItem = async (id: string, updates: Partial<OrderFoodItem>): Promise<SaveOrderFoodItemResponse> => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error: updateError } = await supabase
        .from('order_food_items')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating order food item:', updateError);
        setError(updateError.message || 'Failed to update order food item');
        toast({
          title: "Error",
          description: "Failed to update order food item",
          variant: "destructive",
        });
        return {
          success: false,
          message: updateError.message || 'Failed to update order food item'
        };
      }

      toast({
        title: "Success",
        description: "Order food item updated successfully",
        variant: "default",
      });

      return {
        success: true,
        message: 'Order food item updated successfully',
        data
      };
    } catch (err: any) {
      console.error('Unexpected error updating order food item:', err);
      setError(err.message || 'An unexpected error occurred');
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
      return {
        success: false,
        message: err.message || 'An unexpected error occurred'
      };
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Get all food items for a specific order
   */
  const getOrderFoodItems = async ({ orderId }: GetOrderFoodItemsParams): Promise<OrderFoodItem[]> => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('order_food_items')
        .select(`
          *,
          menu_items:menu_item_id (
            id,
            name,
            price,
            image_url,
            description,
            offer_price,
            is_customisable
          )
        `)
        .eq('order_id', orderId);

      if (fetchError) {
        console.error('Error fetching order food items:', fetchError);
        setError(fetchError.message || 'Failed to fetch order food items');
        return [];
      }

      // Convert the data to ensure addons is properly typed
      const typedData = data?.map(item => ({
        ...item,
        addons: item.addons || []
      })) as OrderFoodItem[];

      return typedData || [];
    } catch (err: any) {
      console.error('Unexpected error fetching order food items:', err);
      setError(err.message || 'An unexpected error occurred');
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Remove an order food item
   */
  const removeOrderFoodItem = async (id: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      const { error: deleteError } = await supabase
        .from('order_food_items')
        .delete()
        .eq('id', id);

      if (deleteError) {
        console.error('Error removing order food item:', deleteError);
        setError(deleteError.message || 'Failed to remove order food item');
        toast({
          title: "Error",
          description: "Failed to remove order food item",
          variant: "destructive",
        });
        return false;
      }

      toast({
        title: "Success",
        description: "Order food item removed successfully",
        variant: "default",
      });

      return true;
    } catch (err: any) {
      console.error('Unexpected error removing order food item:', err);
      setError(err.message || 'An unexpected error occurred');
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    saveOrderFoodItem,
    updateOrderFoodItem,
    getOrderFoodItems,
    removeOrderFoodItem,
    isLoading,
    error,
  };
}
