
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";

export const createOfferColumns = () => {
  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "title",
      header: "Title",
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => {
        const description = row.original.description || "-";
        return description.length > 50 ? `${description.substring(0, 50)}...` : description;
      }
    },
    {
      accessorKey: "discount_percent",
      header: "Discount %",
      cell: ({ row }) => (
        <Badge variant="secondary">{row.original.discount_percent}%</Badge>
      ),
    },
    {
      accessorKey: "min_order",
      header: "Min. Order",
      cell: ({ row }) => (
        <span>₹{row.original.min_order}</span>
      ),
    },
    {
      accessorKey: "valid_from",
      header: "Valid From",
      cell: ({ row }) => {
        if (!row.original.valid_from) return <span>-</span>;
        try {
          return formatDistanceToNow(new Date(row.original.valid_from), { addSuffix: true });
        } catch (error) {
          return <span>Invalid date</span>;
        }
      },
    },
    {
      accessorKey: "valid_to",
      header: "Valid Until",
      cell: ({ row }) => {
        if (!row.original.valid_to) return <span>-</span>;
        try {
          return formatDistanceToNow(new Date(row.original.valid_to), { addSuffix: true });
        } catch (error) {
          return <span>Invalid date</span>;
        }
      },
    },
    {
      accessorKey: "is_active",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant={row.original.is_active ? "success" : "secondary"}>
          {row.original.is_active ? "Active" : "Inactive"}
        </Badge>
      ),
    },
  ];

  return columns;
};
