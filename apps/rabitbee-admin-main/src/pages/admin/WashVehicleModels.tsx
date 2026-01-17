import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { DataTable } from "@/components/admin/DataTable";
import { ConfirmationDialog } from "@/components/admin/ConfirmationDialog";
import { useTenant } from "@/contexts/TenantContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { VehicleModelForm } from "@/components/admin/wash-bookings/VehicleModelForm";

interface VehicleModel {
  id: string;
  name: string;
  is_active: boolean;
  type_id?: string | null;
  tenant_id?: string | null;
  vehicle_type?: {
    name: string;
  };
}

export default function WashVehicleModels() {
  const { toast } = useToast();
  const { selectedTenant } = useTenant();
  const [formOpen, setFormOpen] = useState(false);
  const [editingModel, setEditingModel] = useState<VehicleModel | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; model: VehicleModel | null }>({
    open: false,
    model: null
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch vehicle models
  const { data: vehicleModels = [], isLoading, refetch } = useQuery({
    queryKey: ['vehicle-models', selectedTenant?.id],
    queryFn: async () => {
      let query = supabase
        .from('wash_vehicle_models')
        .select(`
          *,
          vehicle_type:type_id(name)
        `);
      
      // Filter by tenant if selected
      if (selectedTenant?.id) {
        query = query.eq('tenant_id', selectedTenant.id);
      }
      
      const { data, error } = await query.order('name');
      
      if (error) throw error;
      console.log("Fetched vehicle models:", data); // Debug log
      return data as VehicleModel[];
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

      if (editingModel) {
        // Update
        const { error } = await supabase
          .from('wash_vehicle_models')
          .update(submissionData)
          .eq('id', editingModel.id);

        if (error) throw error;

        toast({
          title: "Vehicle model updated",
          description: "The vehicle model has been updated successfully."
        });
      } else {
        // Create
        const { error } = await supabase
          .from('wash_vehicle_models')
          .insert(submissionData);

        if (error) throw error;

        toast({
          title: "Vehicle model created",
          description: "The vehicle model has been created successfully."
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
    if (!deleteDialog.model) return;
    
    try {
      const { error } = await supabase
        .from('wash_vehicle_models')
        .delete()
        .eq('id', deleteDialog.model.id);

      if (error) throw error;

      toast({
        title: "Vehicle model deleted",
        description: `${deleteDialog.model.name} has been deleted successfully.`
      });

      refetch();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error deleting vehicle model",
        description: error.message
      });
    } finally {
      setDeleteDialog({ open: false, model: null });
    }
  };

  // Improved column definitions with null checks
  const columns = [
    { 
      key: "name", 
      title: "Name",
      render: (row: VehicleModel) => row.name || "N/A"
    },
    { 
      key: "vehicle_type", 
      title: "Vehicle Type",
      render: (row: VehicleModel) => row.vehicle_type?.name || "N/A"
    },
    {
      key: "is_active",
      title: "Status",
      render: (row: VehicleModel) => (
        <span className={`px-2 py-1 rounded-full text-xs ${row.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
          {row.is_active ? "Active" : "Inactive"}
        </span>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Vehicle Models</h1>
        <p className="text-muted-foreground">
          Manage vehicle models for wash bookings.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Vehicle Models List</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={vehicleModels}
            columns={columns}
            onEdit={(model) => {
              setEditingModel(model);
              setFormOpen(true);
            }}
            onDelete={(model) => {
              setDeleteDialog({ open: true, model });
            }}
            onAdd={() => {
              setEditingModel(null);
              setFormOpen(true);
            }}
            isLoading={isLoading}
            searchPlaceholder="Search vehicle models..."
            permissions={{
              canAdd: true,
              canEdit: true,
              canDelete: true,
            }}
          />
        </CardContent>
      </Card>

      <VehicleModelForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleSubmit}
        vehicleModel={editingModel}
        isSubmitting={isSubmitting}
      />

      <ConfirmationDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}
        title="Delete Vehicle Model"
        description={`Are you sure you want to delete ${deleteDialog.model?.name}? This cannot be undone.`}
        onConfirm={handleDelete}
      />
    </div>
  );
}
