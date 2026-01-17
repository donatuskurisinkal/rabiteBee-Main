
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { DataTable } from "@/components/admin/DataTable";
import { ConfirmationDialog } from "@/components/admin/ConfirmationDialog";
import { useTenant } from "@/contexts/TenantContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { SlotOverrideForm } from "@/components/admin/wash-bookings/SlotOverrideForm";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { format } from "date-fns";

interface SlotOverride {
  id: string;
  slot_id: string;
  override_date: string;
  max_bookings: number;
  is_active: boolean;
  tenant_id?: string | null;
  created_at: string;
  updated_at: string;
  time_slot?: {
    start_time: string;
    end_time: string;
  };
}

export default function WashSlotOverrides() {
  const { toast } = useToast();
  const { selectedTenant } = useTenant();
  const [formOpen, setFormOpen] = useState(false);
  const [editingOverride, setEditingOverride] = useState<SlotOverride | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; override: SlotOverride | null }>({
    open: false,
    override: null
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch slot overrides
  const { data: slotOverrides = [], isLoading, refetch } = useQuery({
    queryKey: ['slot-overrides', selectedTenant?.id],
    queryFn: async () => {
      let query = supabase
        .from('slot_overrides')
        .select(`
          *,
          time_slot:slot_id(start_time, end_time)
        `);
      
      // Filter by tenant if selected
      if (selectedTenant?.id) {
        query = query.eq('tenant_id', selectedTenant.id);
      }
      
      const { data, error } = await query.order('override_date', { ascending: false });
      
      if (error) throw error;
      return data as SlotOverride[];
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

      if (editingOverride) {
        // Update
        const { error } = await supabase
          .from('slot_overrides')
          .update(submissionData)
          .eq('id', editingOverride.id);

        if (error) throw error;

        toast({
          title: "Slot override updated",
          description: "The slot override has been updated successfully."
        });
      } else {
        // Create
        const { error } = await supabase
          .from('slot_overrides')
          .insert(submissionData);

        if (error) throw error;

        toast({
          title: "Slot override created",
          description: "The slot override has been created successfully."
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

  const handleToggleStatus = async (override: SlotOverride) => {
    try {
      const { error } = await supabase
        .from('slot_overrides')
        .update({ is_active: !override.is_active })
        .eq('id', override.id);

      if (error) throw error;

      toast({
        title: "Status updated",
        description: `Slot override ${!override.is_active ? 'activated' : 'deactivated'} successfully.`
      });

      refetch();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error updating status",
        description: error.message
      });
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog.override) return;
    
    try {
      const { error } = await supabase
        .from('slot_overrides')
        .delete()
        .eq('id', deleteDialog.override.id);

      if (error) throw error;

      toast({
        title: "Slot override deleted",
        description: `Slot override has been deleted successfully.`
      });

      refetch();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error deleting slot override",
        description: error.message
      });
    } finally {
      setDeleteDialog({ open: false, override: null });
    }
  };

  const formatTime = (timeStr: string) => {
    const date = new Date(`2000-01-01T${timeStr}`);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const columns = [
    { 
      key: "time_slot", 
      title: "Time Slot",
      render: (row: SlotOverride) => row.time_slot 
        ? `${formatTime(row.time_slot.start_time)} - ${formatTime(row.time_slot.end_time)}`
        : "N/A"
    },
    { 
      key: "override_date", 
      title: "Date",
      render: (row: SlotOverride) => format(new Date(row.override_date), "PPP")
    },
    { 
      key: "max_bookings", 
      title: "Max Bookings",
      render: (row: SlotOverride) => row.max_bookings 
    },
    {
      key: "is_active",
      title: "Status",
      render: (row: SlotOverride) => (
        <StatusBadge
          isActive={row.is_active}
          onToggle={() => handleToggleStatus(row)}
        />
      ),
    },
    { 
      key: "created_at", 
      title: "Created",
      render: (row: SlotOverride) => format(new Date(row.created_at), "PPp")
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Slot Overrides</h1>
        <p className="text-muted-foreground">
          Manage capacity overrides for specific time slots and dates.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Slot Overrides List</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={slotOverrides}
            columns={columns}
            onEdit={(override) => {
              setEditingOverride(override);
              setFormOpen(true);
            }}
            onDelete={(override) => {
              setDeleteDialog({ open: true, override });
            }}
            onAdd={() => {
              setEditingOverride(null);
              setFormOpen(true);
            }}
            isLoading={isLoading}
            searchPlaceholder="Search slot overrides..."
            permissions={{
              canAdd: true,
              canEdit: true,
              canDelete: true,
            }}
          />
        </CardContent>
      </Card>

      <SlotOverrideForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleSubmit}
        slotOverride={editingOverride}
        isSubmitting={isSubmitting}
      />

      <ConfirmationDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}
        title="Delete Slot Override"
        description="Are you sure you want to delete this slot override? This cannot be undone."
        onConfirm={handleDelete}
      />
    </div>
  );
}
