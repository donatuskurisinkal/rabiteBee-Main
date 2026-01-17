import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface WalletTransaction {
  id: string;
  user_id: string;
  type: 'top_up' | 'order_payment' | 'refund' | 'cashback';
  amount: number;
  source_order_id?: string;
  remarks?: string;
  created_at: string;
  tenant_id?: string;
}

export interface Wallet {
  user_id: string;
  balance: number;
  last_updated: string;
  created_at: string;
}

export function useWallet() {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Fetch wallet balance
  const fetchWallet = async (userId?: string) => {
    setIsLoading(true);
    try {
      const actualUserId = userId || (await supabase.auth.getUser()).data.user?.id;
      if (!actualUserId) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', actualUserId)
        .maybeSingle();

      if (error) throw error;
      setWallet(data);
      return data;
    } catch (error) {
      console.error('Error fetching wallet:', error);
      toast({
        title: "Error",
        description: "Failed to fetch wallet balance",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch wallet transactions
  const fetchTransactions = async (userId?: string) => {
    setIsLoading(true);
    try {
      const actualUserId = userId || (await supabase.auth.getUser()).data.user?.id;
      if (!actualUserId) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('user_id', actualUserId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setTransactions((data || []) as WalletTransaction[]);
      return data;
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast({
        title: "Error",
        description: "Failed to fetch wallet transactions",
        variant: "destructive",
      });
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  // Process order payment using wallet
  const processOrderPayment = async (
    userId: string,
    orderAmount: number,
    orderId: string,
    tenantId?: string
  ): Promise<{ success: boolean; walletUsed: number; remainingAmount: number }> => {
    try {
      // Get current wallet balance
      const currentWallet = await fetchWallet(userId);
      if (!currentWallet) {
        return { success: false, walletUsed: 0, remainingAmount: orderAmount };
      }

      const availableBalance = currentWallet.balance;
      const walletUsed = Math.min(availableBalance, orderAmount);
      const remainingAmount = orderAmount - walletUsed;

      if (walletUsed > 0) {
        // Use the database function to safely update wallet
        const { data, error } = await supabase.rpc('update_wallet_balance', {
          p_user_id: userId,
          p_amount: -walletUsed,
          p_transaction_type: 'order_payment',
          p_source_order_id: orderId,
          p_remarks: `Payment for order #${orderId.slice(-8)}`,
          p_tenant_id: tenantId
        });

        if (error) throw error;
        if (!data) {
          throw new Error('Insufficient wallet balance');
        }

        // Refresh wallet data
        await fetchWallet(userId);

        toast({
          title: "Success",
          description: `₹${walletUsed} deducted from wallet${remainingAmount > 0 ? `. Pay ₹${remainingAmount} via other methods.` : '.'}`,
        });

        return { success: true, walletUsed, remainingAmount };
      }

      return { success: true, walletUsed: 0, remainingAmount: orderAmount };
    } catch (error) {
      console.error('Error processing wallet payment:', error);
      toast({
        title: "Error",
        description: "Failed to process wallet payment",
        variant: "destructive",
      });
      return { success: false, walletUsed: 0, remainingAmount: orderAmount };
    }
  };

  // Process refund to wallet
  const processRefund = async (
    userId: string,
    refundAmount: number,
    orderId: string,
    tenantId?: string,
    remarks?: string
  ): Promise<boolean> => {
    try {
      const { data, error } = await supabase.rpc('update_wallet_balance', {
        p_user_id: userId,
        p_amount: refundAmount,
        p_transaction_type: 'refund',
        p_source_order_id: orderId,
        p_remarks: remarks || `Refund for order #${orderId.slice(-8)}`,
        p_tenant_id: tenantId
      });

      if (error) throw error;

      // Refresh wallet data
      await fetchWallet(userId);

      toast({
        title: "Refund Processed",
        description: `₹${refundAmount} has been credited to wallet`,
      });

      return true;
    } catch (error) {
      console.error('Error processing refund:', error);
      toast({
        title: "Error",
        description: "Failed to process refund",
        variant: "destructive",
      });
      return false;
    }
  };

  // Add cashback to wallet
  const addCashback = async (
    userId: string,
    cashbackAmount: number,
    orderId?: string,
    tenantId?: string,
    remarks?: string
  ): Promise<boolean> => {
    try {
      const { data, error } = await supabase.rpc('update_wallet_balance', {
        p_user_id: userId,
        p_amount: cashbackAmount,
        p_transaction_type: 'cashback',
        p_source_order_id: orderId,
        p_remarks: remarks || 'Cashback earned',
        p_tenant_id: tenantId
      });

      if (error) throw error;

      // Refresh wallet data
      await fetchWallet(userId);

      toast({
        title: "Cashback Added",
        description: `₹${cashbackAmount} cashback credited to wallet`,
      });

      return true;
    } catch (error) {
      console.error('Error adding cashback:', error);
      toast({
        title: "Error",
        description: "Failed to add cashback",
        variant: "destructive",
      });
      return false;
    }
  };

  // Top up wallet (for admin use)
  const topUpWallet = async (
    userId: string,
    topUpAmount: number,
    tenantId?: string,
    remarks?: string
  ): Promise<boolean> => {
    try {
      const { data, error } = await supabase.rpc('update_wallet_balance', {
        p_user_id: userId,
        p_amount: topUpAmount,
        p_transaction_type: 'top_up',
        p_source_order_id: null,
        p_remarks: remarks || 'Wallet top-up',
        p_tenant_id: tenantId
      });

      if (error) throw error;

      // Refresh wallet data
      await fetchWallet(userId);

      toast({
        title: "Wallet Topped Up",
        description: `₹${topUpAmount} added to wallet`,
      });

      return true;
    } catch (error) {
      console.error('Error topping up wallet:', error);
      toast({
        title: "Error",
        description: "Failed to top up wallet",
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    wallet,
    transactions,
    isLoading,
    fetchWallet,
    fetchTransactions,
    processOrderPayment,
    processRefund,
    addCashback,
    topUpWallet
  };
}