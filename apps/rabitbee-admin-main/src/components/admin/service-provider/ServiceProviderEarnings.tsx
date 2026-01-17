import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, Calendar } from "lucide-react";

interface ServiceProviderEarningsProps {
  providerId: string;
  restaurantId: string | null;
}

export const ServiceProviderEarnings = ({ providerId, restaurantId }: ServiceProviderEarningsProps) => {
  const [earnings, setEarnings] = useState({
    total: 0,
    today: 0,
    thisWeek: 0,
    thisMonth: 0
  });

  useEffect(() => {
    if (restaurantId) {
      fetchEarnings();
    }
  }, [restaurantId]);

  const fetchEarnings = async () => {
    try {
      const now = new Date();
      const todayStart = new Date(now.setHours(0, 0, 0, 0));
      const weekStart = new Date(now.setDate(now.getDate() - 7));
      const monthStart = new Date(now.setMonth(now.getMonth() - 1));

      // Fetch delivered orders
      const { data: allOrders } = await supabase
        .from('orders')
        .select('total_amount, created_at')
        .eq('status', 'delivered');

      const total = allOrders?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;
      
      const today = allOrders?.filter(o => new Date(o.created_at) >= todayStart)
        .reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;
      
      const thisWeek = allOrders?.filter(o => new Date(o.created_at) >= weekStart)
        .reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;
      
      const thisMonth = allOrders?.filter(o => new Date(o.created_at) >= monthStart)
        .reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;

      setEarnings({ total, today, thisWeek, thisMonth });
    } catch (error) {
      console.error('Error fetching earnings:', error);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Today's Earnings</CardTitle>
          <DollarSign className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">₹{earnings.today.toFixed(2)}</div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">This Week</CardTitle>
          <Calendar className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">₹{earnings.thisWeek.toFixed(2)}</div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">This Month</CardTitle>
          <TrendingUp className="h-4 w-4 text-purple-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-purple-600">₹{earnings.thisMonth.toFixed(2)}</div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
          <DollarSign className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-primary">₹{earnings.total.toFixed(2)}</div>
        </CardContent>
      </Card>
    </div>
  );
};
