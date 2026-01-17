
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
import { StatusBadge } from "@/components/admin/StatusBadge";
import { supabase } from "@/integrations/supabase/client";
import { Switch } from "@/components/ui/switch";

const tenantFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email").optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  is_active: z.boolean().default(true),
  center_lat: z.string()
    .optional()
    .refine(val => !val || !isNaN(parseFloat(val)), {
      message: "Latitude must be a valid number"
    }),
  center_lng: z.string()
    .optional()
    .refine(val => !val || !isNaN(parseFloat(val)), {
      message: "Longitude must be a valid number"
    }),
  radius_km: z.string()
    .optional()
    .refine(val => !val || !isNaN(parseFloat(val)), {
      message: "Radius must be a valid number"
    }),
  logo_url: z.string().optional().or(z.literal("")),
  max_users: z.number().nullable(),
  max_products: z.number().nullable(),
  max_providers: z.number().nullable(),
});

type FormValues = z.infer<typeof tenantFormSchema>;

interface Tenant {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  logo_url: string | null;
  center_lat: number | null;
  center_lng: number | null;
  radius_km: number | null;
  is_active: boolean;
  created_at: string;
  max_users: number | null;
  max_products: number | null;
  max_providers: number | null;
}

export default function Tenants() {
  const { userPermissions } = useAuth();
  const { toast } = useToast();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    tenant: Tenant | null;
  }>({ open: false, tenant: null });
  
  const canManageTenants = userPermissions.includes('manage_tenants') || userPermissions.includes('manage_all');

  const form = useForm<FormValues>({
    resolver: zodResolver(tenantFormSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      address: "",
      logo_url: "",
      center_lat: "",
      center_lng: "",
      radius_km: "",
      is_active: true,
      max_users: null,
      max_products: null,
      max_providers: null,
    },
  });

  useEffect(() => {
    fetchTenants();
  }, []);

  useEffect(() => {
    if (editingTenant) {
      form.reset({
        name: editingTenant.name,
        email: editingTenant.email || "",
        phone: editingTenant.phone || "",
        address: editingTenant.address || "",
        logo_url: editingTenant.logo_url || "",
        center_lat: editingTenant.center_lat !== null ? String(editingTenant.center_lat) : "",
        center_lng: editingTenant.center_lng !== null ? String(editingTenant.center_lng) : "",
        radius_km: editingTenant.radius_km !== null ? String(editingTenant.radius_km) : "",
        is_active: editingTenant.is_active,
        max_users: editingTenant.max_users,
        max_products: editingTenant.max_products,
        max_providers: editingTenant.max_providers,
      });
    } else {
      form.reset({
        name: "",
        email: "",
        phone: "",
        address: "",
        logo_url: "",
        center_lat: "",
        center_lng: "",
        radius_km: "",
        is_active: true,
        max_users: null,
        max_products: null,
        max_providers: null,
      });
    }
  }, [editingTenant, form]);

  const fetchTenants = async () => {
    setIsLoading(true);
    try {
      console.log("Fetching tenants data...");
      const { data, error } = await supabase
        .from('tenants')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching tenants:", error);
        throw error;
      }
      
      console.log("Tenants data fetched:", data);
      const processedData = (data || []).map((tenant: any): Tenant => ({
        id: tenant.id,
        name: tenant.name,
        email: tenant.email,
        phone: tenant.phone,
        address: tenant.address,
        logo_url: tenant.logo_url,
        center_lat: tenant.center_lat,
        center_lng: tenant.center_lng,
        radius_km: tenant.radius_km,
        is_active: tenant.is_active,
        created_at: tenant.created_at,
        max_users: tenant.max_users || null,
        max_products: tenant.max_products || null,
        max_providers: tenant.max_providers || null,
      }));
      
      setTenants(processedData);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error fetching tenants",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (values: FormValues) => {
    if (!canManageTenants) {
      toast({
        variant: "destructive",
        title: "Permission denied",
        description: "You don't have permission to manage tenants",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const tenantData = {
        name: values.name,
        email: values.email || null,
        phone: values.phone || null,
        address: values.address || null,
        logo_url: values.logo_url || null,
        center_lat: values.center_lat ? parseFloat(values.center_lat) : null,
        center_lng: values.center_lng ? parseFloat(values.center_lng) : null,
        radius_km: values.radius_km ? parseFloat(values.radius_km) : null,
        is_active: values.is_active,
        max_users: values.max_users,
        max_products: values.max_products,
        max_providers: values.max_providers,
      };

      if (editingTenant) {
        const { error } = await supabase
          .from('tenants')
          .update(tenantData)
          .eq('id', editingTenant.id);

        if (error) throw error;

        toast({
          title: "Tenant updated",
          description: `${values.name} has been updated successfully.`,
        });
      } else {
        const { error } = await supabase.from('tenants').insert(tenantData);

        if (error) throw error;

        toast({
          title: "Tenant created",
          description: `${values.name} has been created successfully.`,
        });
      }

      fetchTenants();
      setFormOpen(false);
      setEditingTenant(null);
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
    if (!canManageTenants || !deleteDialog.tenant) return;

    try {
      const { error } = await supabase
        .from('tenants')
        .delete()
        .eq('id', deleteDialog.tenant.id);

      if (error) throw error;

      toast({
        title: "Tenant deleted",
        description: `${deleteDialog.tenant.name} has been deleted successfully.`,
      });

      fetchTenants();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error deleting tenant",
        description: error.message,
      });
    } finally {
      setDeleteDialog({ open: false, tenant: null });
    }
  };

  const handleToggleActive = async (tenant: Tenant, isActive: boolean) => {
    if (!canManageTenants) return;

    try {
      const { error } = await supabase
        .from('tenants')
        .update({ is_active: isActive })
        .eq('id', tenant.id);

      if (error) throw error;

      toast({
        title: isActive ? "Tenant activated" : "Tenant deactivated",
        description: `${tenant.name} has been ${isActive ? "activated" : "deactivated"} successfully.`,
      });

      fetchTenants();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error updating tenant",
        description: error.message,
      });
    }
  };

  const columns = [
    { 
      key: "name", 
      title: "Name",
      render: (row: Tenant) => row.name || 'N/A'
    },
    { 
      key: "email", 
      title: "Email",
      render: (row: Tenant) => row.email || 'N/A'
    },
    { 
      key: "phone", 
      title: "Phone",
      render: (row: Tenant) => row.phone || 'N/A'
    },
    {
      key: "is_active",
      title: "Status",
      render: (row: Tenant) => (
        <StatusBadge isActive={row.is_active} />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold tracking-tight">Tenants Management</h1>
        <p className="text-muted-foreground">
          Manage organizations and tenants in the system.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tenants List</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <p>Loading tenants...</p>
            </div>
          ) : tenants.length === 0 ? (
            <div className="flex justify-center items-center h-64">
              <p>No tenants found. Add your first tenant to get started.</p>
            </div>
          ) : (
            <DataTable
              data={tenants}
              columns={columns}
              onEdit={canManageTenants ? (tenant) => {
                setEditingTenant(tenant as Tenant);
                setFormOpen(true);
              } : undefined}
              onDelete={canManageTenants ? (tenant) => {
                setDeleteDialog({ open: true, tenant: tenant as Tenant });
              } : undefined}
              onAdd={canManageTenants ? () => {
                setEditingTenant(null);
                setFormOpen(true);
              } : undefined}
              isLoading={isLoading}
              searchPlaceholder="Search tenants..."
              permissions={{
                canAdd: canManageTenants,
                canEdit: canManageTenants,
                canDelete: canManageTenants,
              }}
            />
          )}
        </CardContent>
      </Card>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {editingTenant ? "Edit Tenant" : "Add New Tenant"}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter tenant name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter phone number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter address"
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="logo_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Logo URL (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter logo URL" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="center_lat"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Latitude (Optional)</FormLabel>
                      <FormControl>
                        <Input 
                          type="text" 
                          placeholder="e.g., 40.7128" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="center_lng"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Longitude (Optional)</FormLabel>
                      <FormControl>
                        <Input 
                          type="text" 
                          placeholder="e.g., -74.0060" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="radius_km"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Radius (km) (Optional)</FormLabel>
                      <FormControl>
                        <Input 
                          type="text" 
                          placeholder="e.g., 5" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="is_active"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Active Status</FormLabel>
                      <div className="text-sm text-muted-foreground">
                        Set whether this tenant is active in the system
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
                  {isSubmitting ? 'Processing...' : editingTenant ? 'Update' : 'Create'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <ConfirmationDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}
        title="Delete Tenant"
        description={`Are you sure you want to delete ${deleteDialog.tenant?.name}? This action cannot be undone.`}
        onConfirm={handleDelete}
      />
    </div>
  );
}
