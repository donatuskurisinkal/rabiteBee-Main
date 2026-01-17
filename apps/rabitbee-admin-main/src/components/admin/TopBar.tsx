
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Menu, LogOut, User, Building2, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { SessionIndicator } from "@/components/auth/SessionIndicator";

export interface TopBarProps {
  onMenuButtonClick: () => void;
  selectedTenant?: { id: string; name: string } | null;
}

interface UserDetails {
  first_name: string;
  last_name: string;
  username: string;
}

export default function TopBar({ onMenuButtonClick, selectedTenant }: TopBarProps) {
  const { user, signOut, refreshSession } = useAuth();
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserDetails = async () => {
      if (user) {
        const { data, error } = await supabase
          .from("users")
          .select("first_name, last_name, username")
          .eq("id", user.id)
          .single();

        if (!error && data) {
          setUserDetails(data);
        }
      }
    };

    fetchUserDetails();
  }, [user]);

  const userInitials = userDetails
    ? `${userDetails.first_name[0]}${userDetails.last_name[0]}`
    : "U";

  const fullName = userDetails
    ? `${userDetails.first_name} ${userDetails.last_name}`
    : "User";

  const handleSignOut = async () => {
    try {
      console.log("Attempting to sign out...");
      await signOut();
      navigate("/admin/login");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const handleRefreshSession = async () => {
    await refreshSession();
  };

  return (
    <header className="border-b bg-white px-4 py-3 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            className="md:hidden"
            size="icon"
            onClick={onMenuButtonClick}
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle menu</span>
          </Button>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-xl text-primary">Admin Dashboard</span>
            {selectedTenant && (
              <div className="hidden md:flex items-center bg-muted/20 px-2 py-1 rounded-md">
                <Building2 className="h-4 w-4 text-primary mr-1" />
                <span className="text-sm font-medium">{selectedTenant.name}</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Session indicator */}
          <SessionIndicator />
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar>
                  <AvatarFallback className="bg-primary text-white">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{fullName}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleRefreshSession}>
                <RefreshCw className="mr-2 h-4 w-4" />
                <span>Refresh Session</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
