
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { DataTable } from "@/components/admin/DataTable";
import { ConfirmationDialog } from "@/components/admin/ConfirmationDialog";
import DistanceBracketForm from "@/components/admin/distance-brackets/DistanceBracketForm";
import { useTenant } from "@/hooks/use-tenant";
import { StatusBadge } from "@/components/admin/StatusBadge";

interface DistanceBracket {
  id: string;
  min_km: number;
  max_km: number | null;
  flat_fare: number;
  tenant_id: string | null;
  tenant?: { name: string } | null;
  created_at: string;
  updated_at: string | null;
  is_active: boolean;
}

const DistanceBrackets = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedBracket, setSelectedBracket] = useState<DistanceBracket | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { toast } = useToast();
  const { selectedTenant } = useTenant();

  const { data: brackets, isLoading, refetch } = useQuery({
    queryKey: ["distance-brackets", selectedTenant?.id],
    queryFn: async () => {
      const query = supabase
        .from("distance_brackets")
        .select(`
          *,
          tenant:tenant_id(name)
        `);
      
      if (selectedTenant) {
        query.eq('tenant_id', selectedTenant.id);
      }

      const { data, error } = await query.order("min_km", { ascending: true });

      if (error) {
        toast({
          variant: "destructive",
          title: "Error fetching distance brackets",
          description: error.message,
        });
        throw error;
      }

      return data as DistanceBracket[];
    },
  });

  const handleDelete = async (bracket: DistanceBracket) => {
    setSelectedBracket(bracket);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedBracket) return;

    try {
      const { error } = await supabase
        .from("distance_brackets")
        .delete()
        .eq("id", selectedBracket.id);

      if (error) throw error;

      toast({
        title: "Distance bracket deleted",
        description: `Distance bracket has been deleted successfully.`,
      });

      refetch();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error deleting distance bracket",
        description: error.message,
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setSelectedBracket(null);
    }
  };

  const handleEdit = (bracket: DistanceBracket) => {
    setSelectedBracket(bracket);
    setIsEditModalOpen(true);
  };

  const handleAdd = () => {
    setSelectedBracket(null);
    setIsAddModalOpen(true);
  };

  const handleSuccess = () => {
    refetch();
  };

  const handleToggleStatus = async (bracket: DistanceBracket) => {
    try {
      const { error } = await supabase
        .from("distance_brackets")
        .update({ is_active: !bracket.is_active })
        .eq("id", bracket.id);

      if (error) throw error;

      toast({
        title: `Distance bracket ${bracket.is_active ? "deactivated" : "activated"}`,
        description: `Distance bracket has been ${bracket.is_active ? "deactivated" : "activated"} successfully.`,
      });

      refetch();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error updating status",
        description: error.message,
      });
    }
  };

  const columns = [
    {
      key: "distance_range",
      title: "Distance Range",
      render: (row: DistanceBracket) => {
        if (row.max_km === null) {
          return `${row.min_km} km and above`;
        }
        return `${row.min_km} km - ${row.max_km} km`;
      },
    },
    {
      key: "flat_fare",
      title: "Flat Fare",
      render: (row: DistanceBracket) => `${row.flat_fare}`,
    },
    {
      key: "tenant",
      title: "Tenant",
      render: (row: DistanceBracket) => row.tenant?.name || "All Tenants",
    },
    {
      key: "status",
      title: "Status",
      render: (row: DistanceBracket) => (
        <StatusBadge
          isActive={row.is_active}
          onToggle={() => handleToggleStatus(row)}
          showSwitch={true}
        />
      ),
    },
  ];

  return (
    <Card>
      <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <CardTitle>Distance Brackets</CardTitle>
        <Button onClick={handleAdd} className="self-start md:self-auto">
          <Plus className="h-4 w-4 mr-2" />
          Add Distance Bracket
        </Button>
      </CardHeader>
      <CardContent>
        <DataTable
          data={brackets || []}
          columns={columns}
          isLoading={isLoading}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
        
        {isAddModalOpen && (
          <DistanceBracketForm
            isOpen={isAddModalOpen}
            onClose={() => setIsAddModalOpen(false)}
            onSuccess={handleSuccess}
          />
        )}
        
        {isEditModalOpen && selectedBracket && (
          <DistanceBracketForm
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            onSuccess={handleSuccess}
            bracket={selectedBracket}
          />
        )}
        
        <ConfirmationDialog
          open={isDeleteDialogOpen}
          onOpenChange={(open) => setIsDeleteDialogOpen(open)}
          onConfirm={confirmDelete}
          title="Delete Distance Bracket"
          description={`Are you sure you want to delete this distance bracket? This action cannot be undone.`}
        />
      </CardContent>
    </Card>
  );
};

export default DistanceBrackets;
