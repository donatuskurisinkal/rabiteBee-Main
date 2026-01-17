import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle, XCircle, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useTenant } from "@/contexts/TenantContext";

export default function RestaurantTableOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { selectedTenant } = useTenant();

  useEffect(() => {
    loadOrders();
    
    // Subscribe to real-time updates
    const channel = supabase
      .channel('table-orders-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'table_orders'
        },
        () => {
          loadOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedTenant]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('table_orders')
        .select(`
          *,
          restaurants:restaurant_id (
            id,
            name,
            logo_url
          )
        `)
        .order('created_at', { ascending: false });

      if (selectedTenant) {
        query = query.eq('tenant_id', selectedTenant.id);
      }

      const { data, error } = await query;

      if (error) throw error;
      setOrders(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('table_orders')
        .update({ status })
        .eq('id', orderId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Order ${status}`,
      });

      loadOrders();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      pending: { variant: "outline", icon: Clock, color: "text-yellow-600" },
      confirmed: { variant: "default", icon: CheckCircle, color: "text-blue-600" },
      preparing: { variant: "secondary", icon: Clock, color: "text-orange-600" },
      ready: { variant: "default", icon: CheckCircle, color: "text-green-600" },
      completed: { variant: "default", icon: CheckCircle, color: "text-green-700" },
      cancelled: { variant: "destructive", icon: XCircle, color: "text-red-600" },
    };

    const config = variants[status] || variants.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Restaurant Table Orders</h1>
        <p className="text-muted-foreground mt-2">
          Manage orders placed from table QR codes
        </p>
      </div>

      {orders.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center min-h-[300px]">
            <div className="text-center">
              <p className="text-muted-foreground">No table orders yet</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {orders.map((order) => (
            <Card key={order.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    {order.restaurants?.logo_url && (
                      <img
                        src={order.restaurants.logo_url}
                        alt={order.restaurants.name}
                        className="h-8 w-8 rounded object-cover flex-shrink-0"
                      />
                    )}
                    <div className="min-w-0">
                      <CardTitle className="text-base truncate">
                        {order.restaurants?.name || "Unknown Restaurant"}
                      </CardTitle>
                      <p className="text-xs text-muted-foreground truncate">
                        Table #{order.table_number} • {formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                  {getStatusBadge(order.status)}
                </div>
              </CardHeader>
              <CardContent className="pb-3">
                <div className="space-y-3">
                  <div>
                    <h4 className="font-semibold text-sm mb-1">Order Items</h4>
                    <div className="space-y-1">
                      {order.order_items?.map((item: any, idx: number) => (
                        <div key={idx} className="flex justify-between text-xs">
                          <span className="truncate">
                            {item.quantity}x {item.itemName}
                          </span>
                          <span className="font-medium flex-shrink-0 ml-2">₹{item.price * item.quantity}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border-t pt-2">
                    <div className="flex justify-between text-sm font-bold">
                      <span>Total</span>
                      <span>₹{order.total_amount}</span>
                    </div>
                  </div>

                  {order.special_instructions && (
                    <div className="bg-muted p-2 rounded text-xs">
                      <p className="font-semibold">Instructions:</p>
                      <p className="text-muted-foreground">{order.special_instructions}</p>
                    </div>
                  )}

                  <div className="flex gap-1.5 flex-wrap">
                    {order.status === 'pending' && (
                      <>
                        <Button
                          onClick={() => updateOrderStatus(order.id, 'confirmed')}
                          size="sm"
                          className="flex-1 h-8 text-xs"
                        >
                          Confirm
                        </Button>
                        <Button
                          onClick={() => updateOrderStatus(order.id, 'cancelled')}
                          variant="destructive"
                          size="sm"
                          className="flex-1 h-8 text-xs"
                        >
                          Cancel
                        </Button>
                      </>
                    )}
                    {order.status === 'confirmed' && (
                      <Button
                        onClick={() => updateOrderStatus(order.id, 'preparing')}
                        size="sm"
                        className="w-full h-8 text-xs"
                      >
                        Start Preparing
                      </Button>
                    )}
                    {order.status === 'preparing' && (
                      <Button
                        onClick={() => updateOrderStatus(order.id, 'ready')}
                        size="sm"
                        className="w-full h-8 text-xs"
                      >
                        Mark Ready
                      </Button>
                    )}
                    {order.status === 'ready' && (
                      <Button
                        onClick={() => updateOrderStatus(order.id, 'completed')}
                        size="sm"
                        className="w-full h-8 text-xs"
                      >
                        Complete
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
