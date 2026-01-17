
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/admin/DataTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { GroupForm } from "@/components/admin/groups/GroupForm";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { useTenant } from "@/contexts/TenantContext";
import { GroupMembersView } from "@/components/admin/groups/GroupMembersView";

export default function Groups() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const { selectedTenant } = useTenant();

  const {
    data: groupsData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["groups", page, pageSize, searchTerm, selectedTenant?.id],
    queryFn: async () => {
      console.log("Fetching groups data...");
      let query = supabase
        .from("groups")
        .select("*, group_users(user_id)")
        .order("created_at", { ascending: false });

      if (selectedTenant) {
        query = query.eq("tenant_id", selectedTenant.id);
      }

      if (searchTerm) {
        query = query.ilike("name", `%${searchTerm}%`);
      }

      // Calculate pagination range
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      
      query = query.range(from, to);

      const { data, error } = await query;

      if (error) {
        toast.error("Failed to load groups");
        throw error;
      }

      // Get total count with same filters but without pagination
      let countQuery = supabase
        .from("groups")
        .select("id", { count: "exact", head: true });

      if (selectedTenant) {
        countQuery = countQuery.eq("tenant_id", selectedTenant.id);
      }

      if (searchTerm) {
        countQuery = countQuery.ilike("name", `%${searchTerm}%`);
      }

      const { count, error: countError } = await countQuery;

      if (countError) {
        throw countError;
      }

      return {
        data: data || [],
        total: count || 0,
      };
    },
  });

  const columns = [
    {
      key: "name",
      title: "Name",
      render: (item: any) => <span className="font-medium">{item.name}</span>,
    },
    {
      key: "description",
      title: "Description",
      render: (item: any) => <span>{item.description || "-"}</span>,
    },
    {
      key: "users",
      title: "Users",
      render: (item: any) => (
        <div className="flex items-center space-x-2">
          <span>{item.group_users ? item.group_users.length : 0}</span>
          <GroupMembersView groupId={item.id} groupName={item.name} />
        </div>
      ),
    },
    {
      key: "status",
      title: "Status",
      render: (item: any) => (
        <StatusBadge 
          isActive={item.is_active} 
          onToggle={async (active) => {
            try {
              const { error } = await supabase
                .from("groups")
                .update({ is_active: active })
                .eq("id", item.id);
                
              if (error) throw error;
              toast.success(`Group ${active ? 'activated' : 'deactivated'}`);
              refetch();
            } catch (error) {
              console.error("Error updating group status:", error);
              toast.error("Failed to update group status");
            }
          }}
        />
      ),
    },
    {
      key: "created_at",
      title: "Created",
      render: (item: any) => (
        <span>
          {item.created_at
            ? new Date(item.created_at).toLocaleDateString()
            : "-"}
        </span>
      ),
    }
  ];

  const handleSearch = (searchValue: string) => {
    setSearchTerm(searchValue);
    setPage(1);
  };

  const handleAddNew = () => {
    setSelectedGroup(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (item: any) => {
    setSelectedGroup(item);
    setIsDialogOpen(true);
  };

  const handleDelete = async (item: any) => {
    if (window.confirm(`Are you sure you want to delete group ${item.name}?`)) {
      try {
        const { error } = await supabase
          .from("groups")
          .delete()
          .eq("id", item.id);

        if (error) {
          toast.error("Failed to delete group");
          throw error;
        }

        toast.success("Group deleted successfully");
        refetch();
      } catch (error) {
        console.error("Error deleting group:", error);
      }
    }
  };

  const handleFormSaved = () => {
    setIsDialogOpen(false);
    refetch();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold tracking-tight">Groups</h1>
        <p className="text-muted-foreground">
          Create and manage user groups for your organization.
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>All Groups</CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleAddNew}>
                <Plus className="h-4 w-4 mr-2" />
                Add New Group
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <GroupForm 
                group={selectedGroup}
                onSaved={handleFormSaved}
              />
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <DataTable
            data={groupsData?.data || []}
            columns={columns}
            isLoading={isLoading}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onSearch={handleSearch}
            searchPlaceholder="Search groups..."
          />
          
          {groupsData?.total > pageSize && (
            <div className="mt-4 flex justify-center">
              <Button
                variant="outline"
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className="mr-2"
              >
                Previous
              </Button>
              <span className="flex items-center mx-2">
                Page {page} of{" "}
                {Math.ceil(groupsData.total / pageSize)}
              </span>
              <Button
                variant="outline"
                onClick={() => setPage(page + 1)}
                disabled={
                  page >= Math.ceil(groupsData.total / pageSize)
                }
                className="ml-2"
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
