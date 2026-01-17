import { useMemo } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, Clock, CheckCircle, XCircle, ChefHat, UtensilsCrossed } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useState } from "react";
import { OrderCard } from "./OrderCard";

interface Order {
  id: string;
  table_number: string;
  status: string;
  total_amount: number;
  created_at: string;
  order_items: any[];
  [key: string]: any;
}

interface OrderKanbanBoardProps {
  orders: Order[];
  newOrderIds: Set<string>;
  onStatusChange: (orderId: string, newStatus: string) => void;
  onRejectOrder: (orderId: string, order: Order) => void;
}

const STATUS_COLUMNS = [
  {
    id: "pending",
    title: "Pending",
    icon: Clock,
    color: "text-yellow-600",
    bgColor: "bg-yellow-50 dark:bg-yellow-950/20",
    borderColor: "border-yellow-200 dark:border-yellow-800",
  },
  {
    id: "accepted",
    title: "Accepted",
    icon: CheckCircle,
    color: "text-blue-600",
    bgColor: "bg-blue-50 dark:bg-blue-950/20",
    borderColor: "border-blue-200 dark:border-blue-800",
  },
  {
    id: "preparing",
    title: "Preparing",
    icon: ChefHat,
    color: "text-orange-600",
    bgColor: "bg-orange-50 dark:bg-orange-950/20",
    borderColor: "border-orange-200 dark:border-orange-800",
  },
  {
    id: "ready",
    title: "Ready",
    icon: UtensilsCrossed,
    color: "text-green-600",
    bgColor: "bg-green-50 dark:bg-green-950/20",
    borderColor: "border-green-200 dark:border-green-800",
  },
];

export function OrderKanbanBoard({
  orders,
  newOrderIds,
  onStatusChange,
  onRejectOrder,
}: OrderKanbanBoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const ordersByStatus = useMemo(() => {
    const grouped: Record<string, Order[]> = {
      pending: [],
      accepted: [],
      preparing: [],
      ready: [],
    };

    orders.forEach((order) => {
      if (grouped[order.status]) {
        grouped[order.status].push(order);
      }
    });

    return grouped;
  }, [orders]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) {
      setActiveId(null);
      return;
    }

    const orderId = active.id as string;
    const newStatus = over.id as string;

    // Find the order
    const order = orders.find((o) => o.id === orderId);
    if (order && order.status !== newStatus) {
      onStatusChange(orderId, newStatus);
    }

    setActiveId(null);
  };

  const activeOrder = activeId ? orders.find((o) => o.id === activeId) : null;

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {STATUS_COLUMNS.map((column) => {
          const columnOrders = ordersByStatus[column.id];
          const Icon = column.icon;

          return (
            <div key={column.id} className="flex flex-col h-full">
              <Card className={`glass-card border-2 ${column.borderColor} flex-1 flex flex-col`}>
                <CardHeader className={`pb-3 ${column.bgColor}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className={`h-5 w-5 ${column.color}`} />
                      <CardTitle className="text-base font-semibold">
                        {column.title}
                      </CardTitle>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {columnOrders.length}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-4 flex-1 overflow-y-auto max-h-[calc(100vh-300px)]">
                  <SortableContext
                    id={column.id}
                    items={columnOrders.map((o) => o.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-3">
                      {columnOrders.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground text-sm">
                          No orders
                        </div>
                      ) : (
                        columnOrders.map((order) => (
                          <OrderCard
                            key={order.id}
                            order={order}
                            isNew={newOrderIds.has(order.id)}
                            onStatusChange={onStatusChange}
                            onRejectOrder={onRejectOrder}
                          />
                        ))
                      )}
                    </div>
                  </SortableContext>
                </CardContent>
              </Card>
            </div>
          );
        })}
      </div>

      <DragOverlay>
        {activeOrder ? (
          <div className="rotate-3 opacity-80">
            <OrderCard
              order={activeOrder}
              isNew={newOrderIds.has(activeOrder.id)}
              onStatusChange={onStatusChange}
              onRejectOrder={onRejectOrder}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
