import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UtensilsCrossed, Bike, History } from "lucide-react";
import TableOrders from "./TableOrders";
import DeliveryOrders from "./DeliveryOrders";
import OrderHistory from "./OrderHistory";

interface RestaurantOrdersProps {
  restaurantId: string;
}

export default function RestaurantOrders({ restaurantId }: RestaurantOrdersProps) {
  return (
    <Tabs defaultValue="table" className="space-y-4">
      <TabsList className="glass-card">
        <TabsTrigger value="table" className="gap-2">
          <UtensilsCrossed className="h-4 w-4" />
          Table Orders
        </TabsTrigger>
        <TabsTrigger value="delivery" className="gap-2">
          <Bike className="h-4 w-4" />
          Delivery Orders
        </TabsTrigger>
        <TabsTrigger value="history" className="gap-2">
          <History className="h-4 w-4" />
          History
        </TabsTrigger>
      </TabsList>

      <TabsContent value="table">
        <TableOrders restaurantId={restaurantId} />
      </TabsContent>

      <TabsContent value="delivery">
        <DeliveryOrders restaurantId={restaurantId} />
      </TabsContent>

      <TabsContent value="history">
        <OrderHistory restaurantId={restaurantId} />
      </TabsContent>
    </Tabs>
  );
}
