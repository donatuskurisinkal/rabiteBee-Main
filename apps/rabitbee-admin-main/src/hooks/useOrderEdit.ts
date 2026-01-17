import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function useOrderEdit() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Update item quantity
  const updateItemQuantity = async (itemId: string, newQuantity: number) => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('order_food_items')
        .update({ quantity: newQuantity })
        .eq('id', itemId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Item quantity updated successfully",
      });

      return true;
    } catch (error) {
      console.error('Error updating quantity:', error);
      toast({
        title: "Error",
        description: "Failed to update item quantity",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Remove item from order
  const removeOrderItem = async (itemId: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('order_food_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Item removed from order successfully",
      });

      return true;
    } catch (error) {
      console.error('Error removing item:', error);
      toast({
        title: "Error",
        description: "Failed to remove item from order",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Add item to order
  const addOrderItem = async (orderItem: {
    order_id: string;
    menu_item_id: string;
    restaurant_id: string;
    quantity: number;
    price: number;
    notes?: string;
    addons?: any[];
  }) => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('order_food_items')
        .insert([orderItem]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Item added to order successfully",
      });

      return true;
    } catch (error) {
      console.error('Error adding item:', error);
      toast({
        title: "Error",
        description: "Failed to add item to order",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Change restaurant for entire order
  const changeOrderRestaurant = async (orderId: string) => {
    setIsLoading(true);
    try {
      // First, remove all existing items
      const { error: deleteError } = await supabase
        .from('order_food_items')
        .delete()
        .eq('order_id', orderId);

      if (deleteError) throw deleteError;

      // Update order total to 0 since all items are removed (only update total_amount)
      const { error: updateError } = await supabase
        .from('orders')
        .update({ 
          total_amount: 0
        })
        .eq('id', orderId);

      if (updateError) throw updateError;

      toast({
        title: "Success",
        description: "Restaurant changed successfully. Please add new items.",
      });

      return true;
    } catch (error) {
      console.error('Error changing restaurant:', error);
      toast({
        title: "Error",
        description: "Failed to change restaurant",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Recalculate order total
  const recalculateOrderTotal = async (orderId: string) => {
    setIsLoading(true);
    try {
      // Get all order items
      const { data: items, error: itemsError } = await supabase
        .from('order_food_items')
        .select('quantity, price')
        .eq('order_id', orderId);

      if (itemsError) throw itemsError;

      // Calculate new total
      const newTotal = items?.reduce((sum, item) => sum + (item.quantity * item.price), 0) || 0;

      // Update only total_amount (final_amount is a generated column)
      const { error: updateError } = await supabase
        .from('orders')
        .update({ 
          total_amount: newTotal
        })
        .eq('id', orderId);

      if (updateError) throw updateError;

      return newTotal;
    } catch (error) {
      console.error('Error recalculating total:', error);
      toast({
        title: "Error",
        description: "Failed to recalculate order total",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    updateItemQuantity,
    removeOrderItem,
    addOrderItem,
    changeOrderRestaurant,
    recalculateOrderTotal
  };
}