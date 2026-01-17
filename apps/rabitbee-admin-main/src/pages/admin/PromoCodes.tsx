
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/admin/DataTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import PromoCodeForm from "@/components/admin/promo-codes/PromoCodeForm";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { useTenant } from "@/contexts/TenantContext";
import { format } from "date-fns";

export default function PromoCodes() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedPromoCode, setSelectedPromoCode] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const { selectedTenant } = useTenant();

  const {
    data: promoCodesData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["promo-codes", page, pageSize, searchTerm, selectedTenant?.id],
    queryFn: async () => {
      let query = supabase
        .from("promo_codes")
        .select(`
          *,
          screens(name),
          promocode_groups(
            group_id,
            groups(id, name)
          )
        `)
        .order("created_at", { ascending: false });

      if (selectedTenant) {
        query = query.eq("tenant_id", selectedTenant.id);
      }

      if (searchTerm) {
        query = query.ilike("code", `%${searchTerm}%`);
      }

      query = query.range((page - 1) * pageSize, page * pageSize - 1);

      const { data, error, count } = await query;

      if (error) {
        toast.error("Failed to load promo codes");
        throw error;
      }

      // Get total count
      const { count: totalCount, error: countError } = await supabase
        .from("promo_codes")
        .select("*", { count: "exact", head: true });

      if (countError) {
        throw countError;
      }

      return {
        data: data || [],
        total: totalCount || 0,
      };
    },
  });

  const columns = [
    {
      key: "code",
      title: "Code",
      render: (item: any) => <span className="font-medium">{item.code}</span>,
    },
    {
      key: "discount_value",
      title: "Discount",
      render: (item: any) => (
        <span>
          {item.discount_type === "percentage"
            ? `${item.discount_value}%`
            : `$${item.discount_value.toFixed(2)}`}
          {item.max_discount && ` (Max: $${item.max_discount.toFixed(2)})`}
        </span>
      ),
    },
    {
      key: "min_order_amount",
      title: "Min. Order",
      render: (item: any) => <span>${item.min_order_amount.toFixed(2)}</span>,
    },
    {
      key: "validity",
      title: "Valid Period",
      render: (item: any) => (
        <span>
          {format(new Date(item.start_date), "MMM d, yyyy")} -{" "}
          {format(new Date(item.end_date), "MMM d, yyyy")}
        </span>
      ),
    },
    {
      key: "screen",
      title: "Screen",
      render: (item: any) => (
        <span>{item.screens ? item.screens.name : "All Screens"}</span>
      ),
    },
    {
      key: "groups",
      title: "Groups",
      render: (item: any) => {
        if (!item.promocode_groups || item.promocode_groups.length === 0) {
          return <span className="text-muted-foreground text-sm">All users</span>;
        }
        
        const groupNames = item.promocode_groups
          .map((pg: any) => pg.groups?.name)
          .filter(Boolean);
          
        return (
          <div className="max-w-[200px] truncate" title={groupNames.join(', ')}>
            {groupNames.join(', ')}
          </div>
        );
      },
    },
    {
      key: "promo_target",
      title: "Target",
      render: (item: any) => (
        <span className="capitalize">
          {item.promo_target === "delivery" ? "Delivery Fee" : "Order"}
        </span>
      ),
    },
    {
      key: "used_count",
      title: "Usage",
      render: (item: any) => (
        <span>
          {item.used_count || 0}
          {item.usage_limit && ` / ${item.usage_limit}`}
        </span>
      ),
    },
    {
      key: "is_active",
      title: "Status",
      render: (item: any) => (
        <StatusBadge isActive={item.is_active} />
      ),
    },
  ];

  const handleSearch = (searchValue: string) => {
    setSearchTerm(searchValue);
    setPage(1);
  };

  const handleAddNew = () => {
    setSelectedPromoCode(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (item: any) => {
    setSelectedPromoCode(item);
    setIsDialogOpen(true);
  };

  const handleDelete = async (item: any) => {
    if (window.confirm(`Are you sure you want to delete promo code ${item.code}?`)) {
      try {
        const { error } = await supabase
          .from("promo_codes")
          .delete()
          .eq("id", item.id);

        if (error) {
          toast.error("Failed to delete promo code");
          throw error;
        }

        toast.success("Promo code deleted successfully");
        refetch();
      } catch (error) {
        console.error("Error deleting promo code:", error);
      }
    }
  };

  const handleFormSaved = () => {
    setIsDialogOpen(false);
    refetch();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold tracking-tight">Promo Codes</h1>
        <p className="text-muted-foreground">
          Create and manage promotional codes for your business.
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>All Promo Codes</CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleAddNew}>
                <Plus className="h-4 w-4 mr-2" />
                Add New
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <PromoCodeForm 
                promoCode={selectedPromoCode}
                onSaved={handleFormSaved}
              />
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <DataTable
            data={promoCodesData?.data || []}
            columns={columns}
            isLoading={isLoading}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onSearch={handleSearch}
            searchPlaceholder="Search promo codes..."
          />
          
          {promoCodesData?.total > pageSize && (
            <div className="mt-4 flex justify-center">
              <Button
                variant="outline"
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className="mr-2"
              >
                Previous
              </Button>
              <span className="flex items-center mx-2">
                Page {page} of{" "}
                {Math.ceil(promoCodesData.total / pageSize)}
              </span>
              <Button
                variant="outline"
                onClick={() => setPage(page + 1)}
                disabled={
                  page >= Math.ceil(promoCodesData.total / pageSize)
                }
                className="ml-2"
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
