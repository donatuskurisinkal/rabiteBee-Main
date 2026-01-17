
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export const createUserColumns = () => [
  {
    key: "full_name",
    title: "Name",
    render: (row: any) => {
      if (row.first_name || row.last_name) {
        return `${row.first_name || ''} ${row.last_name || ''}`.trim();
      } else if (row.user_metadata?.full_name) {
        return row.user_metadata.full_name;
      }
      return 'N/A';
    }
  },
  {
    key: "email",
    title: "Email",
    render: (row: any) => row.email || row.username || 'N/A'
  },
  {
    key: "role",
    title: "Role",
    render: (row: any) => row.role_name || row.role || 'N/A'
  },
  {
    key: "created_at",
    title: "Created",
    render: (row: any) => {
      try {
        return row.created_at ? format(new Date(row.created_at), "MMM d, yyyy") : 'N/A';
      } catch (error) {
        console.error("Date formatting error:", error);
        return 'Invalid Date';
      }
    }
  },
  {
    key: "is_active",
    title: "Status",
    render: (row: any) => (
      <Badge variant={row.isActive || row.is_active !== false ? "default" : "secondary"}>
        {row.isActive || row.is_active !== false ? "Active" : "Inactive"}
      </Badge>
    ),
  },
];
