
import { useEffect } from "react";
import { RestaurantsList } from "@/components/RestaurantsList";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ensureStorageBucket } from "@/utils/storageHelpers";

export default function RestaurantsPage() {
  // Initialize the storage bucket when the page loads
  useEffect(() => {
    const initStorage = async () => {
      await ensureStorageBucket("restaurants");
    };
    
    initStorage();
  }, []);

  return (
    <div className="container mx-auto py-8">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Restaurants</CardTitle>
        </CardHeader>
        <CardContent>
          <RestaurantsList />
        </CardContent>
      </Card>
    </div>
  );
}
