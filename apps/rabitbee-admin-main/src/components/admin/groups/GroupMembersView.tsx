
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Loader, User, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useTenant } from "@/contexts/TenantContext";
import { useDebounce } from "@/hooks/useDebounce";

interface GroupMemberViewProps {
  groupId: string;
  groupName?: string;
}

interface Member {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  email?: string;
  group_users_id: string;
}

export function GroupMembersView({ groupId, groupName }: GroupMemberViewProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [allMembers, setAllMembers] = useState<Member[]>([]);
  const { selectedTenant } = useTenant();
  const pageSize = 10;
  
  // Use debounced search term to avoid too many API calls
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  
  // Get group members
  const { 
    data: members, 
    isLoading, 
    refetch 
  } = useQuery({
    queryKey: ["group-members", groupId, isOpen, page, debouncedSearchTerm],
    queryFn: async () => {
      // Only fetch if dialog is open
      if (!isOpen) return { data: [], count: 0 };

      try {
        console.log("Fetching members with search:", debouncedSearchTerm);
        let query = supabase
          .from("group_users")
          .select(`
            id,
            user_id,
            users:user_id (
              id, 
              first_name, 
              last_name, 
              phone
            )
          `, { count: "exact" })
          .eq("group_id", groupId);

        // Apply search filter if provided
        if (debouncedSearchTerm) {
          query = query.or(
            `users.first_name.ilike.%${debouncedSearchTerm}%,users.last_name.ilike.%${debouncedSearchTerm}%,users.phone.ilike.%${debouncedSearchTerm}%`
          );
        }
        
        // Apply pagination
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;
        query = query.range(from, to);

        const { data, error, count } = await query;
        
        console.log("Fetched data:", data, "count:", count);
        
        if (error) throw error;
        
        // Transform response to make it easier to work with
        const transformedData = data
          .filter(item => item.users) // Filter out any null users
          .map(item => ({
            id: item.users?.id || '',
            first_name: item.users?.first_name || '',
            last_name: item.users?.last_name || '',
            phone: item.users?.phone || '',
            group_users_id: item.id
          }));
        
        return { 
          data: transformedData, 
          count: count || 0 
        };
      } catch (error) {
        console.error("Error fetching group members:", error);
        toast.error("Failed to load group members");
        return { data: [], count: 0 };
      }
    },
    enabled: isOpen
  });

  // Reset page when search term changes
  useEffect(() => {
    if (debouncedSearchTerm !== searchTerm) return; // Only reset when debounced search completes
    setPage(1);
    setAllMembers([]);
  }, [debouncedSearchTerm]);

  // Update all members when new data is fetched
  useEffect(() => {
    if (members?.data) {
      if (page === 1) {
        setAllMembers(members.data);
      } else {
        setAllMembers(prev => [...prev, ...members.data]);
      }
      
      // Check if there are more members to load
      setHasMore((allMembers.length + members.data.length) < (members.count || 0));
    }
  }, [members]);

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (!isOpen) {
      setSearchTerm("");
      setPage(1);
      setAllMembers([]);
    }
  }, [isOpen]);

  const loadMore = () => {
    setPage(prevPage => prevPage + 1);
  };

  const removeUserFromGroup = async (groupUserId: string) => {
    try {
      const { error } = await supabase
        .from("group_users")
        .delete()
        .eq("id", groupUserId);

      if (error) throw error;
      
      toast.success("User removed from group");
      refetch();
    } catch (error: any) {
      toast.error(`Failed to remove user: ${error.message}`);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <User className="h-4 w-4 mr-1" />
          View Members
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Members of {groupName || "Group"}</DialogTitle>
          <DialogDescription>
            Search and manage users in this group
          </DialogDescription>
        </DialogHeader>

        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search members..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {isLoading && page === 1 ? (
          <div className="flex justify-center items-center py-8">
            <Loader className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Loading members...</span>
          </div>
        ) : allMembers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {debouncedSearchTerm ? "No matching members found" : "No members in this group yet"}
          </div>
        ) : (
          <div className="overflow-y-auto max-h-96 border rounded-md">
            <ul className="divide-y">
              {allMembers.map((member) => (
                <li key={member.id} className="flex justify-between items-center p-3">
                  <div>
                    <div className="font-medium">{`${member.first_name} ${member.last_name}`}</div>
                    <div className="text-sm text-muted-foreground">{member.phone || "No phone"}</div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => removeUserFromGroup(member.group_users_id)}
                    className="text-destructive hover:bg-destructive/10"
                  >
                    Remove
                  </Button>
                </li>
              ))}
            </ul>
            
            {hasMore && (
              <div className="flex justify-center p-2 border-t">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={loadMore}
                  disabled={isLoading && page > 1}
                >
                  {isLoading && page > 1 ? (
                    <>
                      <Loader className="mr-2 h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    "Load More"
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
