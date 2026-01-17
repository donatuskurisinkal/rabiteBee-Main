
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useTenant } from "@/contexts/TenantContext";
import { DataTable } from "@/components/admin/DataTable";
import { ConfirmationDialog } from "@/components/admin/ConfirmationDialog";
import { supabase } from "@/integrations/supabase/client";
import { CategoryFormDialog } from "@/components/admin/categories/CategoryFormDialog";
import { createCategoryColumns } from "@/components/admin/categories/categoryColumns";

interface Category {
  id: string;
  name: string;
  is_active: boolean;
  icon_name: string;
  icon_family: string;
  display_order: number;
  color?: string;
}

export default function Categories() {
  const { user, userPermissions } = useAuth();
  const { selectedTenant } = useTenant();
  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    category: Category | null;
  }>({ open: false, category: null });
  
  const canManageCategories = userPermissions.includes('manage_categories') || userPermissions.includes('manage_all');

  useEffect(() => {
    fetchCategories();
  }, [selectedTenant]);

  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('categories')
        .select('*')
        .order('display_order', { ascending: true })
        .order('name');
      
      if (selectedTenant) {
        query = query.eq('tenant_id', selectedTenant.id);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      const categoriesWithData = (data || []).map(category => ({
        ...category,
        icon_name: category.icon_name || "",
        icon_family: category.icon_family || "",
        display_order: category.display_order || 0,
        color: category.color || ""
      }));
      
      setCategories(categoriesWithData);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error fetching categories",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (values: any) => {
    if (!canManageCategories) {
      toast({
        variant: "destructive",
        title: "Permission denied",
        description: "You don't have permission to manage categories",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingCategory) {
        const { error } = await supabase
          .from('categories')
          .update({
            name: values.name,
            is_active: values.is_active,
            icon_name: values.icon_name,
            icon_family: values.icon_family,
            color: values.color,
            display_order: values.display_order || 0,
            updated_at: new Date().toISOString(),
            tenant_id: selectedTenant?.id || null,
          })
          .eq('id', editingCategory.id);

        if (error) throw error;

        toast({
          title: "Category updated",
          description: `${values.name} has been updated successfully.`,
        });
      } else {
        const { error } = await supabase.from('categories').insert({
          name: values.name,
          is_active: values.is_active,
          icon_name: values.icon_name,
          icon_family: values.icon_family,
          color: values.color,
          display_order: values.display_order || 0,
          tenant_id: selectedTenant?.id || null,
        });

        if (error) throw error;

        toast({
          title: "Category created",
          description: `${values.name} has been created successfully.`,
        });
      }

      fetchCategories();
      setFormOpen(false);
      setEditingCategory(null);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!canManageCategories || !deleteDialog.category) return;

    try {
      const { data: subcategories, error: checkError } = await supabase
        .from('subcategories')
        .select('id')
        .eq('category_id', deleteDialog.category.id)
        .limit(1);

      if (checkError) throw checkError;

      if (subcategories && subcategories.length > 0) {
        throw new Error("Cannot delete category with related subcategories. Remove subcategories first.");
      }

      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', deleteDialog.category.id);

      if (error) throw error;

      toast({
        title: "Category deleted",
        description: `${deleteDialog.category.name} has been deleted successfully.`,
      });

      fetchCategories();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error deleting category",
        description: error.message,
      });
    } finally {
      setDeleteDialog({ open: false, category: null });
    }
  };

  const handleToggleActive = async (category: Category, isActive: boolean) => {
    if (!canManageCategories) return;

    try {
      const { error } = await supabase
        .from('categories')
        .update({
          is_active: isActive,
          updated_at: new Date().toISOString(),
        })
        .eq('id', category.id);

      if (error) throw error;

      toast({
        title: isActive ? "Category activated" : "Category deactivated",
        description: `${category.name} has been ${isActive ? "activated" : "deactivated"} successfully.`,
      });

      fetchCategories();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error updating category",
        description: error.message,
      });
    }
  };

  const columns = createCategoryColumns(canManageCategories, handleToggleActive);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold tracking-tight">Categories Management</h1>
        <p className="text-muted-foreground">
          Manage service categories in the system.
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
              canAdd: canManageCategories,
              canEdit: canManageCategories,
              canDelete: canManageCategories,
            }}
          />
        </CardContent>
      </Card>

      <CategoryFormDialog
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
        description={`Are you sure you want to delete ${deleteDialog.category?.name}? This action cannot be undone.`}
        onConfirm={handleDelete}
      />
    </div>
  );
}
