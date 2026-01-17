
import { useEffect, useState, createContext, useContext, useCallback } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useTenant } from "@/contexts/TenantContext";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  authInitialized: boolean;
  signIn: (username: string, password: string) => Promise<any>;
  signUp: (username: string, password: string, firstName: string, lastName: string, roleId?: string) => Promise<void>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  userPermissions: string[];
  checkUserStatus: (username: string) => Promise<any>;
  refreshSession: () => Promise<void>;
  sessionExpiresAt: Date | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [sessionExpiresAt, setSessionExpiresAt] = useState<Date | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const [authInitialized, setAuthInitialized] = useState(false);
  const { toast } = useToast();
  const tenantContext = useContext(useTenant.Context);
  const selectedTenant = tenantContext?.selectedTenant;

  const fetchUserPermissions = useCallback(async (userId: string) => {
    try {
      console.log("Fetching permissions for user:", userId);
      const { data, error } = await (supabase as any)
        .rpc('get_user_permissions', { user_id: userId });

      if (error) {
        console.error("Error fetching permissions:", error);
        throw error;
      }
      
      if (data && Array.isArray(data)) {
        const permissions = data.map((item: { permission_key: string }) => item.permission_key || "");
        console.log("Fetched permissions:", permissions);
        setUserPermissions(permissions);
        
        const hasAdminPermission = permissions.includes("manage_all");
        setIsAdmin(hasAdminPermission);
        console.log("User is admin:", hasAdminPermission);
      }
      
      return data;
    } catch (error) {
      console.error("Error fetching user permissions:", error);
      return [];
    }
  }, []);

  // Add a function to refresh the session
  const refreshSession = useCallback(async () => {
    try {
      console.log("Refreshing session...");
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error("Error refreshing session:", error);
        toast({
          variant: "destructive",
          title: "Session Error",
          description: "Failed to refresh your session. Please log in again.",
        });
        
        // If refresh fails, log the user out
        await supabase.auth.signOut();
        setUser(null);
        setSession(null);
        setSessionExpiresAt(null);
        return;
      }
      
      console.log("Session refreshed successfully");
      setSession(data.session);
      setUser(data.session?.user || null);
      
      if (data.session?.expires_at) {
        setSessionExpiresAt(new Date(data.session.expires_at * 1000));
      }
      
      toast({
        title: "Session Refreshed",
        description: "Your session has been refreshed successfully.",
      });
    } catch (error) {
      console.error("Error in refreshSession:", error);
    }
  }, [toast]);

  useEffect(() => {
    if (authInitialized) return;

    const initializeAuth = async () => {
      // First set up the auth state change listener
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (event, currentSession) => {
          console.log("Auth state changed:", event);
          
          // Update state with the current session info
          setSession(currentSession);
          setUser(currentSession?.user || null);
          
          if (currentSession?.expires_at) {
            setSessionExpiresAt(new Date(currentSession.expires_at * 1000));
          } else {
            setSessionExpiresAt(null);
          }
        }
      );

      // Then get the initial session
      const { data } = await supabase.auth.getSession();
      const currentSession = data.session;
      
      console.log("Initial session check:", currentSession ? "Session found" : "No session");
      
      setSession(currentSession);
      setUser(currentSession?.user || null);
      
      if (currentSession?.expires_at) {
        setSessionExpiresAt(new Date(currentSession.expires_at * 1000));
      }
      
      // Fetch permissions if we have a user
      if (currentSession?.user) {
        await fetchUserPermissions(currentSession.user.id);
      }
      
      setIsLoading(false);
      setAuthInitialized(true);

      return subscription;
    };

    const subscription = initializeAuth();
    
    // Clean up function
    return () => {
      subscription.then(sub => sub.unsubscribe());
    };
  }, [fetchUserPermissions, authInitialized]);

  // Add session expiration check and auto-refresh
  useEffect(() => {
    if (!session || !sessionExpiresAt) return;
    
    const checkSessionExpiration = () => {
      const now = new Date();
      const expiresAt = new Date(sessionExpiresAt);
      const timeLeft = expiresAt.getTime() - now.getTime();
      
      // If session expires in less than 5 minutes, refresh it
      if (timeLeft > 0 && timeLeft < 5 * 60 * 1000) {
        refreshSession();
      }
      
      // If session is expired, show notification
      if (timeLeft <= 0) {
        toast({
          variant: "destructive",
          title: "Session Expired",
          description: "Your session has expired. Please log in again.",
        });
        
        // Force sign out
        supabase.auth.signOut().then(() => {
          setUser(null);
          setSession(null);
          setSessionExpiresAt(null);
        });
      }
    };
    
    // Check every minute
    const interval = setInterval(checkSessionExpiration, 60 * 1000);
    
    // Initial check
    checkSessionExpiration();
    
    return () => clearInterval(interval);
  }, [session, sessionExpiresAt, refreshSession, toast]);

  // Update user permissions when the user changes
  useEffect(() => {
    if (user && authInitialized) {
      fetchUserPermissions(user.id);
    }
  }, [user, fetchUserPermissions, authInitialized]);

  const checkUserStatus = async (username: string) => {
    try {
      console.log(`Checking status for user: ${username}`);
      
      const { data: userData, error: userCheckError } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .limit(1);
        
      if (userCheckError) {
        console.error("Error checking user status:", userCheckError);
        return { error: userCheckError.message };
      }

      if (!userData || userData.length === 0) {
        console.log("User not found in database");
        return [{
          username: username,
          exists_in_auth: false,
          exists_in_users: false,
          is_verified: false,
          is_active: false,
          role_name: 'unknown'
        }];
      }
      
      return [{
        username: username,
        exists_in_auth: true, // We'll find out during actual login
        exists_in_users: true,
        is_verified: userData[0].is_verified,
        is_active: userData[0].isActive,
        role_name: userData[0].role
      }];
    } catch (error: any) {
      console.error("Error in checkUserStatus:", error);
      return { error: error.message };
    }
  };

  const signIn = async (username: string, password: string) => {
    try {
      setIsLoading(true);
      
      const userStatus = await checkUserStatus(username);
      console.log("User status check:", userStatus);
      
      if (userStatus && userStatus[0]) {
        const status = userStatus[0];
        
        if (status.exists_in_users && !status.exists_in_auth) {
          toast({
            variant: "destructive",
            title: "Authentication Error",
            description: "User exists in database but not in authentication system. Please contact an administrator.",
          });
          return { success: false, error: "User exists in database but not in auth system" };
        }
        
        if (status.exists_in_users && !status.is_active) {
          toast({
            variant: "destructive",
            title: "Account Inactive",
            description: "Your account is inactive. Please contact an administrator.",
          });
          return { success: false, error: "Account inactive" };
        }
      }
      
      const email = `${username}@example.com`;
      console.log("Attempting login with email:", email);
      
      const { error, data } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        console.error("Sign in error details:", error);
        
        toast({
          variant: "destructive",
          title: "Authentication Error",
          description: error.message,
        });
        return { success: false, error: error.message };
      }

      if (data?.user) {
        // Immediately set session and user to avoid routing race conditions
        setSession(data.session ?? null);
        setUser(data.user);

        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (userError) {
          console.error("User verification check error:", userError);
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to verify user status.",
          });
          return { success: false, error: userError.message };
        }

        console.log("User verification status:", userData?.is_verified);
        
        toast({
          title: "Welcome back!",
          description: "You have successfully logged in.",
        });
        
        if (data.session?.expires_at) {
          setSessionExpiresAt(new Date(data.session.expires_at * 1000));
        }
        
        const permissions = await fetchUserPermissions(data.user.id);
        return { success: true, user: data.user, permissions };
      }
      
      return { success: true, user: data?.user };
    } catch (error: any) {
      console.error("Sign in error:", error);
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (username: string, password: string, firstName: string, lastName: string, roleId?: string) => {
    try {
      setIsLoading(true);
      const email = `${username}@example.com`;
      
      let tenantId = null;
      
      if (user && !isAdmin) {
        const { data: userData } = await supabase
          .from('users')
          .select('tenant_id')
          .eq('id', user.id)
          .single();
          
        if (userData?.tenant_id) {
          tenantId = userData.tenant_id;
        }
      } else if (tenantContext?.selectedTenant) {
        tenantId = tenantContext.selectedTenant.id;
      }
      
      console.log("Creating user with tenant ID:", tenantId);
      
      const { error, data } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            username: username,
            tenant_id: tenantId,
          },
        },
      });

      if (error) {
        toast({
          variant: "destructive",
          title: "Registration Error",
          description: error.message,
        });
        throw error;
      }
      
      toast({
        title: "Account created",
        description: "Your account has been created successfully.",
      });
      
      await supabase.auth.signOut();
      
    } catch (error) {
      console.error("Sign up error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setIsLoading(true);
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setSessionExpiresAt(null);
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
    } catch (error) {
      console.error("Sign out error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to log out.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    user,
    session,
    isLoading,
    authInitialized,
    signIn,
    signUp,
    signOut,
    isAdmin,
    userPermissions,
    checkUserStatus,
    refreshSession,
    sessionExpiresAt
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const useAuth = Object.assign(useAuthContext, { Context: AuthContext });
