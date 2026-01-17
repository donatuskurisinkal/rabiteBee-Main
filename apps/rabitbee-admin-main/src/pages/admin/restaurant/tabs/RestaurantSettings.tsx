import { Card, CardContent } from "@/components/ui/card";

interface RestaurantSettingsProps {
  restaurant: any;
  onUpdate: (restaurant: any) => void;
}

export default function RestaurantSettings({ restaurant, onUpdate }: RestaurantSettingsProps) {
  return (
    <Card className="glass-card">
      <CardContent className="pt-6">
        <p className="text-muted-foreground">Restaurant settings coming soon...</p>
        <p className="text-sm text-muted-foreground mt-2">Restaurant: {restaurant?.name}</p>
      </CardContent>
    </Card>
  );
}
