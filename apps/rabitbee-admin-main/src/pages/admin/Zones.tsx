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
  district_id: z.string().uuid("Please select a district"),
  is_active: z.boolean().default(true),
});

type FormValues = z.infer<typeof formSchema>;

interface Zone {
  id: string;
  name: string;
  district_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  district_name?: string;
}

interface District {
  id: string;
  name: string;
  state_id: string;
}

export default function Zones() {
  const { user, userPermissions } = useAuth();
  const { toast } = useToast();
  const [zones, setZones] = useState<Zone[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingZone, setEditingZone] = useState<Zone | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    zone: Zone | null;
  }>({ open: false, zone: null });
  
  const canManageZones = userPermissions.includes('manage_zones') || userPermissions.includes('manage_all');

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      district_id: "",
      is_active: true,
    },
  });

  useEffect(() => {
    fetchDistricts();
    fetchZones();
  }, []);

  useEffect(() => {
    if (editingZone) {
      form.reset({
        name: editingZone.name,
        district_id: editingZone.district_id,
        is_active: editingZone.is_active,
      });
    } else {
      form.reset({
        name: "",
        district_id: "",
        is_active: true,
      });
    }
  }, [editingZone, form]);

  const fetchZones = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('zones')
        .select(`
          *,
          districts:district_id (name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedData = data.map(zone => ({
        ...zone,
        district_name: zone.districts?.name
      }));

      setZones(formattedData);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error fetching zones",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDistricts = async () => {
    try {
      const { data, error } = await supabase
        .from('districts')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;
      setDistricts(data);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error fetching districts",
        description: error.message,
      });
    }
  };

  const handleSubmit = async (values: FormValues) => {
    if (!canManageZones) {
      toast({
        variant: "destructive",
        title: "Permission denied",
        description: "You don't have permission to manage zones",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingZone) {
        const { error } = await supabase
          .from('zones')
          .update({
            name: values.name,
            district_id: values.district_id,
            is_active: values.is_active,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingZone.id);

        if (error) throw error;

        toast({
          title: "Zone updated",
          description: `${values.name} has been updated successfully.`,
        });
      } else {
        const { error } = await supabase.from('zones').insert({
          name: values.name,
          district_id: values.district_id,
          is_active: values.is_active,
        });

        if (error) throw error;

        toast({
          title: "Zone created",
          description: `${values.name} has been created successfully.`,
        });
      }

      fetchZones();
      setFormOpen(false);
      setEditingZone(null);
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
    if (!canManageZones || !deleteDialog.zone) return;

    try {
      const { error } = await supabase
        .from('zones')
        .delete()
        .eq('id', deleteDialog.zone.id);

      if (error) throw error;

      toast({
        title: "Zone deleted",
        description: `${deleteDialog.zone.name} has been deleted successfully.`,
      });

      fetchZones();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error deleting zone",
        description: error.message,
      });
    } finally {
      setDeleteDialog({ open: false, zone: null });
    }
  };

  const handleToggleActive = async (zone: Zone, isActive: boolean) => {
    if (!canManageZones) return;

    try {
      const { error } = await supabase
        .from('zones')
        .update({
          is_active: isActive,
          updated_at: new Date().toISOString(),
        })
        .eq('id', zone.id);

      if (error) throw error;

      toast({
        title: isActive ? "Zone activated" : "Zone deactivated",
        description: `${zone.name} has been ${isActive ? "activated" : "deactivated"} successfully.`,
      });

      fetchZones();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error updating zone",
        description: error.message,
      });
    }
  };

  const columns = [
    { key: "name", title: "Name" },
    { 
      key: "district_name", 
      title: "District",
      render: (row: Zone) => row.district_name || 'Unknown'
    },
    {
      key: "is_active",
      title: "Status",
      render: (row: Zone) => (
        <StatusBadge
          isActive={row.is_active}
          onToggle={(active) => handleToggleActive(row, active)}
          disabled={!canManageZones}
        />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold tracking-tight">Zones Management</h1>
        <p className="text-muted-foreground">
          Manage zones within districts.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Zones List</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={zones}
            columns={columns}
            onEdit={(zone) => {
              setEditingZone(zone);
              setFormOpen(true);
            }}
            onDelete={(zone) => {
              setDeleteDialog({ open: true, zone });
            }}
            onAdd={() => {
              setEditingZone(null);
              setFormOpen(true);
            }}
            isLoading={isLoading}
            searchPlaceholder="Search zones..."
            permissions={{
              canAdd: canManageZones,
              canEdit: canManageZones,
              canDelete: canManageZones,
            }}
          />
        </CardContent>
      </Card>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingZone ? "Edit Zone" : "Add New Zone"}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Zone Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter zone name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="district_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>District</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a district" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {districts.map((district) => (
                          <SelectItem key={district.id} value={district.id}>
                            {district.name}
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
                        Set whether this zone is active in the system
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
                  {isSubmitting ? 'Processing...' : editingZone ? 'Update' : 'Create'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <ConfirmationDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}
        title="Delete Zone"
        description={`Are you sure you want to delete ${deleteDialog.zone?.name}? This action cannot be undone.`}
        onConfirm={handleDelete}
      />
    </div>
  );
}
