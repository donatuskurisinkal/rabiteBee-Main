import { ShoppingCart, UtensilsCrossed, BarChart3, Users, Settings, LogOut } from "lucide-react";
import { NavLink, useParams } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

interface RestaurantSidebarProps {
  restaurant: any;
}

export function RestaurantSidebar({ restaurant }: RestaurantSidebarProps) {
  const { state } = useSidebar();
  const { restaurantId } = useParams();
  const { signOut } = useAuth();
  const isCollapsed = state === "collapsed";

  const menuItems = [
    { title: "Orders", url: `/restaurant/${restaurantId}/orders`, icon: ShoppingCart },
    { title: "Menu", url: `/restaurant/${restaurantId}/menu`, icon: UtensilsCrossed },
    { title: "Analytics", url: `/restaurant/${restaurantId}/analytics`, icon: BarChart3 },
    { title: "Staff", url: `/restaurant/${restaurantId}/staff`, icon: Users },
    { title: "Settings", url: `/restaurant/${restaurantId}/settings`, icon: Settings },
  ];

  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive 
      ? "bg-primary/10 text-primary font-medium border-l-2 border-primary" 
      : "hover:bg-muted/50";

  return (
    <Sidebar className={isCollapsed ? "w-14" : "w-60"}>
      <SidebarHeader className="border-b p-4">
        {!isCollapsed && (
          <div className="flex items-center gap-3">
            {restaurant?.logo_url && (
              <img
                src={restaurant.logo_url}
                alt={restaurant.name}
                className="h-10 w-10 rounded-lg object-cover"
              />
            )}
            <div className="flex-1 min-w-0">
              <h2 className="font-semibold text-sm truncate">{restaurant?.name}</h2>
              <p className="text-xs text-muted-foreground">Restaurant Portal</p>
            </div>
          </div>
        )}
        {isCollapsed && restaurant?.logo_url && (
          <img
            src={restaurant.logo_url}
            alt={restaurant.name}
            className="h-8 w-8 rounded-lg object-cover mx-auto"
          />
        )}
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className={isCollapsed ? "sr-only" : ""}>
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      end 
                      className={getNavCls}
                    >
                      <item.icon className={isCollapsed ? "h-5 w-5" : "h-4 w-4 mr-2"} />
                      {!isCollapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t p-4">
        <Button
          variant="ghost"
          size={isCollapsed ? "icon" : "default"}
          onClick={signOut}
          className="w-full justify-start"
        >
          <LogOut className={isCollapsed ? "h-5 w-5" : "h-4 w-4 mr-2"} />
          {!isCollapsed && <span>Logout</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
