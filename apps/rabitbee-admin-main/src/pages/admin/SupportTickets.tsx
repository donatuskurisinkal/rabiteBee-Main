import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DataTable } from "@/components/admin/DataTable";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Eye, MessageSquare, CheckCircle, XCircle, Mail, MailOpen } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useTenant } from "@/hooks/use-tenant";

const statusOptions = [
  { value: "new", label: "New", color: "bg-blue-500" },
  { value: "in_progress", label: "In Progress", color: "bg-yellow-500" },
  { value: "resolved", label: "Resolved", color: "bg-green-500" },
  { value: "closed", label: "Closed", color: "bg-gray-500" }
];

const priorityOptions = [
  { value: "low", label: "Low", color: "bg-green-500" },
  { value: "medium", label: "Medium", color: "bg-yellow-500" },
  { value: "high", label: "High", color: "bg-orange-500" },
  { value: "urgent", label: "Urgent", color: "bg-red-500" }
];

const userRoleOptions = [
  { value: "customer", label: "Customer" },
  { value: "delivery_agent", label: "Delivery Agent" },
  { value: "service_provider", label: "Service Provider" }
];

const issueCategoryOptions = [
  { value: "order_not_received", label: "Order Not Received" },
  { value: "wrong_delayed_delivery", label: "Wrong/Delayed Delivery" },
  { value: "payment_issue", label: "Payment Issue" },
  { value: "service_problem", label: "Service Problem" },
  { value: "app_bug", label: "App Bug or Technical Issue" },
  { value: "other", label: "Other" }
];

export default function SupportTickets() {
  const { selectedTenant } = useTenant();
  const queryClient = useQueryClient();
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [viewDialog, setViewDialog] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [userRoleFilter, setUserRoleFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [resolutionNotes, setResolutionNotes] = useState("");

  // Fetch support tickets with filters
  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ["support-tickets", selectedTenant?.id, statusFilter, userRoleFilter, priorityFilter],
    queryFn: async () => {
      let query = supabase
        .from("support_tickets")
        .select("*");

      // Only filter by tenant if user is not a superadmin or if a specific tenant is selected
      if (selectedTenant?.id) {
        query = query.eq("tenant_id", selectedTenant.id);
      }

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      if (userRoleFilter !== "all") {
        query = query.eq("user_role", userRoleFilter);
      }

      if (priorityFilter !== "all") {
        query = query.eq("priority", priorityFilter);
      }

      // Order by: 1. Unviewed first, 2. High priority first, 3. Newest first
      query = query.order("is_viewed", { ascending: true })
                   .order("priority", { ascending: false })
                   .order("created_at", { ascending: false });

      const { data, error } = await query;
      if (error) throw error;
      
      // Sort tickets with custom priority order
      const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
      return (data || []).sort((a, b) => {
        // First by viewed status (unviewed first)
        if (a.is_viewed !== b.is_viewed) {
          return a.is_viewed ? 1 : -1;
        }
        // Then by priority
        const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] || 0;
        const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] || 0;
        if (aPriority !== bPriority) {
          return bPriority - aPriority;
        }
        // Finally by creation date (newest first)
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
    },
    enabled: true // Remove the tenant dependency to allow superadmins to see all tickets
  });

  // Update ticket status mutation
  const updateTicketMutation = useMutation({
    mutationFn: async ({ ticketId, updates }: { ticketId: string; updates: any }) => {
      const { error } = await supabase
        .from("support_tickets")
        .update(updates)
        .eq("id", ticketId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["support-tickets"] });
      toast({
        title: "Success",
        description: "Ticket updated successfully"
      });
      setViewDialog(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleStatusUpdate = (ticketId: string, status: string) => {
    const updates: any = { status };
    
    if (status === "resolved" || status === "closed") {
      updates.resolved_at = new Date().toISOString();
      if (resolutionNotes) {
        updates.resolution_notes = resolutionNotes;
      }
    }
    
    updateTicketMutation.mutate({ ticketId, updates });
  };

  const markAsViewed = (ticketId: string) => {
    updateTicketMutation.mutate({ 
      ticketId, 
      updates: { is_viewed: true } 
    });
  };

  const handlePriorityUpdate = (ticketId: string, priority: string) => {
    updateTicketMutation.mutate({ ticketId, updates: { priority } });
  };

  const getStatusBadge = (status: string) => {
    const statusOption = statusOptions.find(s => s.value === status);
    return (
      <Badge className={`${statusOption?.color} text-white`}>
        {statusOption?.label || status}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const priorityOption = priorityOptions.find(p => p.value === priority);
    return (
      <Badge className={`${priorityOption?.color} text-white`}>
        {priorityOption?.label || priority}
      </Badge>
    );
  };

  const getCategoryLabel = (category: string) => {
    const categoryOption = issueCategoryOptions.find(c => c.value === category);
    return categoryOption?.label || category;
  };

  const getRoleLabel = (role: string) => {
    const roleOption = userRoleOptions.find(r => r.value === role);
    return roleOption?.label || role;
  };

  const columns = [
    {
      header: "Status",
      accessorKey: "is_viewed",
      cell: ({ row }: any) => (
        <div className="flex items-center gap-2">
          {row.original.is_viewed ? (
            <MailOpen className="h-4 w-4 text-muted-foreground" />
          ) : (
            <Mail className="h-4 w-4 text-primary" />
          )}
          <span className="sr-only">
            {row.original.is_viewed ? "Viewed" : "Unviewed"}
          </span>
        </div>
      )
    },
    {
      header: "Ticket ID",
      accessorKey: "id",
      cell: ({ row }: any) => (
        <div className="flex items-center gap-2">
          <span className={`font-mono text-sm ${!row.original.is_viewed ? 'font-bold' : ''}`}>
            #{row.original.id.slice(-8)}
          </span>
        </div>
      )
    },
    {
      header: "Subject",
      accessorKey: "subject",
      cell: ({ row }: any) => (
        <div className={`max-w-48 truncate ${!row.original.is_viewed ? 'font-semibold' : ''}`} 
             title={row.original.subject}>
          {row.original.subject}
        </div>
      )
    },
    {
      header: "User Role",
      accessorKey: "user_role",
      cell: ({ row }: any) => getRoleLabel(row.original.user_role)
    },
    {
      header: "Category",
      accessorKey: "issue_category",
      cell: ({ row }: any) => getCategoryLabel(row.original.issue_category)
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: ({ row }: any) => getStatusBadge(row.original.status)
    },
    {
      header: "Priority",
      accessorKey: "priority",
      cell: ({ row }: any) => getPriorityBadge(row.original.priority)
    },
    {
      header: "Created",
      accessorKey: "created_at",
      cell: ({ row }: any) => format(new Date(row.original.created_at), "MMM dd, yyyy HH:mm")
    },
    {
      header: "Actions",
      id: "actions",
      cell: ({ row }: any) => (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedTicket(row.original);
              setViewDialog(true);
              setResolutionNotes(row.original.resolution_notes || "");
              if (!row.original.is_viewed) {
                markAsViewed(row.original.id);
              }
            }}
          >
            <Eye className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <CardTitle>Support Tickets</CardTitle>
            <div className="flex items-center gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  {statusOptions.map(status => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={userRoleFilter} onValueChange={setUserRoleFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="User Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  {userRoleOptions.map(role => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  {priorityOptions.map(priority => (
                    <SelectItem key={priority.value} value={priority.value}>
                      {priority.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            data={tickets}
            columns={columns}
            isLoading={isLoading}
            searchPlaceholder="Search tickets..."
          />
        </CardContent>
      </Card>

      {/* Ticket Details Dialog */}
      <Dialog open={viewDialog} onOpenChange={setViewDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Ticket Details - #{selectedTicket?.id?.slice(-8)}
            </DialogTitle>
          </DialogHeader>
          
          {selectedTicket && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Subject</Label>
                  <p className="mt-1">{selectedTicket.subject}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">User Role</Label>
                  <p className="mt-1">{getRoleLabel(selectedTicket.user_role)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Issue Category</Label>
                  <p className="mt-1">{getCategoryLabel(selectedTicket.issue_category)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Created</Label>
                  <p className="mt-1">{format(new Date(selectedTicket.created_at), "PPp")}</p>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-muted-foreground">Description</Label>
                <div className="mt-1 p-3 bg-muted rounded-md">
                  <p className="whitespace-pre-wrap">{selectedTicket.description}</p>
                </div>
              </div>

              {selectedTicket.attachments && selectedTicket.attachments.length > 0 && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Attachments</Label>
                  <div className="mt-1 space-y-2">
                    {selectedTicket.attachments.map((attachment: any, index: number) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded">
                        <span className="text-sm">{attachment.name}</span>
                        <Button variant="outline" size="sm" asChild>
                          <a href={attachment.url} target="_blank" rel="noopener noreferrer">
                            View
                          </a>
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Current Status</Label>
                  <div className="mt-1">
                    {getStatusBadge(selectedTicket.status)}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Priority</Label>
                  <div className="mt-1">
                    {getPriorityBadge(selectedTicket.priority)}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="status-update">Update Status</Label>
                  <Select 
                    value={selectedTicket.status} 
                    onValueChange={(value) => handleStatusUpdate(selectedTicket.id, value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map(status => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="priority-update">Update Priority</Label>
                  <Select 
                    value={selectedTicket.priority} 
                    onValueChange={(value) => handlePriorityUpdate(selectedTicket.id, value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {priorityOptions.map(priority => (
                        <SelectItem key={priority.value} value={priority.value}>
                          {priority.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="resolution-notes">Resolution Notes</Label>
                <Textarea
                  id="resolution-notes"
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="Add resolution notes or internal comments..."
                  rows={4}
                />
                <Button
                  onClick={() => updateTicketMutation.mutate({
                    ticketId: selectedTicket.id,
                    updates: { resolution_notes: resolutionNotes }
                  })}
                  className="mt-2"
                  disabled={updateTicketMutation.isPending}
                >
                  Save Notes
                </Button>
              </div>

              {selectedTicket.resolution_notes && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Previous Resolution Notes</Label>
                  <div className="mt-1 p-3 bg-muted rounded-md">
                    <p className="whitespace-pre-wrap">{selectedTicket.resolution_notes}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}