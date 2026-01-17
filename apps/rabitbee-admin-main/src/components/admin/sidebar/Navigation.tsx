
import { useLocation } from "react-router-dom";
import { NavItem } from "./NavItem";
import { NavigationItems } from "./NavigationItems";
import { RestaurantNavigationItems } from "./RestaurantNavigationItems";
import { useState } from "react";
import { ReactNode } from "react";

interface NavigationProps {
  userPermissions: string[];
  onItemClick?: () => void;
}

export function Navigation({ userPermissions, onItemClick }: NavigationProps) {
  const location = useLocation();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  
  // Check if user has system access
  const hasSystemAccess = userPermissions.includes("manage_all");
  
  // Check if user is a service provider (restaurant owner)
  const isServiceProvider = userPermissions.includes("manage_restaurants") && !hasSystemAccess;
  
  // Use restaurant navigation for service providers, full navigation for admins
  const navItems = isServiceProvider ? RestaurantNavigationItems : NavigationItems;

  const toggleExpanded = (title: string) => {
    setExpandedItems(prev => 
      prev.includes(title) 
        ? prev.filter(item => item !== title)
        : [...prev, title]
    );
  };

  const filteredNavItems = navItems.filter(
    (item) => {
      if (!item.permission || item.permission.length === 0) {
        return true;
      }
      
      if (hasSystemAccess) {
        return true;
      }
      
      return userPermissions.includes(item.permission);
    }
  );

  return (
    <nav className="flex-1 overflow-auto p-2">
      <div className="space-y-1">
        {filteredNavItems.map((item) => {
          const isExpanded = expandedItems.includes(item.title);
          const hasSubmenu = item.submenu && item.submenu.length > 0;
          const isActive = location.pathname === item.href || 
            (hasSubmenu && item.submenu?.some(subItem => location.pathname === subItem.href));

          return (
            <div key={item.title}>
              <NavItem
                href={item.href || "#"}
                icon={item.icon as ReactNode}
                label={item.title}
                isActive={isActive}
                hasSubmenu={hasSubmenu}
                isExpanded={isExpanded}
                onClick={() => {
                  if (hasSubmenu) {
                    toggleExpanded(item.title);
                  } else {
                    onItemClick?.();
                  }
                }}
              />
              {hasSubmenu && isExpanded && (
                <div className="ml-6 mt-1 space-y-1">
                  {item.submenu?.map((subItem) => {
                    // Make sure to check if icon exists before accessing it
                    const subItemIcon = 'icon' in subItem ? subItem.icon : undefined;
                    
                    return (
                      <NavItem
                        key={subItem.href}
                        href={subItem.href}
                        icon={subItemIcon as ReactNode || <span className="w-4 h-4" />}
                        label={subItem.title}
                        isActive={location.pathname === subItem.href}
                        onClick={onItemClick}
                        isSubmenuItem
                      />
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </nav>
  );
}
