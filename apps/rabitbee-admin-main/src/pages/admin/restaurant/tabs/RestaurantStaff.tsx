import { Card, CardContent } from "@/components/ui/card";

interface RestaurantStaffProps {
  restaurantId: string;
}

export default function RestaurantStaff({ restaurantId }: RestaurantStaffProps) {
  return (
    <Card className="glass-card">
      <CardContent className="pt-6">
        <p className="text-muted-foreground">Staff management coming soon...</p>
        <p className="text-sm text-muted-foreground mt-2">Restaurant ID: {restaurantId}</p>
      </CardContent>
    </Card>
  );
}
