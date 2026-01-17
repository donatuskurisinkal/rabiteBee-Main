import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Clock, CheckCircle2, ChefHat, UtensilsCrossed } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Separator } from "@/components/ui/separator";

type OrderStatus = 'pending' | 'preparing' | 'served' | 'completed';

const statusConfig = {
  pending: {
    icon: Clock,
    label: 'Order Received',
    color: 'from-amber-400 to-orange-500',
    bg: 'from-amber-50 to-orange-50'
  },
  preparing: {
    icon: ChefHat,
    label: 'Preparing',
    color: 'from-blue-400 to-indigo-500',
    bg: 'from-blue-50 to-indigo-50'
  },
  served: {
    icon: UtensilsCrossed,
    label: 'Served',
    color: 'from-purple-400 to-pink-500',
    bg: 'from-purple-50 to-pink-50'
  },
  completed: {
    icon: CheckCircle2,
    label: 'Completed',
    color: 'from-green-400 to-emerald-500',
    bg: 'from-green-50 to-emerald-50'
  }
};

export default function TableOrderStatus() {
  const { tableId, restaurantId, orderId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrder();
    
    // Subscribe to order updates
    const channel = supabase
      .channel('table-order-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'table_orders',
          filter: `id=eq.${orderId}`
        },
        (payload) => {
          setOrder(payload.new);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId]);

  const loadOrder = async () => {
    try {
      const { data, error } = await supabase
        .from('table_orders')
        .select('*')
        .eq('id', orderId)
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity }}>
          <Clock className="w-16 h-16 text-primary" />
        </motion.div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Order not found</h2>
          <Button onClick={() => navigate(-1)}>Go Back</Button>
        </div>
      </div>
    );
  }

  const currentStatus = order.status as OrderStatus;
  const StatusIcon = statusConfig[currentStatus].icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="sticky top-0 z-40 backdrop-blur-xl bg-gradient-to-b from-slate-900/95 via-purple-900/90 to-transparent border-b border-white/10">
        <div className="flex items-center gap-4 p-5">
          <motion.button 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate(`/table/${tableId}/restaurant/${restaurantId}/menu`)} 
            className="text-white bg-white/10 hover:bg-white/20 p-2 rounded-full backdrop-blur-md transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </motion.button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent">
              Order Status
            </h1>
            <p className="text-sm text-purple-300">Table #{tableId}</p>
          </div>
        </div>
      </div>

      <div className="p-5 space-y-6">
        {/* Status Card */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative group"
        >
          <div className={`absolute -inset-0.5 bg-gradient-to-r ${statusConfig[currentStatus].color} rounded-3xl opacity-20 group-hover:opacity-30 blur-xl transition-opacity`} />
          
          <div className={`relative bg-gradient-to-br ${statusConfig[currentStatus].bg} backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/20`}>
            <div className="flex flex-col items-center text-center">
              <motion.div
                animate={{ 
                  scale: [1, 1.1, 1],
                  rotate: currentStatus === 'preparing' ? [0, 10, -10, 0] : 0
                }}
                transition={{ duration: 2, repeat: Infinity }}
                className={`w-24 h-24 rounded-full bg-gradient-to-br ${statusConfig[currentStatus].color} flex items-center justify-center mb-6 shadow-2xl`}
              >
                <StatusIcon className="w-12 h-12 text-white" />
              </motion.div>
              
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                {statusConfig[currentStatus].label}
              </h2>
              
              {currentStatus === 'pending' && (
                <p className="text-gray-600">Your order has been received and will be prepared shortly</p>
              )}
              {currentStatus === 'preparing' && (
                <p className="text-gray-600">Our chefs are preparing your delicious meal</p>
              )}
              {currentStatus === 'served' && (
                <p className="text-gray-600">Your order has been served. Enjoy your meal!</p>
              )}
              {currentStatus === 'completed' && (
                <p className="text-gray-600">Thank you for dining with us!</p>
              )}
            </div>
          </div>
        </motion.div>

        {/* Order Details */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="relative group"
        >
          <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-3xl opacity-20 group-hover:opacity-30 blur-xl transition-opacity" />
          
          <div className="relative bg-gradient-to-br from-white/95 to-white/90 backdrop-blur-xl rounded-3xl shadow-2xl p-6 border border-white/20">
            <h3 className="font-bold text-gray-900 text-xl mb-4">Order Details</h3>
            
            <div className="space-y-3">
              {order.order_items?.map((item: any, index: number) => (
                <div key={index} className="flex justify-between items-center">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{item.itemName}</p>
                    <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                  </div>
                  <p className="font-semibold text-purple-600">₹{(item.price * item.quantity).toFixed(0)}</p>
                </div>
              ))}
              
              <Separator className="bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
              
              <div className="flex justify-between items-center bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-2xl">
                <span className="text-lg font-bold text-gray-900">Total Amount</span>
                <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  ₹{order.total_amount?.toFixed(0)}
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Back to Menu Button */}
        {currentStatus === 'served' || currentStatus === 'completed' ? (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button
              size="lg"
              className="w-full bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 hover:from-pink-700 hover:via-purple-700 hover:to-indigo-700 text-white font-bold text-lg h-14 rounded-2xl shadow-2xl"
              onClick={() => navigate(`/table/${tableId}/restaurant/${restaurantId}/menu`)}
            >
              Back to Menu
            </Button>
          </motion.div>
        ) : null}
      </div>
    </div>
  );
}
