import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useTenant } from "@/hooks/use-tenant";
import { supabase } from "@/integrations/supabase/client";
import { DataTable } from "@/components/admin/DataTable";
import { Badge } from "@/components/ui/badge";
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, DollarSign, Receipt, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface RestaurantEarning {
  id: string;
  restaurant_id: string;
  order_id: string;
  gross_amount: number;
  commission_amount: number;
  net_amount: number;
  settled: boolean;
  settlement_batch_id: string | null;
  created_at: string;
  restaurant?: {
    name: string;
  };
  orders?: {
    orderno: string;
  };
}

interface Restaurant {
  id: string;
  name: string;
}

interface SettlementBatch {
  id: string;
  batch_name: string;
  total_restaurants: number;
  total_amount: number;
  settlement_date: string;
  created_at: string;
}

export default function RestaurantEarnings() {
  const { toast } = useToast();
  const { selectedTenant } = useTenant();
  const queryClient = useQueryClient();
  const [selectedRestaurant, setSelectedRestaurant] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [settlementDialog, setSettlementDialog] = useState(false);
  const [batchName, setBatchName] = useState("");
  const [settlementDate, setSettlementDate] = useState<Date>(new Date());
  const [selectedEarnings, setSelectedEarnings] = useState<string[]>([]);

  // Get date range based on filter
  const getDateRange = (filter: string) => {
    const now = new Date();
    switch (filter) {
      case "today":
        return { start: startOfDay(now), end: endOfDay(now) };
      case "weekly":
        return { start: startOfWeek(now), end: endOfWeek(now) };
      case "monthly":
        return { start: startOfMonth(now), end: endOfMonth(now) };
      case "yearly":
        return { start: startOfYear(now), end: endOfYear(now) };
      default:
        return null;
    }
  };

  // Fetch restaurant earnings
  const { data: earnings = [], isLoading } = useQuery({
    queryKey: ["restaurant-earnings", selectedTenant?.id, selectedRestaurant, dateFilter],
    queryFn: async () => {
      let query = supabase
        .from("restaurant_earnings")
        .select(`
          *,
          restaurant:restaurants(name),
          orders(orderno)
        `)
        .order("created_at", { ascending: false });

      if (selectedRestaurant !== "all") {
        query = query.eq("restaurant_id", selectedRestaurant);
      }

      // Apply date filter
      const dateRange = getDateRange(dateFilter);
      if (dateRange) {
        query = query
          .gte("created_at", dateRange.start.toISOString())
          .lte("created_at", dateRange.end.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as RestaurantEarning[];
    },
    enabled: !!selectedTenant?.id,
  });

  // Fetch restaurants for filter
  const { data: restaurants = [] } = useQuery({
    queryKey: ["restaurants", selectedTenant?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("restaurants")
        .select("id, name")
        .eq("tenant_id", selectedTenant?.id)
        .order("name");

      if (error) throw error;
      return data as Restaurant[];
    },
    enabled: !!selectedTenant?.id,
  });

  // Fetch settlement batches
  const { data: settlementBatches = [] } = useQuery({
    queryKey: ["settlement-batches", selectedTenant?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("settlement_batches")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as SettlementBatch[];
    },
    enabled: !!selectedTenant?.id,
  });

  // Create settlement batch
  const createSettlementMutation = useMutation({
    mutationFn: async ({ earningIds, batchName, settlementDate }: {
      earningIds: string[];
      batchName: string;
      settlementDate: Date;
    }) => {
      // Calculate totals
      const selectedEarningsData = earnings.filter(e => earningIds.includes(e.id));
      const totalAmount = selectedEarningsData.reduce((sum, e) => sum + e.net_amount, 0);
      const uniqueRestaurants = new Set(selectedEarningsData.map(e => e.restaurant_id)).size;

      // Create settlement batch
      const { data: batch, error: batchError } = await supabase
        .from("settlement_batches")
        .insert({
          batch_name: batchName,
          total_restaurants: uniqueRestaurants,
          total_amount: totalAmount,
          settlement_date: format(settlementDate, "yyyy-MM-dd"),
          tenant_id: selectedTenant?.id,
        })
        .select()
        .single();

      if (batchError) throw batchError;

      // Update earnings with settlement batch ID
      const { error: updateError } = await supabase
        .from("restaurant_earnings")
        .update({
          settled: true,
          settlement_batch_id: batch.id,
        })
        .in("id", earningIds);

      if (updateError) throw updateError;

      return batch;
    },
    onSuccess: () => {
      toast({
        title: "Settlement Created",
        description: "Restaurant earnings have been marked as settled.",
      });
      queryClient.invalidateQueries({ queryKey: ["restaurant-earnings"] });
      queryClient.invalidateQueries({ queryKey: ["settlement-batches"] });
      setSettlementDialog(false);
      setBatchName("");
      setSelectedEarnings([]);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create settlement batch.",
        variant: "destructive",
      });
      console.error("Settlement error:", error);
    },
  });

  const columns = [
    {
      accessorKey: "restaurant.name",
      header: "Restaurant",
    },
    {
      accessorKey: "orders.orderno",
      header: "Order #",
    },
    {
      accessorKey: "gross_amount",
      header: "Gross Amount",
      cell: ({ row }: any) => `₹${row.original.gross_amount.toFixed(2)}`,
    },
    {
      accessorKey: "commission_amount",
      header: "Commission",
      cell: ({ row }: any) => `₹${row.original.commission_amount.toFixed(2)}`,
    },
    {
      accessorKey: "net_amount",
      header: "Net Payable",
      cell: ({ row }: any) => `₹${row.original.net_amount.toFixed(2)}`,
    },
    {
      accessorKey: "settled",
      header: "Status",
      cell: ({ row }: any) => (
        <Badge variant={row.original.settled ? "success" : "secondary"}>
          {row.original.settled ? "Settled" : "Pending"}
        </Badge>
      ),
    },
    {
      accessorKey: "created_at",
      header: "Date",
      cell: ({ row }: any) => format(new Date(row.original.created_at), "MMM dd, yyyy"),
    },
  ];

  const unsettledEarnings = earnings.filter(e => !e.settled);
  const totalUnsettled = unsettledEarnings.reduce((sum, e) => sum + e.net_amount, 0);

  const handleCreateSettlement = () => {
    if (!batchName || selectedEarnings.length === 0) {
      toast({
        title: "Invalid Data",
        description: "Please provide batch name and select earnings to settle.",
        variant: "destructive",
      });
      return;
    }

    createSettlementMutation.mutate({
      earningIds: selectedEarnings,
      batchName,
      settlementDate,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Restaurant Earnings</h1>
          <p className="text-muted-foreground">Track and settle restaurant earnings</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Total Unsettled</p>
                <p className="text-2xl font-bold">₹{totalUnsettled.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Receipt className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Pending Orders</p>
                <p className="text-2xl font-bold">{unsettledEarnings.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Check className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Settlement Batches</p>
                <p className="text-2xl font-bold">{settlementBatches.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <CardTitle>Restaurant Earnings</CardTitle>
            <div className="flex items-center gap-2">
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Date filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="weekly">This Week</SelectItem>
                  <SelectItem value="monthly">This Month</SelectItem>
                  <SelectItem value="yearly">This Year</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={selectedRestaurant} onValueChange={setSelectedRestaurant}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by restaurant" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Restaurants</SelectItem>
                  {restaurants.map((restaurant) => (
                    <SelectItem key={restaurant.id} value={restaurant.id}>
                      {restaurant.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {unsettledEarnings.length > 0 && (
                <Dialog open={settlementDialog} onOpenChange={setSettlementDialog}>
                  <DialogTrigger asChild>
                    <Button>Create Settlement</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create Settlement Batch</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="batchName">Batch Name</Label>
                        <Input
                          id="batchName"
                          value={batchName}
                          onChange={(e) => setBatchName(e.target.value)}
                          placeholder="e.g., Weekly Settlement - Week 1"
                        />
                      </div>
                      
                      <div>
                        <Label>Settlement Date</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !settlementDate && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {settlementDate ? format(settlementDate, "PPP") : "Pick a date"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={settlementDate}
                              onSelect={(date) => date && setSettlementDate(date)}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>

                      <div>
                        <Label>Select Earnings to Settle</Label>
                        <div className="max-h-40 overflow-y-auto space-y-2 mt-2">
                          {unsettledEarnings.map((earning) => (
                            <div key={earning.id} className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                id={earning.id}
                                checked={selectedEarnings.includes(earning.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedEarnings([...selectedEarnings, earning.id]);
                                  } else {
                                    setSelectedEarnings(selectedEarnings.filter(id => id !== earning.id));
                                  }
                                }}
                                className="rounded"
                              />
                              <label htmlFor={earning.id} className="text-sm">
                                {earning.restaurant?.name} - {earning.orders?.orderno} - ₹{earning.net_amount.toFixed(2)}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" onClick={() => setSettlementDialog(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleCreateSettlement} disabled={createSettlementMutation.isPending}>
                          {createSettlementMutation.isPending ? "Creating..." : "Create Settlement"}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={earnings}
            isLoading={isLoading}
          />
        </CardContent>
      </Card>

      {/* Settlement Batches */}
      {settlementBatches.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Settlement History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {settlementBatches.map((batch) => (
                <div key={batch.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">{batch.batch_name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {batch.total_restaurants} restaurants • Settlement Date: {format(new Date(batch.settlement_date), "MMM dd, yyyy")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">₹{batch.total_amount.toFixed(2)}</p>
                    <p className="text-sm text-muted-foreground">
                      Created: {format(new Date(batch.created_at), "MMM dd, yyyy")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}