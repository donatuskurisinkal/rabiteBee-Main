
import React, { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { DeliveryAgentForm } from "@/components/admin/delivery-agents/DeliveryAgentForm";
import { deliveryAgentColumns } from "@/components/admin/delivery-agents/deliveryAgentColumns";
import { DataTable } from "@/components/admin/DataTable";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { PaginationComponent } from "@/components/admin/Pagination";
import { supabase } from "@/integrations/supabase/client";
import { ConfirmationDialog } from "@/components/admin/ConfirmationDialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTenant } from "@/hooks/use-tenant";

// Define DeliveryStatus type to match database enum
type DeliveryStatus = "online" | "offline" | "busy" | "on_delivery";

const DeliveryAgents = () => {
  const { toast } = useToast();
  const { selectedTenant } = useTenant();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editAgent, setEditAgent] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<DeliveryStatus | "all">("all");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [agentToDelete, setAgentToDelete] = useState<any>(null);

  // Function to fetch delivery agents with pagination, search, and filters
  const fetchDeliveryAgents = useCallback(async () => {
    try {
      let query = supabase
        .from("delivery_agents")
        .select("*", { count: "exact" });

      // Apply tenant filter
      if (selectedTenant?.id) {
        query = query.eq("tenant_id", selectedTenant.id);
      }

      // Apply search filter
      if (searchTerm) {
        query = query.or(
          `name.ilike.%${searchTerm}%,phone_number.ilike.%${searchTerm}%,vehicle_number.ilike.%${searchTerm}%`
        );
      }

      // Apply status filter
      if (statusFilter && statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      // Apply pagination
      const from = (currentPage - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data, count, error } = await query
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) throw error;

      return {
        data: data || [],
        totalCount: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize),
      };
    } catch (error) {
      console.error("Error fetching delivery agents:", error);
      return { data: [], totalCount: 0, totalPages: 0 };
    }
  }, [selectedTenant, searchTerm, statusFilter, currentPage, pageSize]);

  const {
    data: agentsData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["delivery-agents", selectedTenant?.id, currentPage, searchTerm, statusFilter],
    queryFn: fetchDeliveryAgents,
  });

  const handleAddNew = () => {
    setEditAgent(null);
    setIsFormOpen(true);
  };

  const handleEdit = (agent: any) => {
    setEditAgent(agent);
    setIsFormOpen(true);
  };

  const handleDelete = (agent: any) => {
    setAgentToDelete(agent);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!agentToDelete) return;

    try {
      const { error } = await supabase
        .from("delivery_agents")
        .delete()
        .eq("id", agentToDelete.id);

      if (error) throw error;

      toast({
        title: "Delivery agent deleted",
        description: "The delivery agent has been deleted successfully.",
      });

      refetch();
    } catch (error: any) {
      console.error("Error deleting delivery agent:", error);
      toast({
        variant: "destructive",
        title: "Error deleting delivery agent",
        description: error.message || "An unexpected error occurred.",
      });
    } finally {
      setDeleteConfirmOpen(false);
      setAgentToDelete(null);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0">
          <CardTitle>Delivery Agents</CardTitle>
          <Button onClick={handleAddNew}>
            <Plus className="h-4 w-4 mr-2" />
            Add New Agent
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="flex-1">
              <Input
                placeholder="Search by name, phone or vehicle number"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1); // Reset to first page on new search
                }}
                className="w-full"
              />
            </div>
            <div className="w-full sm:w-[200px]">
              <Select
                value={statusFilter}
                onValueChange={(value: string) => {
                  setStatusFilter(value as DeliveryStatus | "all");
                  setCurrentPage(1); // Reset to first page on new filter
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="online">Online</SelectItem>
                  <SelectItem value="offline">Offline</SelectItem>
                  <SelectItem value="busy">Busy</SelectItem>
                  <SelectItem value="on_delivery">On Delivery</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DataTable
            columns={deliveryAgentColumns}
            data={agentsData?.data || []}
            onEdit={handleEdit}
            onDelete={handleDelete}
            isLoading={isLoading}
          />

          {agentsData?.totalPages && agentsData.totalPages > 1 && (
            <div className="mt-4 flex justify-center">
              <PaginationComponent
                currentPage={currentPage}
                totalPages={agentsData.totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {isFormOpen && (
        <DeliveryAgentForm
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          initialData={editAgent}
          onSuccess={refetch}
        />
      )}

      <ConfirmationDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        onConfirm={confirmDelete}
        title="Delete Delivery Agent"
        description="Are you sure you want to delete this delivery agent? This action cannot be undone."
      />
    </div>
  );
};

export default DeliveryAgents;
