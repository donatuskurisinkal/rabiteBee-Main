
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useTenant } from "@/hooks/use-tenant";
import { DataTable } from "@/components/admin/DataTable";
import { EchoItemFormDialog } from "@/components/admin/echo-items/EchoItemFormDialog";
import { createEchoItemColumns } from "@/components/admin/echo-items/echoItemColumns";
import { ConfirmationDialog } from "@/components/admin/ConfirmationDialog";
import { addTenantFilter, getTenantIdForRecord } from "@/utils/tenantHeaders";

interface EchoItem {
  id: string;
  name: string;
  unit: string;
  base_price: number;
  icon_url?: string;
  is_active: boolean;
  tenant_id?: string;
}

const EchoItems: React.FC = () => {
  const { toast } = useToast();
  const { userPermissions } = useAuth();
  const { selectedTenant } = useTenant();
  const queryClient = useQueryClient();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<EchoItem | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canManageEchoItems = userPermissions.includes("manage_all") || 
                            userPermissions.includes("manage_echo_items");

  // Fetch echo items
  const { data: echoItems, isLoading } = useQuery({
    queryKey: ["echo-items", selectedTenant?.id],
    queryFn: async () => {
      const query = supabase
        .from("echo_items")
        .select("*")
        .order("name");

      const filteredQuery = addTenantFilter(query, selectedTenant?.id);
      const { data, error } = await filteredQuery;

      if (error) throw error;
      return data || [];
    },
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (values: Omit<EchoItem, "id" | "tenant_id">) => {
      const { data, error } = await supabase
        .from("echo_items")
        .insert([{
          ...values,
          tenant_id: getTenantIdForRecord(selectedTenant?.id)
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["echo-items"] });
      toast({
        title: "Success",
        description: "Echo item created successfully",
      });
      setIsFormOpen(false);
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to create echo item",
      });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, ...values }: EchoItem) => {
      const { data, error } = await supabase
        .from("echo_items")
        .update(values)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["echo-items"] });
      toast({
        title: "Success",
        description: "Echo item updated successfully",
      });
      setIsFormOpen(false);
      setSelectedItem(null);
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update echo item",
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("echo_items")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["echo-items"] });
      toast({
        title: "Success",
        description: "Echo item deleted successfully",
      });
      setIsDeleteDialogOpen(false);
      setSelectedItem(null);
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to delete echo item",
      });
    },
  });

  const handleSubmit = async (values: any) => {
    setIsSubmitting(true);
    try {
      if (selectedItem) {
        await updateMutation.mutateAsync({ ...selectedItem, ...values });
      } else {
        await createMutation.mutateAsync(values);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (item: EchoItem) => {
    setSelectedItem(item);
    setIsFormOpen(true);
  };

  const handleDelete = (item: EchoItem) => {
    setSelectedItem(item);
    setIsDeleteDialogOpen(true);
  };

  const handleAdd = () => {
    setSelectedItem(null);
    setIsFormOpen(true);
  };

  const handleToggleActive = async (item: EchoItem, isActive: boolean) => {
    if (!canManageEchoItems) return;

    try {
      await updateMutation.mutateAsync({
        ...item,
        is_active: isActive,
      });
    } catch (error) {
      console.error("Failed to toggle item status:", error);
    }
  };

  const columns = createEchoItemColumns(canManageEchoItems, handleToggleActive);

  const permissions = {
    canAdd: canManageEchoItems,
    canEdit: canManageEchoItems,
    canDelete: canManageEchoItems,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Echo Items</h1>
        <p className="text-muted-foreground">
          Manage recyclable items and their pricing
        </p>
      </div>

      <DataTable
        data={echoItems || []}
        columns={columns}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onAdd={handleAdd}
        isLoading={isLoading}
        searchPlaceholder="Search echo items..."
        permissions={permissions}
      />

      <EchoItemFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleSubmit}
        echoItem={selectedItem}
        isSubmitting={isSubmitting}
      />

      <ConfirmationDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={() => selectedItem && deleteMutation.mutate(selectedItem.id)}
        title="Delete Echo Item"
        description={`Are you sure you want to delete "${selectedItem?.name}"? This action cannot be undone.`}
      />
    </div>
  );
};

export default EchoItems;
