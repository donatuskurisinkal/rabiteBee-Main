import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { formatDistanceToNow } from "date-fns";
import { ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const createRestaurantColumns = () => {
  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.name}</div>
          {row.original.subtitle && (
            <div className="text-sm text-muted-foreground">{row.original.subtitle}</div>
          )}
        </div>
      ),
    },
    {
      accessorKey: "food_type",
      header: "Food Type",
      cell: ({ row }) => {
        const foodType = row.original.food_type || 'All';
        let variant = 'default';
        
        if (foodType === 'Veg') {
          variant = 'success';
        } else if (foodType === 'Non-veg') {
          variant = 'destructive';
        }
        
        return <Badge variant={variant as any}>{foodType}</Badge>;
      },
    },
    {
      accessorKey: "is_open",
      header: "Status",
      cell: ({ row }) => (
        <div className="space-y-1">
          <Badge variant={row.original.is_open ? "success" : "secondary"}>
            {row.original.is_open ? "Open" : "Closed"}
          </Badge>
          {row.original.is_sold_out && (
            <Badge variant="destructive" className="ml-1">Sold Out</Badge>
          )}
        </div>
      ),
    },
    {
      accessorKey: "availability_window",
      header: "Availability",
      cell: ({ row }) => (
        <span className="text-sm">{row.original.availability_window || "All Day"}</span>
      ),
    },
    {
      accessorKey: "delivery_fee",
      header: "Delivery Fee",
      cell: ({ row }) => (
        <span>₹{row.original.delivery_fee || 0}</span>
      ),
    },
    {
      accessorKey: "isActive",
      header: "Active",
      cell: ({ row }) => (
        <StatusBadge 
          isActive={row.original.isActive || false} 
          showSwitch={false} 
        />
      ),
    },
    {
      accessorKey: "rating",
      header: "Rating",
      cell: ({ row }) => {
        const rating = row.original.rating;
        const ratingCount = row.original.rating_count || 0;
        
        if (rating === null || rating === undefined) {
          return <span>No ratings</span>;
        }
        
        return <span>{parseFloat(rating).toFixed(1)} ({ratingCount})</span>;
      },
    },
    {
      accessorKey: "created_at",
      header: "Created",
      cell: ({ row }) => {
        if (!row.original.created_at) return <span>-</span>;
        try {
          return formatDistanceToNow(new Date(row.original.created_at), { addSuffix: true });
        } catch (error) {
          console.error("Invalid date format:", row.original.created_at);
          return <span>Invalid date</span>;
        }
      },
    },
    {
      id: "dashboard",
      header: "Dashboard",
      cell: ({ row }) => {
        const navigate = useNavigate();
        return (
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/admin/restaurant/${row.original.id}`)}
            className="gap-2"
          >
            <ExternalLink className="h-3 w-3" />
            Open
          </Button>
        );
      },
    },
  ];

  return columns;
};
