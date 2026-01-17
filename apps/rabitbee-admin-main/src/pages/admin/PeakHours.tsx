
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { DataTable } from "@/components/admin/DataTable";
import { ConfirmationDialog } from "@/components/admin/ConfirmationDialog";
import { StatusBadge } from "@/components/admin/StatusBadge";
import PeakHourForm from "@/components/admin/peak-hours/PeakHourForm";

interface PeakHour {
  id: string;
  start_time: string;
  end_time: string;
  tenant_id: string | null;
  tenants?: { name: string } | null;
  day_of_week: string;
  is_active: boolean;
  multiplier: number;
  created_at: string;
}

const formatTime = (timeStr: string) => {
  try {
    const [hours, minutes] = timeStr.split(':');
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch (e) {
    return timeStr;
  }
};

const capitalizeFirstLetter = (string: string) => {
  return string.charAt(0).toUpperCase() + string.slice(1);
};

const PeakHours = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedPeakHour, setSelectedPeakHour] = useState<PeakHour | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { toast } = useToast();

  const { data: peakHours, isLoading, refetch } = useQuery({
    queryKey: ["peak-hours"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("peak_hours")
        .select(`
          *,
          tenants:tenant_id(name)
        `)
        .order("created_at", { ascending: false });

      if (error) {
        toast({
          variant: "destructive",
          title: "Error fetching peak hours",
          description: error.message,
        });
        throw error;
      }

      // Transform the data to match our PeakHour interface
      return (data as any[]).map(item => ({
        ...item,
        // Ensure compatibility with our interface
        tenant_id: item.tenant_id,
        multiplier: item.multiplier || 1.0
      })) as PeakHour[];
    },
  });

  const handleDelete = async (peakHour: PeakHour) => {
    setSelectedPeakHour(peakHour);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedPeakHour) return;

    try {
      const { error } = await supabase
        .from("peak_hours")
        .delete()
        .eq("id", selectedPeakHour.id);

      if (error) throw error;

      toast({
        title: "Peak hour deleted",
        description: `Peak hour has been deleted successfully.`,
      });

      refetch();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error deleting peak hour",
        description: error.message,
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setSelectedPeakHour(null);
    }
  };

  const handleEdit = (peakHour: PeakHour) => {
    setSelectedPeakHour(peakHour);
    setIsEditModalOpen(true);
  };

  const handleAdd = () => {
    setSelectedPeakHour(null);
    setIsAddModalOpen(true);
  };

  const handleSuccess = () => {
    refetch();
  };

  const columns = [
    {
      key: "day_of_week",
      title: "Day of Week",
      render: (row: PeakHour) => capitalizeFirstLetter(row.day_of_week),
    },
    {
      key: "start_time",
      title: "Start Time",
      render: (row: PeakHour) => formatTime(row.start_time),
    },
    {
      key: "end_time",
      title: "End Time",
      render: (row: PeakHour) => formatTime(row.end_time),
    },
    {
      key: "multiplier",
      title: "Price Multiplier",
      render: (row: PeakHour) => `${row.multiplier}x`,
    },
    {
      key: "tenant",
      title: "Tenant",
      render: (row: PeakHour) => row.tenants?.name || "All Tenants",
    },
    {
      key: "is_active",
      title: "Status",
      render: (row: PeakHour) => (
        <StatusBadge
          isActive={row.is_active}
          showSwitch={false}
        />
      ),
    },
  ];

  return (
    <Card>
      <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <CardTitle>Peak Hours</CardTitle>
        <Button onClick={handleAdd} className="self-start md:self-auto">
          <Plus className="h-4 w-4 mr-2" />
          Add Peak Hour
        </Button>
      </CardHeader>
      <CardContent>
        <DataTable
          data={peakHours || []}
          columns={columns}
          isLoading={isLoading}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
        
        {isAddModalOpen && (
          <PeakHourForm
            isOpen={isAddModalOpen}
            onClose={() => setIsAddModalOpen(false)}
            onSuccess={handleSuccess}
          />
        )}
        
        {isEditModalOpen && selectedPeakHour && (
          <PeakHourForm
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            onSuccess={handleSuccess}
            peakHour={selectedPeakHour}
          />
        )}
        
        <ConfirmationDialog
          open={isDeleteDialogOpen}
          onOpenChange={(open) => setIsDeleteDialogOpen(open)}
          onConfirm={confirmDelete}
          title="Delete Peak Hour"
          description={`Are you sure you want to delete this peak hour? This action cannot be undone.`}
        />
      </CardContent>
    </Card>
  );
};

export default PeakHours;
