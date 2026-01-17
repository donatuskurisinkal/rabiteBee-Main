
import { Link } from "react-router-dom";
import { Server } from "lucide-react";

export function SidebarHeader() {
  return (
    <div className="p-4">
      <Link to="/admin/dashboard" className="flex items-center gap-2">
        <Server className="h-6 w-6 text-primary" />
        <h1 className="text-xl font-display font-bold text-primary">Admin</h1>
      </Link>
    </div>
  );
}
