import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { DataTable } from "@/components/admin/DataTable";
import { ConfirmationDialog } from "@/components/admin/ConfirmationDialog";
import { useTenant } from "@/contexts/TenantContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { WashTypeForm } from "@/components/admin/wash-bookings/WashTypeForm";

interface WashType {
  id: string;
  name: string;
  description?: string;
  base_price: number;
  offer_price?: number;
  discount_percent?: number;
  gst_percent?: number;
  service_charge?: number;
  is_active: boolean;
  tenant_id?: string | null;
  vehicle_type_id: string;
  vehicle_type_name?: string;
}

export default function WashTypes() {
  const { toast } = useToast();
  const { selectedTenant } = useTenant();
  const [formOpen, setFormOpen] = useState(false);
  const [editingType, setEditingType] = useState<WashType | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; type: WashType | null }>({
    open: false,
    type: null
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch wash types with vehicle type information
  const { data: washTypes = [], isLoading, refetch } = useQuery({
    queryKey: ['wash-types', selectedTenant?.id],
    queryFn: async () => {
      let query = supabase
        .from('wash_types')
        .select(`
          *,
          vehicle_type:wash_vehicle_types(id, name)
        `);
      
      if (selectedTenant?.id) {
        query = query.eq('tenant_id', selectedTenant.id);
      }
      
      const { data, error } = await query.order('name');
      
      if (error) throw error;

      // Transform the data to include vehicle type name
      return data.map((type: any) => ({
        ...type,
        vehicle_type_id: type.vehicle_type?.id,
        vehicle_type_name: type.vehicle_type?.name
      }));
    },
  });

  const handleSubmit = async (values: any) => {
    setIsSubmitting(true);
    try {
      // Ensure tenant_id is set
      const submissionData = {
        ...values,
        tenant_id: selectedTenant?.id || null
      };

      if (editingType) {
        // Update
        const { error } = await supabase
          .from('wash_types')
          .update(submissionData)
          .eq('id', editingType.id);

        if (error) throw error;

        toast({
          title: "Wash type updated",
          description: "The wash type has been updated successfully."
        });
      } else {
        // Create
        const { error } = await supabase
          .from('wash_types')
          .insert(submissionData);

        if (error) throw error;

        toast({
          title: "Wash type created",
          description: "The wash type has been created successfully."
        });
      }
      setFormOpen(false);
      refetch();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog.type) return;
    
    try {
      const { error } = await supabase
        .from('wash_types')
        .delete()
        .eq('id', deleteDialog.type.id);

      if (error) throw error;

      toast({
        title: "Wash type deleted",
        description: `${deleteDialog.type.name} has been deleted successfully.`
      });

      refetch();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error deleting wash type",
        description: error.message
      });
    } finally {
      setDeleteDialog({ open: false, type: null });
    }
  };

  const columns = [
    { 
      key: "name", 
      title: "Name",
      render: (row: WashType) => row.name || "N/A"
    },
    {
      key: "vehicle_type_name",
      title: "Vehicle Type",
      render: (row: WashType) => row.vehicle_type_name || "N/A"
    },
    { 
      key: "description", 
      title: "Description",
      render: (row: WashType) => row.description || "No description" 
    },
    { 
      key: "base_price", 
      title: "Base Price",
      render: (row: WashType) => row.base_price !== undefined && row.base_price !== null 
        ? `₹${row.base_price.toFixed(2)}` 
        : "N/A" 
    },
    { 
      key: "offer_price", 
      title: "Offer Price",
      render: (row: WashType) => row.offer_price !== undefined && row.offer_price !== null 
        ? `₹${row.offer_price.toFixed(2)}` 
        : "N/A" 
    },
    { 
      key: "discount_percent", 
      title: "Discount %",
      render: (row: WashType) => row.discount_percent !== undefined && row.discount_percent !== null 
        ? `${row.discount_percent}%` 
        : "N/A" 
    },
    { 
      key: "gst_percent", 
      title: "GST %",
      render: (row: WashType) => row.gst_percent !== undefined && row.gst_percent !== null 
        ? `${row.gst_percent}%` 
        : "18%" 
    },
    {
      key: "is_active",
      title: "Status",
      render: (row: WashType) => (
        <span className={`px-2 py-1 rounded-full text-xs ${row.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
          {row.is_active ? "Active" : "Inactive"}
        </span>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Wash Types</h1>
        <p className="text-muted-foreground">
          Manage wash types, their pricing, and additional charges.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Wash Types List</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={washTypes}
            columns={columns}
            onEdit={(type) => {
              setEditingType(type);
              setFormOpen(true);
            }}
            onDelete={(type) => {
              setDeleteDialog({ open: true, type });
            }}
            onAdd={() => {
              setEditingType(null);
              setFormOpen(true);
            }}
            isLoading={isLoading}
            searchPlaceholder="Search wash types..."
            permissions={{
              canAdd: true,
              canEdit: true,
              canDelete: true,
            }}
          />
        </CardContent>
      </Card>

      <WashTypeForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleSubmit}
        washType={editingType}
        isSubmitting={isSubmitting}
      />

      <ConfirmationDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}
        title="Delete Wash Type"
        description={`Are you sure you want to delete ${deleteDialog.type?.name}? This cannot be undone.`}
        onConfirm={handleDelete}
      />
    </div>
  );
}
