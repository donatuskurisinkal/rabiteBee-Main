
import { StatusBadge } from "@/components/admin/StatusBadge";

interface Category {
  id: string;
  name: string;
  is_active: boolean;
  icon_name: string;
  icon_family: string;
  display_order: number;
  color?: string;
}

export const createCategoryColumns = (
  canManageCategories: boolean,
  handleToggleActive: (category: Category, isActive: boolean) => void
) => [
  {
    key: "icon",
    title: "Icon Info",
    render: (row: Category) => (
      <div className="space-y-1">
        <div className="text-sm font-medium">{row.icon_name}</div>
        <div className="text-xs text-muted-foreground">{row.icon_family}</div>
      </div>
    ),
  },
  { key: "name", title: "Name" },
  {
    key: "color",
    title: "Color",
    render: (row: Category) => (
      <div className="flex items-center gap-2">
        {row.color && (
          <div
            className="w-4 h-4 rounded border"
            style={{ backgroundColor: row.color }}
          />
        )}
        <span>{row.color || "No color"}</span>
      </div>
    ),
  },
  { key: "display_order", title: "Display Order" },
  {
    key: "is_active",
    title: "Status",
    render: (row: Category) => (
      <StatusBadge
        isActive={row.is_active}
        onToggle={(active) => handleToggleActive(row, active)}
        disabled={!canManageCategories}
      />
    ),
  },
];
