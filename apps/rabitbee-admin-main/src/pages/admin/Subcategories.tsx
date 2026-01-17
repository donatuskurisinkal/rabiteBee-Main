
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { DataTable } from "@/components/admin/DataTable";
import { ConfirmationDialog } from "@/components/admin/ConfirmationDialog";
import { supabase } from "@/integrations/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  category_id: z.string().uuid("Please select a category"),
});

type FormValues = z.infer<typeof formSchema>;

interface Subcategory {
  id: string;
  name: string;
  category_id: string;
  created_at: string;
  updated_at: string | null;
  category_name?: string;
}

interface Category {
  id: string;
  name: string;
}

export default function Subcategories() {
  const { user, userPermissions } = useAuth();
  const { toast } = useToast();
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingSubcategory, setEditingSubcategory] = useState<Subcategory | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    subcategory: Subcategory | null;
  }>({ open: false, subcategory: null });
  
  const canManageSubcategories = userPermissions.includes('manage_subcategories') || userPermissions.includes('manage_all');

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      category_id: "",
    },
  });

  useEffect(() => {
    fetchCategories();
    fetchSubcategories();
  }, []);

  useEffect(() => {
    if (editingSubcategory) {
      form.reset({
        name: editingSubcategory.name,
        category_id: editingSubcategory.category_id,
      });
    } else {
      form.reset({
        name: "",
        category_id: "",
      });
    }
  }, [editingSubcategory, form]);

  const fetchSubcategories = async () => {
    setIsLoading(true);
    try {
      // Join with categories table to get category names
      const { data, error } = await supabase
        .from('subcategories')
        .select(`
          *,
          categories:category_id (name)
        `)
        .order('name');

      if (error) throw error;

      const formattedData = data.map(subcategory => ({
        ...subcategory,
        category_name: subcategory.categories?.name
      }));

      setSubcategories(formattedData);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error fetching subcategories",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error fetching categories",
        description: error.message,
      });
    }
  };

  const handleSubmit = async (values: FormValues) => {
    if (!canManageSubcategories) {
      toast({
        variant: "destructive",
        title: "Permission denied",
        description: "You don't have permission to manage subcategories",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingSubcategory) {
        // Update existing subcategory
        const { error } = await supabase
          .from('subcategories')
          .update({
            name: values.name,
            category_id: values.category_id,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingSubcategory.id);

        if (error) throw error;

        toast({
          title: "Subcategory updated",
          description: `${values.name} has been updated successfully.`,
        });
      } else {
        // Create new subcategory
        const { error } = await supabase.from('subcategories').insert({
          name: values.name,
          category_id: values.category_id,
        });

        if (error) throw error;

        toast({
          title: "Subcategory created",
          description: `${values.name} has been created successfully.`,
        });
      }

      // Refresh the subcategories list
      fetchSubcategories();
      setFormOpen(false);
      setEditingSubcategory(null);
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
    if (!canManageSubcategories || !deleteDialog.subcategory) return;

    try {
      const { error } = await supabase
        .from('subcategories')
        .delete()
        .eq('id', deleteDialog.subcategory.id);

      if (error) throw error;

      toast({
        title: "Subcategory deleted",
        description: `${deleteDialog.subcategory.name} has been deleted successfully.`,
      });

      fetchSubcategories();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error deleting subcategory",
        description: error.message,
      });
    } finally {
      setDeleteDialog({ open: false, subcategory: null });
    }
  };

  const columns = [
    { key: "name", title: "Name" },
    { 
      key: "category_name", 
      title: "Category",
      render: (row: Subcategory) => row.category_name || 'Unknown'
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold tracking-tight">Subcategories Management</h1>
        <p className="text-muted-foreground">
          Manage service subcategories in the system.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Subcategories List</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={subcategories}
            columns={columns}
            onEdit={(subcategory) => {
              setEditingSubcategory(subcategory);
              setFormOpen(true);
            }}
            onDelete={(subcategory) => {
              setDeleteDialog({ open: true, subcategory });
            }}
            onAdd={() => {
              setEditingSubcategory(null);
              setFormOpen(true);
            }}
            isLoading={isLoading}
            searchPlaceholder="Search subcategories..."
            permissions={{
              canAdd: canManageSubcategories,
              canEdit: canManageSubcategories,
              canDelete: canManageSubcategories,
            }}
          />
        </CardContent>
      </Card>

      {/* Form Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingSubcategory ? "Edit Subcategory" : "Add New Subcategory"}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subcategory Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter subcategory name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="category_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setFormOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Processing...' : editingSubcategory ? 'Update' : 'Create'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmationDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}
        title="Delete Subcategory"
        description={`Are you sure you want to delete ${deleteDialog.subcategory?.name}? This action cannot be undone.`}
        onConfirm={handleDelete}
      />
    </div>
  );
}
