
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Package, 
  MapPin, 
  Clock, 
  User, 
  Phone,
  CheckCircle2,
  Circle,
  Truck,
  Edit3,
  RotateCcw,
  AlertTriangle
} from "lucide-react";
import { OrderStatusBadge } from "./OrderStatusBadge";
import { OrderEditModal } from "./OrderEditModal";
import { formatTime } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface OrderTrackingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: any;
  onUpdate?: () => void;
}

export function OrderTrackingModal({
  open,
  onOpenChange,
  order,
  onUpdate
}: OrderTrackingModalProps) {
  const [showEditModal, setShowEditModal] = useState(false);
  const [reassignments, setReassignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open && order?.id) {
      fetchReassignments();
    }
  }, [open, order?.id]);

  const fetchReassignments = async () => {
    if (!order?.id) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('delivery_reassignments')
        .select(`
          *,
          from_agent:delivery_agents!delivery_reassignments_from_agent_id_fkey(name),
          to_agent:delivery_agents!delivery_reassignments_to_agent_id_fkey(name)
        `)
        .eq('order_id', order.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setReassignments(data || []);
    } catch (error) {
      console.error('Error fetching reassignments:', error);
      toast({
        title: "Error",
        description: "Failed to fetch reassignment history",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Create comprehensive timeline with status updates and reassignments
  const createTimeline = () => {
    const events = [];

    // Add order placement
    events.push({
      type: 'status',
      status: 'pending',
      label: 'Order Placed',
      time: order?.created_at,
      description: `Order #${order?.orderno || order?.id?.slice(-8)} was placed`,
      icon: <Package className="h-4 w-4" />
    });

    // Add initial agent assignment if exists
    if (order?.assigned_at && order?.delivery_agent_name) {
      // Check if this is the first assignment or a reassignment
      const isInitialAssignment = reassignments.length === 0;
      
      events.push({
        type: 'assignment',
        status: 'assigned',
        label: isInitialAssignment ? 'Agent Assigned' : 'Agent Reassigned',
        time: order.assigned_at,
        description: `${isInitialAssignment ? 'Delivery agent assigned' : 'Order reassigned to'}: ${order.delivery_agent_name}`,
        icon: <User className="h-4 w-4" />,
        agentName: order.delivery_agent_name
      });
    }

    // Add all reassignment events
    reassignments.forEach((reassignment, index) => {
      const isFirstReassignment = index === 0;
      const fromAgent = reassignment.from_agent?.name || 'Previous agent';
      const toAgent = reassignment.to_agent?.name || 'New agent';
      
      events.push({
        type: 'reassignment',
        status: 'reassignment',
        label: `Agent Reassigned ${index > 0 ? `(${index + 1})` : ''}`,
        time: reassignment.created_at,
        description: `Order reassigned from ${fromAgent} to ${toAgent}`,
        reason: reassignment.reason,
        note: reassignment.note,
        icon: <RotateCcw className="h-4 w-4" />,
        fromAgent,
        toAgent,
        isFirstReassignment
      });
    });

    // Add status-based events using available timestamps
    const statusEvents = [
      { status: 'confirmed', label: 'Order Confirmed', time: order?.updated_at, description: 'Restaurant confirmed the order', condition: order?.status === 'confirmed' || ['preparing', 'ready', 'picked_up', 'out for delivery', 'delivered'].includes(order?.status) },
      { status: 'preparing', label: 'Preparing Food', time: order?.updated_at, description: 'Kitchen started preparing your order', condition: order?.status === 'preparing' || ['ready', 'picked_up', 'out for delivery', 'delivered'].includes(order?.status) },
      { status: 'ready', label: 'Ready for Pickup', time: order?.updated_at, description: 'Order is ready for delivery agent pickup', condition: order?.status === 'ready' || ['picked_up', 'out for delivery', 'delivered'].includes(order?.status) },
      { status: 'picked_up', label: 'Order Picked Up', time: order?.collected_at || order?.updated_at, description: 'Order picked up by delivery agent', condition: order?.status === 'picked_up' || ['out for delivery', 'delivered'].includes(order?.status) },
      { status: 'out for delivery', label: 'Out for Delivery', time: order?.updated_at, description: 'Order is on the way to your location', condition: order?.status === 'out for delivery' || order?.status === 'delivered' },
      { status: 'delivered', label: 'Order Delivered', time: order?.updated_at, description: 'Order successfully delivered', condition: order?.status === 'delivered' },
      { status: 'cancelled', label: 'Order Cancelled', time: order?.updated_at, description: order?.change_reason ? `Cancelled: ${order.change_reason}` : 'Order was cancelled', condition: order?.status === 'cancelled' }
    ];

    statusEvents.forEach(statusEvent => {
      if (statusEvent.condition && statusEvent.time) {
        events.push({
          type: 'status',
          status: statusEvent.status,
          label: statusEvent.label,
          time: statusEvent.time,
          description: statusEvent.description,
          icon: statusEvent.status === 'cancelled' ? <AlertTriangle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />
        });
      }
    });

    // Add collection event if collected_at exists and is different from other events
    if (order?.collected_at && !events.some(e => e.time === order.collected_at)) {
      events.push({
        type: 'status',
        status: 'collected',
        label: 'Order Collected',
        time: order.collected_at,
        description: 'Order was collected by delivery agent',
        icon: <Truck className="h-4 w-4" />
      });
    }

    // Sort by time
    return events
      .filter(event => event.time)
      .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
  };

  const timeline = createTimeline();

  const getStepIcon = (event: any, index: number) => {
    if (event.type === 'reassignment') {
      return <div className="p-1 rounded-full bg-orange-100"><RotateCcw className="h-3 w-3 text-orange-600" /></div>;
    }
    
    if (event.type === 'assignment') {
      return <div className="p-1 rounded-full bg-blue-100"><User className="h-3 w-3 text-blue-600" /></div>;
    }
    
    if (event.status === 'cancelled') {
      return <div className="p-1 rounded-full bg-red-100"><AlertTriangle className="h-3 w-3 text-red-600" /></div>;
    }

    if (event.status === 'collected' || event.status === 'picked_up') {
      return <div className="p-1 rounded-full bg-purple-100"><Truck className="h-3 w-3 text-purple-600" /></div>;
    }
    
    return <div className="p-1 rounded-full bg-green-100"><CheckCircle2 className="h-3 w-3 text-green-600" /></div>;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Order Tracking - #{order?.id?.slice(-8)}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Order Summary */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">{order?.user_name || 'N/A'}</div>
                      {order?.user_phone && (
                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {order.user_phone}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div className="text-sm">
                      <div className="font-medium">Delivery Address:</div>
                      <div className="text-muted-foreground">{order?.user_address || 'N/A'}</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="text-sm font-medium">Current Status</div>
                    <OrderStatusBadge status={order?.status} />
                  </div>
                  
                  <div>
                    <div className="text-sm font-medium">Total Amount</div>
                    <div className="text-lg font-bold">₹{order?.total_amount}</div>
                  </div>

                  {order?.delivery_agent_name && (
                    <div className="flex items-center gap-2">
                      <Truck className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="text-sm font-medium">Delivery Agent:</div>
                        <div className="text-sm">{order.delivery_agent_name}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Enhanced Timeline */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Order Timeline & History
                  {loading && <div className="text-sm text-muted-foreground">(Loading...)</div>}
                </h3>
                
                <div className="space-y-4">
                  {timeline.length > 0 ? timeline.map((event, index) => (
                    <div key={`${event.type}-${index}`} className="flex items-start gap-4">
                      <div className="flex flex-col items-center">
                        {getStepIcon(event, index)}
                        {index < timeline.length - 1 && (
                          <div className="w-px h-12 mt-2 bg-gray-200" />
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0 pb-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <div className={`font-medium ${
                              event.type === 'reassignment' ? 'text-orange-700' : 
                              event.type === 'assignment' ? 'text-blue-700' :
                              event.status === 'cancelled' ? 'text-red-700' : 'text-gray-900'
                            }`}>
                              {event.label}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {event.description}
                            </div>
                            
                            {/* Agent details for assignment/reassignment */}
                            {(event.type === 'assignment' || event.type === 'reassignment') && event.agentName && (
                              <div className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded border mt-1">
                                <span className="font-medium">Agent:</span> {event.agentName}
                              </div>
                            )}
                            
                            {event.type === 'reassignment' && event.fromAgent && event.toAgent && (
                              <div className="text-xs space-y-1 mt-1">
                                <div className="bg-red-50 text-red-700 px-2 py-1 rounded border">
                                  <span className="font-medium">From:</span> {event.fromAgent}
                                </div>
                                <div className="bg-green-50 text-green-700 px-2 py-1 rounded border">
                                  <span className="font-medium">To:</span> {event.toAgent}
                                </div>
                              </div>
                            )}
                            
                            {event.reason && (
                              <div className="text-xs bg-orange-50 text-orange-700 px-2 py-1 rounded border mt-1">
                                <span className="font-medium">Reason:</span> {event.reason}
                              </div>
                            )}
                            {event.note && (
                              <div className="text-xs bg-gray-50 text-gray-700 px-2 py-1 rounded border mt-1">
                                <span className="font-medium">Note:</span> {event.note}
                              </div>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground text-right">
                            <div>{new Date(event.time).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric'
                            })}</div>
                            <div>{new Date(event.time).toLocaleTimeString('en-IN', {
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: true
                            })}</div>
                          </div>
                        </div>
                        
                        {event.status === order?.status && (
                          <Badge variant="outline" className="mt-2 text-xs bg-blue-50 text-blue-700 border-blue-200">
                            Current Status
                          </Badge>
                        )}
                      </div>
                    </div>
                  )) : (
                    <div className="text-center text-muted-foreground py-4">
                      No timeline events found
                    </div>
                  )}
                </div>

                {/* Reassignment Summary */}
                {reassignments.length > 0 && (
                  <div className="mt-6 pt-4 border-t">
                    <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                      <RotateCcw className="h-4 w-4 text-orange-600" />
                      Reassignment Summary ({reassignments.length} total)
                    </h4>
                    <div className="text-sm text-muted-foreground">
                      This order has been reassigned {reassignments.length} time{reassignments.length > 1 ? 's' : ''} 
                      {order?.delivery_agent_name && ` and is currently with ${order.delivery_agent_name}`}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Order Items */}
          {order?.order_items && order.order_items.length > 0 && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Order Items</h3>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowEditModal(true)}
                    className="flex items-center gap-2"
                  >
                    <Edit3 className="h-4 w-4" />
                    Edit Order
                  </Button>
                </div>
                <div className="space-y-3">
                  {order.order_items.map((item, index) => (
                    <div key={index} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div className="flex-1">
                        <div className="font-medium">{item.menu_item_name || 'Item'}</div>
                        <div className="text-sm text-muted-foreground">
                          Quantity: {item.quantity} × ₹{item.price}
                        </div>
                        {item.notes && (
                          <div className="text-sm text-blue-600">Note: {item.notes}</div>
                        )}
                      </div>
                      <div className="font-semibold">
                        ₹{(item.quantity * item.price).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>

      {/* Order Edit Modal */}
      {showEditModal && (
        <OrderEditModal
          open={showEditModal}
          onOpenChange={setShowEditModal}
          order={order}
          onUpdate={() => {
            onUpdate?.();
            setShowEditModal(false);
          }}
        />
      )}
    </Dialog>
  );
}
