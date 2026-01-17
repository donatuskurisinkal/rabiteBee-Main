import React, { useState } from "react";
import { useOrdersData } from "@/hooks/useOrdersData";
import OrderAssignmentMap from "@/components/admin/orders/OrderAssignmentMap";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, RefreshCw, Search } from "lucide-react";
import { toast } from "sonner";

export default function OrderMapPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [agentFilter, setAgentFilter] = useState<string>("all");

  const {
    orders,
    deliveryAgents,
    isLoading,
    assignAgent,
    refetchOrders
  } = useOrdersData({
    search: searchTerm,
    status: statusFilter === "all" ? undefined : statusFilter,
    agent: agentFilter === "all" ? undefined : agentFilter,
    page: 1
  });

  const handleAssignAgent = async (orderId: string, agentId: string) => {
    try {
      await assignAgent(orderId, agentId);
      toast.success("Agent assigned successfully");
    } catch (error) {
      toast.error("Failed to assign agent");
      console.error("Error assigning agent:", error);
    }
  };

  const handleRefresh = () => {
    refetchOrders();
    toast.success("Map refreshed");
  };

  const ordersWithLocation = orders.filter(order => 
    order.user_latitude && order.user_longitude
  );

  const pendingOrders = ordersWithLocation.filter(order => 
    order.delivery_agent_status === 'pending' || !order.delivery_agent_id
  );

  const assignedOrders = ordersWithLocation.filter(order => 
    order.delivery_agent_id && order.delivery_agent_status !== 'pending'
  );

  const onlineAgents = deliveryAgents.filter(agent => agent.is_online);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Order Assignment Map</h1>
          <p className="text-muted-foreground">
            Visualize and manage delivery order assignments in real-time
          </p>
        </div>
        <Button onClick={handleRefresh} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ordersWithLocation.length}</div>
            <p className="text-xs text-muted-foreground">
              Orders with location data
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
            <Badge variant="destructive" className="h-6 w-6 rounded-full p-0 flex items-center justify-center">
              {pendingOrders.length}
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingOrders.length}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting assignment
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assigned Orders</CardTitle>
            <Badge variant="secondary" className="h-6 w-6 rounded-full p-0 flex items-center justify-center">
              {assignedOrders.length}
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assignedOrders.length}</div>
            <p className="text-xs text-muted-foreground">
              With delivery agents
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Online Agents</CardTitle>
            <Badge variant="default" className="h-6 w-6 rounded-full p-0 flex items-center justify-center">
              {onlineAgents.length}
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{onlineAgents.length}</div>
            <p className="text-xs text-muted-foreground">
              Available for assignment
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search orders..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="assigned">Assigned</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
              </SelectContent>
            </Select>
            <Select value={agentFilter} onValueChange={setAgentFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by agent" />
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
          </div>
        </CardContent>
      </Card>

      {/* Map */}
      <Card className="overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="text-lg">Order Locations</CardTitle>
              <p className="text-sm text-muted-foreground">
                Click on pending orders (orange markers) to assign delivery agents
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <OrderAssignmentMap
            orders={ordersWithLocation}
            deliveryAgents={deliveryAgents}
            onAssignAgent={handleAssignAgent}
            isLoading={isLoading}
          />
        </CardContent>
      </Card>
    </div>
  );
}