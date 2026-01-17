
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useTenant } from '@/hooks/use-tenant';

// Define the enum to match the database enum for order_type
export type OrderType = 'food' | 'grocery';

interface CartItem {
  id?: string;
  menu_item_id?: string;
  product_id?: string;
  quantity: number;
  notes?: string;
  selected_addons?: any[];
  order_type: OrderType;
  tenant_id?: string;
  menuItem?: {
    id: string;
    name: string;
    price: number;
    image?: string;
    description?: string;
    offerPrice?: number;
    isCustomisable?: boolean;
    tags?: string[];
  };
}

interface SaveCartItemResponse {
  success: boolean;
  message: string;
  data: any;
}

interface UpdateCartItemPayload {
  id: string;
  quantity?: number;
  notes?: string;
  selected_addons?: any[];
}

export function useCart() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { selectedTenant } = useTenant();

  /**
   * Add or update an item in the cart
   */
  const saveCartItem = async (cartItem: CartItem): Promise<SaveCartItemResponse | null> => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error: functionError } = await supabase.functions.invoke('save-cart-item', {
        body: cartItem,
      });

      if (functionError) {
        console.error('Error saving cart item:', functionError);
        setError(functionError.message || 'Failed to save item to cart');
        toast({
          title: "Error",
          description: "Failed to save item to cart",
          variant: "destructive",
        });
        return null;
      }

      toast({
        title: "Success",
        description: "Item added to cart",
        variant: "default",
      });

      return data as SaveCartItemResponse;
    } catch (err: any) {
      console.error('Unexpected error saving cart item:', err);
      setError(err.message || 'An unexpected error occurred');
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Update an existing cart item
   */
  const updateCartItem = async (updatePayload: UpdateCartItemPayload): Promise<SaveCartItemResponse | null> => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error: functionError } = await supabase.functions.invoke('update-cart-item', {
        body: updatePayload,
      });

      if (functionError) {
        console.error('Error updating cart item:', functionError);
        setError(functionError.message || 'Failed to update cart item');
        toast({
          title: "Error",
          description: "Failed to update cart item",
          variant: "destructive",
        });
        return null;
      }

      toast({
        title: "Success",
        description: "Cart item updated",
        variant: "default",
      });

      return data as SaveCartItemResponse;
    } catch (err: any) {
      console.error('Unexpected error updating cart item:', err);
      setError(err.message || 'An unexpected error occurred');
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Get all cart items for the current user
   */
  const getCartItems = async (): Promise<CartItem[]> => {
    try {
      setIsLoading(true);
      setError(null);

      // Use the edge function to get cart items with tenant_id if available
      const tenantId = selectedTenant?.id;
      
      // Build the correct options object for the function call
      const options: { headers?: Record<string, string> } = {};
      if (tenantId) {
        options.headers = {
          'x-tenant-id': tenantId
        };
      }
      
      const { data, error: functionError } = await supabase.functions.invoke('get-cart-items', options);

      if (functionError) {
        console.error('Error fetching cart items:', functionError);
        setError(functionError.message || 'Failed to fetch cart items');
        return [];
      }

      return data?.data || [];
    } catch (err: any) {
      console.error('Unexpected error fetching cart items:', err);
      setError(err.message || 'An unexpected error occurred');
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Remove an item from the cart
   */
  const removeCartItem = async (cartItemId: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      const { error: deleteError } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', cartItemId);

      if (deleteError) {
        console.error('Error removing cart item:', deleteError);
        setError(deleteError.message || 'Failed to remove item from cart');
        toast({
          title: "Error",
          description: "Failed to remove item from cart",
          variant: "destructive",
        });
        return false;
      }

      toast({
        title: "Success",
        description: "Item removed from cart",
        variant: "default",
      });

      return true;
    } catch (err: any) {
      console.error('Unexpected error removing cart item:', err);
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

  /**
   * Clear all items from the cart
   */
  const clearCart = async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      const user = await supabase.auth.getUser();
      
      if (!user.data.user) {
        setError('User not authenticated');
        toast({
          title: "Error",
          description: "User not authenticated",
          variant: "destructive",
        });
        return false;
      }

      const { error: deleteError } = await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', user.data.user.id);

      if (deleteError) {
        console.error('Error clearing cart:', deleteError);
        setError(deleteError.message || 'Failed to clear cart');
        toast({
          title: "Error",
          description: "Failed to clear cart",
          variant: "destructive",
        });
        return false;
      }

      toast({
        title: "Success",
        description: "Cart cleared",
        variant: "default",
      });

      return true;
    } catch (err: any) {
      console.error('Unexpected error clearing cart:', err);
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
    saveCartItem,
    updateCartItem,
    getCartItems,
    removeCartItem,
    clearCart,
    isLoading,
    error,
  };
}
