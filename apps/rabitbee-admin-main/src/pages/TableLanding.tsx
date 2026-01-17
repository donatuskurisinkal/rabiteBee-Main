import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { ChefHat, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useTableCart } from "@/hooks/useTableCart";
import CartFloatingBar from "@/components/CartFloatingBar";

export default function TableLanding() {
  const { tableId, restaurantId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { getCartItems } = useTableCart();
  const [restaurant, setRestaurant] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [cartItems, setCartItems] = useState<any[]>([]);

  useEffect(() => {
    loadRestaurant();
    loadCartItems();
  }, [restaurantId, tableId]);

  const loadCartItems = async () => {
    if (!tableId) return;
    const items = await getCartItems(tableId, tableId);
    setCartItems(items);
  };

  const loadRestaurant = async () => {
    try {
      const { data, error } = await supabase
        .from("restaurants")
        .select("*")
        .eq("id", restaurantId)
        .single();

      if (error) throw error;
      setRestaurant(data);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load restaurant details",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <ChefHat className="w-16 h-16 text-primary" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex flex-col items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="glass-card p-8 text-center space-y-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center"
          >
            <ChefHat className="w-10 h-10 text-white" />
          </motion.div>

          <div className="space-y-2">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
              Welcome to
            </h1>
            <h2 className="text-4xl font-bold text-white">
              {restaurant?.name}
            </h2>
          </div>

          <div className="flex items-center justify-center gap-2 text-blue-200">
            <Sparkles className="w-5 h-5" />
            <span className="text-lg">Table #{tableId}</span>
          </div>

          <p className="text-gray-300 text-sm">
            {restaurant?.description || "Experience premium dining with our curated menu"}
          </p>

          <Button
            size="lg"
            className="w-full glow-button text-lg h-14"
            onClick={() => navigate(`/table/${tableId}/restaurant/${restaurantId}/menu`)}
          >
            <motion.span
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              Start Ordering
            </motion.span>
          </Button>
        </div>
      </motion.div>

      {cartItems.length > 0 && (
        <CartFloatingBar
          totalItems={cartItems.reduce((sum, item) => sum + item.quantity, 0)}
          totalAmount={cartItems.reduce(
            (sum, item) => sum + (item.offer_price || item.price) * item.quantity,
            0
          )}
          tableId={tableId!}
          restaurantId={restaurantId!}
        />
      )}
    </div>
  );
}
