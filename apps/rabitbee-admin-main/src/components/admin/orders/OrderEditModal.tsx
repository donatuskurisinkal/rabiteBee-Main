import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Package, 
  Plus,
  Minus,
  Trash2,
  Edit3,
  RefreshCw,
  ShoppingCart,
  AlertTriangle
} from "lucide-react";
import { useOrderEdit } from "@/hooks/useOrderEdit";
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { ConfirmationDialog } from "@/components/admin/ConfirmationDialog";
import { WalletBalance } from "@/components/admin/wallet/WalletBalance";
import { WalletRefundModal } from "@/components/admin/wallet/WalletRefundModal";
import { useWallet } from "@/hooks/useWallet";

interface OrderEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: any;
  onUpdate: () => void;
}

export function OrderEditModal({
  open,
  onOpenChange,
  order,
  onUpdate
}: OrderEditModalProps) {
  const [orderItems, setOrderItems] = useState(order?.order_items || []);
  const [menuItems, setMenuItems] = useState([]);
  const [selectedMenuItem, setSelectedMenuItem] = useState('');
  const [addQuantity, setAddQuantity] = useState(1);
  const [selectedAddons, setSelectedAddons] = useState([]);
  const [itemAddons, setItemAddons] = useState([]);
  const [collectedAmount, setCollectedAmount] = useState(order?.collected_amount || 0);
  const [changeGiven, setChangeGiven] = useState(0);
  const [isAddingToWallet, setIsAddingToWallet] = useState(false);
  const [walletAddedOnce, setWalletAddedOnce] = useState(false);
  
  // Check if order is delivered and should be read-only
  const isOrderDelivered = order?.status === 'delivered';
  const [shouldResolveOrder, setShouldResolveOrder] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: '',
    description: '',
    action: null as (() => void) | null
  });
  
  const { selectedTenant } = useTenant();
  const { addCashback } = useWallet();
  const {
    isLoading,
    updateItemQuantity,
    removeOrderItem,
    addOrderItem,
    recalculateOrderTotal
  } = useOrderEdit();

  // Get restaurant ID from first order item
  const restaurantId = orderItems?.[0]?.restaurant_id;

  // Fetch menu items from the same restaurant as the order
  useEffect(() => {
    const fetchMenuItems = async () => {
      if (!restaurantId) return;

      try {
        const response = await supabase
          .from('menu_items')
          .select(`
            id,
            name,
            price,
            description,
            is_customisable,
            restaurant_id,
            available
          `)
          .eq('restaurant_id', restaurantId)
          .eq('available', true);

        if (response.error) throw response.error;
        setMenuItems(response.data || []);
      } catch (error) {
        console.error('Error fetching menu items:', error);
      }
    };

    fetchMenuItems();
  }, [restaurantId]);

  // Fetch addons when menu item is selected
  useEffect(() => {
    const fetchAddons = async () => {
      if (!selectedMenuItem) {
        setItemAddons([]);
        return;
      }

      try {
        const response = await supabase
          .from('item_addons')
          .select('*')
          .eq('menu_item_id', selectedMenuItem);

        if (response.error) throw response.error;
        setItemAddons(response.data || []);
        setSelectedAddons([]); // Reset selected addons
      } catch (error) {
        console.error('Error fetching addons:', error);
      }
    };

    fetchAddons();
  }, [selectedMenuItem]);

  const handleQuantityChange = async (itemId: string, newQuantity: number, currentQuantity: number) => {
    if (newQuantity < 1) return;

    const action = newQuantity > currentQuantity ? 'increase' : 'decrease';
    setConfirmDialog({
      open: true,
      title: `${action === 'increase' ? 'Increase' : 'Decrease'} Item Quantity`,
      description: `Are you sure you want to ${action} the quantity from ${currentQuantity} to ${newQuantity}?`,
      action: async () => {
        const success = await updateItemQuantity(itemId, newQuantity);
        if (success) {
          await recalculateOrderTotal(order.id);
          onUpdate();
        }
        setConfirmDialog({ open: false, title: '', description: '', action: null });
      }
    });
  };

  const handleRemoveItem = async (itemId: string, itemName: string) => {
    setConfirmDialog({
      open: true,
      title: 'Remove Item',
      description: `Are you sure you want to remove "${itemName}" from this order? This action cannot be undone.`,
      action: async () => {
        const success = await removeOrderItem(itemId);
        if (success) {
          await recalculateOrderTotal(order.id);
          onUpdate();
        }
        setConfirmDialog({ open: false, title: '', description: '', action: null });
      }
    });
  };

  const handleAddItem = async () => {
    if (!selectedMenuItem || !restaurantId) return;

    const menuItem = menuItems.find(item => item.id === selectedMenuItem);
    if (!menuItem) return;

    const newItem = {
      order_id: order.id,
      menu_item_id: selectedMenuItem,
      restaurant_id: restaurantId,
      quantity: addQuantity,
      price: menuItem.price,
      notes: '',
      addons: selectedAddons
    };

    const success = await addOrderItem(newItem);
    if (success) {
      await recalculateOrderTotal(order.id);
      setSelectedMenuItem('');
      setAddQuantity(1);
      setSelectedAddons([]);
      onUpdate();
    }
  };

  const handleAddonToggle = (addon) => {
    setSelectedAddons(prev => {
      const exists = prev.find(a => a.id === addon.id);
      if (exists) {
        return prev.filter(a => a.id !== addon.id);
      } else {
        return [...prev, addon];
      }
    });
  };

  const handleCashTransaction = async () => {
    const resolveText = shouldResolveOrder ? ' and mark order as delivered' : '';
    setConfirmDialog({
      open: true,
      title: 'Complete Cash Transaction',
      description: `Update collected amount to ₹${collectedAmount}${changeGiven > 0 ? `, change given ₹${changeGiven}` : ''}${resolveText}?`,
      action: async () => {
        try {
          const updateData: any = {
            collected_amount: collectedAmount,
            collected_at: new Date().toISOString()
          };

          // If user wants to resolve the order, update status to delivered
          if (shouldResolveOrder) {
            updateData.status = 'delivered';
          }

          const { error } = await supabase
            .from('orders')
            .update(updateData)
            .eq('id', order.id);

          if (error) throw error;

          onUpdate();
          setConfirmDialog({ open: false, title: '', description: '', action: null });
        } catch (error) {
          console.error('Error updating cash transaction:', error);
        }
      }
    });
  };

  // Calculate change automatically
  useEffect(() => {
    if (isAddingToWallet) return; // Don't recalculate while adding to wallet
    
    const orderTotal = order?.final_amount || order?.total_amount || 0;
    if (collectedAmount > orderTotal) {
      setChangeGiven(collectedAmount - orderTotal);
    } else {
      setChangeGiven(0);
    }
  }, [collectedAmount, order?.final_amount, order?.total_amount, isAddingToWallet]);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-6xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit3 className="h-5 w-5" />
              Edit Order - #{order?.id?.slice(-8)}
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Main content area */}
            <div className="lg:col-span-3 space-y-6">
              {/* Current Order Items */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Current Order Items
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {!orderItems || orderItems.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No items in this order
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {orderItems.map((item, index) => (
                        <div key={item.id || index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex-1">
                            <div className="font-medium">{item.menu_item_name || 'Item'}</div>
                            <div className="text-sm text-muted-foreground">
                              ₹{item.price} each
                            </div>
                            {item.notes && (
                              <div className="text-sm text-blue-600">Note: {item.notes}</div>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2">
                           <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleQuantityChange(item.id, item.quantity - 1, item.quantity)}
                              disabled={isLoading || item.quantity <= 1 || isOrderDelivered}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            
                            <span className="w-8 text-center font-medium">
                              {item.quantity}
                            </span>
                            
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleQuantityChange(item.id, item.quantity + 1, item.quantity)}
                              disabled={isLoading || isOrderDelivered}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                            
                            <div className="w-20 text-right font-semibold">
                              ₹{(item.quantity * item.price).toFixed(2)}
                            </div>
                            
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleRemoveItem(item.id, item.menu_item_name || 'Item')}
                              disabled={isLoading || isOrderDelivered}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Add New Item from Same Restaurant */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Add Item from Restaurant Menu
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="text-sm font-medium mb-1 block">
                          Menu Item
                        </label>
                        <Select 
                          value={selectedMenuItem} 
                          onValueChange={setSelectedMenuItem}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Choose item" />
                          </SelectTrigger>
                          <SelectContent>
                            {menuItems.map((item) => (
                              <SelectItem key={item.id} value={item.id}>
                                {item.name} - ₹{item.price}
                                {item.is_customisable && <span className="text-xs text-blue-600 ml-2">(Customizable)</span>}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="text-sm font-medium mb-1 block">
                          Quantity
                        </label>
                        <Input
                          type="number"
                          min="1"
                          value={addQuantity}
                          onChange={(e) => setAddQuantity(parseInt(e.target.value) || 1)}
                        />
                      </div>

                      <div className="flex items-end">
                        <Button
                          onClick={handleAddItem}
                          disabled={!selectedMenuItem || isLoading || isOrderDelivered}
                          className="w-full"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Item
                        </Button>
                      </div>
                    </div>

                    {/* Customization Options */}
                    {selectedMenuItem && itemAddons.length > 0 && (
                      <div className="border-t pt-4">
                        <h4 className="font-medium mb-3">Customize Your Item</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {itemAddons.map((addon) => (
                            <div 
                              key={addon.id}
                              className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                                selectedAddons.find(a => a.id === addon.id) 
                                  ? 'bg-blue-50 border-blue-200' 
                                  : 'hover:bg-gray-50'
                              }`}
                              onClick={() => handleAddonToggle(addon)}
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="font-medium">{addon.name}</div>
                                  {addon.is_mandatory && (
                                    <span className="text-xs text-red-600">Required</span>
                                  )}
                                </div>
                                <div className="text-sm font-semibold">
                                  +₹{addon.price}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedAddons.length > 0 && (
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <div className="text-sm font-medium mb-1">Selected Addons:</div>
                        <div className="text-sm text-blue-700">
                          {selectedAddons.map(addon => `${addon.name} (+₹${addon.price})`).join(', ')}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Cash Transaction Tracking */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4" />
                    Cash Transaction
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Order Total
                      </label>
                      <div className="text-lg font-semibold text-green-600">
                        ₹{(order?.final_amount || order?.total_amount || 0).toFixed(2)}
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Amount Collected from Customer
                      </label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={collectedAmount}
                        onChange={(e) => setCollectedAmount(parseFloat(e.target.value) || 0)}
                        placeholder="Enter collected amount"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Change to Give Back
                      </label>
                      <div className="flex items-center gap-2">
                        <div className={`text-lg font-semibold ${changeGiven > 0 ? 'text-orange-600' : 'text-gray-500'}`}>
                          ₹{changeGiven.toFixed(2)}
                        </div>
                        {changeGiven > 0 && !walletAddedOnce && !order?.change_amount && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={async () => {
                              setIsAddingToWallet(true); // Prevent useEffect from recalculating
                              
                              const success = await addCashback(
                                order.user_id,
                                changeGiven,
                                order.id,
                                order.tenantId,
                                `Change credited to wallet for order #${order.id.slice(-8)}`
                              );
                              
                              if (success) {
                                // Store change amount in order table and set collected amount to exact order total
                                const orderTotal = order?.final_amount || order?.total_amount || 0;
                                
                                // Update order with change amount
                                await supabase
                                  .from('orders')
                                  .update({ 
                                    change_amount: changeGiven,
                                    collected_amount: orderTotal
                                  })
                                  .eq('id', order.id);
                                
                                setCollectedAmount(orderTotal);
                                setChangeGiven(0);
                                setWalletAddedOnce(true); // Hide button permanently
                                // Auto-update cash transaction to tally state
                                await handleCashTransaction();
                                onUpdate();
                              }
                              
                              setIsAddingToWallet(false); // Re-enable useEffect
                            }}
                            disabled={isLoading || walletAddedOnce}
                          >
                            Add to Wallet
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 space-y-4">
                    {/* Resolve Order Option */}
                    {order?.status !== 'delivered' && order?.status !== 'cancelled' && (
                      <div className="flex items-center space-x-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <Checkbox
                          id="resolve-order"
                          checked={shouldResolveOrder}
                          onCheckedChange={(checked) => setShouldResolveOrder(checked === true)}
                        />
                        <label 
                          htmlFor="resolve-order" 
                          className="text-sm font-medium text-blue-800 cursor-pointer"
                        >
                          Mark order as delivered after completing cash transaction
                        </label>
                      </div>
                    )}

                    <div className="flex justify-end">
                      <Button
                        onClick={handleCashTransaction}
                        disabled={isLoading}
                        variant={shouldResolveOrder ? "default" : "outline"}
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        {shouldResolveOrder ? 'Complete & Deliver Order' : 'Update Cash Transaction'}
                      </Button>
                    </div>
                  </div>

                  {order?.collected_amount && (
                    <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="text-sm text-green-800">
                        <strong>Previously Collected:</strong> ₹{order.collected_amount}
                        {order.collected_at && (
                          <span className="ml-2 text-green-600">
                            on {new Date(order.collected_at).toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar - Wallet & Customer Info */}
            <div className="lg:col-span-1 space-y-4">
              {/* Customer Wallet */}
              {order?.user_id && (
                <WalletBalance 
                  userId={order.user_id} 
                  showTransactions={true}
                />
              )}

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingCart className="h-4 w-4" />
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {(order?.status === 'cancelled' || order?.status === 'delivered') && (
                    <Button
                      onClick={() => setShowRefundModal(true)}
                      variant="outline"
                      className="w-full"
                      disabled={isLoading}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Refund to Wallet
                    </Button>
                  )}
                  
                  <div className="text-xs text-muted-foreground mt-2">
                    Order Status: <strong>{order?.status}</strong>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </DialogContent>

        <ConfirmationDialog
          open={confirmDialog.open}
          onOpenChange={(open) => !open && setConfirmDialog({ open: false, title: '', description: '', action: null })}
          onConfirm={() => confirmDialog.action?.()}
          title={confirmDialog.title}
          description={confirmDialog.description}
          confirmText="Confirm"
          cancelText="Cancel"
          variant="destructive"
        />
      </Dialog>

      {/* Refund Modal */}
      {showRefundModal && (
        <WalletRefundModal
          open={showRefundModal}
          onOpenChange={setShowRefundModal}
          order={order}
          onSuccess={() => {
            onUpdate();
            setShowRefundModal(false);
          }}
        />
      )}
    </>
  );
}