import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, UtensilsCrossed, Package, CreditCard, Wallet, Banknote, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useTableCart } from "@/hooks/useTableCart";
import { supabase } from "@/integrations/supabase/client";

export default function TableCheckout() {
  const { tableId, restaurantId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { getCartItems, placeOrder } = useTableCart();
  const [orderType, setOrderType] = useState<"dine-in" | "takeaway">("dine-in");
  const [paymentMethod, setPaymentMethod] = useState<"counter" | "upi" | "card">("counter");
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCartItems();
  }, []);

  const loadCartItems = async () => {
    if (tableId) {
      const items = await getCartItems(tableId, tableId);
      setCartItems(items);
    }
  };

  const subtotal = cartItems.reduce(
    (sum, item) => sum + (item.offer_price || item.price || 0) * item.quantity,
    0
  );
  const gst = subtotal * 0.05;
  const serviceCharge = subtotal * 0.1;
  const total = subtotal + gst + serviceCharge;

  const handlePlaceOrder = async () => {
    if (!orderType) {
      toast({
        variant: "destructive",
        title: "Please select order type",
      });
      return;
    }

    if (!paymentMethod) {
      toast({
        variant: "destructive",
        title: "Please select payment method",
      });
      return;
    }

    setLoading(true);

    try {
      if (!tableId) throw new Error('Table ID is required');

      // Get restaurant data for tenant_id
      const { data: restaurant } = await supabase
        .from('restaurants')
        .select('tenant_id')
        .eq('id', restaurantId)
        .single();

      const order = await placeOrder(
        tableId,
        tableId,
        'Guest',
        paymentMethod,
        restaurant?.tenant_id,
        restaurantId
      );

      if (order) {
        toast({
          title: "Order placed successfully!",
          description: `Your ${orderType} order for Table #${tableId} has been confirmed.`,
        });

        navigate(`/table/${tableId}/restaurant/${restaurantId}/order/${order.id}`);
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error placing order",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Premium Header */}
      <div className="sticky top-0 z-40 backdrop-blur-xl bg-gradient-to-b from-slate-900/95 via-purple-900/90 to-transparent border-b border-white/10">
        <div className="flex items-center gap-4 p-5">
          <motion.button 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate(-1)} 
            className="text-white bg-white/10 hover:bg-white/20 p-2 rounded-full backdrop-blur-md transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </motion.button>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent">
            Checkout
          </h1>
        </div>
      </div>

      <div className="p-5 space-y-5 pb-32">
        {/* Premium Order Type Selection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative group"
        >
          <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 rounded-3xl opacity-20 group-hover:opacity-30 blur-xl transition-opacity" />
          
          <div className="relative bg-gradient-to-br from-white/95 to-white/90 backdrop-blur-xl rounded-3xl shadow-2xl p-6 border border-white/20">
            <h3 className="font-bold text-gray-900 text-xl mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-gradient-to-r from-purple-600 to-pink-600" />
              Select Order Type
            </h3>
            <RadioGroup value={orderType} onValueChange={(v: any) => setOrderType(v)}>
              <motion.div
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className={`relative flex items-center space-x-3 p-5 rounded-2xl border-2 cursor-pointer transition-all mb-3 ${
                  orderType === "dine-in"
                    ? "border-purple-500 bg-gradient-to-r from-purple-50 to-pink-50 shadow-lg"
                    : "border-gray-200 bg-white/50 hover:border-purple-300"
                }`}
                onClick={() => setOrderType("dine-in")}
              >
                <RadioGroupItem value="dine-in" id="dine-in" className="border-purple-500" />
                <Label htmlFor="dine-in" className="flex items-center gap-4 cursor-pointer flex-1">
                  <div className={`p-3 rounded-full ${
                    orderType === "dine-in" 
                      ? "bg-gradient-to-br from-purple-500 to-pink-500" 
                      : "bg-gray-200"
                  }`}>
                    <UtensilsCrossed className={`w-6 h-6 ${
                      orderType === "dine-in" ? "text-white" : "text-gray-500"
                    }`} />
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-900 font-bold text-lg">Dine-In</p>
                    <p className="text-sm text-gray-600">Served at your table</p>
                  </div>
                </Label>
                {orderType === "dine-in" && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="bg-gradient-to-br from-green-400 to-green-600 rounded-full p-1"
                  >
                    <Check className="w-5 h-5 text-white" />
                  </motion.div>
                )}
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className={`relative flex items-center space-x-3 p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                  orderType === "takeaway"
                    ? "border-purple-500 bg-gradient-to-r from-purple-50 to-pink-50 shadow-lg"
                    : "border-gray-200 bg-white/50 hover:border-purple-300"
                }`}
                onClick={() => setOrderType("takeaway")}
              >
                <RadioGroupItem value="takeaway" id="takeaway" className="border-purple-500" />
                <Label htmlFor="takeaway" className="flex items-center gap-4 cursor-pointer flex-1">
                  <div className={`p-3 rounded-full ${
                    orderType === "takeaway" 
                      ? "bg-gradient-to-br from-purple-500 to-pink-500" 
                      : "bg-gray-200"
                  }`}>
                    <Package className={`w-6 h-6 ${
                      orderType === "takeaway" ? "text-white" : "text-gray-500"
                    }`} />
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-900 font-bold text-lg">Takeaway</p>
                    <p className="text-sm text-gray-600">Pack and collect</p>
                  </div>
                </Label>
                {orderType === "takeaway" && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="bg-gradient-to-br from-green-400 to-green-600 rounded-full p-1"
                  >
                    <Check className="w-5 h-5 text-white" />
                  </motion.div>
                )}
              </motion.div>
            </RadioGroup>
          </div>
        </motion.div>

        {/* Premium Payment Method Selection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative group"
        >
          <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 rounded-3xl opacity-20 group-hover:opacity-30 blur-xl transition-opacity" />
          
          <div className="relative bg-gradient-to-br from-white/95 to-white/90 backdrop-blur-xl rounded-3xl shadow-2xl p-6 border border-white/20">
            <h3 className="font-bold text-gray-900 text-xl mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500" />
              Payment Method
            </h3>
            <RadioGroup value={paymentMethod} onValueChange={(v: any) => setPaymentMethod(v)}>
              <motion.div
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className={`relative flex items-center space-x-3 p-5 rounded-2xl border-2 cursor-pointer transition-all mb-3 ${
                  paymentMethod === "counter"
                    ? "border-emerald-500 bg-gradient-to-r from-emerald-50 to-teal-50 shadow-lg"
                    : "border-gray-200 bg-white/50 hover:border-emerald-300"
                }`}
                onClick={() => setPaymentMethod("counter")}
              >
                <RadioGroupItem value="counter" id="counter" className="border-emerald-500" />
                <Label htmlFor="counter" className="flex items-center gap-4 cursor-pointer flex-1">
                  <div className={`p-3 rounded-full ${
                    paymentMethod === "counter" 
                      ? "bg-gradient-to-br from-emerald-500 to-teal-500" 
                      : "bg-gray-200"
                  }`}>
                    <Banknote className={`w-6 h-6 ${
                      paymentMethod === "counter" ? "text-white" : "text-gray-500"
                    }`} />
                  </div>
                  <p className="text-gray-900 font-bold text-lg flex-1">Pay at Counter</p>
                </Label>
                {paymentMethod === "counter" && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="bg-gradient-to-br from-green-400 to-green-600 rounded-full p-1"
                  >
                    <Check className="w-5 h-5 text-white" />
                  </motion.div>
                )}
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className={`relative flex items-center space-x-3 p-5 rounded-2xl border-2 cursor-pointer transition-all mb-3 ${
                  paymentMethod === "upi"
                    ? "border-emerald-500 bg-gradient-to-r from-emerald-50 to-teal-50 shadow-lg"
                    : "border-gray-200 bg-white/50 hover:border-emerald-300"
                }`}
                onClick={() => setPaymentMethod("upi")}
              >
                <RadioGroupItem value="upi" id="upi" className="border-emerald-500" />
                <Label htmlFor="upi" className="flex items-center gap-4 cursor-pointer flex-1">
                  <div className={`p-3 rounded-full ${
                    paymentMethod === "upi" 
                      ? "bg-gradient-to-br from-emerald-500 to-teal-500" 
                      : "bg-gray-200"
                  }`}>
                    <Wallet className={`w-6 h-6 ${
                      paymentMethod === "upi" ? "text-white" : "text-gray-500"
                    }`} />
                  </div>
                  <p className="text-gray-900 font-bold text-lg flex-1">UPI / Wallet</p>
                </Label>
                {paymentMethod === "upi" && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="bg-gradient-to-br from-green-400 to-green-600 rounded-full p-1"
                  >
                    <Check className="w-5 h-5 text-white" />
                  </motion.div>
                )}
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className={`relative flex items-center space-x-3 p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                  paymentMethod === "card"
                    ? "border-emerald-500 bg-gradient-to-r from-emerald-50 to-teal-50 shadow-lg"
                    : "border-gray-200 bg-white/50 hover:border-emerald-300"
                }`}
                onClick={() => setPaymentMethod("card")}
              >
                <RadioGroupItem value="card" id="card" className="border-emerald-500" />
                <Label htmlFor="card" className="flex items-center gap-4 cursor-pointer flex-1">
                  <div className={`p-3 rounded-full ${
                    paymentMethod === "card" 
                      ? "bg-gradient-to-br from-emerald-500 to-teal-500" 
                      : "bg-gray-200"
                  }`}>
                    <CreditCard className={`w-6 h-6 ${
                      paymentMethod === "card" ? "text-white" : "text-gray-500"
                    }`} />
                  </div>
                  <p className="text-gray-900 font-bold text-lg flex-1">Credit / Debit Card</p>
                </Label>
                {paymentMethod === "card" && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="bg-gradient-to-br from-green-400 to-green-600 rounded-full p-1"
                  >
                    <Check className="w-5 h-5 text-white" />
                  </motion.div>
                )}
              </motion.div>
            </RadioGroup>
          </div>
        </motion.div>

        {/* Premium Total Amount */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="relative group"
        >
          <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 rounded-3xl opacity-20 blur-xl" />
          
          <div className="relative bg-gradient-to-br from-white/95 to-white/90 backdrop-blur-xl rounded-3xl shadow-2xl p-6 border border-white/20">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-gray-700">Total Amount</span>
              <motion.span 
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent"
              >
                ₹{total.toFixed(0)}
              </motion.span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Floating Place Order Button */}
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-gradient-to-t from-slate-900 via-slate-900/95 to-transparent backdrop-blur-md">
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="relative"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 rounded-2xl blur-xl opacity-75" />
          <Button
            size="lg"
            className="relative w-full bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-700 hover:via-teal-700 hover:to-cyan-700 text-white font-bold text-lg h-16 rounded-2xl shadow-2xl border-0 disabled:opacity-50"
            onClick={handlePlaceOrder}
            disabled={loading}
          >
            {loading ? (
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="inline-block"
              >
                ⏳
              </motion.span>
            ) : (
              <span className="flex items-center gap-3">
                <Check className="w-6 h-6" />
                Place Order • ₹{total.toFixed(0)}
                <motion.span
                  animate={{ x: [0, 5, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  →
                </motion.span>
              </span>
            )}
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
