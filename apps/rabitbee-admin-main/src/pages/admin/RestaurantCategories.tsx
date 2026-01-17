
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { DataTable } from "@/components/admin/DataTable";
import { ConfirmationDialog } from "@/components/admin/ConfirmationDialog";
import { CategoryForm } from "@/components/admin/restaurant-categories/CategoryForm";
import { createCategoryColumns } from "@/components/admin/restaurant-categories/categoryColumns";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

interface Category {
  id: string;
  name: string;
  restaurant_id: string;
  is_active: boolean;
  is_veg_only: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
  restaurant?: {
    name: string;
  };
}

export default function RestaurantCategories() {
  const { toast } = useToast();
  const [formOpen, setFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; category: Category | null; }>({
    open: false,
    category: null
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Use regular useQuery instead of useTenantQuery
  const { data: categories = [], isLoading, refetch } = useQuery({
    queryKey: ['restaurant-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('restaurant_categories')
        .select(`
          *,
          restaurant:restaurant_id(name)
        `)
        .order('name');
      
      if (error) throw error;
      return data as Category[];
    },
  });

  const handleSubmit = async (values: any) => {
    setIsSubmitting(true);
    try {
      if (editingCategory) {
        // Update category
        const { error } = await supabase
          .from('restaurant_categories')
          .update(values)
          .eq('id', editingCategory.id);

        if (error) throw error;

        toast({
          title: "Category updated",
          description: "The category has been updated successfully."
        });
      } else {
        // Create new category
        const { error } = await supabase
          .from('restaurant_categories')
          .insert(values);

        if (error) throw error;

        toast({
          title: "Category created",
          description: "The category has been created successfully."
        });
      }
      setFormOpen(false);
      refetch();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog.category) return;
    
    try {
      const { error } = await supabase
        .from('restaurant_categories')
        .delete()
        .eq('id', deleteDialog.category.id);

      if (error) throw error;

      toast({
        title: "Category deleted",
        description: `${deleteDialog.category.name} has been deleted successfully.`
      });

      refetch();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error deleting category",
        description: error.message
      });
    } finally {
      setDeleteDialog({ open: false, category: null });
    }
  };

  const columns = createCategoryColumns();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Restaurant Categories</h1>
        <p className="text-muted-foreground">
          Manage restaurant categories and their details.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Categories List</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={categories}
            columns={columns}
            onEdit={(category) => {
              setEditingCategory(category);
              setFormOpen(true);
            }}
            onDelete={(category) => {
              setDeleteDialog({ open: true, category });
            }}
            onAdd={() => {
              setEditingCategory(null);
              setFormOpen(true);
            }}
            isLoading={isLoading}
            searchPlaceholder="Search categories..."
            permissions={{
              canAdd: true,
              canEdit: true,
              canDelete: true,
            }}
          />
        </CardContent>
      </Card>

      <CategoryForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleSubmit}
        category={editingCategory}
        isSubmitting={isSubmitting}
      />

      <ConfirmationDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}
        title="Delete Category"
        description={`Are you sure you want to delete ${deleteDialog.category?.name}? This cannot be undone.`}
        onConfirm={handleDelete}
      />
    </div>
  );
}
