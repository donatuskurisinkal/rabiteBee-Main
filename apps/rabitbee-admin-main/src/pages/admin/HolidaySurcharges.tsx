
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { DataTable } from "@/components/admin/DataTable";
import { ConfirmationDialog } from "@/components/admin/ConfirmationDialog";
import HolidaySurchargeForm from "@/components/admin/holiday-surcharges/HolidaySurchargeForm";
import { useTenant } from "@/hooks/use-tenant";

interface Holiday {
  id: string;
  holiday_name: string;
  date: string;
}

interface HolidaySurcharge {
  id: string;
  holiday_id: string;
  extra_flat: number | null;
  multiplier: number;
  tenant_id: string | null;
  tenant?: { name: string } | null;
  holiday?: Holiday;
  created_at: string;
  updated_at: string | null;
}

const HolidaySurcharges = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedSurcharge, setSelectedSurcharge] = useState<HolidaySurcharge | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { toast } = useToast();
  const { selectedTenant } = useTenant();

  const { data: surcharges, isLoading, refetch } = useQuery({
    queryKey: ["holiday-surcharges", selectedTenant?.id],
    queryFn: async () => {
      const query = supabase
        .from("holiday_surcharges")
        .select(`
          *,
          tenant:tenant_id(name),
          holiday:holiday_id(id, holiday_name, date)
        `);
      
      if (selectedTenant) {
        query.eq('tenant_id', selectedTenant.id);
      }

      const { data, error } = await query.order("created_at", { ascending: false });

      if (error) {
        toast({
          variant: "destructive",
          title: "Error fetching holiday surcharges",
          description: error.message,
        });
        throw error;
      }

      return data as HolidaySurcharge[];
    },
  });

  const handleDelete = async (surcharge: HolidaySurcharge) => {
    setSelectedSurcharge(surcharge);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedSurcharge) return;

    try {
      const { error } = await supabase
        .from("holiday_surcharges")
        .delete()
        .eq("id", selectedSurcharge.id);

      if (error) throw error;

      toast({
        title: "Holiday surcharge deleted",
        description: `Holiday surcharge has been deleted successfully.`,
      });

      refetch();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error deleting holiday surcharge",
        description: error.message,
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setSelectedSurcharge(null);
    }
  };

  const handleEdit = (surcharge: HolidaySurcharge) => {
    setSelectedSurcharge(surcharge);
    setIsEditModalOpen(true);
  };

  const handleAdd = () => {
    setSelectedSurcharge(null);
    setIsAddModalOpen(true);
  };

  const handleSuccess = () => {
    refetch();
  };

  const columns = [
    {
      key: "holiday",
      title: "Holiday",
      render: (row: HolidaySurcharge) => row.holiday?.holiday_name || "Unknown Holiday",
    },
    {
      key: "date",
      title: "Date",
      render: (row: HolidaySurcharge) => row.holiday?.date 
        ? new Date(row.holiday.date).toLocaleDateString() 
        : "Unknown Date",
    },
    {
      key: "extra_flat",
      title: "Extra Flat Fee",
      render: (row: HolidaySurcharge) => row.extra_flat === null ? "-" : `${row.extra_flat}`,
    },
    {
      key: "multiplier",
      title: "Price Multiplier",
      render: (row: HolidaySurcharge) => `${row.multiplier}x`,
    },
    {
      key: "tenant",
      title: "Tenant",
      render: (row: HolidaySurcharge) => row.tenant?.name || "All Tenants",
    },
  ];

  return (
    <Card>
      <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <CardTitle>Holiday Surcharges</CardTitle>
        <Button onClick={handleAdd} className="self-start md:self-auto">
          <Plus className="h-4 w-4 mr-2" />
          Add Holiday Surcharge
        </Button>
      </CardHeader>
      <CardContent>
        <DataTable
          data={surcharges || []}
          columns={columns}
          isLoading={isLoading}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
        
        {isAddModalOpen && (
          <HolidaySurchargeForm
            isOpen={isAddModalOpen}
            onClose={() => setIsAddModalOpen(false)}
            onSuccess={handleSuccess}
          />
        )}
        
        {isEditModalOpen && selectedSurcharge && (
          <HolidaySurchargeForm
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            onSuccess={handleSuccess}
            surcharge={selectedSurcharge}
          />
        )}
        
        <ConfirmationDialog
          open={isDeleteDialogOpen}
          onOpenChange={(open) => setIsDeleteDialogOpen(open)}
          onConfirm={confirmDelete}
          title="Delete Holiday Surcharge"
          description={`Are you sure you want to delete this holiday surcharge? This action cannot be undone.`}
        />
      </CardContent>
    </Card>
  );
};

export default HolidaySurcharges;
