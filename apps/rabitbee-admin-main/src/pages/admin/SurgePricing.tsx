
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { DataTable } from "@/components/admin/DataTable";
import { ConfirmationDialog } from "@/components/admin/ConfirmationDialog";
import { StatusBadge } from "@/components/admin/StatusBadge";
import SurgePricingForm from "@/components/admin/surge-pricing/SurgePricingForm";
import { format } from "date-fns";
import { useTenant } from "@/hooks/use-tenant";

interface SurgePricing {
  id: string;
  reason: string;
  extra_charge_amount: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
  tenant_id: string | null;
  tenants?: { name: string } | null;
  area_zones?: { name: string }[];
  applies_to_all_zones?: boolean;
  created_at: string;
  updated_at: string | null;
}

const SurgePricing = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedSurgePricing, setSelectedSurgePricing] = useState<SurgePricing | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { toast } = useToast();
  const { selectedTenant } = useTenant();

  const { data: surgePricingData, isLoading, refetch } = useQuery({
    queryKey: ["surge-pricing", selectedTenant?.id],
    queryFn: async () => {
      const query = supabase
        .from("surge_pricing")
        .select(`
          *,
          tenants:tenant_id(name)
        `);
      
      // Filter by tenant if one is selected
      if (selectedTenant) {
        query.eq('tenant_id', selectedTenant.id);
      }

      const { data: surgePricingItems, error } = await query.order("created_at", { ascending: false });

      if (error) {
        toast({
          variant: "destructive",
          title: "Error fetching surge pricing data",
          description: error.message,
        });
        throw error;
      }

      // For each surge pricing, fetch associated area zones
      const enhancedData = await Promise.all(
        (surgePricingItems || []).map(async (item) => {
          // Check if there are any linked zones
          const { data: zones, error: zonesError } = await supabase
            .from("surge_pricing_area_zones")
            .select(`
              area_zones:area_zone_id(name)
            `)
            .eq("surge_pricing_id", item.id);

          if (zonesError) {
            console.error("Error fetching zones for surge pricing:", zonesError);
            return {
              ...item,
              area_zones: [],
              applies_to_all_zones: true
            };
          }

          return {
            ...item,
            area_zones: zones?.map(zone => zone.area_zones) || [],
            applies_to_all_zones: !zones || zones.length === 0
          };
        })
      );

      return enhancedData as SurgePricing[];
    },
  });

  const handleDelete = async (surgePricing: SurgePricing) => {
    setSelectedSurgePricing(surgePricing);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedSurgePricing) return;

    try {
      // First delete related area zones
      const { error: deleteZonesError } = await supabase
        .from("surge_pricing_area_zones")
        .delete()
        .eq("surge_pricing_id", selectedSurgePricing.id);

      if (deleteZonesError) throw deleteZonesError;

      // Then delete the surge pricing
      const { error } = await supabase
        .from("surge_pricing")
        .delete()
        .eq("id", selectedSurgePricing.id);

      if (error) throw error;

      toast({
        title: "Surge pricing deleted",
        description: `Surge pricing has been deleted successfully.`,
      });

      refetch();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error deleting surge pricing",
        description: error.message,
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setSelectedSurgePricing(null);
    }
  };

  const handleEdit = (surgePricing: SurgePricing) => {
    setSelectedSurgePricing(surgePricing);
    setIsEditModalOpen(true);
  };

  const handleAdd = () => {
    setSelectedSurgePricing(null);
    setIsAddModalOpen(true);
  };

  const handleSuccess = () => {
    refetch();
  };

  const formatDateTime = (dateTimeStr: string) => {
    try {
      return format(new Date(dateTimeStr), 'yyyy-MM-dd HH:mm');
    } catch (e) {
      return dateTimeStr;
    }
  };

  const renderZones = (surgePricing: SurgePricing) => {
    if (surgePricing.applies_to_all_zones) {
      return <span className="text-sm text-gray-600">All Zones</span>;
    }

    if (!surgePricing.area_zones || surgePricing.area_zones.length === 0) {
      return <span className="text-sm text-gray-600">None</span>;
    }

    const zoneNames = surgePricing.area_zones.map(zone => zone.name).join(", ");
    
    if (zoneNames.length > 30) {
      return (
        <span className="text-sm text-gray-600" title={zoneNames}>
          {zoneNames.substring(0, 30)}...
        </span>
      );
    }
    
    return <span className="text-sm text-gray-600">{zoneNames}</span>;
  };

  const columns = [
    {
      key: "reason",
      title: "Reason",
      render: (row: SurgePricing) => row.reason,
    },
    {
      key: "extra_charge_amount",
      title: "Charge Amount",
      render: (row: SurgePricing) => row.extra_charge_amount,
    },
    {
      key: "start_time",
      title: "Start Time",
      render: (row: SurgePricing) => formatDateTime(row.start_time),
    },
    {
      key: "end_time",
      title: "End Time",
      render: (row: SurgePricing) => formatDateTime(row.end_time),
    },
    {
      key: "zones",
      title: "Applies To",
      render: (row: SurgePricing) => renderZones(row),
    },
    {
      key: "tenant",
      title: "Tenant",
      render: (row: SurgePricing) => row.tenants?.name || "All Tenants",
    },
    {
      key: "is_active",
      title: "Status",
      render: (row: SurgePricing) => (
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
        <CardTitle>Surge Pricing</CardTitle>
        <Button onClick={handleAdd} className="self-start md:self-auto">
          <Plus className="h-4 w-4 mr-2" />
          Add Surge Pricing
        </Button>
      </CardHeader>
      <CardContent>
        <DataTable
          data={surgePricingData || []}
          columns={columns}
          isLoading={isLoading}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
        
        {isAddModalOpen && (
          <SurgePricingForm
            isOpen={isAddModalOpen}
            onClose={() => setIsAddModalOpen(false)}
            onSuccess={handleSuccess}
          />
        )}
        
        {isEditModalOpen && selectedSurgePricing && (
          <SurgePricingForm
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            onSuccess={handleSuccess}
            surgePricing={selectedSurgePricing}
          />
        )}
        
        <ConfirmationDialog
          open={isDeleteDialogOpen}
          onOpenChange={(open) => setIsDeleteDialogOpen(open)}
          onConfirm={confirmDelete}
          title="Delete Surge Pricing"
          description={`Are you sure you want to delete this surge pricing? This action cannot be undone.`}
        />
      </CardContent>
    </Card>
  );
};

export default SurgePricing;
