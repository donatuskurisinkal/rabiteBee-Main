import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DatePicker } from "@/components/ui/date-picker";
import { Wallet, Users, Plus, History, Search, CalendarDays, TrendingUp, Filter, Eye } from "lucide-react";
import { useWallet } from "@/hooks/useWallet";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { WalletBalance } from "@/components/admin/wallet/WalletBalance";
import { ConfirmationDialog } from "@/components/admin/ConfirmationDialog";
import { DataTable } from "@/components/admin/DataTable";
import { format } from "date-fns";

interface User {
  id: string;
  username: string;
  first_name: string;
  last_name: string;
  phone: string;
}

interface WalletTransaction {
  id: string;
  user_id: string;
  type: string;
  amount: number;
  source_order_id: string | null;
  remarks: string | null;
  created_at: string;
}

const WalletManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [topUpAmount, setTopUpAmount] = useState("");
  const [remarks, setRemarks] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  
  // Transactions state
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [transactionUsers, setTransactionUsers] = useState<Record<string, User>>({});
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);
  const [transactionFilters, setTransactionFilters] = useState({
    type: '',
    dateFrom: new Date(),
    dateTo: new Date(),
    userId: '',
    search: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalAmount, setTotalAmount] = useState({ credit: 0, debit: 0, net: 0 });
  const pageSize = 10;
  
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: '',
    description: '',
    action: null as (() => void) | null
  });

  const { topUpWallet, isLoading } = useWallet();
  const { toast } = useToast();

  // Set default date filters to today
  useEffect(() => {
    const today = new Date();
    setTransactionFilters(prev => ({
      ...prev,
      dateFrom: today,
      dateTo: today
    }));
  }, []);

  // Fetch users
  const fetchUsers = async () => {
    setIsLoadingUsers(true);
    try {
      // First get current user's tenant_id
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      
      const { data: currentUserData } = await supabase
        .from('users')
        .select('tenant_id, role')
        .eq('id', user.id)
        .single();

      // If user has no tenant but is an admin, they can see all users
      const isAdmin = currentUserData?.role === 'admin';
      const tenantId = currentUserData?.tenant_id;

      if (!tenantId && !isAdmin) {
        throw new Error('User not assigned to any tenant');
      }

      let query = supabase
        .from('users')
        .select(`
          id,
          username,
          first_name,
          last_name,
          phone,
          tenant_id
        `)
        .order('first_name', { ascending: true })
        .limit(50);

      // If user has a specific tenant, filter by it
      if (tenantId) {
        query = query.eq('tenant_id', tenantId);
      }

      if (searchTerm) {
        query = query.or(`username.ilike.%${searchTerm}%,first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive",
      });
    } finally {
      setIsLoadingUsers(false);
    }
  };

  // Fetch wallet transactions
  const fetchTransactions = async () => {
    setIsLoadingTransactions(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      
      const { data: currentUserData } = await supabase
        .from('users')
        .select('tenant_id, role')
        .eq('id', user.id)
        .single();

      // If user has no tenant but is an admin, they can see all transactions
      const isAdmin = currentUserData?.role === 'admin';
      const tenantId = currentUserData?.tenant_id;

      if (!tenantId && !isAdmin) {
        throw new Error('User not assigned to any tenant');
      }

      // Build query with filters  
      let query = supabase
        .from('wallet_transactions')
        .select(`
          id,
          user_id,
          type,
          amount,
          source_order_id,
          remarks,
          created_at
        `, { count: 'exact' })
        .order('created_at', { ascending: false });

      // If user has a specific tenant, filter by it
      if (tenantId) {
        query = query.eq('tenant_id', tenantId);
      }

      // Apply date filters
      if (transactionFilters.dateFrom) {
        const fromDate = new Date(transactionFilters.dateFrom);
        fromDate.setHours(0, 0, 0, 0);
        query = query.gte('created_at', fromDate.toISOString());
      }
      
      if (transactionFilters.dateTo) {
        const toDate = new Date(transactionFilters.dateTo);
        toDate.setHours(23, 59, 59, 999);
        query = query.lte('created_at', toDate.toISOString());
      }

      // Apply type filter
      if (transactionFilters.type && transactionFilters.type !== 'all') {
        query = query.eq('type', transactionFilters.type);
      }

      // Apply user filter
      if (transactionFilters.userId && transactionFilters.userId !== 'all') {
        query = query.eq('user_id', transactionFilters.userId);
      }

      // Pagination
      const offset = (currentPage - 1) * pageSize;
      query = query.range(offset, offset + pageSize - 1);

      const { data, error, count } = await query;

      if (error) throw error;

      // Fetch user data for transactions
      if (data && data.length > 0) {
        const userIds = [...new Set(data.map(t => t.user_id))];
        const { data: userData } = await supabase
          .from('users')
          .select('id, first_name, last_name, username, phone')
          .in('id', userIds);
        
        if (userData) {
          const userMap: Record<string, User> = {};
          userData.forEach(user => {
            userMap[user.id] = user;
          });
          setTransactionUsers(userMap);
        }
      }

      setTransactions(data || []);
      setTotalPages(Math.ceil((count || 0) / pageSize));

      // Calculate totals for the filtered period
      const totalsQuery = supabase
        .from('wallet_transactions')
        .select('amount, type');

      // If user has a specific tenant, filter by it
      if (tenantId) {
        totalsQuery.eq('tenant_id', tenantId);
      }

      if (transactionFilters.dateFrom) {
        const fromDate = new Date(transactionFilters.dateFrom);
        fromDate.setHours(0, 0, 0, 0);
        totalsQuery.gte('created_at', fromDate.toISOString());
      }
      
      if (transactionFilters.dateTo) {
        const toDate = new Date(transactionFilters.dateTo);
        toDate.setHours(23, 59, 59, 999);
        totalsQuery.lte('created_at', toDate.toISOString());
      }

      const { data: totalsData } = await totalsQuery;
      
      if (totalsData) {
        const credit = totalsData
          .filter(t => t.amount > 0)
          .reduce((sum, t) => sum + t.amount, 0);
        const debit = totalsData
          .filter(t => t.amount < 0)
          .reduce((sum, t) => sum + Math.abs(t.amount), 0);
        
        setTotalAmount({
          credit,
          debit,
          net: credit - debit
        });
      }

    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast({
        title: "Error",
        description: "Failed to fetch transactions",
        variant: "destructive",
      });
    } finally {
      setIsLoadingTransactions(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [searchTerm]);

  useEffect(() => {
    if (transactionFilters.dateFrom && transactionFilters.dateTo) {
      fetchTransactions();
    }
  }, [transactionFilters, currentPage]);

  const handleTopUp = () => {
    const amount = parseFloat(topUpAmount);
    if (!selectedUserId || !amount || amount <= 0) {
      toast({
        title: "Validation Error",
        description: "Please select a user and enter a valid amount",
        variant: "destructive",
      });
      return;
    }

    const selectedUser = users.find(u => u.id === selectedUserId);
    
    setConfirmDialog({
      open: true,
      title: 'Add Wallet Amount',
      description: `Are you sure you want to add ₹${amount} to ${selectedUser?.first_name} ${selectedUser?.last_name}'s wallet?`,
      action: async () => {
        const success = await topUpWallet(
          selectedUserId,
          amount,
          undefined, // tenant_id will be handled in the hook
          remarks || `Wallet top-up by admin`
        );

        if (success) {
          setTopUpAmount("");
          setRemarks("");
          fetchTransactions(); // Refresh transactions
          toast({
            title: "Success",
            description: `₹${amount} added to customer's wallet`,
          });
        }
        setConfirmDialog({ open: false, title: '', description: '', action: null });
      }
    });
  };

  // Define transaction columns for DataTable
  const transactionColumns = [
    {
      accessorKey: "created_at",
      header: "Date & Time",
      cell: ({ row }: any) => {
        const date = new Date(row.getValue("created_at"));
        return (
          <div className="text-sm">
            <div>{format(date, "MMM dd, yyyy")}</div>
            <div className="text-muted-foreground">{format(date, "hh:mm a")}</div>
          </div>
        );
      },
    },
    {
      accessorKey: "user_id",
      header: "Customer",
      cell: ({ row }: any) => {
        const userId = row.getValue("user_id") as string;
        const user = transactionUsers[userId];
        return (
          <div className="text-sm">
            <div className="font-medium">{user?.first_name || 'Unknown'} {user?.last_name || 'User'}</div>
            <div className="text-muted-foreground">{user?.username || user?.phone || 'N/A'}</div>
          </div>
        );
      },
    },
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }: any) => {
        const type = row.getValue("type") as string;
        const colorMap: Record<string, string> = {
          'credit': 'bg-green-100 text-green-800',
          'debit': 'bg-red-100 text-red-800',
          'refund': 'bg-blue-100 text-blue-800',
          'cashback': 'bg-purple-100 text-purple-800',
        };
        return (
          <Badge className={colorMap[type] || 'bg-gray-100 text-gray-800'}>
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </Badge>
        );
      },
    },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }: any) => {
        const amount = row.getValue("amount") as number;
        const isPositive = amount > 0;
        return (
          <div className={`text-sm font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {isPositive ? '+' : ''}₹{Math.abs(amount).toFixed(2)}
          </div>
        );
      },
    },
    {
      accessorKey: "remarks",
      header: "Remarks",
      cell: ({ row }: any) => {
        const remarks = row.getValue("remarks") as string;
        return (
          <div className="text-sm text-muted-foreground max-w-[200px] truncate">
            {remarks || '-'}
          </div>
        );
      },
    },
    {
      accessorKey: "source_order_id",
      header: "Order ID",
      cell: ({ row }: any) => {
        const orderId = row.getValue("source_order_id") as string;
        return orderId ? (
          <Badge variant="outline" className="font-mono text-xs">
            #{orderId.slice(-8)}
          </Badge>
        ) : '-';
      },
    },
  ];

  const selectedUser = users.find(u => u.id === selectedUserId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Wallet Management</h1>
          <p className="text-muted-foreground">
            Manage customer wallet balances and view transactions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Wallet className="h-5 w-5 text-green-600" />
          <span className="text-sm text-muted-foreground">Digital Wallet System</span>
        </div>
      </div>

      <Tabs defaultValue="add-balance" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="add-balance" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Balance
          </TabsTrigger>
          <TabsTrigger value="transactions" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Transactions
          </TabsTrigger>
        </TabsList>

        {/* Add Balance Tab */}
        <TabsContent value="add-balance">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="h-5 w-5" />
                    Add Wallet Amount
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="user-search">Search Customer</Label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="user-search"
                          placeholder="Search by name, username, or phone..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-9"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="user-select">Select Customer</Label>
                      <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a customer" />
                        </SelectTrigger>
                        <SelectContent>
                          {isLoadingUsers ? (
                            <SelectItem value="loading" disabled>Loading customers...</SelectItem>
                          ) : users.length === 0 ? (
                            <SelectItem value="no-users" disabled>No customers found</SelectItem>
                          ) : (
                            users.map((user) => (
                              <SelectItem key={user.id} value={user.id}>
                                <div className="flex items-center gap-2">
                                  <Users className="h-3 w-3" />
                                  <span>{user.first_name} {user.last_name}</span>
                                  <span className="text-xs text-muted-foreground">
                                    ({user.username || user.phone})
                                  </span>
                                </div>
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {selectedUser && (
                    <Card className="bg-blue-50 border-blue-200">
                      <CardContent className="pt-4">
                        <div className="space-y-2">
                          <div className="font-medium text-blue-900">
                            {selectedUser.first_name} {selectedUser.last_name}
                          </div>
                          <div className="text-sm text-blue-700 space-y-1">
                            <div>Username: {selectedUser.username}</div>
                            <div>Phone: {selectedUser.phone}</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="amount">Amount (₹)</Label>
                      <Input
                        id="amount"
                        type="number"
                        min="0"
                        step="0.01"
                        value={topUpAmount}
                        onChange={(e) => setTopUpAmount(e.target.value)}
                        placeholder="Enter amount to add"
                      />
                    </div>

                    <div>
                      <Label htmlFor="remarks">Remarks (Optional)</Label>
                      <Input
                        id="remarks"
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                        placeholder="Reason for wallet credit"
                      />
                    </div>
                  </div>

                  <Button
                    onClick={handleTopUp}
                    disabled={isLoading || !selectedUserId || !topUpAmount}
                    className="w-full"
                    size="lg"
                  >
                    <Wallet className="h-4 w-4 mr-2" />
                    {isLoading ? 'Processing...' : `Add ₹${topUpAmount || '0'} to Wallet`}
                  </Button>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="text-sm text-yellow-800">
                      <div className="font-medium mb-2">Wallet System Rules:</div>
                      <ul className="space-y-1 text-xs">
                        <li>• Wallet balance can only be used within the app</li>
                        <li>• No cash withdrawals allowed</li>
                        <li>• Refunds and cashbacks are credited to wallet</li>
                        <li>• Balance is used first during checkout</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-1">
              {selectedUserId ? (
                <WalletBalance 
                  userId={selectedUserId} 
                  showTransactions={true}
                />
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <History className="h-4 w-4" />
                      Customer Wallet
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8 text-muted-foreground">
                      <Wallet className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Select a customer to view wallet details</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Transactions Tab */}
        <TabsContent value="transactions" className="space-y-6">
          {/* Today's Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <div className="text-sm font-medium">Total Credits</div>
                </div>
                <div className="text-2xl font-bold text-green-600">
                  ₹{totalAmount.credit.toFixed(2)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-red-600 rotate-180" />
                  <div className="text-sm font-medium">Total Debits</div>
                </div>
                <div className="text-2xl font-bold text-red-600">
                  ₹{totalAmount.debit.toFixed(2)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-blue-600" />
                  <div className="text-sm font-medium">Net Amount</div>
                </div>
                <div className={`text-2xl font-bold ${totalAmount.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ₹{totalAmount.net.toFixed(2)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-purple-600" />
                  <div className="text-sm font-medium">Period</div>
                </div>
                <div className="text-sm text-muted-foreground">
                  {format(transactionFilters.dateFrom, "MMM dd")} - {format(transactionFilters.dateTo, "MMM dd, yyyy")}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div>
                  <Label>From Date</Label>
                  <DatePicker
                    date={transactionFilters.dateFrom}
                    setDate={(date) => setTransactionFilters(prev => ({ ...prev, dateFrom: date || new Date() }))}
                  />
                </div>

                <div>
                  <Label>To Date</Label>
                  <DatePicker
                    date={transactionFilters.dateTo}
                    setDate={(date) => setTransactionFilters(prev => ({ ...prev, dateTo: date || new Date() }))}
                  />
                </div>

                <div>
                  <Label>Transaction Type</Label>
                  <Select
                    value={transactionFilters.type}
                    onValueChange={(value) => setTransactionFilters(prev => ({ ...prev, type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="credit">Credit</SelectItem>
                      <SelectItem value="debit">Debit</SelectItem>
                      <SelectItem value="refund">Refund</SelectItem>
                      <SelectItem value="cashback">Cashback</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Customer</Label>
                  <Select
                    value={transactionFilters.userId}
                    onValueChange={(value) => setTransactionFilters(prev => ({ ...prev, userId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All customers" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Customers</SelectItem>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.first_name} {user.last_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end">
                  <Button
                    onClick={() => {
                      setCurrentPage(1);
                      fetchTransactions();
                    }}
                    className="w-full"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Apply Filters
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Transactions Table */}
          <Card>
            <CardHeader>
              <CardTitle>Wallet Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={transactionColumns}
                data={transactions}
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                showPagination={true}
                isLoading={isLoadingTransactions}
                permissions={{ canAdd: false, canEdit: false, canDelete: false }}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ConfirmationDialog
        open={confirmDialog.open}
        onOpenChange={(open) => !open && setConfirmDialog({ open: false, title: '', description: '', action: null })}
        onConfirm={() => confirmDialog.action?.()}
        title={confirmDialog.title}
        description={confirmDialog.description}
        confirmText="Add Amount"
        cancelText="Cancel"
        variant="default"
      />
    </div>
  );
};

export default WalletManagement;