
import { useState, useEffect } from "react";
import { PlusCircle } from "lucide-react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { PaginationComponent } from "@/components/admin/Pagination"; 
import { StatusBadge } from "@/components/admin/StatusBadge"; 
import { DataTable } from "@/components/admin/DataTable";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import BannerForm from "@/components/admin/banners/BannerForm";
import { ConfirmationDialog } from "@/components/admin/ConfirmationDialog";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getAllScreens, getBannersPaginated } from "@/integrations/supabase/screenFunctions";
import { BannerWithScreen, Screen } from "@/integrations/supabase/screen-types";
import { useIsMobile } from "@/hooks/use-mobile";
import { ensureStorageBucket } from "@/utils/storageHelpers";
import Lottie from "react-lottie-player";
import { Badge } from "@/components/ui/badge";
import { useTenant } from "@/hooks/use-tenant";
import { getTenantHeaders } from "@/utils/tenantHeaders";

export default function Banners() {
  // State variables
  const [banners, setBanners] = useState<BannerWithScreen[]>([]);
  const [screens, setScreens] = useState<Screen[]>([]);
  const [selectedScreen, setSelectedScreen] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [pageSize] = useState(10);
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [currentBanner, setCurrentBanner] = useState<BannerWithScreen | null>(null);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [lottieData, setLottieData] = useState<Record<string, any>>({});
  const isMobile = useIsMobile();
  const { selectedTenant } = useTenant();

  // Initialize storage bucket when the component mounts
  useEffect(() => {
    const initStorage = async () => {
      try {
        await ensureStorageBucket('banners');
      } catch (error) {
        console.error("Error initializing storage:", error);
      }
    };
    
    initStorage();
  }, []);

  // Fetch screens for filter dropdown
  useEffect(() => {
    const fetchScreens = async () => {
      try {
        const screens = await getAllScreens(selectedTenant?.id);
        setScreens(screens);
      } catch (error) {
        console.error("Error fetching screens:", error);
        toast.error("Failed to load screens");
      }
    };

    fetchScreens();
  }, [selectedTenant]);

  // Load banners with pagination and optional screen filter
  const { isLoading, refetch } = useQuery({
    queryKey: ["banners", currentPage, pageSize, selectedScreen, selectedTenant?.id],
    queryFn: async () => {
      try {
        const bannersData = await getBannersPaginated(currentPage, pageSize, selectedScreen, selectedTenant?.id);
        if (bannersData && bannersData.length > 0) {
          setBanners(bannersData);
          
          // Load Lottie data for any Lottie banners
          const lottiePromises = bannersData
            .filter(banner => banner.asset_type === 'lottie')
            .map(banner => 
              fetch(banner.image_url)
                .then(response => response.json())
                .then(data => ({ id: banner.id, data }))
                .catch(() => ({ id: banner.id, data: null }))
            );
            
          const lottieResults = await Promise.all(lottiePromises);
          const lottieDataMap: Record<string, any> = {};
          lottieResults.forEach(result => {
            if (result.data) {
              lottieDataMap[result.id] = result.data;
            }
          });
          
          setLottieData(lottieDataMap);
          
          // Set total items from the first row (all rows have the same total_count)
          setTotalItems(bannersData[0].total_count || 0);
        } else {
          setBanners([]);
          setTotalItems(0);
        }
        return bannersData;
      } catch (error) {
        console.error("Error loading banners:", error);
        toast.error("Failed to load banners");
        setBanners([]);
        setTotalItems(0);
        return [];
      }
    },
    initialData: [],
  });

  // Handle banner deletion
  const handleDelete = async () => {
    if (!currentBanner) return;
    
    try {
      const { error } = await supabase
        .from("banners")
        .delete()
        .eq("id", currentBanner.id)
        .eq("tenant_id", selectedTenant?.id || null);
      
      if (error) throw error;
      
      toast.success("Banner deleted successfully");
      refetch();
    } catch (error) {
      console.error("Error deleting banner:", error);
      toast.error("Failed to delete banner");
    } finally {
      setOpenDeleteDialog(false);
      setCurrentBanner(null);
    }
  };

  // Handle banner status toggle
  const handleToggleStatus = async (banner: BannerWithScreen) => {
    try {
      const { error } = await supabase
        .from("banners")
        .update({ is_active: !banner.is_active })
        .eq("id", banner.id)
        .eq("tenant_id", selectedTenant?.id || null);
      
      if (error) throw error;
      
      toast.success(`Banner ${!banner.is_active ? "activated" : "deactivated"} successfully`);
      refetch();
    } catch (error) {
      console.error("Error updating banner status:", error);
      toast.error("Failed to update banner status");
    }
  };

  // Handle screen filter change
  const handleScreenFilterChange = (screenId: string) => {
    setSelectedScreen(screenId === "all" ? null : screenId);
    setCurrentPage(1); // Reset to first page on filter change
  };

  // Handle creating a new banner
  const handleCreateBanner = async () => {
    setOpenCreateDialog(true);
  };

  // Table columns definition
  const columns = [
    { key: "name", title: "Name" },
    { 
      key: "asset_type", 
      title: "Asset Type",
      render: (row: BannerWithScreen) => (
        <Badge variant={row.asset_type === 'lottie' ? 'secondary' : 'default'}>
          {row.asset_type === 'lottie' ? 'Lottie' : 'Image'}
        </Badge>
      )
    },
    { 
      key: "image_url", 
      title: "Preview", 
      render: (row: BannerWithScreen) => (
        <div className="w-16 h-16 relative">
          {row.asset_type === 'lottie' && lottieData[row.id] ? (
            <Lottie
              loop
              animationData={lottieData[row.id]}
              play
              style={{ width: '100%', height: '100%' }}
            />
          ) : (
            <img 
              src={row.image_url} 
              alt={row.name} 
              className="absolute inset-0 w-full h-full object-cover rounded"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.onerror = null;
                target.src = '/placeholder.svg';
              }}
            />
          )}
        </div>
      )
    },
    { 
      key: "screen_name", 
      title: "Screen",
    },
    {
      key: "description",
      title: "Description",
      render: (row: BannerWithScreen) => (
        <div className="max-w-[200px] truncate">{row.description || "-"}</div>
      )
    },
    {
      key: "display_order",
      title: "Display Order",
    },
    { 
      key: "is_active", 
      title: "Status",
      render: (row: BannerWithScreen) => (
        <StatusBadge isActive={row.is_active} />
      )
    },
    {
      key: "actions",
      title: "Actions",
      render: (row: BannerWithScreen) => (
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => {
              setCurrentBanner(row);
              setOpenEditDialog(true);
            }}
          >
            Edit
          </Button>
          <Button 
            variant="destructive" 
            size="sm"
            onClick={() => {
              setCurrentBanner(row);
              setOpenDeleteDialog(true);
            }}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  // Handle pagination change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold">Banners</h1>
        <div className="flex flex-col md:flex-row gap-4">
          <Select
            value={selectedScreen || "all"}
            onValueChange={handleScreenFilterChange}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by Screen" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Screens</SelectItem>
              {screens.map((screen) => (
                <SelectItem key={screen.id} value={screen.id}>{screen.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleCreateBanner}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Banner
          </Button>
        </div>
      </div>

      {/* Data table */}
      <DataTable
        columns={columns}
        data={banners}
        isLoading={isLoading}
        onEdit={(banner) => {
          setCurrentBanner(banner as BannerWithScreen);
          setOpenEditDialog(true);
        }}
        onDelete={(banner) => {
          setCurrentBanner(banner as BannerWithScreen);
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
        <DialogContent className={isMobile ? "w-[95vw] max-w-lg p-4" : "sm:max-w-[500px]"}>
          <DialogTitle>Create Banner</DialogTitle>
          <BannerForm 
            onSaved={() => {
              setOpenCreateDialog(false);
              refetch();
            }}
            tenantId={selectedTenant?.id} 
          />
        </DialogContent>
      </Dialog>
      
      {/* Edit dialog */}
      <Dialog open={openEditDialog} onOpenChange={setOpenEditDialog}>
        <DialogContent className={isMobile ? "w-[95vw] max-w-lg p-4" : "sm:max-w-[500px]"}>
          <DialogTitle>Edit Banner</DialogTitle>
          <BannerForm 
            banner={currentBanner} 
            onSaved={() => {
              setOpenEditDialog(false);
              refetch();
              setCurrentBanner(null);
            }} 
            tenantId={selectedTenant?.id}
          />
        </DialogContent>
      </Dialog>
      
      {/* Delete confirmation dialog */}
      <ConfirmationDialog
        open={openDeleteDialog}
        onOpenChange={setOpenDeleteDialog}
        onConfirm={handleDelete}
        title="Delete Banner"
        description={`Are you sure you want to delete "${currentBanner?.name}"? This action cannot be undone.`}
      />
    </div>
  );
}
