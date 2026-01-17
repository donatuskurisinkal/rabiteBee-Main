
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface Category {
  id: string;
  name: string;
  is_active: boolean;
  restaurant_id: string;
  display_order: number;
  icon_url?: string;
  is_veg_only?: boolean;
  restaurant?: {
    name: string;
  }
}

export const createCategoryColumns = () => {
  return [
    {
      key: "icon",
      title: "Icon",
      render: (row: Category) => (
        <Avatar className="h-10 w-10">
          {row.icon_url ? (
            <AvatarImage src={row.icon_url} alt={row.name} />
          ) : (
            <AvatarFallback>{row.name.substring(0, 2).toUpperCase()}</AvatarFallback>
          )}
        </Avatar>
      ),
    },
    { 
      key: "name", 
      title: "Name",
      render: (row: Category) => row.name
    },
    { 
      key: "restaurant_id", 
      title: "Restaurant",
      render: (row: Category) => row.restaurant?.name || "N/A" 
    },
    { 
      key: "display_order", 
      title: "Display Order",
      render: (row: Category) => row.display_order.toString()
    },
    {
      key: "is_veg_only",
      title: "Veg Only",
      render: (row: Category) => (
        <Badge variant={row.is_veg_only ? "success" : "secondary"}>
          {row.is_veg_only ? "Yes" : "No"}
        </Badge>
      ),
    },
    {
      key: "is_active",
      title: "Status",
      render: (row: Category) => (
        <Badge variant={row.is_active ? "default" : "secondary"}>
          {row.is_active ? "Active" : "Inactive"}
        </Badge>
      ),
    },
  ];
};
