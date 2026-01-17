import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface TableCartItem {
  id?: string;
  username: string;
  phone_number: string;
  table_number: string;
  item_id: string;
  item_name: string;
  quantity: number;
  price: number;
  tenant_id?: string;
  restaurant_id?: string;
  image_url?: string;
  is_veg?: boolean;
  quantity_label?: string;
  offer_price?: number;
  selected_addons?: any[];
}

export function useTableCart() {
  const [isLoading, setIsLoading] = useState(false);

  const addToCart = async (item: Omit<TableCartItem, 'id'>) => {
    try {
      setIsLoading(true);

      // Check if item already exists
      const { data: existing } = await supabase
        .from('table_order_cart')
        .select('*')
        .eq('phone_number', item.phone_number)
        .eq('table_number', item.table_number)
        .eq('item_id', item.item_id)
        .maybeSingle();

      if (existing) {
        // Update quantity
        const { error } = await supabase
          .from('table_order_cart')
          .update({ quantity: existing.quantity + 1 })
          .eq('id', existing.id);

        if (error) throw error;
        toast({ title: "Updated quantity in cart" });
      } else {
        // Insert new item
        const { error } = await supabase
          .from('table_order_cart')
          .insert({
            username: item.username,
            phone_number: item.phone_number,
            table_number: item.table_number,
            item_id: item.item_id,
            item_name: item.item_name,
            quantity: item.quantity,
            price: item.price,
            tenant_id: item.tenant_id,
            restaurant_id: item.restaurant_id
          });

        if (error) throw error;
        toast({ title: "Added to cart" });
      }

      return true;
    } catch (error: any) {
      console.error('Error adding to cart:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const getCartItems = async (phoneNumber: string, tableNumber: string) => {
    try {
      setIsLoading(true);

      const { data, error } = await supabase
        .from('table_order_cart')
        .select(`
          *,
          menu_items:item_id (
            image_url,
            is_veg,
            quantity_label,
            offer_price
          )
        `)
        .eq('phone_number', phoneNumber)
        .eq('table_number', tableNumber);

      if (error) throw error;

      return data.map(item => ({
        ...item,
        image_url: item.menu_items?.image_url,
        is_veg: item.menu_items?.is_veg,
        quantity_label: item.menu_items?.quantity_label,
        offer_price: item.menu_items?.offer_price
      }));
    } catch (error: any) {
      console.error('Error fetching cart:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message
      });
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    try {
      setIsLoading(true);

      if (quantity < 1) {
        const { error } = await supabase
          .from('table_order_cart')
          .delete()
          .eq('id', itemId);

        if (error) throw error;
        toast({ title: "Removed from cart" });
      } else {
        const { error } = await supabase
          .from('table_order_cart')
          .update({ quantity })
          .eq('id', itemId);

        if (error) throw error;
      }

      return true;
    } catch (error: any) {
      console.error('Error updating quantity:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const removeItem = async (itemId: string) => {
    try {
      setIsLoading(true);

      const { error } = await supabase
        .from('table_order_cart')
        .delete()
        .eq('id', itemId);

      if (error) throw error;
      toast({ title: "Removed from cart" });
      return true;
    } catch (error: any) {
      console.error('Error removing item:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const placeOrder = async (
    phoneNumber: string,
    tableNumber: string,
    username: string,
    paymentMethod: string,
    tenantId?: string,
    restaurantId?: string
  ) => {
    try {
      setIsLoading(true);

      // Get cart items
      const cartItems = await getCartItems(phoneNumber, tableNumber);
      if (cartItems.length === 0) {
        throw new Error('Cart is empty');
      }

      // Calculate total
      const totalAmount = cartItems.reduce(
        (sum, item) => sum + (item.offer_price || item.price) * item.quantity,
        0
      );

      // Create order items JSON
      const orderItems = cartItems.map(item => ({
        itemId: item.item_id,
        itemName: item.item_name,
        quantity: item.quantity,
        price: item.offer_price || item.price
      }));

      // Insert order
      const { data: order, error: orderError } = await supabase
        .from('table_orders')
        .insert({
          username,
          phone_number: phoneNumber,
          table_number: tableNumber,
          order_items: orderItems,
          total_amount: totalAmount,
          status: 'pending',
          tenant_id: tenantId,
          restaurant_id: restaurantId
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Clear cart
      const { error: clearError } = await supabase
        .from('table_order_cart')
        .delete()
        .eq('phone_number', phoneNumber)
        .eq('table_number', tableNumber);

      if (clearError) throw clearError;

      toast({ title: "Order placed successfully!" });
      return order;
    } catch (error: any) {
      console.error('Error placing order:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    addToCart,
    getCartItems,
    updateQuantity,
    removeItem,
    placeOrder,
    isLoading
  };
}
