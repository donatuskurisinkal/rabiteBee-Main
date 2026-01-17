
import React, { useEffect, useMemo } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

export interface AuthRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requirePermission?: string;
}

const AuthRoute: React.FC<AuthRouteProps> = ({ 
  children, 
  requireAdmin = false, 
  requirePermission 
}) => {
  const { user, isAdmin, userPermissions, isLoading, authInitialized } = useAuth();
  const navigate = useNavigate();

  // Add debugging to help troubleshoot
  useEffect(() => {
    if (!isLoading) {
      console.log("AuthRoute - User:", user?.id);
      console.log("AuthRoute - Is Admin:", isAdmin);
      console.log("AuthRoute - Permissions:", userPermissions);
      console.log("AuthRoute - Require Admin:", requireAdmin);
      console.log("AuthRoute - Require Permission:", requirePermission);
    }
  }, [isLoading, authInitialized, user, isAdmin, userPermissions, requireAdmin, requirePermission]);

  // Use useMemo to prevent unnecessary rerenders
  const hasAccess = useMemo(() => {
    if (!user) return false;
    
    // Check if the user has a system role (has access to everything)
    const hasSystemRole = userPermissions.includes('manage_all');
    
    // Admin or system role has access to all routes
    if (isAdmin || hasSystemRole) return true;
    
    // Check specific requirements
    if (requireAdmin) return false;
    if (requirePermission) return userPermissions.includes(requirePermission);
    
    // No specific requirements
    return true;
  }, [user, isAdmin, userPermissions, requireAdmin, requirePermission]);

  if (isLoading || !authInitialized) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-lg">Loading...</span>
      </div>
    );
  }

  if (!user) {
    console.log("AuthRoute - No user after init, redirecting to login");
    return <Navigate to="/admin/login" replace />;
  }

  if (!hasAccess) {
    console.log("AuthRoute - User doesn't have required access, redirecting");
    return <Navigate to="/admin/dashboard" replace />;
  }

  console.log("AuthRoute - Providing access");
  return <>{children}</>;
};

export default AuthRoute;
