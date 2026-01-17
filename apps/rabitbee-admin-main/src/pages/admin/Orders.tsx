import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/admin/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar, Search, Filter, Package, Clock, User, MapPin, Phone, Edit3 } from "lucide-react";
import { useOrdersData } from "@/hooks/useOrdersData";
import { OrderAssignmentModal } from "@/components/admin/orders/OrderAssignmentModal";
import { OrderCancelModal } from "@/components/admin/orders/OrderCancelModal";
import { OrderTrackingModal } from "@/components/admin/orders/OrderTrackingModal";
import { OrderEditModal } from "@/components/admin/orders/OrderEditModal";
import { OrderStatusBadge } from "@/components/admin/orders/OrderStatusBadge";
import { formatDate, formatTime } from "@/lib/utils";
import { cn } from "@/lib/utils";

const Orders = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [agentFilter, setAgentFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [modalType, setModalType] = useState(null);

  const {
    orders,
    deliveryAgents,
    isLoading,
    newOrderIds,
    totalCount,
    currentPage,
    totalPages,
    refetchOrders,
    assignAgent,
    cancelOrder,
    updateOrderStatus,
    onPageChange
  } = useOrdersData({
    search: searchTerm,
    status: statusFilter,
    date: dateFilter,
    agent: agentFilter,
    pageSize: 10
  });

  const handleAssignAgent = (order) => {
    setSelectedOrder(order);
    setModalType('assign');
  };

  const handleCancelOrder = (order) => {
    setSelectedOrder(order);
    setModalType('cancel');
  };

  const handleViewTracking = (order) => {
    setSelectedOrder(order);
    setModalType('tracking');
  };

  const handleEditOrder = (order) => {
    setSelectedOrder(order);
    setModalType('edit');
  };

  const closeModal = () => {
    setSelectedOrder(null);
    setModalType(null);
  };

  const columns = [
    {
      key: "id",
      title: "Order ID",
      render: (order) => (
        <div className={cn(
          "font-mono text-sm transition-all duration-300",
          newOrderIds.has(order.id) && "animate-pulse bg-green-100 p-2 rounded"
        )}>
          #{order.id.slice(-8)}
        </div>
      )
    },
    {
      key: "customer",
      title: "Customer",
      render: (order) => (
        <div className={cn(
          "flex items-center gap-2 transition-all duration-300",
          newOrderIds.has(order.id) && "animate-fade-in"
        )}>
          <User className="h-4 w-4 text-muted-foreground" />
          <div>
            <div className="font-medium">{order.user_name || 'N/A'}</div>
            <div className="text-sm text-muted-foreground">{order.user_phone || ''}</div>
          </div>
        </div>
      )
    },
    {
      key: "addresses",
      title: "Addresses",
      render: (order) => (
        <div className="space-y-1 max-w-xs">
          <div className="flex items-start gap-2">
            <Package className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <span className="font-medium">From: </span>
              <span className="text-muted-foreground">Restaurant</span>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <span className="font-medium">To: </span>
              <span className="text-muted-foreground">{order.user_address || 'N/A'}</span>
            </div>
          </div>
        </div>
      )
    },
    {
      key: "status",
      title: "Status",
      render: (order) => (
        <div className={cn(
          "transition-all duration-300",
          newOrderIds.has(order.id) && "animate-scale-in"
        )}>
          <OrderStatusBadge status={order.status} />
        </div>
      )
    },
    {
      key: "agent",
      title: "Delivery Agent",
      render: (order) => (
        <div className="flex items-center gap-2">
          {order.delivery_agent_name ? (
            <>
              <div className="h-2 w-2 bg-green-500 rounded-full"></div>
              <span className="text-sm font-medium">{order.delivery_agent_name}</span>
            </>
          ) : (
            <Badge variant="secondary">Unassigned</Badge>
          )}
        </div>
      )
    },
    {
      key: "timing",
      title: "Timing",
      render: (order) => (
        <div className="space-y-1">
          <div className="flex items-center gap-1 text-sm">
            <Clock className="h-3 w-3 text-muted-foreground" />
            <span>Created: {formatTime(order.created_at)}</span>
          </div>
          {order.scheduled_at && (
            <div className="flex items-center gap-1 text-sm text-orange-600">
              <Calendar className="h-3 w-3" />
              <span>Scheduled: {formatTime(order.scheduled_at)}</span>
            </div>
          )}
        </div>
      )
    },
    {
      key: "amount",
      title: "Amount",
      render: (order) => (
        <div className="text-right space-y-1">
          <div className="font-semibold">₹{order.total_amount}</div>
          {order.collected_amount && (
            <div className="text-sm text-green-600 font-medium">
              Collected: ₹{order.collected_amount}
            </div>
          )}
          <div className="text-sm text-muted-foreground">
            {order.payment_status || 'Pending'}
          </div>
        </div>
      )
    },
    {
      key: "actions",
      title: "Actions",
      render: (order) => (
        <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleEditOrder(order)}
              className="h-8"
            >
              <Edit3 className="h-3 w-3 mr-1" />
              Edit
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleAssignAgent(order)}
              className="h-8"
            >
              {order.delivery_agent_name ? 'Reassign' : 'Assign'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleViewTracking(order)}
              className="h-8"
            >
              Track
            </Button>
          {order.status !== 'cancelled' && order.status !== 'delivered' && (
            <Button
              size="sm"
              variant="destructive"
              onClick={() => handleCancelOrder(order)}
              className="h-8"
            >
              Cancel
            </Button>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Orders Management</h1>
          <p className="text-muted-foreground">
            Manage delivery orders, assign agents, and track progress
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm text-muted-foreground">Live Updates</span>
        </div>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-1 items-center gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by order ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Filter className="h-4 w-4 text-muted-foreground" />
            </div>
            
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                </SelectContent>
              </Select>

              <Select value={agentFilter} onValueChange={setAgentFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Agent" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Agents</SelectItem>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {deliveryAgents.map((agent) => (
                    <SelectItem key={agent.id} value={agent.id}>
                      {agent.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Date" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="yesterday">Yesterday</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Orders ({totalCount})
            {newOrderIds.size > 0 && (
              <Badge variant="secondary" className="animate-pulse">
                {newOrderIds.size} New
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={orders}
            columns={columns}
            isLoading={isLoading}
            searchPlaceholder="Search orders..."
            permissions={{
              canAdd: false,
              canEdit: true,
              canDelete: false
            }}
            showPagination={true}
            currentPage={currentPage}
            totalPages={totalPages}
            totalCount={totalCount}
            onPageChange={onPageChange}
          />
        </CardContent>
      </Card>

      {/* Modals */}
      {modalType === 'assign' && selectedOrder && (
        <OrderAssignmentModal
          open={true}
          onOpenChange={closeModal}
          orderId={selectedOrder.id}
          deliveryAgents={deliveryAgents}
          onAssign={assignAgent}
          onSuccess={() => {
            refetchOrders();
            closeModal();
          }}
        />
      )}

      {modalType === 'cancel' && selectedOrder && (
        <OrderCancelModal
          open={true}
          onOpenChange={closeModal}
          order={selectedOrder}
          onCancel={cancelOrder}
          onSuccess={() => {
            refetchOrders();
            closeModal();
          }}
        />
      )}

      {modalType === 'tracking' && selectedOrder && (
        <OrderTrackingModal
          open={true}
          onOpenChange={closeModal}
          order={selectedOrder}
          onUpdate={refetchOrders}
        />
      )}

      {modalType === 'edit' && selectedOrder && (
        <OrderEditModal
          open={true}
          onOpenChange={closeModal}
          order={selectedOrder}
          onUpdate={() => {
            refetchOrders();
            closeModal();
          }}
        />
      )}
    </div>
  );
};

export default Orders;
