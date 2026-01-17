
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

interface NavItemProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  hasSubmenu?: boolean;
  isExpanded?: boolean;
  isSubmenuItem?: boolean;
  onClick?: () => void;
}

export function NavItem({ 
  href, 
  icon, 
  label, 
  isActive, 
  hasSubmenu, 
  isExpanded,
  isSubmenuItem,
  onClick 
}: NavItemProps) {
  const Component = href === "#" ? "button" : Link;
  
  return (
    <Component
      to={href !== "#" ? href : undefined}
      onClick={onClick}
      className={cn(
        "group flex items-center justify-between w-full rounded-lg px-3 py-2.5 text-sm transition-all duration-300",
        isSubmenuItem ? "text-sm ml-2" : "text-sm font-medium",
        isActive
          ? "bg-gradient-to-r from-primary/20 to-primary/10 text-primary border-l-2 border-primary shadow-lg shadow-primary/20 neon-glow"
          : "hover:bg-muted/50 hover:text-foreground hover:translate-x-1 backdrop-blur-sm",
        hasSubmenu && "cursor-pointer"
      )}
    >
      <span className="flex items-center gap-3">
        <span className={cn("icon-glow", isActive && "text-primary")}>{icon}</span>
        <span>{label}</span>
      </span>
      {hasSubmenu && (
        <ChevronDown
          className={cn(
            "h-4 w-4 transition-all duration-300 group-hover:text-primary",
            isExpanded && "transform rotate-180"
          )}
        />
      )}
    </Component>
  );
}
