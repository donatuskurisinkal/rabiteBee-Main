
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";

export const deliveryAgentColumns = [
  {
    key: "name",
    title: "Name",
    render: (agent: any) => agent.name || "N/A"
  },
  {
    key: "phone_number",
    title: "Phone",
    render: (agent: any) => agent.phone_number || "N/A"
  },
  {
    key: "status",
    title: "Status",
    render: (agent: any) => {
      const statusVariant = {
        online: "success",
        offline: "secondary",
        busy: "warning",
        on_delivery: "destructive"
      }[agent.status] || "secondary";

      return (
        <Badge variant={statusVariant}>
          {agent.status?.toUpperCase() || "OFFLINE"}
        </Badge>
      );
    }
  },
  {
    key: "vehicle_type",
    title: "Vehicle",
    render: (agent: any) => agent.vehicle_type || "N/A"
  },
  {
    key: "rating",
    title: "Rating",
    render: (agent: any) => agent.rating?.toFixed(1) || "No ratings"
  },
  {
    key: "is_online",
    title: "Online",
    render: (agent: any) => (
      <Badge variant={agent.is_online ? "success" : "secondary"}>
        {agent.is_online ? "YES" : "NO"}
      </Badge>
    )
  },
  {
    key: "last_tracked_at",
    title: "Last Seen",
    render: (agent: any) => 
      agent.last_tracked_at 
        ? formatDistanceToNow(new Date(agent.last_tracked_at), { addSuffix: true })
        : "Never"
  },
  {
    key: "is_active",
    title: "Active",
    render: (agent: any) => (
      <Badge variant={agent.is_active ? "outline" : "secondary"}>
        {agent.is_active ? "ACTIVE" : "INACTIVE"}
      </Badge>
    )
  },
];
