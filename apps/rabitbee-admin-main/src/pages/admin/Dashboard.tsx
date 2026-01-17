
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Building2, Map, Tag, Package, ListChecks, Store, Landmark } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export default function Dashboard() {
  const { user } = useAuth();

  const { data: stats, isLoading } = useQuery({
    queryKey: ["admin-dashboard-stats"],
    queryFn: async () => {
      try {
        console.log("Fetching dashboard stats...");
        
        // Fetch count of users
        const { count: usersCount, error: usersError } = await supabase
          .from("users")
          .select("*", { count: "exact", head: true });
          
        if (usersError) {
          console.error("Error fetching users count:", usersError);
        }

        // Fetch count of tenants
        const { count: tenantsCount, error: tenantsError } = await supabase
          .from("tenants")
          .select("*", { count: "exact", head: true });
          
        if (tenantsError) {
          console.error("Error fetching tenants count:", tenantsError);
        }

        // Fetch count of states
        const { count: statesCount, error: statesError } = await supabase
          .from("states")
          .select("*", { count: "exact", head: true });
          
        if (statesError) {
          console.error("Error fetching states count:", statesError);
        }

        // Fetch count of categories
        const { count: categoriesCount, error: categoriesError } = await supabase
          .from("categories")
          .select("*", { count: "exact", head: true });
          
        if (categoriesError) {
          console.error("Error fetching categories count:", categoriesError);
        }
        
        console.log("Dashboard stats loaded:", {
          users: usersCount || 0,
          tenants: tenantsCount || 0,
          states: statesCount || 0,
          categories: categoriesCount || 0
        });

        return {
          users: usersCount || 0,
          tenants: tenantsCount || 0,
          states: statesCount || 0,
          categories: categoriesCount || 0,
        };
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        return {
          users: 0,
          tenants: 0,
          states: 0,
          categories: 0
        };
      }
    },
  });

  return (
    <div className="space-y-6">
      <div className="border-b pb-4 mb-6">
        <h1 className="text-4xl font-display font-bold tracking-tight text-primary">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Welcome back, <span className="font-medium">{user?.email?.split('@')[0] || 'User'}</span>!
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-t-4 border-t-primary shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-display font-semibold">Total Users</CardTitle>
            <Users className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {isLoading ? "..." : stats?.users || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Registered users</p>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-primary/80 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-display font-semibold">Tenants</CardTitle>
            <Building2 className="h-5 w-5 text-primary/80" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {isLoading ? "..." : stats?.tenants || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Active organizations</p>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-primary/60 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-display font-semibold">States</CardTitle>
            <Map className="h-5 w-5 text-primary/60" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {isLoading ? "..." : stats?.states || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Geographical regions</p>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-primary/40 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-display font-semibold">Categories</CardTitle>
            <Tag className="h-5 w-5 text-primary/40" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {isLoading ? "..." : stats?.categories || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Service categories</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="font-display">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="border-l-4 border-primary/20 pl-4 py-1">
                <p className="text-sm">System initialized</p>
                <p className="text-xs text-muted-foreground">Today, 10:30 AM</p>
              </div>
              <div className="border-l-4 border-primary/20 pl-4 py-1">
                <p className="text-sm">Admin user created</p>
                <p className="text-xs text-muted-foreground">Today, 10:32 AM</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="font-display">Quick Links</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <a href="/admin/users" className="flex items-center p-3 rounded-md bg-muted/50 cursor-pointer hover:bg-muted transition-colors">
              <Users className="h-4 w-4 mr-2 text-primary" />
              <p className="text-sm font-medium">Manage Users</p>
            </a>
            <a href="/admin/tenants" className="flex items-center p-3 rounded-md bg-muted/50 cursor-pointer hover:bg-muted transition-colors">
              <Building2 className="h-4 w-4 mr-2 text-primary" />
              <p className="text-sm font-medium">View Tenants</p>
            </a>
            <a href="/admin/settings" className="flex items-center p-3 rounded-md bg-muted/50 cursor-pointer hover:bg-muted transition-colors">
              <Landmark className="h-4 w-4 mr-2 text-primary" />
              <p className="text-sm font-medium">Update Settings</p>
            </a>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
