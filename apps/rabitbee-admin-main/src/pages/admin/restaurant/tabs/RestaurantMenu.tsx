import { Card, CardContent } from "@/components/ui/card";

interface RestaurantMenuProps {
  restaurantId: string;
}

export default function RestaurantMenu({ restaurantId }: RestaurantMenuProps) {
  return (
    <Card className="glass-card">
      <CardContent className="pt-6">
        <p className="text-muted-foreground">Menu management coming soon...</p>
        <p className="text-sm text-muted-foreground mt-2">Restaurant ID: {restaurantId}</p>
      </CardContent>
    </Card>
  );
}
