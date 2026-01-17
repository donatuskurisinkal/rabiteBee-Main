import React, { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet, History, TrendingUp } from "lucide-react";
import { useWallet } from "@/hooks/useWallet";
import { Badge } from "@/components/ui/badge";

interface WalletBalanceProps {
  userId: string;
  showTransactions?: boolean;
}

export function WalletBalance({ userId, showTransactions = false }: WalletBalanceProps) {
  const { wallet, transactions, isLoading, fetchWallet, fetchTransactions } = useWallet();

  useEffect(() => {
    if (userId) {
      fetchWallet(userId);
      if (showTransactions) {
        fetchTransactions(userId);
      }
    }
  }, [userId, showTransactions]);

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'top_up':
        return <TrendingUp className="h-3 w-3 text-green-600" />;
      case 'order_payment':
        return <Wallet className="h-3 w-3 text-red-600" />;
      case 'refund':
        return <TrendingUp className="h-3 w-3 text-blue-600" />;
      case 'cashback':
        return <TrendingUp className="h-3 w-3 text-purple-600" />;
      default:
        return <Wallet className="h-3 w-3" />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'top_up':
      case 'refund':
      case 'cashback':
        return 'text-green-600';
      case 'order_payment':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const formatTransactionType = (type: string) => {
    switch (type) {
      case 'top_up':
        return 'Top Up';
      case 'order_payment':
        return 'Order Payment';
      case 'refund':
        return 'Refund';
      case 'cashback':
        return 'Cashback';
      default:
        return type;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            Wallet Balance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-8 w-24 mb-4 bg-gray-200 animate-pulse rounded" />
          <div className="h-4 w-32 bg-gray-200 animate-pulse rounded" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            Wallet Balance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            ₹{wallet?.balance?.toFixed(2) || '0.00'}
          </div>
          <div className="text-sm text-muted-foreground">
            Available for orders
          </div>
        </CardContent>
      </Card>

      {showTransactions && transactions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-4 w-4" />
              Recent Transactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {transactions.slice(0, 10).map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-gray-50"
                >
                  <div className="flex items-center gap-2">
                    {getTransactionIcon(transaction.type)}
                    <div>
                      <div className="text-sm font-medium">
                        {formatTransactionType(transaction.type)}
                      </div>
                      {transaction.remarks && (
                        <div className="text-xs text-muted-foreground">
                          {transaction.remarks}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-semibold ${getTransactionColor(transaction.type)}`}>
                      {transaction.type === 'order_payment' ? '-' : '+'}₹{Math.abs(transaction.amount).toFixed(2)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(transaction.created_at).toLocaleDateString()}
                    </div>
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