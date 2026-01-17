
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useTenant } from '@/hooks/use-tenant';

interface UseOrdersDataParams {
  search?: string;
  status?: string;
  date?: string;
  agent?: string;
  page?: number;
  pageSize?: number;
}

type ValidOrderStatus = 'pending' | 'confirmed' | 'delivered' | 'cancelled' | 'out for delivery';

const VALID_ORDER_STATUSES: ValidOrderStatus[] = ['pending', 'confirmed', 'delivered', 'cancelled', 'out for delivery'];

export function useOrdersData(params: UseOrdersDataParams = {}) {
  const [orders, setOrders] = useState([]);
  const [deliveryAgents, setDeliveryAgents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newOrderIds, setNewOrderIds] = useState<Set<string>>(new Set());
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(params.page || 1);
  const [pageSize] = useState(params.pageSize || 10);
  const { toast } = useToast();
  const { selectedTenant } = useTenant();

  const fetchOrders = async (page = currentPage) => {
    setIsLoading(true);
    try {
      // Build the base query
      let query = supabase
        .from('orders')
        .select(`
          *,
          delivery_agents!orders_delivery_agent_id_fkey(name, phone_number),
          order_food_items(
            *,
            menu_items(name, price)
          )
        `, { count: 'exact' })
        .order('created_at', { ascending: false });

      // Apply filters
      if (params.status && params.status !== 'all') {
        if (params.status === 'unassigned') {
          query = query.is('delivery_agent_id', null);
        } else {
          if (VALID_ORDER_STATUSES.includes(params.status as ValidOrderStatus)) {
            query = query.eq('status', params.status as ValidOrderStatus);
          }
        }
      }

      if (params.agent && params.agent !== 'all') {
        if (params.agent === 'unassigned') {
          query = query.is('delivery_agent_id', null);
        } else {
          query = query.eq('delivery_agent_id', params.agent);
        }
      }

      if (params.date && params.date !== 'all') {
        const now = new Date();
        let startDate: Date;
        
        switch (params.date) {
          case 'today':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            break;
          case 'yesterday':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
            break;
          case 'week':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case 'month':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            break;
          default:
            startDate = new Date(0);
        }
        
        query = query.gte('created_at', startDate.toISOString());
        
        if (params.date === 'today' || params.date === 'yesterday') {
          const endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000);
          query = query.lt('created_at', endDate.toISOString());
        }
      }

      if (params.search) {
        const searchLower = params.search.toLowerCase();
        query = query.ilike('id', `%${searchLower}%`);
      }

      // Apply pagination
      const offset = (page - 1) * pageSize;
      query = query.range(offset, offset + pageSize - 1);

      const { data, error, count } = await query;

      if (error) throw error;

      // Set total count for pagination
      setTotalCount(count || 0);

      // Get user details separately for orders that have user_id
      const userIds = data?.map(order => order.user_id).filter(Boolean) || [];
      
      let users = [];
      if (userIds.length > 0) {
        users = userIds.map(userId => ({
          id: userId,
          first_name: 'Customer',
          last_name: `${userId.slice(0, 8)}`,
          phone: 'N/A'
        }));
      }

      // Transform the data to include computed fields
      const transformedOrders = data?.map(order => {
        const user = users.find(u => u.id === order.user_id);
        return {
          ...order,
          user_name: user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() : 'Unknown Customer',
          user_phone: user?.phone || 'N/A',
          delivery_agent_name: order.delivery_agents?.name,
          order_items: order.order_food_items?.map(item => ({
            ...item,
            menu_item_name: item.menu_items?.name,
            price: item.price || item.menu_items?.price || 0
          })) || []
        };
      }) || [];

      setOrders(transformedOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast({
        title: "Error",
        description: "Failed to fetch orders",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDeliveryAgents = async () => {
    try {
      let query = supabase
        .from('delivery_agents')
        .select('*')
        .eq('is_active', true)
        .eq('is_online', true) // Only show online agents
        .order('name');

      // Filter by current tenant if available
      if (selectedTenant?.id) {
        query = query.eq('tenant_id', selectedTenant.id);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      console.log('Fetched delivery agents:', data?.length, 'agents for tenant:', selectedTenant?.name);
      setDeliveryAgents(data || []);
    } catch (error) {
      console.error('Error fetching delivery agents:', error);
    }
  };

  const assignAgent = async (orderId: string, agentId: string) => {
    try {
      // First, get the current order details to check for existing assignment
      const { data: currentOrder, error: fetchError } = await supabase
        .from('orders')
        .select('delivery_agent_id, delivery_agent_status, tenantId')
        .eq('id', orderId)
        .single();

      if (fetchError) throw fetchError;

      const isReassignment = currentOrder?.delivery_agent_id && currentOrder.delivery_agent_id !== agentId;
      
      console.log('Assignment details:', {
        orderId,
        currentAgentId: currentOrder?.delivery_agent_id,
        newAgentId: agentId,
        isReassignment
      });

      // Record reassignment BEFORE updating the order (if it's a reassignment)
      if (isReassignment && currentOrder.delivery_agent_id) {
        console.log('Recording reassignment for order:', orderId);
        
        const { error: reassignmentError } = await supabase
          .from('delivery_reassignments')
          .insert({
            order_id: orderId,
            from_agent_id: currentOrder.delivery_agent_id,
            to_agent_id: agentId,
            reason: 'Manual reassignment by admin',
            status_before: currentOrder.delivery_agent_status,
            status_after: 'assigned',
            tenant_id: currentOrder.tenantId || selectedTenant?.id
          });

        if (reassignmentError) {
          console.error('Error recording reassignment:', reassignmentError);
          throw new Error(`Failed to record reassignment: ${reassignmentError.message}`);
        } else {
          console.log('Reassignment recorded successfully');
        }
      }
      
      // Update the order with new agent
      const { error: updateError } = await supabase
        .from('orders')
        .update({ 
          delivery_agent_id: agentId,
          delivery_agent_status: 'assigned',
          assigned_at: new Date().toISOString(),
          status: 'confirmed' as ValidOrderStatus
        })
        .eq('id', orderId);

      if (updateError) throw updateError;

      // Update new agent status to busy
      const { error: newAgentError } = await supabase
        .from('delivery_agents')
        .update({ status: 'busy' })
        .eq('id', agentId);

      if (newAgentError) {
        console.error('Error updating new agent status:', newAgentError);
      }

      // If this is a reassignment, handle old agent status
      if (isReassignment && currentOrder.delivery_agent_id) {
        // Check if old agent has any other orders assigned
        const { data: otherOrders, error: checkError } = await supabase
          .from('orders')
          .select('id')
          .eq('delivery_agent_id', currentOrder.delivery_agent_id)
          .neq('id', orderId)
          .in('status', ['confirmed', 'out for delivery']);

        if (!checkError) {
          // If no other orders, set old agent status to online
          if (!otherOrders || otherOrders.length === 0) {
            const { error: oldAgentError } = await supabase
              .from('delivery_agents')
              .update({ status: 'online' })
              .eq('id', currentOrder.delivery_agent_id);

            if (oldAgentError) {
              console.error('Error updating old agent status:', oldAgentError);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error assigning agent:', error);
      throw error;
    }
  };

  const cancelOrder = async (orderId: string, reason: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          status: 'cancelled' as ValidOrderStatus,
          change_reason: reason,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (error) throw error;
    } catch (error) {
      console.error('Error cancelling order:', error);
      throw error;
    }
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      const finalStatus = VALID_ORDER_STATUSES.includes(status as ValidOrderStatus) 
        ? status as ValidOrderStatus 
        : 'pending' as ValidOrderStatus;
      
      const { error } = await supabase
        .from('orders')
        .update({ 
          status: finalStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating order status:', error);
      throw error;
    }
  };

  const refetchOrders = () => {
    fetchOrders(currentPage);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchOrders(page);
  };

  // Set up real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('orders-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders'
        },
        (payload) => {
          console.log('New order inserted:', payload);
          
          setNewOrderIds(prev => new Set([...prev, payload.new.id]));
          
          toast({
            title: "New Order Received",
            description: `Order #${payload.new.id.slice(-8)} has been placed`,
            className: "bg-green-50 border-green-200",
          });
          
          // Only refresh if we're on the first page to show new orders
          if (currentPage === 1) {
            fetchOrders(1);
          }
          
          setTimeout(() => {
            setNewOrderIds(prev => {
              const newSet = new Set(prev);
              newSet.delete(payload.new.id);
              return newSet;
            });
          }, 5000);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders'
        },
        (payload) => {
          console.log('Order updated:', payload);
          
          if (payload.old.status !== payload.new.status) {
            toast({
              title: "Order Status Updated",
              description: `Order #${payload.new.id.slice(-8)} is now ${payload.new.status}`,
              className: "bg-blue-50 border-blue-200",
            });
          }
          
          fetchOrders(currentPage);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [toast, currentPage]);

  useEffect(() => {
    setCurrentPage(1); // Reset to first page when filters change
    fetchOrders(1);
    fetchDeliveryAgents();
  }, [params.search, params.status, params.date, params.agent, selectedTenant?.id]);

  const totalPages = Math.ceil(totalCount / pageSize);

  return {
    orders,
    deliveryAgents,
    isLoading,
    newOrderIds,
    totalCount,
    currentPage,
    totalPages,
    pageSize,
    refetchOrders,
    assignAgent,
    cancelOrder,
    updateOrderStatus,
    onPageChange: handlePageChange
  };
}
