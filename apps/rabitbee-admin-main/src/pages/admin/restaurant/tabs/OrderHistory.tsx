import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle, XCircle, Clock, History, UtensilsCrossed, Bike, MapPin, User } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface OrderHistoryProps {
  restaurantId: string;
}

export default function OrderHistory({ restaurantId }: OrderHistoryProps) {
  const [tableAccepted, setTableAccepted] = useState<any[]>([]);
  const [tableRejected, setTableRejected] = useState<any[]>([]);
  const [deliveryAccepted, setDeliveryAccepted] = useState<any[]>([]);
  const [deliveryRejected, setDeliveryRejected] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadOrderHistory();

    // Set up real-time subscription for table orders
    const tableChannel = supabase
      .channel('table-order-history-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'table_orders',
          filter: `restaurant_id=eq.${restaurantId}`
        },
        () => {
          loadOrderHistory();
        }
      )
      .subscribe();

    // Set up real-time subscription for delivery orders
    const deliveryChannel = supabase
      .channel('delivery-order-history-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders'
        },
        () => {
          loadOrderHistory();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(tableChannel);
      supabase.removeChannel(deliveryChannel);
    };
  }, [restaurantId]);

  const loadOrderHistory = async () => {
    try {
      setLoading(true);
      
      // Fetch table orders - accepted
      const { data: tableAcceptedData, error: tableAcceptedError } = await supabase
        .from('table_orders')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .in('status', ['accepted', 'preparing', 'ready', 'completed'])
        .order('created_at', { ascending: false })
        .limit(50);

      if (tableAcceptedError) throw tableAcceptedError;

      // Fetch table orders - rejected
      const { data: tableRejectedData, error: tableRejectedError } = await supabase
        .from('table_orders')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .eq('status', 'rejected')
        .order('created_at', { ascending: false })
        .limit(50);

      if (tableRejectedError) throw tableRejectedError;

      // Fetch delivery orders - accepted
      try {
        const response = await supabase
          .from('orders')
          .select('*')
          .eq('order_type', 'food')
          .order('created_at', { ascending: false })
          .limit(100);

        if (!response.error && response.data) {
          const accepted = response.data.filter((o: any) => 
            ['confirmed', 'preparing', 'ready', 'out for delivery', 'delivered'].includes(o.order_status)
          );
          const rejected = response.data.filter((o: any) => o.order_status === 'cancelled');
          
          setDeliveryAccepted(accepted.slice(0, 50));
          setDeliveryRejected(rejected.slice(0, 50));
        }
      } catch (err) {
        console.error('Error fetching delivery orders:', err);
        setDeliveryAccepted([]);
        setDeliveryRejected([]);
      }

      setTableAccepted(tableAcceptedData || []);
      setTableRejected(tableRejectedData || []);
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

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      pending: { variant: "outline", icon: Clock, color: "text-yellow-600" },
      accepted: { variant: "default", icon: CheckCircle, color: "text-blue-600" },
      preparing: { variant: "secondary", icon: Clock, color: "text-orange-600" },
      ready: { variant: "default", icon: CheckCircle, color: "text-green-600" },
      completed: { variant: "default", icon: CheckCircle, color: "text-green-700" },
      rejected: { variant: "destructive", icon: XCircle, color: "text-red-600" },
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

  const TableOrderCard = ({ order }: { order: any }) => (
    <Card className="glass-card">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-base">Table #{order.table_number}</CardTitle>
            <p className="text-xs text-muted-foreground">
              {format(new Date(order.created_at), 'PPp')}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}
            </p>
          </div>
          {getStatusBadge(order.status)}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <h4 className="font-semibold text-sm mb-1">Items</h4>
          <div className="space-y-1">
            {order.order_items?.map((item: any, idx: number) => (
              <div key={idx} className="flex justify-between text-xs">
                <span className="truncate">{item.quantity}x {item.itemName}</span>
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

        {order.updated_at && order.updated_at !== order.created_at && (
          <div className="text-xs text-muted-foreground pt-2 border-t">
            <p>Updated: {formatDistanceToNow(new Date(order.updated_at), { addSuffix: true })}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const DeliveryOrderCard = ({ order }: { order: any }) => (
    <Card className="glass-card">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-base">Order #{order.orderno}</CardTitle>
            <p className="text-xs text-muted-foreground">
              {format(new Date(order.created_at), 'PPp')}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}
            </p>
          </div>
          {getStatusBadge(order.order_status)}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
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

        {order.updated_at && order.updated_at !== order.created_at && (
          <div className="text-xs text-muted-foreground pt-2 border-t">
            <p>Updated: {formatDistanceToNow(new Date(order.updated_at), { addSuffix: true })}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <History className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold">Order History</h2>
      </div>

      <Tabs defaultValue="table" className="space-y-4">
        <TabsList className="glass-card">
          <TabsTrigger value="table" className="gap-2">
            <UtensilsCrossed className="h-4 w-4" />
            Table Orders
          </TabsTrigger>
          <TabsTrigger value="delivery" className="gap-2">
            <Bike className="h-4 w-4" />
            Delivery Orders
          </TabsTrigger>
        </TabsList>

        {/* Table Orders History */}
        <TabsContent value="table" className="space-y-4">
          <Tabs defaultValue="accepted" className="space-y-4">
            <TabsList className="glass-card">
              <TabsTrigger value="accepted" className="gap-2">
                <CheckCircle className="h-4 w-4" />
                Accepted ({tableAccepted.length})
              </TabsTrigger>
              <TabsTrigger value="rejected" className="gap-2">
                <XCircle className="h-4 w-4" />
                Rejected ({tableRejected.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="accepted" className="space-y-4">
              {/* Stats Cards */}
              <div className="grid gap-4 md:grid-cols-3">
                <Card className="glass-card">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Total Accepted
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{tableAccepted.length}</div>
                  </CardContent>
                </Card>
                <Card className="glass-card">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Completed
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {tableAccepted.filter(o => o.status === 'completed').length}
                    </div>
                  </CardContent>
                </Card>
                <Card className="glass-card">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Total Revenue
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      ₹{tableAccepted
                        .filter(o => o.status === 'completed')
                        .reduce((sum, o) => sum + Number(o.total_amount), 0)
                        .toFixed(2)}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {tableAccepted.length === 0 ? (
                <Card className="glass-card">
                  <CardContent className="flex items-center justify-center min-h-[300px]">
                    <div className="text-center">
                      <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground">No accepted table orders yet</p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {tableAccepted.map((order) => (
                    <TableOrderCard key={order.id} order={order} />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="rejected" className="space-y-4">
              {/* Stats Cards */}
              <div className="grid gap-4 md:grid-cols-2">
                <Card className="glass-card">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Total Rejected
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{tableRejected.length}</div>
                  </CardContent>
                </Card>
                <Card className="glass-card">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Lost Revenue
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-destructive">
                      ₹{tableRejected
                        .reduce((sum, o) => sum + Number(o.total_amount), 0)
                        .toFixed(2)}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {tableRejected.length === 0 ? (
                <Card className="glass-card">
                  <CardContent className="flex items-center justify-center min-h-[300px]">
                    <div className="text-center">
                      <XCircle className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground">No rejected table orders</p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {tableRejected.map((order) => (
                    <TableOrderCard key={order.id} order={order} />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* Delivery Orders History */}
        <TabsContent value="delivery" className="space-y-4">
          <Tabs defaultValue="accepted" className="space-y-4">
            <TabsList className="glass-card">
              <TabsTrigger value="accepted" className="gap-2">
                <CheckCircle className="h-4 w-4" />
                Accepted ({deliveryAccepted.length})
              </TabsTrigger>
              <TabsTrigger value="rejected" className="gap-2">
                <XCircle className="h-4 w-4" />
                Rejected ({deliveryRejected.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="accepted" className="space-y-4">
              {/* Stats Cards */}
              <div className="grid gap-4 md:grid-cols-3">
                <Card className="glass-card">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Total Accepted
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{deliveryAccepted.length}</div>
                  </CardContent>
                </Card>
                <Card className="glass-card">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Delivered
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {deliveryAccepted.filter(o => o.order_status === 'delivered').length}
                    </div>
                  </CardContent>
                </Card>
                <Card className="glass-card">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Total Revenue
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      ₹{deliveryAccepted
                        .filter(o => o.order_status === 'delivered')
                        .reduce((sum, o) => sum + Number(o.total_amount), 0)
                        .toFixed(2)}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {deliveryAccepted.length === 0 ? (
                <Card className="glass-card">
                  <CardContent className="flex items-center justify-center min-h-[300px]">
                    <div className="text-center">
                      <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground">No accepted delivery orders yet</p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {deliveryAccepted.map((order) => (
                    <DeliveryOrderCard key={order.id} order={order} />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="rejected" className="space-y-4">
              {/* Stats Cards */}
              <div className="grid gap-4 md:grid-cols-2">
                <Card className="glass-card">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Total Rejected
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{deliveryRejected.length}</div>
                  </CardContent>
                </Card>
                <Card className="glass-card">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Lost Revenue
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-destructive">
                      ₹{deliveryRejected
                        .reduce((sum, o) => sum + Number(o.total_amount), 0)
                        .toFixed(2)}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {deliveryRejected.length === 0 ? (
                <Card className="glass-card">
                  <CardContent className="flex items-center justify-center min-h-[300px]">
                    <div className="text-center">
                      <XCircle className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground">No rejected delivery orders</p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {deliveryRejected.map((order) => (
                    <DeliveryOrderCard key={order.id} order={order} />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </TabsContent>
      </Tabs>
    </div>
  );
}
