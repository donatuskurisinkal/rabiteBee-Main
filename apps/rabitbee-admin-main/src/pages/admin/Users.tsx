
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { DataTable } from "@/components/admin/DataTable";
import { ConfirmationDialog } from "@/components/admin/ConfirmationDialog";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { UserForm } from "@/components/admin/users/UserForm";
import { createUserColumns } from "@/components/admin/users/userColumns";

interface User {
  id: string;
  email?: string;
  created_at: string;
  updated_at: string;
  first_name: string;
  last_name: string;
  role: string;
  role_id: string;
  phone: string;
  is_verified: boolean;
  isActive: boolean;
  tenant_id: string;
  username: string;
}

export default function Users() {
  const { toast } = useToast();
  const [formOpen, setFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; user: User | null; }>({
    open: false,
    user: null
  });

  const { data: users = [], isLoading, refetch } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      console.log("Fetching users data...");
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .order('created_at', { ascending: false });
          
        if (error) {
          console.error("Error fetching users:", error);
          throw error;
        }
        
        console.log("Users data fetched:", data);
        return data as User[];
      } catch (error) {
        console.error("Failed to fetch users:", error);
        throw error;
      }
    }
  });

  const handleDelete = async () => {
    if (!deleteDialog.user) return;
    
    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', deleteDialog.user.id);

      if (error) throw error;

      toast({
        title: "User deleted",
        description: `${deleteDialog.user.email || deleteDialog.user.username} has been deleted successfully.`
      });

      refetch();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error deleting user",
        description: error.message
      });
    } finally {
      setDeleteDialog({ open: false, user: null });
    }
  };

  const columns = createUserColumns();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
        <p className="text-muted-foreground">
          Manage users and their details in the system.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Users List</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <p>Loading users...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="flex justify-center items-center h-64">
              <p>No users found. Add your first user to get started.</p>
            </div>
          ) : (
            <DataTable
              data={users}
              columns={columns}
              onEdit={(user) => {
                setEditingUser(user);
                setFormOpen(true);
              }}
              onDelete={(user) => {
                setDeleteDialog({ open: true, user });
              }}
              onAdd={() => {
                setEditingUser(null);
                setFormOpen(true);
              }}
              isLoading={isLoading}
              searchPlaceholder="Search users..."
              permissions={{
                canAdd: true,
                canEdit: true,
                canDelete: true,
              }}
            />
          )}
        </CardContent>
      </Card>

      <UserForm
        open={formOpen}
        onOpenChange={setFormOpen}
        user={editingUser}
        onSaved={refetch}
      />

      <ConfirmationDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}
        title="Delete User"
        description={`Are you sure you want to delete ${deleteDialog.user?.email || deleteDialog.user?.username}? This action cannot be undone.`}
        onConfirm={handleDelete}
      />
    </div>
  );
}
