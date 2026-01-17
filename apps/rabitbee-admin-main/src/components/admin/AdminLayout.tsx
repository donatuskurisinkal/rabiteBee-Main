
import React, { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import Sidebar from "./Sidebar";
import AdminTopBar from "./TopBar";
import { Loader2 } from "lucide-react";
import { createAdminUser } from "@/utils/createAdminUser";
import { useToast } from "@/hooks/use-toast";
import { useTenant } from "@/contexts/TenantContext";
import { supabase } from "@/integrations/supabase/client";

const AdminLayout = () => {
  const { user, isLoading, isAdmin, userPermissions } = useAuth();
  const { selectedTenant } = useTenant();
  const [isCreatingAdmin, setIsCreatingAdmin] = useState(false);
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [adminSetupComplete, setAdminSetupComplete] = useState(() => {
    return localStorage.getItem("adminSetupComplete") === "true";
  });
  const [setupAttempted, setSetupAttempted] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    async function checkIfUsersExist() {
      try {
        const { count, error } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true });
        
        if (error) {
          console.error("Error checking users:", error);
          return false;
        }
        
        return count && count > 0;
      } catch (err) {
        console.error("Exception checking users:", err);
        return false;
      }
    }

    async function setupAdmin() {
      if (adminSetupComplete || setupAttempted) {
        return;
      }
      
      setSetupAttempted(true);
      
      // Check if users already exist
      const hasUsers = await checkIfUsersExist();
      if (hasUsers) {
        console.log("Users already exist, skipping admin setup");
        localStorage.setItem("adminSetupComplete", "true");
        setAdminSetupComplete(true);
        setIsCheckingAdmin(false);
        return;
      }
      
      try {
        setIsCreatingAdmin(true);
        const result = await createAdminUser();
        if (result.success && result.data) {
          console.log("Admin setup completed");
          localStorage.setItem("adminSetupComplete", "true");
          setAdminSetupComplete(true);
        }
      } catch (error) {
        console.error("Error setting up admin:", error);
        toast({
          variant: "destructive",
          title: "Admin Setup Error",
          description: `Failed to set up admin user: ${error instanceof Error ? error.message : "Unknown error"}`,
        });
      } finally {
        setIsCreatingAdmin(false);
        setIsCheckingAdmin(false);
      }
    }

    // Only admins can setup the admin user
    if (!isLoading && user && isAdmin && !adminSetupComplete && !setupAttempted) {
      setupAdmin();
    } else if (!isLoading) {
      setIsCheckingAdmin(false);
    }

    // Any authenticated user can access the admin layout, no need to check if they're admin
    if (!isLoading && !user) {
      console.log("AdminLayout - No user, redirecting to login");
      navigate("/admin/login");
    }
  }, [isLoading, user, isAdmin, navigate, toast, adminSetupComplete, setupAttempted]);

  const handleMenuButtonClick = () => {
    setSidebarOpen(!sidebarOpen);
  };

  if (isLoading || isCreatingAdmin || isCheckingAdmin) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-lg">
          {isCreatingAdmin ? "Setting up admin account..." : isCheckingAdmin ? "Checking admin setup..." : "Loading..."}
        </span>
      </div>
    );
  }

  // Now we only check if the user is authenticated, not if they're admin
  if (!user) {
    return null;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <div className={`${sidebarOpen ? 'block' : 'hidden md:block'}`}>
        <Sidebar onItemClick={() => setSidebarOpen(false)} />
      </div>
      <div className="flex flex-col flex-1 overflow-y-auto">
        <AdminTopBar 
          onMenuButtonClick={handleMenuButtonClick} 
          selectedTenant={selectedTenant}
        />
        <main className="flex-1 p-6 bg-muted/10">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
