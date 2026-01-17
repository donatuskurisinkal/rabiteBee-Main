import {
  Home,
  Utensils,
  ShoppingCart,
  BarChart3,
  Users,
  Settings,
} from "lucide-react";

// Restaurant-specific navigation for service providers
export const RestaurantNavigationItems = [
  {
    title: "Dashboard",
    href: "/admin/dashboard",
    icon: <Home className="h-4 w-4" />,
    permission: "view_dashboard",
  },
  {
    title: "My Restaurant",
    icon: <Utensils className="h-4 w-4" />,
    permission: "manage_restaurants",
    submenu: [
      {
        title: "Menu Items",
        href: "/admin/menu-items",
        permission: "manage_restaurants",
      },
      {
        title: "Categories",
        href: "/admin/restaurant-categories",
        permission: "manage_restaurants",
      },
      {
        title: "Offers",
        href: "/admin/restaurant-offers",
        permission: "manage_restaurants",
      },
    ],
  },
  {
    title: "Orders",
    icon: <ShoppingCart className="h-4 w-4" />,
    permission: "manage_restaurants",
    submenu: [
      {
        title: "All Orders",
        href: "/admin/orders",
        permission: "manage_restaurants",
      },
      {
        title: "Table Orders",
        href: "/admin/restaurant-table-orders",
        permission: "manage_restaurants",
        icon: <Utensils className="h-4 w-4" />,
      },
      {
        title: "QR Codes",
        href: "/admin/table-qr-codes",
        permission: "manage_restaurants",
      },
    ],
  },
  {
    title: "Analytics",
    icon: <BarChart3 className="h-4 w-4" />,
    permission: "manage_restaurants",
    submenu: [
      {
        title: "Earnings",
        href: "/admin/restaurant-earnings",
        permission: "manage_restaurants",
      },
    ],
  },
  {
    title: "Settings",
    href: "/admin/settings",
    icon: <Settings className="h-4 w-4" />,
    permission: "manage_settings",
  },
];
