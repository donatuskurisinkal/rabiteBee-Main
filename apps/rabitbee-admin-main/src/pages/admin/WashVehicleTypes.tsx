import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { DataTable } from "@/components/admin/DataTable";
import { ConfirmationDialog } from "@/components/admin/ConfirmationDialog";
import { useTenant } from "@/contexts/TenantContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { VehicleTypeForm } from "@/components/admin/wash-bookings/VehicleTypeForm";

interface VehicleType {
  id: string;
  name: string;
  icon_url?: string;
  tenant_id?: string | null;
}

export default function WashVehicleTypes() {
  const { toast } = useToast();
  const { selectedTenant } = useTenant();
  const [formOpen, setFormOpen] = useState(false);
  const [editingType, setEditingType] = useState<VehicleType | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; type: VehicleType | null }>({
    open: false,
    type: null
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch vehicle types
  const { data: vehicleTypes = [], isLoading, refetch } = useQuery({
    queryKey: ['vehicle-types', selectedTenant?.id],
    queryFn: async () => {
      let query = supabase
        .from('wash_vehicle_types')
        .select('*');
      
      // Filter by tenant if selected
      if (selectedTenant?.id) {
        query = query.eq('tenant_id', selectedTenant.id);
      }
      
      const { data, error } = await query.order('name');
      
      if (error) throw error;
      console.log("Fetched vehicle types:", data); // Debug log
      return data as VehicleType[];
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
          .from('wash_vehicle_types')
          .update(submissionData)
          .eq('id', editingType.id);

        if (error) throw error;

        toast({
          title: "Vehicle type updated",
          description: "The vehicle type has been updated successfully."
        });
      } else {
        // Create
        const { error } = await supabase
          .from('wash_vehicle_types')
          .insert(submissionData);

        if (error) throw error;

        toast({
          title: "Vehicle type created",
          description: "The vehicle type has been created successfully."
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
        .from('wash_vehicle_types')
        .delete()
        .eq('id', deleteDialog.type.id);

      if (error) throw error;

      toast({
        title: "Vehicle type deleted",
        description: `${deleteDialog.type.name} has been deleted successfully.`
      });

      refetch();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error deleting vehicle type",
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
      render: (row: VehicleType) => row.name || "N/A"
    },
    { 
      key: "icon_url", 
      title: "Icon",
      render: (row: VehicleType) => row.icon_url ? (
        <img src={row.icon_url} alt={row.name || "vehicle"} className="h-8 w-8 object-contain" />
      ) : "No Icon"
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Vehicle Types</h1>
        <p className="text-muted-foreground">
          Manage vehicle types for wash bookings.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Vehicle Types List</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={vehicleTypes}
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
            searchPlaceholder="Search vehicle types..."
            permissions={{
              canAdd: true,
              canEdit: true,
              canDelete: true,
            }}
          />
        </CardContent>
      </Card>

      <VehicleTypeForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleSubmit}
        vehicleType={editingType}
        isSubmitting={isSubmitting}
      />

      <ConfirmationDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}
        title="Delete Vehicle Type"
        description={`Are you sure you want to delete ${deleteDialog.type?.name}? This cannot be undone.`}
        onConfirm={handleDelete}
      />
    </div>
  );
}
