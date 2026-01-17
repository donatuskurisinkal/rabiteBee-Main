import { useState, useEffect } from "react";
import { PlusCircle, FilterIcon } from "lucide-react";
import { toast } from "sonner";

import { DataTable } from "@/components/admin/DataTable";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { PaginationComponent } from "@/components/admin/Pagination";
import { StatusBadge } from "@/components/admin/StatusBadge";
import ScreenForm from "@/components/admin/screens/ScreenForm";
import { ConfirmationDialog } from "@/components/admin/ConfirmationDialog";
import { Switch } from "@/components/ui/switch";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { 
  getScreensPaginated,
  updateScreenStatus,
  deleteScreen
} from "@/integrations/supabase/screenFunctions";
import { ScreenWithCount } from "@/integrations/supabase/screen-types";
import { useTenant } from "@/contexts/TenantContext";

export default function Screens() {
  // State variables
  const [screens, setScreens] = useState<ScreenWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [pageSize] = useState(10);
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [currentScreen, setCurrentScreen] = useState<ScreenWithCount | null>(null);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);
  
  const { tenants, selectedTenant } = useTenant();

  // Set initial tenant filter from context
  useEffect(() => {
    if (selectedTenant) {
      setSelectedTenantId(selectedTenant.id);
    }
  }, [selectedTenant]);

  // Load screens with pagination
  const loadScreens = async () => {
    setLoading(true);
    try {
      const screensData = await getScreensPaginated(currentPage, pageSize, selectedTenantId);
      if (screensData && screensData.length > 0) {
        setScreens(screensData);
        // Set total items from the first row (all rows have the same total_count)
        setTotalItems(screensData[0].total_count);
      } else {
        setScreens([]);
        setTotalItems(0);
      }
    } catch (error) {
      console.error("Error loading screens:", error);
      toast.error("Failed to load screens");
      setScreens([]);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  };

  // Load screens when page or tenant filter changes
  useEffect(() => {
    loadScreens();
  }, [currentPage, selectedTenantId]);

  // Handle screen deletion
  const handleDelete = async () => {
    if (!currentScreen) return;
    
    try {
      await deleteScreen(currentScreen.id);
      toast.success("Screen deleted successfully");
      loadScreens();
    } catch (error) {
      console.error("Error deleting screen:", error);
      toast.error("Failed to delete screen");
    } finally {
      setOpenDeleteDialog(false);
      setCurrentScreen(null);
    }
  };

  // Handle status toggle
  const handleToggleStatus = async (screen: ScreenWithCount) => {
    try {
      await updateScreenStatus(screen.id, !screen.is_active);
      toast.success(`Screen ${!screen.is_active ? "activated" : "deactivated"} successfully`);
      loadScreens();
    } catch (error) {
      console.error("Error updating screen status:", error);
      toast.error("Failed to update screen status");
    }
  };

  // Find tenant name by ID
  const getTenantName = (tenantId: string | null | undefined) => {
    if (!tenantId) return "Global";
    const tenant = tenants.find(t => t.id === tenantId);
    return tenant ? tenant.name : "Unknown";
  };

  // Handle edit screen
  const handleEditScreen = (screen: ScreenWithCount) => {
    console.log("Editing screen:", screen);
    setCurrentScreen(screen);
    setOpenEditDialog(true);
  };

  // Table columns definition
  const columns = [
    { 
      key: "name", 
      title: "Name",
      render: (row: ScreenWithCount) => row.name
    },
    { 
      key: "is_active", 
      title: "Status",
      render: (row: ScreenWithCount) => (
        <StatusBadge isActive={row.is_active} />
      )
    },
    {
      key: "is_maintenance_mode",
      title: "Maintenance Mode",
      render: (row: ScreenWithCount) => (
        <StatusBadge 
          isActive={row.is_maintenance_mode}
          showSwitch={false}
        />
      )
    },
    { 
      key: "display_order", 
      title: "Display Order",
      render: (row: ScreenWithCount) => row.display_order
    },
    {
      key: "tenant_id",
      title: "Tenant",
      render: (row: ScreenWithCount) => getTenantName(row.tenant_id)
    },
    { 
      key: "toggle_status", 
      title: "Active/Inactive",
      render: (row: ScreenWithCount) => (
        <Switch 
          checked={row.is_active} 
          onCheckedChange={() => handleToggleStatus(row)}
        />
      )
    },
  ];

  // Handle pagination change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Screens</h1>
        <Button onClick={() => setOpenCreateDialog(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Screen
        </Button>
      </div>

      {/* Tenant filter */}
      <div className="mb-6">
        <div className="flex items-center space-x-2 mb-2">
          <FilterIcon className="h-4 w-4" />
          <span className="font-medium">Filter by Tenant:</span>
        </div>
        <Select
          value={selectedTenantId || "all"}
          onValueChange={(value) => setSelectedTenantId(value === "all" ? null : value)}
        >
          <SelectTrigger className="w-[250px]">
            <SelectValue placeholder="Select a tenant" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tenants</SelectItem>
            {tenants.map((tenant) => (
              <SelectItem key={tenant.id} value={tenant.id}>
                {tenant.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Data table */}
      <DataTable
        columns={columns}
        data={screens}
        isLoading={loading}
        onEdit={handleEditScreen}
        onDelete={(screen) => {
          setCurrentScreen(screen as ScreenWithCount);
          setOpenDeleteDialog(true);
        }}
      />
      
      {/* Pagination */}
      {totalItems > 0 && (
        <div className="mt-4">
          <PaginationComponent
            currentPage={currentPage}
            totalPages={Math.ceil(totalItems / pageSize)}
            onPageChange={handlePageChange}
          />
        </div>
      )}
      
      {/* Create dialog */}
      <Dialog open={openCreateDialog} onOpenChange={setOpenCreateDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogTitle>Create Screen</DialogTitle>
          <ScreenForm onSaved={() => {
            setOpenCreateDialog(false);
            loadScreens();
          }} />
        </DialogContent>
      </Dialog>
      
      {/* Edit dialog */}
      <Dialog open={openEditDialog} onOpenChange={setOpenEditDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogTitle>Edit Screen</DialogTitle>
          {currentScreen && (
            <ScreenForm 
              screen={currentScreen} 
              onSaved={() => {
                setOpenEditDialog(false);
                loadScreens();
                setCurrentScreen(null);
              }} 
            />
          )}
        </DialogContent>
      </Dialog>
      
      {/* Delete confirmation dialog */}
      <ConfirmationDialog
        open={openDeleteDialog}
        onOpenChange={setOpenDeleteDialog}
        onConfirm={handleDelete}
        title="Delete Screen"
        description={`Are you sure you want to delete "${currentScreen?.name}"? This action cannot be undone.`}
      />
    </div>
  );
}
