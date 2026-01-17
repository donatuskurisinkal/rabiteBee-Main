
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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { DataTable } from "@/components/admin/DataTable";
import { ConfirmationDialog } from "@/components/admin/ConfirmationDialog";
import { supabase } from "@/integrations/supabase/client";

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().optional(),
  color: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Invalid color format (e.g. #FF5733)").optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface Tag {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
}

export default function Tags() {
  const { user, userPermissions } = useAuth();
  const { toast } = useToast();
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    tag: Tag | null;
  }>({ open: false, tag: null });
  
  const canManageTags = userPermissions.includes('manage_tags') || userPermissions.includes('manage_all');

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      color: "#3B82F6", // default to a blue color
    },
  });

  useEffect(() => {
    fetchTags();
  }, []);

  useEffect(() => {
    if (editingTag) {
      form.reset({
        name: editingTag.name,
        description: editingTag.description || "",
        color: editingTag.color || "#3B82F6",
      });
    } else {
      form.reset({
        name: "",
        description: "",
        color: "#3B82F6",
      });
    }
  }, [editingTag, form]);

  const fetchTags = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .order('name');

      if (error) throw error;
      setTags(data || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error fetching tags",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (values: FormValues) => {
    if (!canManageTags) {
      toast({
        variant: "destructive",
        title: "Permission denied",
        description: "You don't have permission to manage tags",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingTag) {
        // Update existing tag
        const { error } = await supabase
          .from('tags')
          .update({
            name: values.name,
            description: values.description || null,
            color: values.color || null,
          })
          .eq('id', editingTag.id);

        if (error) throw error;

        toast({
          title: "Tag updated",
          description: `${values.name} has been updated successfully.`,
        });
      } else {
        // Create new tag
        const { error } = await supabase.from('tags').insert({
          name: values.name,
          description: values.description || null,
          color: values.color || null,
        });

        if (error) throw error;

        toast({
          title: "Tag created",
          description: `${values.name} has been created successfully.`,
        });
      }

      // Refresh the tags list
      fetchTags();
      setFormOpen(false);
      setEditingTag(null);
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
    if (!canManageTags || !deleteDialog.tag) return;

    try {
      const { error } = await supabase
        .from('tags')
        .delete()
        .eq('id', deleteDialog.tag.id);

      if (error) throw error;

      toast({
        title: "Tag deleted",
        description: `${deleteDialog.tag.name} has been deleted successfully.`,
      });

      fetchTags();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error deleting tag",
        description: error.message,
      });
    } finally {
      setDeleteDialog({ open: false, tag: null });
    }
  };

  const columns = [
    { key: "name", title: "Name" },
    { key: "description", title: "Description" },
    {
      key: "color",
      title: "Color",
      render: (row: Tag) => (
        row.color ? (
          <div className="flex items-center">
            <div 
              className="w-6 h-6 mr-2 rounded-full border" 
              style={{ backgroundColor: row.color }}
            ></div>
            {row.color}
          </div>
        ) : 'No color'
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold tracking-tight">Tags Management</h1>
        <p className="text-muted-foreground">
          Manage tags for services and categories.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tags List</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={tags}
            columns={columns}
            onEdit={(tag) => {
              setEditingTag(tag);
              setFormOpen(true);
            }}
            onDelete={(tag) => {
              setDeleteDialog({ open: true, tag });
            }}
            onAdd={() => {
              setEditingTag(null);
              setFormOpen(true);
            }}
            isLoading={isLoading}
            searchPlaceholder="Search tags..."
            permissions={{
              canAdd: canManageTags,
              canEdit: canManageTags,
              canDelete: canManageTags,
            }}
          />
        </CardContent>
      </Card>

      {/* Form Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingTag ? "Edit Tag" : "Add New Tag"}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tag Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter tag name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter tag description (optional)" 
                        {...field} 
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Color</FormLabel>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-8 h-8 rounded-full border" 
                        style={{ backgroundColor: field.value || "#3B82F6" }}
                      ></div>
                      <FormControl>
                        <Input 
                          type="text" 
                          placeholder="#RRGGBB" 
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                    </div>
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
                  {isSubmitting ? 'Processing...' : editingTag ? 'Update' : 'Create'}
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
        title="Delete Tag"
        description={`Are you sure you want to delete ${deleteDialog.tag?.name}? This action cannot be undone.`}
        onConfirm={handleDelete}
      />
    </div>
  );
}
