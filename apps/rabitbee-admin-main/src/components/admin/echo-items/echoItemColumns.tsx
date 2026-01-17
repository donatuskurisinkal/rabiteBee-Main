
import { StatusBadge } from "@/components/admin/StatusBadge";

interface EchoItem {
  id: string;
  name: string;
  unit: string;
  base_price: number;
  icon_url?: string;
  is_active: boolean;
}

export const createEchoItemColumns = (
  canManageEchoItems: boolean,
  handleToggleActive: (item: EchoItem, isActive: boolean) => void
) => [
  {
    key: "icon",
    title: "Icon",
    render: (row: EchoItem) => (
      <div className="flex items-center justify-center w-10 h-10">
        {row.icon_url ? (
          <img 
            src={row.icon_url} 
            alt={row.name} 
            className="w-8 h-8 object-contain rounded"
          />
        ) : (
          <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center">
            <span className="text-xs text-gray-500">No Image</span>
          </div>
        )}
      </div>
    ),
  },
  { key: "name", title: "Name" },
  { key: "unit", title: "Unit" },
  {
    key: "base_price",
    title: "Base Price",
    render: (row: EchoItem) => (
      <span>₹{row.base_price.toFixed(2)}</span>
    ),
  },
  {
    key: "is_active",
    title: "Status",
    render: (row: EchoItem) => (
      <StatusBadge
        isActive={row.is_active}
        onToggle={(active) => handleToggleActive(row, active)}
        disabled={!canManageEchoItems}
      />
    ),
  },
];
