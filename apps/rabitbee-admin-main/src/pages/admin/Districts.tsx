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
import { Switch } from "@/components/ui/switch";

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  state_id: z.string().uuid("Please select a state"),
  is_active: z.boolean().default(true),
});

type FormValues = z.infer<typeof formSchema>;

interface District {
  id: string;
  name: string;
  state_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  state_name?: string;
}

interface State {
  id: string;
  name: string;
}

export default function Districts() {
  const { user, userPermissions } = useAuth();
  const { toast } = useToast();
  const [districts, setDistricts] = useState<District[]>([]);
  const [states, setStates] = useState<State[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingDistrict, setEditingDistrict] = useState<District | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    district: District | null;
  }>({ open: false, district: null });
  
  const canManageDistricts = userPermissions.includes('manage_districts') || userPermissions.includes('manage_all');

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      state_id: "",
      is_active: true,
    },
  });

  useEffect(() => {
    fetchStates();
    fetchDistricts();
  }, []);

  useEffect(() => {
    if (editingDistrict) {
      form.reset({
        name: editingDistrict.name,
        state_id: editingDistrict.state_id,
        is_active: editingDistrict.is_active,
      });
    } else {
      form.reset({
        name: "",
        state_id: "",
        is_active: true,
      });
    }
  }, [editingDistrict, form]);

  const fetchDistricts = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('districts')
        .select(`
          *,
          states:state_id (name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedData = data.map(district => ({
        ...district,
        state_name: district.states?.name
      }));

      setDistricts(formattedData);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error fetching districts",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStates = async () => {
    try {
      const { data, error } = await supabase
        .from('states')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;
      setStates(data);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error fetching states",
        description: error.message,
      });
    }
  };

  const handleSubmit = async (values: FormValues) => {
    if (!canManageDistricts) {
      toast({
        variant: "destructive",
        title: "Permission denied",
        description: "You don't have permission to manage districts",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingDistrict) {
        const { error } = await supabase
          .from('districts')
          .update({
            name: values.name,
            state_id: values.state_id,
            is_active: values.is_active,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingDistrict.id);

        if (error) throw error;

        toast({
          title: "District updated",
          description: `${values.name} has been updated successfully.`,
        });
      } else {
        const { error } = await supabase.from('districts').insert({
          name: values.name,
          state_id: values.state_id,
          is_active: values.is_active,
        });

        if (error) throw error;

        toast({
          title: "District created",
          description: `${values.name} has been created successfully.`,
        });
      }

      fetchDistricts();
      setFormOpen(false);
      setEditingDistrict(null);
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
    if (!canManageDistricts || !deleteDialog.district) return;

    try {
      const { error } = await supabase
        .from('districts')
        .delete()
        .eq('id', deleteDialog.district.id);

      if (error) throw error;

      toast({
        title: "District deleted",
        description: `${deleteDialog.district.name} has been deleted successfully.`,
      });

      fetchDistricts();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error deleting district",
        description: error.message,
      });
    } finally {
      setDeleteDialog({ open: false, district: null });
    }
  };

  const handleToggleActive = async (district: District, isActive: boolean) => {
    if (!canManageDistricts) return;

    try {
      const { error } = await supabase
        .from('districts')
        .update({
          is_active: isActive,
          updated_at: new Date().toISOString(),
        })
        .eq('id', district.id);

      if (error) throw error;

      toast({
        title: isActive ? "District activated" : "District deactivated",
        description: `${district.name} has been ${isActive ? "activated" : "deactivated"} successfully.`,
      });

      fetchDistricts();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error updating district",
        description: error.message,
      });
    }
  };

  const columns = [
    { key: "name", title: "Name" },
    { 
      key: "state_name", 
      title: "State",
      render: (row: District) => row.state_name || 'Unknown'
    },
    {
      key: "is_active",
      title: "Status",
      render: (row: District) => (
        <StatusBadge
          isActive={row.is_active}
          onToggle={(active) => handleToggleActive(row, active)}
          disabled={!canManageDistricts}
        />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold tracking-tight">Districts Management</h1>
        <p className="text-muted-foreground">
          Manage districts within states.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Districts List</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={districts}
            columns={columns}
            onEdit={(district) => {
              setEditingDistrict(district);
              setFormOpen(true);
            }}
            onDelete={(district) => {
              setDeleteDialog({ open: true, district });
            }}
            onAdd={() => {
              setEditingDistrict(null);
              setFormOpen(true);
            }}
            isLoading={isLoading}
            searchPlaceholder="Search districts..."
            permissions={{
              canAdd: canManageDistricts,
              canEdit: canManageDistricts,
              canDelete: canManageDistricts,
            }}
          />
        </CardContent>
      </Card>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingDistrict ? "Edit District" : "Add New District"}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>District Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter district name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="state_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>State</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a state" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {states.map((state) => (
                          <SelectItem key={state.id} value={state.id}>
                            {state.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="is_active"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Active Status</FormLabel>
                      <div className="text-sm text-muted-foreground">
                        Set whether this district is active in the system
                      </div>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
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
                  {isSubmitting ? 'Processing...' : editingDistrict ? 'Update' : 'Create'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <ConfirmationDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}
        title="Delete District"
        description={`Are you sure you want to delete ${deleteDialog.district?.name}? This action cannot be undone.`}
        onConfirm={handleDelete}
      />
    </div>
  );
}
