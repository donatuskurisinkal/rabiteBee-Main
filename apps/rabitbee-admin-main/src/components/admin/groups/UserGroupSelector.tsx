
import { useState, useEffect } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader } from "lucide-react";
import { useTenant } from "@/contexts/TenantContext";

interface User {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
}

interface UserGroupSelectorProps {
  groupId: string;
  groupName: string;
  onUserAdded?: () => void;
}

export function UserGroupSelector({ groupId, groupName, onUserAdded }: UserGroupSelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [addingUser, setAddingUser] = useState(false);
  const { selectedTenant } = useTenant();

  // Get existing group users to check if a user is already added
  const { data: existingGroupUsers, refetch: refetchGroupUsers } = useQuery({
    queryKey: ["group-users", groupId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("group_users")
        .select("user_id")
        .eq("group_id", groupId);

      if (error) throw error;
      return data.map(item => item.user_id);
    },
    enabled: open // Only fetch when dialog is open
  });

  // Search for users based on search term
  const { data: users, isLoading: searchLoading } = useQuery({
    queryKey: ["users-search", debouncedSearchTerm, selectedTenant?.id],
    queryFn: async () => {
      if (!debouncedSearchTerm || debouncedSearchTerm.length < 2) return [];

      let query = supabase
        .from("users")
        .select("id, first_name, last_name, phone")
        .order("first_name", { ascending: true });

      if (selectedTenant) {
        query = query.eq("tenant_id", selectedTenant.id);
      }

      // Search by name or phone
      query = query.or(`first_name.ilike.%${debouncedSearchTerm}%,last_name.ilike.%${debouncedSearchTerm}%,phone.ilike.%${debouncedSearchTerm}%`);

      const { data, error } = await query;

      if (error) throw error;
      return data as User[];
    },
    enabled: debouncedSearchTerm.length >= 2 && open
  });

  // Reset search and selection when dialog closes
  useEffect(() => {
    if (!open) {
      setSearchTerm("");
      setSelectedUsers([]);
    }
  }, [open]);

  const isUserInGroup = (userId: string) => {
    return existingGroupUsers?.includes(userId);
  };

  const handleAddUser = async (userId: string) => {
    if (isUserInGroup(userId)) {
      toast.info("User is already in this group");
      return;
    }

    try {
      setAddingUser(true);
      
      const { error } = await supabase
        .from("group_users")
        .insert({
          group_id: groupId,
          user_id: userId,
          tenant_id: selectedTenant?.id
        });

      if (error) throw error;
      
      toast.success("User added to group successfully");
      refetchGroupUsers();
      
      if (onUserAdded) {
        onUserAdded();
      }
    } catch (error: any) {
      toast.error(`Failed to add user: ${error.message}`);
    } finally {
      setAddingUser(false);
    }
  };

  const getFullName = (user: User) => {
    return `${user.first_name} ${user.last_name}`;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Add Users
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Add Users to Group: {groupName}</DialogTitle>
        </DialogHeader>

        <div className="relative mb-4">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or phone number..."
            type="search"
            className="w-full pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="overflow-y-auto max-h-96 border rounded-md">
          {searchLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">Searching users...</span>
            </div>
          ) : !debouncedSearchTerm || debouncedSearchTerm.length < 2 ? (
            <div className="p-4 text-center text-muted-foreground">
              Enter at least 2 characters to search
            </div>
          ) : users && users.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              No users found matching "{debouncedSearchTerm}"
            </div>
          ) : (
            <ul className="divide-y">
              {users?.map((user) => {
                const isInGroup = isUserInGroup(user.id);
                return (
                  <li 
                    key={user.id}
                    className={`flex justify-between items-center p-3 hover:bg-muted/50 ${isInGroup ? 'bg-muted/20' : ''}`}
                  >
                    <div>
                      <div className="font-medium">{getFullName(user)}</div>
                      <div className="text-sm text-muted-foreground">{user.phone || "No phone"}</div>
                    </div>
                    <Button
                      size="sm"
                      variant={isInGroup ? "outline" : "default"}
                      disabled={isInGroup || addingUser}
                      onClick={() => handleAddUser(user.id)}
                    >
                      {isInGroup ? "Added" : "Add"}
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
