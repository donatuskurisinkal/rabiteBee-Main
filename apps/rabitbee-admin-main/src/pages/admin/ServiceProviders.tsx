
import { useState } from "react";
import { DataTable } from "@/components/admin/DataTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useTenantQuery } from "@/hooks/useTenantQuery";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ConfirmationDialog } from "@/components/admin/ConfirmationDialog";
import { StatusBadge } from "@/components/admin/StatusBadge";
import ServiceProviderForm from "@/components/admin/service-providers/ServiceProviderForm";

interface ServiceProvider {
  id: string;
  name: string;
  address: string;
  phone_number: string;
  email: string;
  website: string;
  contact_person: string;
  commission_rate: number;
  service_fee: number;
  latitude: number;
  longitude: number;
  is_active: boolean;
  created_at: string;
}

const ServiceProviders = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedServiceProvider, setSelectedServiceProvider] =
    useState<ServiceProvider | null>(null);
  const { toast } = useToast();

  const { data: serviceProviders, isLoading, refetch } = useTenantQuery(
    ["service-providers"],
    (tenantId) => supabase.from("service_providers").select("*").order("created_at", { ascending: false })
  );

  const handleDelete = async (serviceProvider: ServiceProvider) => {
    setSelectedServiceProvider(serviceProvider);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedServiceProvider) return;

    try {
      const { error } = await supabase
        .from("service_providers")
        .delete()
        .eq("id", selectedServiceProvider.id);

      if (error) throw error;

      toast({
        title: "Service provider deleted",
        description: `${selectedServiceProvider.name} has been deleted successfully.`,
      });

      refetch();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error deleting service provider",
        description: error.message,
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setSelectedServiceProvider(null);
    }
  };

  const handleEdit = (serviceProvider: ServiceProvider) => {
    setSelectedServiceProvider(serviceProvider);
    setIsEditModalOpen(true);
  };

  const handleAdd = () => {
    setSelectedServiceProvider(null);
    setIsAddModalOpen(true);
  };

  const handleSuccess = () => {
    refetch();
    setIsAddModalOpen(false);
    setIsEditModalOpen(false);
  };

  const columns = [
    {
      key: "name",
      title: "Name",
    },
    {
      key: "address",
      title: "Address",
    },
    {
      key: "phone_number",
      title: "Phone Number",
    },
    {
      key: "email",
      title: "Email",
    },
    {
      key: "contact_person",
      title: "Contact Person",
    },
    {
      key: "commission_rate",
      title: "Commission Rate",
      render: (row: ServiceProvider) => (
        <span>{row.commission_rate}%</span>
      ),
    },
    {
      key: "service_fee",
      title: "Service Fee",
      render: (row: ServiceProvider) => (
        <span>₹{row.service_fee}</span>
      ),
    },
    {
      key: "is_active",
      title: "Status",
      render: (row: ServiceProvider) => (
        <StatusBadge isActive={row.is_active} />
      ),
    },
  ];

  return (
    <Card>
      <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <CardTitle>Service Providers</CardTitle>
        <Button onClick={handleAdd} className="self-start md:self-auto">
          <Plus className="h-4 w-4 mr-2" />
          Add Service Provider
        </Button>
      </CardHeader>
      <CardContent>
        <DataTable
          data={serviceProviders || []}
          columns={columns}
          isLoading={isLoading}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />

        {isAddModalOpen && (
          <ServiceProviderForm
            open={isAddModalOpen}
            onOpenChange={setIsAddModalOpen}
            onSuccess={handleSuccess}
          />
        )}

        {isEditModalOpen && selectedServiceProvider && (
          <ServiceProviderForm
            open={isEditModalOpen}
            onOpenChange={setIsEditModalOpen}
            serviceProvider={selectedServiceProvider}
            onSuccess={handleSuccess}
          />
        )}

        <ConfirmationDialog
          open={isDeleteDialogOpen}
          onOpenChange={(open) => setIsDeleteDialogOpen(open)}
          onConfirm={confirmDelete}
          title="Delete Service Provider"
          description={`Are you sure you want to delete ${selectedServiceProvider?.name}? This action cannot be undone.`}
        />
      </CardContent>
    </Card>
  );
};

export default ServiceProviders;
