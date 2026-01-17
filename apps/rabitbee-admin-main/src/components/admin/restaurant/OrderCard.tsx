import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, GripVertical, Clock, CheckCircle, XCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Order {
  id: string;
  table_number: string;
  status: string;
  total_amount: number;
  created_at: string;
  order_items: any[];
  [key: string]: any;
}

interface OrderCardProps {
  order: Order;
  isNew: boolean;
  onStatusChange: (orderId: string, status: string) => void;
  onRejectOrder: (orderId: string, order: Order) => void;
}

export function OrderCard({
  order,
  isNew,
  onStatusChange,
  onRejectOrder,
}: OrderCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: order.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`
        glass-card overflow-hidden cursor-grab active:cursor-grabbing
        ${isDragging ? "opacity-50 shadow-lg" : ""}
        ${isNew ? "ring-2 ring-primary animate-pulse" : ""}
        hover:shadow-md transition-all
      `}
    >
      <CardContent className="p-4 space-y-3">
        {/* Header with drag handle */}
        <div className="flex items-start gap-2">
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing touch-none mt-1"
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {isNew && (
                <Bell className="h-3 w-3 text-primary animate-bounce flex-shrink-0" />
              )}
              <h4 className="font-semibold text-sm truncate">
                Table #{order.table_number}
              </h4>
            </div>
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}
            </p>
          </div>
        </div>

        {/* Order Items */}
        <div className="space-y-1">
          {order.order_items?.slice(0, 3).map((item: any, idx: number) => (
            <div key={idx} className="flex justify-between text-xs">
              <span className="truncate flex-1">
                {item.quantity}x {item.itemName}
              </span>
              <span className="font-medium flex-shrink-0 ml-2">
                ₹{item.price * item.quantity}
              </span>
            </div>
          ))}
          {order.order_items?.length > 3 && (
            <p className="text-xs text-muted-foreground">
              +{order.order_items.length - 3} more items
            </p>
          )}
        </div>

        {/* Total */}
        <div className="border-t pt-2">
          <div className="flex justify-between text-sm font-bold">
            <span>Total</span>
            <span>₹{order.total_amount}</span>
          </div>
        </div>

        {/* Action Buttons */}
        {order.status === "pending" && (
          <div className="flex gap-2 pt-2">
            <Button
              onClick={() => onStatusChange(order.id, "accepted")}
              size="sm"
              className="flex-1 h-8 text-xs gap-1"
            >
              <CheckCircle className="h-3 w-3" />
              Accept
            </Button>
            <Button
              onClick={() => onRejectOrder(order.id, order)}
              variant="destructive"
              size="sm"
              className="flex-1 h-8 text-xs gap-1"
            >
              <XCircle className="h-3 w-3" />
              Reject
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
