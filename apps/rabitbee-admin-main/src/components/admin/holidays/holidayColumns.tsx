
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface Holiday {
  id: string;
  holiday_name: string;
  date: string;
  is_active: boolean;
  tenant_id: string | null;
}

export const createHolidayColumns = () => [
  {
    key: "holiday_name",
    title: "Holiday Name",
  },
  {
    key: "date",
    title: "Date",
    render: (row: Holiday) => format(new Date(row.date), "PPP"),
  },
  {
    key: "is_active",
    title: "Status",
    render: (row: Holiday) => (
      <Badge variant={row.is_active ? "default" : "secondary"}>
        {row.is_active ? "Active" : "Inactive"}
      </Badge>
    ),
  },
];
