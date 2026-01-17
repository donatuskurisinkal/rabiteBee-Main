import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Calendar, ChevronDown } from "lucide-react";
import { startOfDay, endOfDay, subDays } from "date-fns";
import { ConfirmRejectDialog } from "@/components/admin/restaurant/ConfirmRejectDialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { OrderKanbanBoard } from "@/components/admin/restaurant/OrderKanbanBoard";

interface TableOrdersProps {
  restaurantId: string;
}

export default function TableOrders({ restaurantId }: TableOrdersProps) {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [dateFilter, setDateFilter] = useState<string>("today");
  const [newOrderIds, setNewOrderIds] = useState<Set<string>>(new Set());
  const [rejectDialog, setRejectDialog] = useState<{
    open: boolean;
    orderId: string | null;
    orderDetails: any;
  }>({ open: false, orderId: null, orderDetails: {} });
  const { toast } = useToast();

  const PAGE_SIZE = 20;

  const getDateRange = () => {
    const now = new Date();
    let startDate: Date;
    let endDate = endOfDay(now);

    switch (dateFilter) {
      case "today":
        startDate = startOfDay(now);
        break;
      case "yesterday":
        startDate = startOfDay(subDays(now, 1));
        endDate = endOfDay(subDays(now, 1));
        break;
      case "last7days":
        startDate = startOfDay(subDays(now, 7));
        break;
      case "last30days":
        startDate = startOfDay(subDays(now, 30));
        break;
      default:
        startDate = startOfDay(now);
    }

    return { startDate, endDate };
  };

  useEffect(() => {
    setOrders([]);
    setPage(0);
    setHasMore(true);
    loadOrders(true);
  }, [restaurantId, dateFilter]);

  useEffect(() => {
    // Set up real-time subscription
    const channel = supabase
      .channel('restaurant-table-orders-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'table_orders',
          filter: `restaurant_id=eq.${restaurantId}`
        },
        (payload) => {
          setNewOrderIds(prev => new Set(prev).add(payload.new.id));
          toast({
            title: "🔔 New Table Order!",
            description: `Table #${payload.new.table_number} placed an order`,
          });
          // Reload only if we're on today's filter
          if (dateFilter === "today") {
            setOrders([]);
            setPage(0);
            setHasMore(true);
            loadOrders(true);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'table_orders',
          filter: `restaurant_id=eq.${restaurantId}`
        },
        () => {
          // Reload orders on update
          setOrders([]);
          setPage(0);
          setHasMore(true);
          loadOrders(true);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [restaurantId]);

  const loadOrders = async (reset = false) => {
    try {
      const isInitialLoad = reset || page === 0;
      if (isInitialLoad) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const currentPage = reset ? 0 : page;
      const { startDate, endDate } = getDateRange();

      const { data, error } = await supabase
        .from('table_orders')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .not('status', 'in', '("completed","rejected")')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: false })
        .range(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE - 1);

      if (error) throw error;

      const newOrders = data || [];
      
      if (reset) {
        setOrders(newOrders);
      } else {
        setOrders(prev => [...prev, ...newOrders]);
      }
      
      setHasMore(newOrders.length === PAGE_SIZE);
      setPage(currentPage + 1);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const updateOrderStatus = async (orderId: string, status: string, orderDetails?: any) => {
    try {
      const now = new Date().toISOString();
      const { error } = await supabase
        .from('table_orders')
        .update({ 
          status, 
          updated_at: now,
          // Track when order status changes
          ...(status === 'accepted' && { confirmed_at: now }),
          ...(status === 'rejected' && { cancelled_at: now }),
          ...(status === 'preparing' && { preparing_at: now }),
          ...(status === 'ready' && { ready_at: now }),
          ...(status === 'completed' && { completed_at: now })
        })
        .eq('id', orderId);

      if (error) throw error;

      const statusMessages: Record<string, string> = {
        accepted: 'Order accepted successfully',
        rejected: 'Order rejected',
        preparing: 'Order is now being prepared',
        ready: 'Order is ready for pickup',
        completed: 'Order completed successfully'
      };

      toast({
        title: "Success",
        description: statusMessages[status] || `Order ${status}`,
      });

      setNewOrderIds(prev => {
        const updated = new Set(prev);
        updated.delete(orderId);
        return updated;
      });

      // Reload orders to reflect changes
      setOrders([]);
      setPage(0);
      setHasMore(true);
      loadOrders(true);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleRejectOrder = (orderId: string, order: any) => {
    setRejectDialog({
      open: true,
      orderId,
      orderDetails: {
        tableNumber: order.table_number,
        amount: order.total_amount
      }
    });
  };

  const confirmReject = async () => {
    if (rejectDialog.orderId) {
      await updateOrderStatus(rejectDialog.orderId, 'rejected');
      setRejectDialog({ open: false, orderId: null, orderDetails: {} });
    }
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
      {/* Date Filter */}
      <Card className="glass-card">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select date range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="yesterday">Yesterday</SelectItem>
                <SelectItem value="last7days">Last 7 Days</SelectItem>
                <SelectItem value="last30days">Last 30 Days</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground">
              {orders.length} order{orders.length !== 1 ? 's' : ''} found
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orders.filter(o => o.status === 'pending').length}</div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Preparing</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orders.filter(o => o.status === 'preparing').length}</div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Ready</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orders.filter(o => o.status === 'ready').length}</div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Today's Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₹{orders.filter(o => o.status === 'completed').reduce((sum, o) => sum + Number(o.total_amount), 0).toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Kanban Board */}
      {orders.length === 0 ? (
        <Card className="glass-card">
          <CardContent className="flex items-center justify-center min-h-[300px]">
            <div className="text-center">
              <p className="text-muted-foreground">No table orders yet</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <OrderKanbanBoard
          orders={orders}
          newOrderIds={newOrderIds}
          onStatusChange={updateOrderStatus}
          onRejectOrder={handleRejectOrder}
        />
      )}

      {/* Load More Button */}
      {!loading && hasMore && orders.length > 0 && (
        <div className="flex justify-center pt-4">
          <Button
            onClick={() => loadOrders(false)}
            disabled={loadingMore}
            variant="outline"
            className="gap-2"
          >
            {loadingMore ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4" />
                Load More
              </>
            )}
          </Button>
        </div>
      )}

      <ConfirmRejectDialog
        open={rejectDialog.open}
        onOpenChange={(open) => setRejectDialog({ ...rejectDialog, open })}
        onConfirm={confirmReject}
        orderDetails={rejectDialog.orderDetails}
      />
    </div>
  );
}
