
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface MenuItem {
  id: string;
  name: string;
  description?: string;
  subtitle?: string;
  price: number;
  category_id?: string;
  restaurant_id?: string;
  offer_price?: number;
  discount_percent?: number;
  is_veg: boolean;
  is_customisable: boolean;
  is_popular: boolean;
  is_sold_out: boolean;
  available: boolean;
  preparation_time?: number;
  image_url?: string;
  quantity_label?: string;
  rating_value?: number;
  rating_count?: number;
  availability_window?: string;
  unavailable_reason?: string;
  iscombo?: boolean;
  combo_description?: string[];
  created_at: string;
  updated_at: string;
  addons?: ItemAddon[];
}

export interface ItemAddon {
  id: string;
  name: string;
  price: number;
  is_mandatory: boolean;
  is_default: boolean;
  menu_item_id: string;
}

// Define the column type explicitly
export const menuItemColumns: ColumnDef<MenuItem>[] = [
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "restaurant_id",
    header: "Restaurant",
    cell: ({ row }) => {
      const { data: restaurant } = useQuery({
        queryKey: ['restaurant', row.original.restaurant_id],
        queryFn: async () => {
          if (!row.original.restaurant_id) return null;
          
          const { data, error } = await supabase
            .from('restaurants')
            .select('name')
            .eq('id', row.original.restaurant_id)
            .single();
          
          if (error) throw error;
          return data;
        },
        enabled: !!row.original.restaurant_id
      });
      
      return restaurant?.name || '-';
    },
  },
  {
    accessorKey: "price",
    header: "Price",
    cell: ({ row }) => (
      <span>₹{row.original.price}</span>
    ),
  },
  {
    accessorKey: "is_veg",
    header: "Type",
    cell: ({ row }) => (
      <Badge variant={row.original.is_veg ? "success" : "secondary"}>
        {row.original.is_veg ? "Veg" : "Non-veg"}
      </Badge>
    ),
  },
  {
    accessorKey: "is_customisable",
    header: "Customizable",
    cell: ({ row }) => (
      <Badge variant={row.original.is_customisable ? "outline" : "secondary"}>
        {row.original.is_customisable ? "Yes" : "No"}
      </Badge>
    ),
  },
  {
    accessorKey: "is_popular",
    header: "Popular",
    cell: ({ row }) => (
      <Badge variant={row.original.is_popular ? "default" : "secondary"}>
        {row.original.is_popular ? "Yes" : "No"}
      </Badge>
    ),
  },
  {
    accessorKey: "available",
    header: "Status",
    cell: ({ row }) => (
      <div className="flex gap-1">
        <Badge variant={row.original.available ? "success" : "destructive"}>
          {row.original.available ? "Available" : "Unavailable"}
        </Badge>
        {row.original.is_sold_out && (
          <Badge variant="outline">Sold Out</Badge>
        )}
      </div>
    ),
  },
  {
    accessorKey: "rating_value",
    header: "Rating",
    cell: ({ row }) => (
      row.original.rating_value ? (
        <span className="flex items-center gap-1">
          ⭐ {row.original.rating_value} ({row.original.rating_count || 0})
        </span>
      ) : '-'
    ),
  },
  {
    accessorKey: "availability_window",
    header: "Availability",
    cell: ({ row }) => (
      <Badge variant="outline">
        {row.original.availability_window || 'All Day'}
      </Badge>
    ),
  },
];
