
import React from "react";
import { Outlet } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import Sidebar from "@/components/admin/Sidebar";
import AdminTopBar from "@/components/admin/TopBar";
import { Loader2 } from "lucide-react";

const AdminLayout: React.FC = () => {
  const { user, isLoading, authInitialized } = useAuth();
  const [sidebarOpen, setSidebarOpen] = React.useState(true);

  const handleMenuButtonClick = () => {
    setSidebarOpen(!sidebarOpen);
  };

  if (isLoading || !authInitialized) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-lg">Loading...</span>
      </div>
    );
  }


  return (
    <div className="flex h-screen overflow-hidden bg-premium-gradient">
      <div className={`${sidebarOpen ? 'block' : 'hidden md:block'}`}>
        <Sidebar onItemClick={() => setSidebarOpen(false)} />
      </div>
      <div className="flex flex-col flex-1 overflow-y-auto">
        <AdminTopBar onMenuButtonClick={handleMenuButtonClick} />
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
