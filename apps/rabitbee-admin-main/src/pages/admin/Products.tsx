
import { useState } from "react";
import { DataTable } from "@/components/admin/DataTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import ProductForm from "@/components/admin/products/ProductForm";
import { ConfirmationDialog } from "@/components/admin/ConfirmationDialog";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { useTenant } from "@/hooks/use-tenant";
import { Pagination } from "@/components/admin/Pagination";
import { ensureStorageBucket } from "@/utils/storageHelpers";
import { useEffect } from "react";

interface Tag {
  id: string;
  name: string;
  color: string;
}

interface ProductTag {
  tag_id: string;
  tags: Tag;
}

interface Product {
  id: string;
  name: string;
  name_ml?: string;
  category_id: string;
  category?: { id?: string; name: string };
  provider_id: string;
  provider?: { id?: string; name: string };
  unit_id: string;
  unit?: { name: string; abbreviation: string };
  price: number;
  offer_price: number | null;
  stock_quantity: number;
  discount_percent: number;
  is_active: boolean;
  is_combo: boolean;
  is_popular: boolean;
  is_flash: boolean;
  coming_soon?: boolean;
  image_url: string | null;
  tags: ProductTag[] | string[];
}

const Products = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const { selectedTenant } = useTenant();

  // Initialize the storage bucket when the page loads
  useEffect(() => {
    const initStorage = async () => {
      try {
        await ensureStorageBucket("products");
        console.log("Products storage bucket is ready");
      } catch (error) {
        console.error("Failed to initialize products storage bucket:", error);
      }
    };
    
    initStorage();
  }, []);

  const { data: productsData, isLoading, refetch } = useQuery({
    queryKey: ["admin-products", selectedTenant?.id, page, pageSize, searchTerm],
    queryFn: async () => {
      if (!selectedTenant?.id) {
        throw new Error("No tenant selected");
      }

      console.log("Fetching products with tenant ID:", selectedTenant.id, "Page:", page);
      
      const query = supabase
        .from("products")
        .select(`
          id,
          name,
          name_ml,
          category_id,
          category:category_id (
            id,
            name
          ),
          provider_id,
          provider:provider_id (
            id,
            name
          ),
          price,
          offer_price,
          unit_id,
          unit:unit_id (
            name,
            abbreviation
          ),
          stock_quantity,
          discount_percent,
          tags,
          is_active,
          coming_soon,
          is_popular,
          is_flash,
          image_url,
          is_combo
        `)
        .eq("tenant_id", selectedTenant.id)
        .order("created_at", { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1);
      
      if (searchTerm) {
        query.ilike("name", `%${searchTerm}%`);
      }

      const { data: products, error } = await query;

      if (error) {
        console.error("Error fetching products:", error);
        toast({
          variant: "destructive",
          title: "Error fetching products",
          description: error.message,
        });
        throw error;
      }

      // Count total products for pagination
      const countQuery = supabase
        .from("products")
        .select("id", { count: "exact" })
        .eq("tenant_id", selectedTenant.id);

      if (searchTerm) {
        countQuery.ilike("name", `%${searchTerm}%`);
      }

      const { count, error: countError } = await countQuery;
      
      if (countError) {
        console.error("Error counting products:", countError);
      }

      const totalCount = count || 0;
      const totalPages = Math.ceil(totalCount / pageSize);

      // Make sure we map the returned data to our expected Product interface
      const mappedProducts: Product[] = (products || []).map(product => ({
        id: product.id,
        name: product.name,
        name_ml: product.name_ml,
        category_id: product.category_id,
        category: product.category,
        provider_id: product.provider_id,
        provider: product.provider,
        unit_id: product.unit_id,
        unit: product.unit,
        price: product.price,
        offer_price: product.offer_price,
        stock_quantity: product.stock_quantity,
        discount_percent: product.discount_percent,
        is_active: product.is_active,
        coming_soon: product.coming_soon,
        is_popular: product.is_popular,
        is_flash: product.is_flash,
        image_url: product.image_url,
        is_combo: product.is_combo,
        tags: product.tags || []
      }));

      return {
        data: mappedProducts,
        pagination: {
          currentPage: page,
          pageSize,
          totalItems: totalCount,
          totalPages
        }
      };
    },
    enabled: !!selectedTenant?.id
  });

  const handleDelete = async (product: Product) => {
    setSelectedProduct(product);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedProduct) return;

    try {
      if (selectedProduct.image_url) {
        const imagePath = `products/${selectedProduct.id}/main.jpg`;
        const { error: storageError } = await supabase.storage
          .from('products')
          .remove([imagePath]);
        
        if (storageError) {
          console.error("Error deleting image:", storageError);
        }
      }

      if (selectedProduct.is_combo) {
        await supabase
          .from("product_combos")
          .delete()
          .eq("combo_product_id", selectedProduct.id);
      }

      await supabase
        .from("product_combos")
        .delete()
        .eq("item_product_id", selectedProduct.id);

      await supabase
        .from("product_tags")
        .delete()
        .eq("product_id", selectedProduct.id);

      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", selectedProduct.id)
        .eq("tenant_id", selectedTenant?.id);

      if (error) throw error;

      toast({
        title: "Product deleted",
        description: `${selectedProduct.name} has been deleted successfully.`,
      });

      refetch();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error deleting product",
        description: error.message,
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setSelectedProduct(null);
    }
  };

  const handleEdit = (product: Product) => {
    console.log("Editing product:", product);
    setSelectedProduct(product);
    setIsEditModalOpen(true);
  };

  const handleAdd = () => {
    setSelectedProduct(null);
    setIsAddModalOpen(true);
  };

  const handleSuccess = () => {
    refetch();
    setIsAddModalOpen(false);
    setIsEditModalOpen(false);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setPage(1); // Reset to first page on search
  };

  const columns = [
    {
      key: "name",
      title: "Name",
      render: (row: Product) => row.name || "N/A",
    },
    {
      key: "image",
      title: "Image",
      render: (row: Product) => (
        <div className="flex items-center justify-center">
          {row.image_url ? (
            <img
              src={row.image_url}
              alt={row.name}
              className="h-10 w-10 rounded-full object-cover"
            />
          ) : (
            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
              N/A
            </div>
          )}
        </div>
      ),
    },
    {
      key: "category",
      title: "Category",
      render: (row: Product) => row.category?.name || "N/A",
    },
    {
      key: "price",
      title: "Price",
      render: (row: Product) => `₹${row.price.toFixed(2)}`,
    },
    {
      key: "offer_price",
      title: "Offer Price",
      render: (row: Product) => row.offer_price ? `₹${row.offer_price.toFixed(2)}` : "-",
    },
    {
      key: "stock",
      title: "Stock",
      render: (row: Product) => row.stock_quantity || 0,
    },
    {
      key: "is_popular",
      title: "Popular",
      render: (row: Product) => (
        <StatusBadge
          isActive={row.is_popular}
          showSwitch={false}
        />
      ),
    },
    {
      key: "is_flash",
      title: "Flash Deal",
      render: (row: Product) => (
        <StatusBadge
          isActive={row.is_flash}
          showSwitch={false}
        />
      ),
    },
    {
      key: "is_combo",
      title: "Combo",
      render: (row: Product) => (
        <StatusBadge
          isActive={row.is_combo}
          showSwitch={false}
        />
      ),
    },
    {
      key: "is_active",
      title: "Status",
      render: (row: Product) => (
        <StatusBadge
          isActive={row.is_active}
          showSwitch={false}
        />
      ),
    },
  ];

  const paginationData = productsData?.pagination || {
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    pageSize: 10,
  };

  return (
    <Card>
      <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <CardTitle>Products</CardTitle>
        <Button onClick={handleAdd} className="self-start md:self-auto">
          <Plus className="h-4 w-4 mr-2" />
          Add Product
        </Button>
      </CardHeader>
      <CardContent>
        <DataTable
          data={productsData?.data || []}
          columns={columns}
          isLoading={isLoading}
          onEdit={handleEdit}
          onDelete={handleDelete}
          searchPlaceholder="Search products..."
          onSearch={handleSearch}
        />
        
        {productsData && productsData.pagination.totalPages > 1 && (
          <div className="mt-4 flex justify-center">
            <Pagination
              currentPage={paginationData.currentPage}
              totalPages={paginationData.totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        )}
        
        {isAddModalOpen && (
          <ProductForm
            isOpen={isAddModalOpen}
            onClose={() => setIsAddModalOpen(false)}
            onSuccess={handleSuccess}
          />
        )}
        
        {isEditModalOpen && selectedProduct && (
          <ProductForm
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            onSuccess={handleSuccess}
            product={selectedProduct}
          />
        )}
        
        <ConfirmationDialog
          open={isDeleteDialogOpen}
          onOpenChange={(open) => setIsDeleteDialogOpen(open)}
          onConfirm={confirmDelete}
          title="Delete Product"
          description={`Are you sure you want to delete ${selectedProduct?.name}? This action cannot be undone.`}
        />
      </CardContent>
    </Card>
  );
};

export default Products;
