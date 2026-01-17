import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle2, Clock, ChefHat, Truck, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const statusSteps = [
  { key: "pending", label: "Order Placed", icon: CheckCircle2 },
  { key: "confirmed", label: "Preparing", icon: ChefHat },
  { key: "ready", label: "Ready", icon: Package },
  { key: "delivered", label: "Delivered", icon: Truck },
];

export default function OrderTracking() {
  const { orderId, tableId } = useParams();
  const { toast } = useToast();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrder();
    const subscription = supabase
      .channel(`order-${orderId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `id=eq.${orderId}`,
        },
        (payload) => {
          setOrder(payload.new);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [orderId]);

  const loadOrder = async () => {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .single();

      if (error) throw error;
      setOrder(data);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const getCurrentStepIndex = () => {
    if (!order) return 0;
    return statusSteps.findIndex(step => step.key === order.status);
  };

  const currentStepIndex = getCurrentStepIndex();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity }}>
          <Clock className="w-16 h-16 text-primary" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-6">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <div className="glass-card text-center space-y-2">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center"
          >
            <CheckCircle2 className="w-8 h-8 text-white" />
          </motion.div>
          <h1 className="text-2xl font-bold text-white">Order Placed!</h1>
          <p className="text-gray-400">Order #{order?.orderno}</p>
          <p className="text-sm text-gray-500">Table #{tableId}</p>
        </div>

        {/* Order Status */}
        <div className="glass-card space-y-6">
          {statusSteps.map((step, index) => {
            const Icon = step.icon;
            const isCompleted = index <= currentStepIndex;
            const isCurrent = index === currentStepIndex;

            return (
              <motion.div
                key={step.key}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="relative"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                      isCompleted
                        ? "bg-gradient-to-br from-primary to-purple-500"
                        : "bg-white/10"
                    }`}
                  >
                    <Icon className={`w-6 h-6 ${isCompleted ? "text-white" : "text-gray-500"}`} />
                  </div>

                  <div className="flex-1">
                    <p className={`font-medium ${isCompleted ? "text-white" : "text-gray-500"}`}>
                      {step.label}
                    </p>
                    {isCurrent && (
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-sm text-primary"
                      >
                        In Progress
                      </motion.p>
                    )}
                  </div>

                  {isCurrent && (
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                      className="w-3 h-3 rounded-full bg-primary"
                    />
                  )}
                </div>

                {index < statusSteps.length - 1 && (
                  <div
                    className={`absolute left-6 top-12 w-0.5 h-12 transition-colors ${
                      isCompleted ? "bg-primary" : "bg-white/20"
                    }`}
                  />
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Order Details */}
        <div className="glass-card space-y-3">
          <h3 className="font-semibold text-white">Order Details</h3>
          <div className="flex justify-between text-gray-300">
            <span>Subtotal</span>
            <span>₹{order?.subtotal?.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-gray-300">
            <span>Tax & Service Charge</span>
            <span>₹{((order?.tax_amount || 0) + (order?.service_charge || 0)).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-xl font-bold text-white border-t border-white/20 pt-3">
            <span>Total</span>
            <span>₹{order?.total_amount?.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
