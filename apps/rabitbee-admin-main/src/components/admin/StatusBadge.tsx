
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

export interface StatusBadgeProps {
  isActive?: boolean;
  status?: string;
  onToggle?: (active: boolean) => void;
  disabled?: boolean;
  showSwitch?: boolean;
}

export function StatusBadge({ 
  isActive, 
  status,
  onToggle, 
  disabled = false,
  showSwitch = true 
}: StatusBadgeProps) {
  // If status is provided, convert it to boolean isActive value
  const active = status ? status === "active" : isActive;
  
  if (showSwitch && onToggle) {
    return (
      <div className="flex items-center">
        <Switch 
          checked={active} 
          onCheckedChange={onToggle}
          disabled={disabled} 
        />
        <span className="ml-2">
          {active ? 'Active' : 'Inactive'}
        </span>
      </div>
    )
  }

  return (
    <Badge 
      variant="outline" 
      className={cn(
        "px-2 py-1",
        active 
          ? "bg-green-100 text-green-800 border-green-200" 
          : "bg-red-100 text-red-800 border-red-200"
      )}
    >
      {active ? "Active" : "Inactive"}
    </Badge>
  );
}
