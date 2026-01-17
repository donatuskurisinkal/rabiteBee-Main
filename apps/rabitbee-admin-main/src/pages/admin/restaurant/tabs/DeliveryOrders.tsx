import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle, XCircle, Clock, Bell, MapPin, User } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface DeliveryOrdersProps {
  restaurantId: string;
}

export default function DeliveryOrders({ restaurantId }: DeliveryOrdersProps) {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newOrderIds, setNewOrderIds] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  useEffect(() => {
    loadOrders();

    // Set up real-time subscription for food orders
    const channel = supabase
      .channel('restaurant-delivery-orders-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders'
        },
        (payload) => {
          if (payload.new.order_type === 'food') {
            setNewOrderIds(prev => new Set(prev).add(payload.new.id));
            toast({
              title: "🔔 New Delivery Order!",
              description: `Order #${payload.new.orderno || 'N/A'}`,
            });
            loadOrders();
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders'
        },
        () => {
          loadOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [restaurantId]);

  const loadOrders = async () => {
    setLoading(true);
    
    try {
      // First get orders for this restaurant's service
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .eq('order_type', 'food')
        .order('created_at', { ascending: false })
        .limit(50);

      if (ordersError) throw ordersError;
      setOrders(ordersData || []);
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
        .from('orders')
        .update({ order_status: status, updated_at: new Date().toISOString() })
        .eq('id', orderId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Order ${status}`,
      });

      setNewOrderIds(prev => {
        const updated = new Set(prev);
        updated.delete(orderId);
        return updated;
      });
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
      'out for delivery': { variant: "secondary", icon: MapPin, color: "text-purple-600" },
      delivered: { variant: "default", icon: CheckCircle, color: "text-green-700" },
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
    <div className="space-y-4">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orders.filter(o => o.order_status === 'pending').length}</div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Preparing</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orders.filter(o => o.order_status === 'preparing').length}</div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Out for Delivery</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orders.filter(o => o.order_status === 'out for delivery').length}</div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Today's Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₹{orders.filter(o => o.order_status === 'delivered').reduce((sum, o) => sum + Number(o.total_amount), 0).toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Orders Grid */}
      {orders.length === 0 ? (
        <Card className="glass-card">
          <CardContent className="flex items-center justify-center min-h-[300px]">
            <div className="text-center">
              <p className="text-muted-foreground">No delivery orders yet</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {orders.map((order) => (
            <Card 
              key={order.id} 
              className={`glass-card overflow-hidden transition-all ${
                newOrderIds.has(order.id) ? 'ring-2 ring-primary animate-pulse' : ''
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {newOrderIds.has(order.id) && (
                      <Bell className="h-4 w-4 text-primary animate-bounce" />
                    )}
                    <div>
                      <CardTitle className="text-base">
                        Order #{order.orderno}
                      </CardTitle>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                  {getStatusBadge(order.order_status)}
                </div>
              </CardHeader>
              <CardContent className="pb-3 space-y-3">
                <div>
                  <h4 className="font-semibold text-sm mb-1 flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    Delivery Address
                  </h4>
                  <p className="text-xs text-muted-foreground line-clamp-2">{order.user_address}</p>
                </div>

                <div className="border-t pt-2">
                  <div className="flex justify-between text-sm font-bold">
                    <span>Total</span>
                    <span>₹{order.total_amount}</span>
                  </div>
                </div>

                <div className="flex gap-1.5 flex-wrap">
                  {order.order_status === 'pending' && (
                    <>
                      <Button
                        onClick={() => updateOrderStatus(order.id, 'confirmed')}
                        size="sm"
                        className="flex-1 h-8 text-xs"
                      >
                        Accept
                      </Button>
                      <Button
                        onClick={() => updateOrderStatus(order.id, 'cancelled')}
                        variant="destructive"
                        size="sm"
                        className="flex-1 h-8 text-xs"
                      >
                        Reject
                      </Button>
                    </>
                  )}
                  {order.order_status === 'confirmed' && (
                    <Button
                      onClick={() => updateOrderStatus(order.id, 'preparing')}
                      size="sm"
                      className="w-full h-8 text-xs"
                    >
                      Start Preparing
                    </Button>
                  )}
                  {order.order_status === 'preparing' && (
                    <Button
                      onClick={() => updateOrderStatus(order.id, 'ready')}
                      size="sm"
                      className="w-full h-8 text-xs"
                    >
                      Mark Ready
                    </Button>
                  )}
                  {order.order_status === 'ready' && (
                    <Button
                      onClick={() => updateOrderStatus(order.id, 'out for delivery')}
                      size="sm"
                      className="w-full h-8 text-xs"
                    >
                      Out for Delivery
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
