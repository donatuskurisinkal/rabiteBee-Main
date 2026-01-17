import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Plus, Minus, Trash2, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useTableCart } from "@/hooks/useTableCart";
import { Separator } from "@/components/ui/separator";

export default function TableCart() {
  const { tableId, restaurantId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { getCartItems, updateQuantity, removeItem } = useTableCart();
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCartItems();
  }, []);

  const loadCartItems = async () => {
    try {
      if (tableId) {
        const items = await getCartItems(tableId, tableId);
        setCartItems(items);
      }
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

  const handleUpdateQuantity = async (itemId: string, newQuantity: number) => {
    const success = await updateQuantity(itemId, newQuantity);
    if (success) {
      if (newQuantity < 1) {
        setCartItems(prev => prev.filter(item => item.id !== itemId));
      } else {
        setCartItems(prev =>
          prev.map(item =>
            item.id === itemId ? { ...item, quantity: newQuantity } : item
          )
        );
      }
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    const success = await removeItem(itemId);
    if (success) {
      setCartItems(prev => prev.filter(item => item.id !== itemId));
    }
  };

  const subtotal = cartItems.reduce(
    (sum, item) => sum + (item.offer_price || item.price || 0) * item.quantity,
    0
  );
  const gst = subtotal * 0.05;
  const serviceCharge = subtotal * 0.1;
  const total = subtotal + gst + serviceCharge;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity }}>
          <ShoppingBag className="w-16 h-16 text-primary" />
        </motion.div>
      </div>
    );
  }

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
          <div className="flex-1">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent">
              Your Cart
            </h1>
            <p className="text-sm text-purple-300">Table #{tableId} • {cartItems.length} items</p>
          </div>
        </div>
      </div>

      {cartItems.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center min-h-[70vh] p-6"
        >
          <motion.div
            animate={{ 
              rotate: [0, 10, -10, 0],
              scale: [1, 1.1, 1]
            }}
            transition={{ duration: 2, repeat: Infinity }}
            className="mb-6"
          >
            <ShoppingBag className="w-32 h-32 text-purple-400/50" />
          </motion.div>
          <h2 className="text-3xl font-bold text-white mb-3">Your cart is empty</h2>
          <p className="text-purple-300 text-center mb-8 max-w-sm">
            Discover delicious dishes from our menu and start your culinary journey
          </p>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button 
              onClick={() => navigate(`/table/${tableId}/restaurant/${restaurantId}/menu`)}
              className="bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 hover:from-pink-700 hover:via-purple-700 hover:to-indigo-700 text-white font-bold px-8 py-6 rounded-full shadow-2xl text-lg"
            >
              Browse Menu
            </Button>
          </motion.div>
        </motion.div>
      ) : (
        <div className="p-5 space-y-5 pb-32">
          {/* Premium Cart Items */}
          <div className="space-y-4">
            {cartItems.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -30, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 30, scale: 0.9 }}
                transition={{ delay: index * 0.06, type: "spring", stiffness: 100 }}
                whileHover={{ y: -2 }}
                className="group relative"
              >
                {/* Glow Effect */}
                <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 rounded-3xl opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500" />
                
                <div className="relative bg-gradient-to-br from-white/95 to-white/90 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-white/20 p-4">
                  <div className="flex gap-4">
                    {/* Item Image */}
                    <motion.div 
                      whileHover={{ scale: 1.05 }}
                      className="relative w-24 h-24 flex-shrink-0"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-pink-400/20 to-purple-400/20 rounded-2xl blur-md" />
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.item_name}
                          className="relative w-full h-full object-cover rounded-2xl shadow-lg ring-2 ring-white/50"
                        />
                      ) : (
                        <div className="relative w-full h-full bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl shadow-lg ring-2 ring-white/50 flex items-center justify-center">
                          <ShoppingBag className="w-10 h-10 text-purple-400" />
                        </div>
                      )}
                      
                      {/* Veg Indicator */}
                      {item.is_veg !== undefined && (
                        <div className={`absolute -top-1 -left-1 w-6 h-6 rounded-lg ${
                          item.is_veg 
                            ? 'bg-gradient-to-br from-green-400 to-green-600' 
                            : 'bg-gradient-to-br from-red-400 to-red-600'
                        } flex items-center justify-center shadow-lg ring-2 ring-white`}>
                          <div className="w-2.5 h-2.5 rounded-full bg-white" />
                        </div>
                      )}
                    </motion.div>

                    {/* Item Details */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <h3 className="font-bold text-gray-900 text-lg line-clamp-1">
                          {item.item_name}
                        </h3>
                        {item.quantity_label && (
                          <p className="text-xs text-purple-600 font-medium mt-0.5">
                            {item.quantity_label}
                          </p>
                        )}
                        <div className="flex items-baseline gap-2 mt-2">
                          <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                            ₹{((item.offer_price || item.price || 0) * item.quantity).toFixed(0)}
                          </span>
                          {item.offer_price && (
                            <span className="text-xs text-gray-400 line-through">
                              ₹{(item.price * item.quantity).toFixed(0)}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center justify-between mt-3">
                        <div className="relative">
                          <div className="absolute inset-0 bg-gradient-to-r from-pink-600 to-purple-600 rounded-full blur-md opacity-40" />
                          <div className="relative flex items-center gap-3 bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 rounded-full px-4 py-2 shadow-lg">
                            <motion.button
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                              className="text-white hover:scale-110 transition-transform"
                            >
                              <Minus className="w-4 h-4 font-bold" />
                            </motion.button>
                            <motion.span 
                              key={item.quantity}
                              initial={{ scale: 1.3 }}
                              animate={{ scale: 1 }}
                              className="text-white font-bold min-w-[24px] text-center"
                            >
                              {item.quantity}
                            </motion.span>
                            <motion.button
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                              className="text-white hover:scale-110 transition-transform"
                            >
                              <Plus className="w-4 h-4 font-bold" />
                            </motion.button>
                          </div>
                        </div>

                        <motion.button
                          whileHover={{ scale: 1.1, rotate: 10 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleRemoveItem(item.id)}
                          className="bg-red-500/10 hover:bg-red-500/20 text-red-600 p-2 rounded-full transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </motion.button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Premium Bill Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: cartItems.length * 0.06 + 0.2 }}
            className="relative group"
          >
            <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 rounded-3xl opacity-20 group-hover:opacity-30 blur-xl transition-opacity" />
            
            <div className="relative bg-gradient-to-br from-white/95 to-white/90 backdrop-blur-xl rounded-3xl shadow-2xl p-6 border border-white/20">
              <h3 className="font-bold text-gray-900 text-xl mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-gradient-to-r from-purple-600 to-pink-600" />
                Bill Summary
              </h3>
              
              <div className="space-y-3">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span className="font-semibold">₹{subtotal.toFixed(0)}</span>
                </div>
                
                <div className="flex justify-between text-gray-600">
                  <span>GST (5%)</span>
                  <span className="font-semibold">₹{gst.toFixed(0)}</span>
                </div>
                
                <div className="flex justify-between text-gray-600">
                  <span>Service Charge (10%)</span>
                  <span className="font-semibold">₹{serviceCharge.toFixed(0)}</span>
                </div>
                
                <Separator className="bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
                
                <motion.div 
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200 }}
                  className="flex justify-between items-center bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-2xl"
                >
                  <span className="text-lg font-bold text-gray-900">Total Amount</span>
                  <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    ₹{total.toFixed(0)}
                  </span>
                </motion.div>
              </div>
            </div>
          </motion.div>

          {/* Floating Checkout Button */}
          <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-gradient-to-t from-slate-900 via-slate-900/95 to-transparent backdrop-blur-md">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="relative"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 rounded-2xl blur-xl opacity-75" />
              <Button
                size="lg"
                className="relative w-full bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 hover:from-pink-700 hover:via-purple-700 hover:to-indigo-700 text-white font-bold text-lg h-16 rounded-2xl shadow-2xl border-0"
                onClick={() => navigate(`/table/${tableId}/restaurant/${restaurantId}/checkout`)}
              >
                <span className="flex items-center gap-3">
                  Proceed to Checkout
                  <motion.span
                    animate={{ x: [0, 5, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    →
                  </motion.span>
                </span>
              </Button>
            </motion.div>
          </div>
        </div>
      )}
    </div>
  );
}
