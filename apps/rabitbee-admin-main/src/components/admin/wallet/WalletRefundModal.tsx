import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Wallet, CreditCard, AlertCircle } from "lucide-react";
import { useWallet } from "@/hooks/useWallet";
import { ConfirmationDialog } from "@/components/admin/ConfirmationDialog";

interface WalletRefundModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: any;
  onSuccess: () => void;
}

export function WalletRefundModal({
  open,
  onOpenChange,
  order,
  onSuccess
}: WalletRefundModalProps) {
  const [refundAmount, setRefundAmount] = useState(order?.total_amount || 0);
  const [remarks, setRemarks] = useState('');
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: '',
    description: '',
    action: null as (() => void) | null
  });

  const { processRefund, isLoading } = useWallet();

  const handleRefund = () => {
    if (refundAmount <= 0) {
      return;
    }

    setConfirmDialog({
      open: true,
      title: 'Process Refund to Wallet',
      description: `Are you sure you want to refund ₹${refundAmount} to the customer's wallet? This action cannot be undone.`,
      action: async () => {
        const success = await processRefund(
          order.user_id,
          refundAmount,
          order.id,
          order.tenantId,
          remarks || `Refund for cancelled order #${order.id.slice(-8)}`
        );

        if (success) {
          onSuccess();
          onOpenChange(false);
        }
        setConfirmDialog({ open: false, title: '', description: '', action: null });
      }
    });
  };

  const maxRefundAmount = order?.total_amount || 0;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Refund to Wallet
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Order Details */}
            <Card>
              <CardContent className="pt-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Order ID:</span>
                    <span className="font-mono">#{order?.id?.slice(-8)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Original Amount:</span>
                    <span className="font-semibold">₹{maxRefundAmount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Payment Method:</span>
                    <span className="flex items-center gap-1">
                      <CreditCard className="h-3 w-3" />
                      {order?.payment_mode || 'Card/UPI'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Refund Amount */}
            <div className="space-y-2">
              <Label htmlFor="refund-amount">Refund Amount</Label>
              <Input
                id="refund-amount"
                type="number"
                min="0"
                max={maxRefundAmount}
                step="0.01"
                value={refundAmount}
                onChange={(e) => setRefundAmount(parseFloat(e.target.value) || 0)}
                placeholder="Enter refund amount"
              />
              {refundAmount > maxRefundAmount && (
                <div className="flex items-center gap-1 text-sm text-red-600">
                  <AlertCircle className="h-3 w-3" />
                  Refund amount cannot exceed order total
                </div>
              )}
            </div>

            {/* Remarks */}
            <div className="space-y-2">
              <Label htmlFor="remarks">Remarks (Optional)</Label>
              <Textarea
                id="remarks"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Reason for refund..."
                rows={3}
              />
            </div>

            {/* Refund Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="text-sm text-blue-800">
                <div className="font-medium mb-1">Refund Process:</div>
                <ul className="space-y-1 text-xs">
                  <li>• Amount will be credited to customer's wallet</li>
                  <li>• Customer can use wallet balance for future orders</li>
                  <li>• Wallet balance cannot be withdrawn as cash</li>
                  <li>• Refund will be processed instantly</li>
                </ul>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1"
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleRefund}
                disabled={isLoading || refundAmount <= 0 || refundAmount > maxRefundAmount}
                className="flex-1"
              >
                <Wallet className="h-4 w-4 mr-2" />
                {isLoading ? 'Processing...' : `Refund ₹${refundAmount}`}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmationDialog
        open={confirmDialog.open}
        onOpenChange={(open) => !open && setConfirmDialog({ open: false, title: '', description: '', action: null })}
        onConfirm={() => confirmDialog.action?.()}
        title={confirmDialog.title}
        description={confirmDialog.description}
        confirmText="Process Refund"
        cancelText="Cancel"
        variant="default"
      />
    </>
  );
}