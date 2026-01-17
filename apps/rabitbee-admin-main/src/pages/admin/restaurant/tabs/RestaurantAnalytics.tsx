import { Card, CardContent } from "@/components/ui/card";

interface RestaurantAnalyticsProps {
  restaurantId: string;
}

export default function RestaurantAnalytics({ restaurantId }: RestaurantAnalyticsProps) {
  return (
    <Card className="glass-card">
      <CardContent className="pt-6">
        <p className="text-muted-foreground">Analytics dashboard coming soon...</p>
        <p className="text-sm text-muted-foreground mt-2">Restaurant ID: {restaurantId}</p>
      </CardContent>
    </Card>
  );
}
