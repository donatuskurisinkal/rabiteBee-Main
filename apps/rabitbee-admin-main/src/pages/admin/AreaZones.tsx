
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Badge } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { DataTable } from "@/components/admin/DataTable";
import { ConfirmationDialog } from "@/components/admin/ConfirmationDialog";
import { StatusBadge } from "@/components/admin/StatusBadge";
import AreaZoneForm from "@/components/admin/area-zones/AreaZoneForm";
import { useTenant } from "@/hooks/use-tenant";
import { Badge as UIBadge } from "@/components/ui/badge";

interface AreaZone {
  id: string;
  name: string;
  description: string;
  latitude: number;
  longitude: number;
  price: number;
  is_active: boolean;
  tenant_id: string | null;
  tenants?: { name: string } | null;
  created_at: string;
  updated_at: string | null;
  prime_discount_percent?: number;
  prime_only?: boolean;
}

const AreaZones = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedAreaZone, setSelectedAreaZone] = useState<AreaZone | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { toast } = useToast();
  const { selectedTenant } = useTenant();

  const { data: areaZonesData, isLoading, refetch } = useQuery({
    queryKey: ["area-zones", selectedTenant?.id],
    queryFn: async () => {
      const query = supabase
        .from("area_zones")
        .select(`
          *,
          tenants:tenant_id(name)
        `);
      
      // Filter by tenant if one is selected
      if (selectedTenant) {
        query.eq('tenant_id', selectedTenant.id);
      }

      const { data, error } = await query.order("created_at", { ascending: false });

      if (error) {
        toast({
          variant: "destructive",
          title: "Error fetching area zones data",
          description: error.message,
        });
        throw error;
      }

      return data as AreaZone[];
    },
  });

  const handleDelete = async (areaZone: AreaZone) => {
    setSelectedAreaZone(areaZone);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedAreaZone) return;

    try {
      const { error } = await supabase
        .from("area_zones")
        .delete()
        .eq("id", selectedAreaZone.id);

      if (error) throw error;

      toast({
        title: "Area zone deleted",
        description: `Area zone has been deleted successfully.`,
      });

      refetch();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error deleting area zone",
        description: error.message,
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setSelectedAreaZone(null);
    }
  };

  const handleEdit = (areaZone: AreaZone) => {
    setSelectedAreaZone(areaZone);
    setIsEditModalOpen(true);
  };

  const handleAdd = () => {
    setSelectedAreaZone(null);
    setIsAddModalOpen(true);
  };

  const handleSuccess = () => {
    refetch();
  };

  const renderPrimeStatus = (row: AreaZone) => {
    if (row.prime_only) {
      return (
        <UIBadge variant="default" className="bg-yellow-500">
          <Badge className="h-3 w-3 mr-1" />
          Prime Only
        </UIBadge>
      );
    }
    
    if (row.prime_discount_percent && row.prime_discount_percent > 0) {
      return (
        <UIBadge variant="outline" className="border-yellow-500 text-yellow-700">
          <Badge className="h-3 w-3 mr-1" />
          {row.prime_discount_percent}% Prime Discount
        </UIBadge>
      );
    }
    
    return "No Prime Benefits";
  };

  const columns = [
    {
      key: "name",
      title: "Name",
      render: (row: AreaZone) => row.name,
    },
    {
      key: "description",
      title: "Description",
      render: (row: AreaZone) => row.description || "—",
    },
    {
      key: "location",
      title: "Location (Lat, Long)",
      render: (row: AreaZone) => (
        row.latitude && row.longitude ? 
        `${row.latitude}, ${row.longitude}` : "—"
      ),
    },
    {
      key: "price",
      title: "Price",
      render: (row: AreaZone) => row.price,
    },
    {
      key: "prime_benefits",
      title: "Prime Benefits",
      render: renderPrimeStatus,
    },
    {
      key: "tenant",
      title: "Tenant",
      render: (row: AreaZone) => row.tenants?.name || "All Tenants",
    },
    {
      key: "is_active",
      title: "Status",
      render: (row: AreaZone) => (
        <StatusBadge
          isActive={row.is_active || false}
          showSwitch={false}
        />
      ),
    },
  ];

  return (
    <Card>
      <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <CardTitle>Area Zones</CardTitle>
        <Button onClick={handleAdd} className="self-start md:self-auto">
          <Plus className="h-4 w-4 mr-2" />
          Add Area Zone
        </Button>
      </CardHeader>
      <CardContent>
        <DataTable
          data={areaZonesData || []}
          columns={columns}
          isLoading={isLoading}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
        
        {isAddModalOpen && (
          <AreaZoneForm
            isOpen={isAddModalOpen}
            onClose={() => setIsAddModalOpen(false)}
            onSuccess={handleSuccess}
          />
        )}
        
        {isEditModalOpen && selectedAreaZone && (
          <AreaZoneForm
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            onSuccess={handleSuccess}
            areaZone={selectedAreaZone}
          />
        )}
        
        <ConfirmationDialog
          open={isDeleteDialogOpen}
          onOpenChange={(open) => setIsDeleteDialogOpen(open)}
          onConfirm={confirmDelete}
          title="Delete Area Zone"
          description={`Are you sure you want to delete this area zone? This action cannot be undone.`}
        />
      </CardContent>
    </Card>
  );
};

export default AreaZones;
