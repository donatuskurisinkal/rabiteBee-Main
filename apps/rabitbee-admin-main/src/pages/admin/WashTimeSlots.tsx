
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { DataTable } from "@/components/admin/DataTable";
import { ConfirmationDialog } from "@/components/admin/ConfirmationDialog";
import { useTenant } from "@/contexts/TenantContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { TimeSlotForm } from "@/components/admin/wash-bookings/TimeSlotForm";

interface TimeSlot {
  id: string;
  start_time: string;
  end_time: string;
  max_bookings: number;
  is_active: boolean;
  tenant_id?: string | null;
}

export default function WashTimeSlots() {
  const { toast } = useToast();
  const { selectedTenant } = useTenant();
  const [formOpen, setFormOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<TimeSlot | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; slot: TimeSlot | null }>({
    open: false,
    slot: null
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch time slots
  const { data: timeSlots = [], isLoading, refetch } = useQuery({
    queryKey: ['time-slots', selectedTenant?.id],
    queryFn: async () => {
      let query = supabase
        .from('wash_time_slots')
        .select('*');
      
      // Filter by tenant if selected
      if (selectedTenant?.id) {
        query = query.eq('tenant_id', selectedTenant.id);
      }
      
      const { data, error } = await query.order('start_time');
      
      if (error) throw error;
      return data as TimeSlot[];
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

      if (editingSlot) {
        // Update
        const { error } = await supabase
          .from('wash_time_slots')
          .update(submissionData)
          .eq('id', editingSlot.id);

        if (error) throw error;

        toast({
          title: "Time slot updated",
          description: "The time slot has been updated successfully."
        });
      } else {
        // Create
        const { error } = await supabase
          .from('wash_time_slots')
          .insert(submissionData);

        if (error) throw error;

        toast({
          title: "Time slot created",
          description: "The time slot has been created successfully."
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
    if (!deleteDialog.slot) return;
    
    try {
      const { error } = await supabase
        .from('wash_time_slots')
        .delete()
        .eq('id', deleteDialog.slot.id);

      if (error) throw error;

      toast({
        title: "Time slot deleted",
        description: `Time slot has been deleted successfully.`
      });

      refetch();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error deleting time slot",
        description: error.message
      });
    } finally {
      setDeleteDialog({ open: false, slot: null });
    }
  };

  const formatTime = (timeStr: string) => {
    if (!timeStr) return "N/A";
    
    // Handle both HH:MM:SS and HH:MM formats
    const timeParts = timeStr.split(':');
    const hours = parseInt(timeParts[0]);
    const minutes = timeParts[1];
    
    const hour12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    const period = hours >= 12 ? 'PM' : 'AM';
    
    return `${hour12}:${minutes} ${period}`;
  };

  const columns = [
    { 
      key: "start_time", 
      title: "Start Time",
      render: (row: TimeSlot) => formatTime(row.start_time)
    },
    { 
      key: "end_time", 
      title: "End Time",
      render: (row: TimeSlot) => formatTime(row.end_time) 
    },
    { 
      key: "max_bookings", 
      title: "Max Bookings",
      render: (row: TimeSlot) => row.max_bookings 
    },
    {
      key: "is_active",
      title: "Status",
      render: (row: TimeSlot) => (
        <span className={`px-2 py-1 rounded-full text-xs ${row.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
          {row.is_active ? "Active" : "Inactive"}
        </span>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Time Slots</h1>
        <p className="text-muted-foreground">
          Manage time slots for wash bookings.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Time Slots List</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={timeSlots}
            columns={columns}
            onEdit={(slot) => {
              setEditingSlot(slot);
              setFormOpen(true);
            }}
            onDelete={(slot) => {
              setDeleteDialog({ open: true, slot });
            }}
            onAdd={() => {
              setEditingSlot(null);
              setFormOpen(true);
            }}
            isLoading={isLoading}
            searchPlaceholder="Search time slots..."
            permissions={{
              canAdd: true,
              canEdit: true,
              canDelete: true,
            }}
          />
        </CardContent>
      </Card>

      <TimeSlotForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleSubmit}
        timeSlot={editingSlot}
        isSubmitting={isSubmitting}
      />

      <ConfirmationDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}
        title="Delete Time Slot"
        description="Are you sure you want to delete this time slot? This cannot be undone."
        onConfirm={handleDelete}
      />
    </div>
  );
}
