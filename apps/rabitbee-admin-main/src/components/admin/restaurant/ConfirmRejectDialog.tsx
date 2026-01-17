import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ConfirmRejectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  orderDetails: {
    tableNumber?: string | number;
    orderNumber?: string;
    amount?: number;
  };
}

export function ConfirmRejectDialog({ 
  open, 
  onOpenChange, 
  onConfirm, 
  orderDetails 
}: ConfirmRejectDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Reject Order?</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to reject this order? This action cannot be undone.
            {orderDetails.tableNumber && (
              <div className="mt-2 space-y-1">
                <p className="font-medium text-foreground">
                  {orderDetails.orderNumber 
                    ? `Order #${orderDetails.orderNumber}` 
                    : `Table #${orderDetails.tableNumber}`}
                </p>
                {orderDetails.amount && (
                  <p className="text-sm">Amount: ₹{orderDetails.amount}</p>
                )}
              </div>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Reject Order
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
