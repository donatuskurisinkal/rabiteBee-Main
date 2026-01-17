
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { DataTable } from "@/components/admin/DataTable";
import { ConfirmationDialog } from "@/components/admin/ConfirmationDialog";
import { HolidayForm } from "@/components/admin/holidays/HolidayForm";
import { createHolidayColumns } from "@/components/admin/holidays/holidayColumns";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useTenant } from "@/contexts/TenantContext";

interface Holiday {
  id: string;
  holiday_name: string;
  date: string;
  is_active: boolean;
  tenant_id: string | null;
  created_at: string;
}

export default function Holidays() {
  const { toast } = useToast();
  const { selectedTenant } = useTenant();
  const [formOpen, setFormOpen] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState<Holiday | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; holiday: Holiday | null; }>({
    open: false,
    holiday: null
  });

  const { data: holidays = [], isLoading, refetch } = useQuery({
    queryKey: ['holidays', selectedTenant?.id],
    queryFn: async () => {
      let query = supabase.from('holidays').select('*').order('date', { ascending: false });
      
      if (selectedTenant) {
        query = query.eq('tenant_id', selectedTenant.id);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as Holiday[];
    }
  });

  const handleDelete = async () => {
    if (!deleteDialog.holiday) return;
    
    try {
      const { error } = await supabase
        .from('holidays')
        .delete()
        .eq('id', deleteDialog.holiday.id);

      if (error) throw error;

      toast({
        title: "Holiday deleted",
        description: `${deleteDialog.holiday.holiday_name} has been deleted successfully.`
      });

      refetch();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error deleting holiday",
        description: error.message
      });
    } finally {
      setDeleteDialog({ open: false, holiday: null });
    }
  };

  const columns = createHolidayColumns();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Holiday Management</h1>
        <p className="text-muted-foreground">
          Manage holidays and their details in the system.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Holidays List</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={holidays}
            columns={columns}
            onEdit={(holiday) => {
              setEditingHoliday(holiday);
              setFormOpen(true);
            }}
            onDelete={(holiday) => {
              setDeleteDialog({ open: true, holiday });
            }}
            onAdd={() => {
              setEditingHoliday(null);
              setFormOpen(true);
            }}
            isLoading={isLoading}
            searchPlaceholder="Search holidays..."
            permissions={{
              canAdd: true,
              canEdit: true,
              canDelete: true,
            }}
          />
        </CardContent>
      </Card>

      <HolidayForm
        open={formOpen}
        onOpenChange={setFormOpen}
        holiday={editingHoliday}
        onSaved={refetch}
      />

      <ConfirmationDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}
        title="Delete Holiday"
        description={`Are you sure you want to delete ${deleteDialog.holiday?.holiday_name}? This action cannot be undone.`}
        onConfirm={handleDelete}
      />
    </div>
  );
}
