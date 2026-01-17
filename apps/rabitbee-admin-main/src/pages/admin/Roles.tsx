
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
import { Checkbox } from "@/components/ui/checkbox";

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  is_system_role: z.boolean().default(false),
  permissions: z.array(z.string()).optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface Role {
  id: string;
  name: string;
  is_system_role: boolean;
  created_at: string;
  updated_at: string | null;
}

interface Permission {
  id: string;
  key: string;
  label: string;
}

interface RolePermission {
  role_id: string;
  permission_id: string;
}

export default function Roles() {
  const { user, userPermissions } = useAuth();
  const { toast } = useToast();
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [rolePermissions, setRolePermissions] = useState<Record<string, string[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    role: Role | null;
  }>({ open: false, role: null });
  
  const canManageRoles = userPermissions.includes('manage_roles') || userPermissions.includes('manage_all');

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      is_system_role: false,
      permissions: [],
    },
  });

  useEffect(() => {
    fetchRoles();
    fetchPermissions();
  }, []);

  useEffect(() => {
    if (editingRole) {
      // Get the role's permissions
      fetchRolePermissions(editingRole.id).then((permissionIds) => {
        form.reset({
          name: editingRole.name,
          is_system_role: editingRole.is_system_role,
          permissions: permissionIds,
        });
      });
    } else {
      form.reset({
        name: "",
        is_system_role: false,
        permissions: [],
      });
    }
  }, [editingRole, form]);

  const fetchRoles = async () => {
    setIsLoading(true);
    try {
      console.log("Fetching roles data...");
      const { data, error } = await supabase
        .from('roles')
        .select('*')
        .order('name');

      if (error) {
        console.error("Error fetching roles:", error);
        throw error;
      }
      
      console.log("Roles data fetched:", data);
      setRoles(data || []);
      
      // Fetch permissions for each role
      const rolePermissionsMap: Record<string, string[]> = {};
      for (const role of data || []) {
        const permissionIds = await fetchRolePermissions(role.id);
        rolePermissionsMap[role.id] = permissionIds;
      }
      setRolePermissions(rolePermissionsMap);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error fetching roles",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPermissions = async () => {
    try {
      const { data, error } = await supabase
        .from('permissions')
        .select('*')
        .order('label');

      if (error) throw error;
      setPermissions(data || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error fetching permissions",
        description: error.message,
      });
    }
  };

  const fetchRolePermissions = async (roleId: string): Promise<string[]> => {
    try {
      const { data, error } = await supabase
        .from('role_permissions')
        .select('permission_id')
        .eq('role_id', roleId);

      if (error) throw error;
      return data.map(rp => rp.permission_id);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error fetching role permissions",
        description: error.message,
      });
      return [];
    }
  };

  const handleSubmit = async (values: FormValues) => {
    if (!canManageRoles) {
      toast({
        variant: "destructive",
        title: "Permission denied",
        description: "You don't have permission to manage roles",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      let roleId: string;

      if (editingRole) {
        // Update existing role
        const { error } = await supabase
          .from('roles')
          .update({
            name: values.name,
            is_system_role: values.is_system_role,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingRole.id);

        if (error) throw error;
        roleId = editingRole.id;

        toast({
          title: "Role updated",
          description: `${values.name} has been updated successfully.`,
        });
      } else {
        // Create new role
        const { data, error } = await supabase
          .from('roles')
          .insert({
            name: values.name,
            is_system_role: values.is_system_role,
          })
          .select('id')
          .single();

        if (error) throw error;
        roleId = data.id;

        toast({
          title: "Role created",
          description: `${values.name} has been created successfully.`,
        });
      }

      // Update role permissions
      if (roleId) {
        // First, remove existing permissions
        await supabase
          .from('role_permissions')
          .delete()
          .eq('role_id', roleId);

        // Then, add new permissions
        if (values.permissions && values.permissions.length > 0) {
          const rolePermissions = values.permissions.map(permissionId => ({
            role_id: roleId,
            permission_id: permissionId,
          }));

          const { error } = await supabase
            .from('role_permissions')
            .insert(rolePermissions);

          if (error) throw error;
        }
      }

      // Refresh the roles list
      fetchRoles();
      setFormOpen(false);
      setEditingRole(null);
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
    if (!canManageRoles || !deleteDialog.role) return;

    try {
      // Check if there are users with this role
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id')
        .eq('role_id', deleteDialog.role.id)
        .limit(1);

      if (usersError) throw usersError;

      if (users && users.length > 0) {
        throw new Error("Cannot delete role that is assigned to users. Please reassign users first.");
      }

      // Delete role permissions first
      const { error: permissionsError } = await supabase
        .from('role_permissions')
        .delete()
        .eq('role_id', deleteDialog.role.id);

      if (permissionsError) throw permissionsError;

      // Delete the role
      const { error } = await supabase
        .from('roles')
        .delete()
        .eq('id', deleteDialog.role.id);

      if (error) throw error;

      toast({
        title: "Role deleted",
        description: `${deleteDialog.role.name} has been deleted successfully.`,
      });

      fetchRoles();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error deleting role",
        description: error.message,
      });
    } finally {
      setDeleteDialog({ open: false, role: null });
    }
  };

  const getPermissionCountLabel = (roleId: string): string => {
    const count = rolePermissions[roleId]?.length || 0;
    return `${count} permission${count !== 1 ? 's' : ''}`;
  };

  const columns = [
    { 
      key: "name", 
      title: "Name",
      render: (row: Role) => row.name || 'N/A'
    },
    { 
      key: "permissions", 
      title: "Permissions",
      render: (row: Role) => getPermissionCountLabel(row.id)
    },
    {
      key: "is_system_role",
      title: "System Role",
      render: (row: Role) => (
        row.is_system_role ? "Yes" : "No"
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold tracking-tight">Roles Management</h1>
        <p className="text-muted-foreground">
          Manage user roles and permissions within the system.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Roles Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <p>Loading roles...</p>
            </div>
          ) : roles.length === 0 ? (
            <div className="flex justify-center items-center h-64">
              <p>No roles found. Add your first role to get started.</p>
            </div>
          ) : (
            <DataTable
              data={roles}
              columns={columns}
              onEdit={(role) => {
                setEditingRole(role);
                setFormOpen(true);
              }}
              onDelete={(role) => {
                setDeleteDialog({ open: true, role });
              }}
              onAdd={() => {
                setEditingRole(null);
                setFormOpen(true);
              }}
              isLoading={isLoading}
              searchPlaceholder="Search roles..."
              permissions={{
                canAdd: canManageRoles,
                canEdit: canManageRoles,
                canDelete: canManageRoles,
              }}
            />
          )}
        </CardContent>
      </Card>

      {/* Form Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-[650px]">
          <DialogHeader>
            <DialogTitle>
              {editingRole ? `Edit Role: ${editingRole.name}` : "Add New Role"}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter role name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="is_system_role"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-3 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>System Role</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        System roles are reserved for internal system use.
                      </p>
                    </div>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="permissions"
                render={() => (
                  <FormItem>
                    <div className="mb-4">
                      <FormLabel className="text-base">Role Permissions</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Select the permissions for this role
                      </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border rounded-md p-4 max-h-[300px] overflow-y-auto">
                      {permissions.map((permission) => (
                        <FormField
                          key={permission.id}
                          control={form.control}
                          name="permissions"
                          render={({ field }) => {
                            return (
                              <FormItem
                                key={permission.id}
                                className="flex flex-row items-start space-x-3 space-y-0"
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(permission.id)}
                                    onCheckedChange={(checked) => {
                                      return checked
                                        ? field.onChange([...field.value || [], permission.id])
                                        : field.onChange(
                                            field.value?.filter(
                                              (value) => value !== permission.id
                                            )
                                          );
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  {permission.label}
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {permission.key}
                                  </p>
                                </FormLabel>
                              </FormItem>
                            );
                          }}
                        />
                      ))}
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
                  {isSubmitting ? 'Processing...' : editingRole ? 'Update' : 'Create'}
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
        title="Delete Role"
        description={`Are you sure you want to delete ${deleteDialog.role?.name}? This action cannot be undone.`}
        onConfirm={handleDelete}
      />
    </div>
  );
}
