
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
import { StatusBadge } from "@/components/admin/StatusBadge";
import { supabase } from "@/integrations/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  abbreviation: z.string().min(1, "Abbreviation is required"),
  type: z.string().min(1, "Type is required"),
});

type FormValues = z.infer<typeof formSchema>;

interface Unit {
  id: string;
  name: string;
  abbreviation: string;
  type: string;
  created_at: string;
  updated_at: string | null;
}

const UNIT_TYPES = [
  "weight",
  "volume",
  "length",
  "time",
  "quantity",
  "currency",
  "temperature",
  "other"
];

export default function Units() {
  const { user, userPermissions } = useAuth();
  const { toast } = useToast();
  const [units, setUnits] = useState<Unit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    unit: Unit | null;
  }>({ open: false, unit: null });
  
  const canManageUnits = userPermissions.includes('manage_units') || userPermissions.includes('manage_all');

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      abbreviation: "",
      type: "weight",
    },
  });

  useEffect(() => {
    fetchUnits();
  }, []);

  useEffect(() => {
    if (editingUnit) {
      form.reset({
        name: editingUnit.name,
        abbreviation: editingUnit.abbreviation,
        type: editingUnit.type,
      });
    } else {
      form.reset({
        name: "",
        abbreviation: "",
        type: "weight",
      });
    }
  }, [editingUnit, form]);

  const fetchUnits = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('units')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUnits(data || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error fetching units",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (values: FormValues) => {
    if (!canManageUnits) {
      toast({
        variant: "destructive",
        title: "Permission denied",
        description: "You don't have permission to manage units",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingUnit) {
        // Update existing unit
        const { error } = await supabase
          .from('units')
          .update({
            name: values.name,
            abbreviation: values.abbreviation,
            type: values.type,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingUnit.id);

        if (error) throw error;

        toast({
          title: "Unit updated",
          description: `${values.name} has been updated successfully.`,
        });
      } else {
        // Create new unit
        const { error } = await supabase.from('units').insert({
          name: values.name,
          abbreviation: values.abbreviation,
          type: values.type,
        });

        if (error) throw error;

        toast({
          title: "Unit created",
          description: `${values.name} has been created successfully.`,
        });
      }

      // Refresh the units list
      fetchUnits();
      setFormOpen(false);
      setEditingUnit(null);
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
    if (!canManageUnits || !deleteDialog.unit) return;

    try {
      const { error } = await supabase
        .from('units')
        .delete()
        .eq('id', deleteDialog.unit.id);

      if (error) throw error;

      toast({
        title: "Unit deleted",
        description: `${deleteDialog.unit.name} has been deleted successfully.`,
      });

      fetchUnits();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error deleting unit",
        description: error.message,
      });
    } finally {
      setDeleteDialog({ open: false, unit: null });
    }
  };

  const columns = [
    { key: "name", title: "Name" },
    { key: "abbreviation", title: "Abbreviation" },
    { key: "type", title: "Type" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold tracking-tight">Units Management</h1>
        <p className="text-muted-foreground">
          Manage measurement units in the system.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Units List</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={units}
            columns={columns}
            onEdit={(unit) => {
              setEditingUnit(unit);
              setFormOpen(true);
            }}
            onDelete={(unit) => {
              setDeleteDialog({ open: true, unit });
            }}
            onAdd={() => {
              setEditingUnit(null);
              setFormOpen(true);
            }}
            isLoading={isLoading}
            searchPlaceholder="Search units..."
            permissions={{
              canAdd: canManageUnits,
              canEdit: canManageUnits,
              canDelete: canManageUnits,
            }}
          />
        </CardContent>
      </Card>

      {/* Form Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingUnit ? "Edit Unit" : "Add New Unit"}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Kilogram" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="abbreviation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Abbreviation</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. kg" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select unit type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {UNIT_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type.charAt(0).toUpperCase() + type.slice(1)}
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
                  {isSubmitting ? 'Processing...' : editingUnit ? 'Update' : 'Create'}
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
        title="Delete Unit"
        description={`Are you sure you want to delete ${deleteDialog.unit?.name}? This action cannot be undone.`}
        onConfirm={handleDelete}
      />
    </div>
  );
}
