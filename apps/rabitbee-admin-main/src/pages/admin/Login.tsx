import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { createAdminUser } from "@/utils/createAdminUser";
import { supabase } from '@/integrations/supabase/client';
import config from '@/config';
export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCreatingAdmin, setIsCreatingAdmin] = useState(false);
  const { signIn, user, isLoading, isAdmin, userPermissions, authInitialized } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const redirectUser = async () => {
      if (isLoading || !user) return;

      console.log("Login page - User authenticated, redirecting based on role");
      console.log("User permissions:", userPermissions);
      console.log("Is admin:", isAdmin);

      try {
        const { data: userData, error } = await supabase
          .from('users')
          .select('role, service_provider_id, restaurant_id')
          .eq('id', user.id)
          .maybeSingle();

        if (error) {
          console.error('Error fetching user data:', error);
          navigate('/admin/dashboard');
          return;
        }

        const role = userData?.role?.toLowerCase().trim();
        console.log("User role (normalized):", role);
        console.log("Service Provider ID:", userData?.service_provider_id);
        console.log("Restaurant ID:", userData?.restaurant_id);
        
        // Admin or superadmin should always go to admin dashboard
        if (role === 'super_admin' || role === 'superadmin' || role === 'admin') {
          console.log("Redirecting admin to dashboard");
          navigate('/admin/dashboard', { replace: true });
        } 
        // Service provider with restaurant should go to restaurant dashboard
        else if (role === 'service_provider' && userData?.restaurant_id) {
          console.log("Redirecting service provider to restaurant dashboard:", userData.restaurant_id);
          navigate(`/restaurant/${userData.restaurant_id}/orders`, { replace: true });
        }
        // Restaurant role should also go to restaurant dashboard if restaurant_id exists
        else if (userData?.restaurant_id) {
          console.log("Redirecting to restaurant dashboard:", userData.restaurant_id);
          navigate(`/restaurant/${userData.restaurant_id}/orders`, { replace: true });
        }
        // Service provider without restaurant goes to service provider dashboard
        else if (role === 'service_provider' && userData?.service_provider_id) {
          console.log("Redirecting to service provider dashboard:", userData.service_provider_id);
          navigate(`/admin/service-provider/${userData.service_provider_id}`, { replace: true });
        } 
        else {
          console.log("No service provider or restaurant ID found, redirecting to default dashboard");
          toast({
            title: "Setup Required",
            description: "Your service provider or restaurant profile needs to be set up. Please contact an administrator.",
            variant: "destructive",
          });
          navigate('/admin/dashboard', { replace: true });
        }
      } catch (error) {
        console.error('Error during redirect:', error);
        navigate('/admin/dashboard');
      }
    };

    redirectUser();
  }, [isLoading, user, navigate, isAdmin, userPermissions, toast]);

  useEffect(() => {
    async function setupAdmin() {
      if (localStorage.getItem("adminSetupComplete") === "true") {
        return;
      }
      
      try {
        setIsCreatingAdmin(true);
        const result = await createAdminUser();
        if (result.success && result.data) {
          const adminUsername = result.data.user.split('@')[0] || 'admin';
          const adminPassword = result.data.password;
          
          setUsername(adminUsername || '');
          setPassword(adminPassword || '');
          
          toast({
            title: "Admin credentials loaded",
            description: "Default admin login details have been pre-filled.",
          });
          
          localStorage.setItem("adminSetupComplete", "true");
        }
      } catch (error) {
        console.error("Error setting up admin:", error);
      } finally {
        setIsCreatingAdmin(false);
      }
    }

    if (!localStorage.getItem("adminSetupComplete")) {
      setupAdmin();
    }
  }, [toast]);

  const handleUsernameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setUsername(e.target.value);
  }, []);

  const handlePasswordChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const attemptLogin = async (pwd: string) => {
      const res = await signIn(username, pwd);
      console.log("Sign in result:", res);
      return res;
    };

    try {
      let signInResult = await attemptLogin(password);

      if (!signInResult?.success && signInResult?.error?.toLowerCase().includes('invalid login credentials')) {
        // Try to auto-repair by resetting password via edge function
        try {
          const response = await fetch(`https://elcbugfsnqitkkgvhapa.supabase.co/functions/v1/reset-user-password`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${config.supabase.anonKey}`,
              'apikey': config.supabase.anonKey,
            },
            body: JSON.stringify({ username })
          });
          
          const data = await response.json();
          
          if (!response.ok) {
            console.error('Repair failed:', data);
          } else {
            const defaultPwd = `${username}123`;
            setPassword(defaultPwd);
            toast({ title: 'Account repaired', description: 'Password reset. Trying login again.' });
            signInResult = await attemptLogin(defaultPwd);
          }
        } catch (invErr) {
          console.error('Invoke error:', invErr);
        }
      }

      // On success, let auth state update trigger redirect
      if (signInResult?.success) {
        // Do not navigate immediately; Login page will redirect once user and permissions are loaded
        return;
      }
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Immediate redirect if already authenticated admin
  if (authInitialized && user && (isAdmin || (userPermissions?.includes?.('manage_all')))) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Admin Login</CardTitle>
          <CardDescription>
            Sign in to access the admin dashboard
          </CardDescription>
        </CardHeader>
        
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={handleUsernameChange}
                disabled={isSubmitting || isCreatingAdmin}
                className="focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                autoComplete="username"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={handlePasswordChange}
                disabled={isSubmitting || isCreatingAdmin}
                className="focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                autoComplete="current-password"
                required
              />
            </div>
          </CardContent>
          
          <CardFooter className="flex flex-col gap-2">
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isSubmitting || isCreatingAdmin}
            >
              {(isSubmitting || isCreatingAdmin) ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isCreatingAdmin ? 'Setting up admin...' : 'Signing in...'}
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
