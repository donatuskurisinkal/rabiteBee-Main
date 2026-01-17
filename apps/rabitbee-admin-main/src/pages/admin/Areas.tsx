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
  zone_id: z.string().uuid("Please select a zone"),
  pincode: z.string().regex(/^\d{6}$/, "Pincode must be 6 digits"),
  is_active: z.boolean().default(true),
});

type FormValues = z.infer<typeof formSchema>;

interface Area {
  id: string;
  name: string;
  zone_id: string;
  pincode: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  zone_name?: string;
}

interface Zone {
  id: string;
  name: string;
  district_id: string;
}

export default function Areas() {
  const { user, userPermissions } = useAuth();
  const { toast } = useToast();
  const [areas, setAreas] = useState<Area[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingArea, setEditingArea] = useState<Area | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    area: Area | null;
  }>({ open: false, area: null });
  
  const canManageAreas = userPermissions.includes('manage_areas') || userPermissions.includes('manage_all');

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      zone_id: "",
      pincode: "",
      is_active: true,
    },
  });

  useEffect(() => {
    fetchZones();
    fetchAreas();
  }, []);

  useEffect(() => {
    if (editingArea) {
      form.reset({
        name: editingArea.name,
        zone_id: editingArea.zone_id,
        pincode: editingArea.pincode || "",
        is_active: editingArea.is_active,
      });
    } else {
      form.reset({
        name: "",
        zone_id: "",
        pincode: "",
        is_active: true,
      });
    }
  }, [editingArea, form]);

  const fetchAreas = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('areas')
        .select(`
          *,
          zones:zone_id (name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedData = data.map(area => ({
        ...area,
        zone_name: area.zones?.name
      }));

      setAreas(formattedData);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error fetching areas",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchZones = async () => {
    try {
      const { data, error } = await supabase
        .from('zones')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;
      setZones(data);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error fetching zones",
        description: error.message,
      });
    }
  };

  const handleSubmit = async (values: FormValues) => {
    if (!canManageAreas) {
      toast({
        variant: "destructive",
        title: "Permission denied",
        description: "You don't have permission to manage areas",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingArea) {
        const { error } = await supabase
          .from('areas')
          .update({
            name: values.name,
            zone_id: values.zone_id,
            pincode: values.pincode,
            is_active: values.is_active,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingArea.id);

        if (error) throw error;

        toast({
          title: "Area updated",
          description: `${values.name} has been updated successfully.`,
        });
      } else {
        const { error } = await supabase.from('areas').insert({
          name: values.name,
          zone_id: values.zone_id,
          pincode: values.pincode,
          is_active: values.is_active,
        });

        if (error) throw error;

        toast({
          title: "Area created",
          description: `${values.name} has been created successfully.`,
        });
      }

      fetchAreas();
      setFormOpen(false);
      setEditingArea(null);
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
    if (!canManageAreas || !deleteDialog.area) return;

    try {
      const { error } = await supabase
        .from('areas')
        .delete()
        .eq('id', deleteDialog.area.id);

      if (error) throw error;

      toast({
        title: "Area deleted",
        description: `${deleteDialog.area.name} has been deleted successfully.`,
      });

      fetchAreas();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error deleting area",
        description: error.message,
      });
    } finally {
      setDeleteDialog({ open: false, area: null });
    }
  };

  const handleToggleActive = async (area: Area, isActive: boolean) => {
    if (!canManageAreas) return;

    try {
      const { error } = await supabase
        .from('areas')
        .update({
          is_active: isActive,
          updated_at: new Date().toISOString(),
        })
        .eq('id', area.id);

      if (error) throw error;

      toast({
        title: isActive ? "Area activated" : "Area deactivated",
        description: `${area.name} has been ${isActive ? "activated" : "deactivated"} successfully.`,
      });

      fetchAreas();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error updating area",
        description: error.message,
      });
    }
  };

  const columns = [
    { key: "name", title: "Name" },
    { 
      key: "zone_name", 
      title: "Zone",
      render: (row: Area) => row.zone_name || 'Unknown'
    },
    { key: "pincode", title: "Pincode" },
    {
      key: "is_active",
      title: "Status",
      render: (row: Area) => (
        <StatusBadge
          isActive={row.is_active}
          onToggle={(active) => handleToggleActive(row, active)}
          disabled={!canManageAreas}
        />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold tracking-tight">Areas Management</h1>
        <p className="text-muted-foreground">
          Manage areas within zones.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Areas List</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={areas}
            columns={columns}
            onEdit={(area) => {
              setEditingArea(area);
              setFormOpen(true);
            }}
            onDelete={(area) => {
              setDeleteDialog({ open: true, area });
            }}
            onAdd={() => {
              setEditingArea(null);
              setFormOpen(true);
            }}
            isLoading={isLoading}
            searchPlaceholder="Search areas..."
            permissions={{
              canAdd: canManageAreas,
              canEdit: canManageAreas,
              canDelete: canManageAreas,
            }}
          />
        </CardContent>
      </Card>

      {/* Form Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingArea ? "Edit Area" : "Add New Area"}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Area Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter area name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="zone_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Zone</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a zone" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {zones.map((zone) => (
                          <SelectItem key={zone.id} value={zone.id}>
                            {zone.name}
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
                name="pincode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pincode</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter 6-digit pincode" {...field} />
                    </FormControl>
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
                        Set whether this area is active in the system
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
                  {isSubmitting ? 'Processing...' : editingArea ? 'Update' : 'Create'}
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
        title="Delete Area"
        description={`Are you sure you want to delete ${deleteDialog.area?.name}? This action cannot be undone.`}
        onConfirm={handleDelete}
      />
    </div>
  );
}
