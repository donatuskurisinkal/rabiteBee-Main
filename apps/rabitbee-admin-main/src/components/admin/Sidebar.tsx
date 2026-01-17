
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { SidebarHeader } from "./sidebar/SidebarHeader";
import { TenantSelector } from "./sidebar/TenantSelector";
import { Navigation } from "./sidebar/Navigation";
import { SidebarFooter } from "./sidebar/SidebarFooter";

interface SidebarProps {
  onItemClick?: () => void;
}

export default function Sidebar({ onItemClick }: SidebarProps) {
  const { userPermissions } = useAuth();

  return (
    <aside className="glass-sidebar flex h-full w-64 flex-col">
      <SidebarHeader />

      {userPermissions.includes("manage_all") && (
        <TenantSelector />
      )}

      <Navigation 
        userPermissions={userPermissions} 
        onItemClick={onItemClick} 
      />

      <SidebarFooter />
    </aside>
  );
}
