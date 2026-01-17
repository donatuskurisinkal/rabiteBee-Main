
import {
  Home,
  Users,
  Shield,
  Building,
  Map,
  Tags,
  Store,
  Settings,
  Calendar,
  Layout,
  Utensils,
  Percent,
  Car,
  Globe,
  DollarSign,
  Gauge,
  UserPlus,
  Database,
  ShoppingCart,
  Wallet,
  MessageSquare
} from "lucide-react";

// Grouping for admin navigation
export const NavigationItems = [
  {
    title: "Dashboard",
    href: "/admin/dashboard",
    icon: <Home className="h-4 w-4" />,
    permission: "view_dashboard",
  },
  {
    title: "User Management",
    icon: <Users className="h-4 w-4" />,
    permission: "manage_users",
    submenu: [
      {
        title: "Users",
        href: "/admin/users",
        permission: "manage_users",
      },
      {
        title: "Roles",
        href: "/admin/roles",
        permission: "manage_roles",
      },
      {
        title: "Groups",
        href: "/admin/groups",
        permission: "manage_users",
        icon: <UserPlus className="h-4 w-4" />,
      },
    ],
  },
  {
    title: "Multi-tenancy",
    icon: <Building className="h-4 w-4" />,
    permission: "manage_all",
    submenu: [
      {
        title: "Tenants",
        href: "/admin/tenants",
        permission: "manage_tenants",
      },
    ],
  },
  {
    title: "Location Management",
    icon: <Map className="h-4 w-4" />,
    permission: "manage_locations",
    submenu: [
      {
        title: "States",
        href: "/admin/states",
        permission: "manage_states",
      },
      {
        title: "Districts",
        href: "/admin/districts",
        permission: "manage_districts",
      },
      {
        title: "Zones",
        href: "/admin/zones",
        permission: "manage_zones",
      },
      {
        title: "Areas",
        href: "/admin/areas",
        permission: "manage_areas",
      },
    ],
  },
  {
    title: "Catalog Management",
    icon: <Tags className="h-4 w-4" />,
    permission: "manage_catalog",
    submenu: [
      {
        title: "Categories",
        href: "/admin/categories",
        permission: "manage_categories",
      },
      {
        title: "Subcategories",
        href: "/admin/subcategories",
        permission: "manage_subcategories",
      },
      {
        title: "Products",
        href: "/admin/products",
        permission: "manage_products",
      },
      {
        title: "Tags",
        href: "/admin/tags",
        permission: "manage_tags",
      },
      {
        title: "Units",
        href: "/admin/units",
        permission: "manage_units",
      },
    ],
  },
  {
    title: "Echo Management",
    icon: <Database className="h-4 w-4" />,
    permission: "manage_echo_items",
    submenu: [
      {
        title: "Echo Items",
        href: "/admin/echo-items",
        permission: "manage_echo_items",
      },
    ],
  },
  {
    title: "Service Management",
    icon: <Store className="h-4 w-4" />,
    permission: "manage_service_providers",
    submenu: [
      {
        title: "Providers",
        href: "/admin/service-providers",
        permission: "manage_service_providers",
      },
      {
        title: "Delivery Agents",
        href: "/admin/delivery-agents",
        permission: "manage_service_providers",
      },
    ],
  },
  {
    title: "Restaurant Management",
    icon: <Utensils className="h-4 w-4" />,
    permission: "manage_restaurants",
    submenu: [
      {
        title: "Restaurants",
        href: "/admin/restaurants",
        permission: "manage_restaurants",
      },
      {
        title: "Categories",
        href: "/admin/restaurant-categories",
        permission: "manage_restaurants",
      },
      {
        title: "Menu Items",
        href: "/admin/menu-items",
        permission: "manage_restaurants",
      },
      {
        title: "Offers",
        href: "/admin/restaurant-offers",
        permission: "manage_restaurants",
      },
      {
        title: "Orders",
        href: "/admin/orders",
        permission: "manage_restaurants",
        icon: <ShoppingCart className="h-4 w-4" />,
      },
      {
        title: "Order Map",
        href: "/admin/order-map",
        permission: "manage_restaurants",
        icon: <Map className="h-4 w-4" />,
      },
      {
        title: "Restaurant Earnings",
        href: "/admin/restaurant-earnings",
        permission: "manage_restaurants",
        icon: <DollarSign className="h-4 w-4" />,
      },
      {
        title: "QR Code Generator",
        href: "/admin/table-qr-codes",
        permission: "manage_restaurants",
      },
      {
        title: "Table Orders",
        href: "/admin/restaurant-table-orders",
        permission: "manage_restaurants",
        icon: <Utensils className="h-4 w-4" />,
      },
    ],
  },
  {
    title: "Car Wash Management",
    icon: <Car className="h-4 w-4" />,
    permission: "manage_service_providers",
    submenu: [
      {
        title: "Vehicle Types",
        href: "/admin/wash-vehicle-types",
        permission: "manage_service_providers",
      },
      {
        title: "Vehicle Models",
        href: "/admin/wash-vehicle-models",
        permission: "manage_service_providers",
      },
      {
        title: "Wash Types",
        href: "/admin/wash-types",
        permission: "manage_service_providers",
      },
      {
        title: "Time Slots",
        href: "/admin/wash-time-slots",
        permission: "manage_service_providers",
      },
      {
        title: "Slot Overrides",
        href: "/admin/wash-slot-overrides",
        permission: "manage_service_providers",
      },
      {
        title: "Bookings",
        href: "/admin/wash-bookings",
        permission: "manage_service_providers",
      },
    ],
  },
  {
    title: "App Configuration",
    icon: <Layout className="h-4 w-4" />,
    permission: "manage_content",
    submenu: [
      {
        title: "Screens",
        href: "/admin/screens",
        permission: "manage_screens",
      },
      {
        title: "Banners",
        href: "/admin/banners",
        permission: "manage_banners",
      },
    ],
  },
  {
    title: "Business Settings",
    icon: <Calendar className="h-4 w-4" />,
    permission: "manage_business_settings",
    submenu: [
      {
        title: "Promo Codes",
        href: "/admin/promo-codes",
        icon: <Percent className="h-4 w-4" />,
        permission: "manage_business_settings",
      },
      {
        title: "Holidays",
        href: "/admin/holidays",
        permission: "manage_holidays",
      },
      {
        title: "Holiday Surcharges",
        href: "/admin/holiday-surcharges",
        icon: <DollarSign className="h-4 w-4" />,
        permission: "manage_business_settings",
      },
      {
        title: "Peak Hours",
        href: "/admin/peak-hours",
        permission: "manage_peak_hours",
      },
      {
        title: "Surge Pricing",
        href: "/admin/surge-pricing",
        permission: "manage_business_settings",
      },
      {
        title: "Distance Brackets",
        href: "/admin/distance-brackets",
        icon: <Gauge className="h-4 w-4" />,
        permission: "manage_business_settings",
      },
      {
        title: "Area Zones",
        href: "/admin/area-zones",
        icon: <Globe className="h-4 w-4" />,
        permission: "manage_business_settings",
      },
      {
        title: "Wallet Management",
        href: "/admin/wallet-management",
        icon: <Wallet className="h-4 w-4" />,
        permission: "manage_finance",
      },
    ],
  },
  {
    title: "Support Tickets",
    href: "/admin/support-tickets", 
    icon: <MessageSquare className="h-4 w-4" />,
    permission: "manage_all",
  },
  {
    title: "Settings",
    href: "/admin/settings",
    icon: <Settings className="h-4 w-4" />,
    permission: "manage_settings",
  },
];
