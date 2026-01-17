import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart, ChevronUp, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface CartFloatingBarProps {
  totalItems: number;
  totalAmount: number;
  tableId: string;
  restaurantId: string;
}

export default function CartFloatingBar({ totalItems, totalAmount, tableId, restaurantId }: CartFloatingBarProps) {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      transition={{ type: "spring", stiffness: 100, damping: 20 }}
      className="fixed bottom-0 left-0 right-0 z-50 p-4"
    >
      {/* Glow Effect */}
      <div className="absolute inset-0 bg-gradient-to-t from-pink-500/30 via-purple-500/20 to-transparent blur-2xl pointer-events-none" />
      
      <motion.div
        whileHover={{ scale: 1.02, y: -2 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => navigate(`/table/${tableId}/restaurant/${restaurantId}/cart`)}
        className="relative cursor-pointer group"
      >
        {/* Animated Shimmer Background */}
        <div className="absolute inset-0 bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 rounded-3xl blur-sm opacity-75 group-hover:opacity-100 transition-opacity" />
        
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-pink-400/0 via-white/40 to-pink-400/0 rounded-3xl"
          animate={{
            x: ['-200%', '200%'],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "linear",
            repeatDelay: 1
          }}
        />
        
        <div className="relative bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 rounded-3xl shadow-2xl overflow-hidden">
          {/* Premium Pattern Overlay */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNiIgc3Ryb2tlPSIjZmZmIiBzdHJva2Utd2lkdGg9IjIiIG9wYWNpdHk9Ii4xIi8+PC9nPjwvc3ZnPg==')] opacity-20" />
          
          <div className="relative flex items-center justify-between px-6 py-5">
            {/* Left Section with Cart Icon */}
            <div className="flex items-center gap-5">
              <div className="relative">
                {/* Pulsing Ring Animation */}
                <motion.div
                  animate={{ 
                    scale: [1, 1.2, 1],
                    opacity: [0.5, 0, 0.5]
                  }}
                  transition={{ 
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="absolute inset-0 bg-white rounded-full"
                />
                
                <div className="relative bg-white/20 backdrop-blur-md rounded-full p-3.5 ring-2 ring-white/30">
                  <ShoppingCart className="w-7 h-7 text-white" />
                </div>
                
                {/* Item Count Badge with Bounce */}
                <motion.div
                  key={totalItems}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 15 }}
                  className="absolute -top-1 -right-1 min-w-[24px] h-6 bg-gradient-to-r from-orange-500 to-red-600 rounded-full flex items-center justify-center shadow-lg ring-2 ring-white"
                >
                  <motion.span 
                    key={`count-${totalItems}`}
                    initial={{ scale: 1.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-xs font-bold text-white px-1"
                  >
                    {totalItems}
                  </motion.span>
                </motion.div>
              </div>
              
              <div>
                <motion.p 
                  className="text-xs text-white/90 font-semibold flex items-center gap-1.5"
                  animate={{ opacity: [0.7, 1, 0.7] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Sparkles className="w-3 h-3" />
                  {totalItems} {totalItems === 1 ? 'item' : 'items'} in cart
                </motion.p>
                <motion.p 
                  key={totalAmount}
                  initial={{ scale: 1.1 }}
                  animate={{ scale: 1 }}
                  className="text-2xl font-bold text-white mt-0.5"
                >
                  ₹{totalAmount.toFixed(0)}
                </motion.p>
              </div>
            </div>

            {/* Right Section - View Cart CTA */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:block">
                <div className="bg-white/20 backdrop-blur-md px-5 py-2.5 rounded-full ring-1 ring-white/30">
                  <span className="text-white font-bold text-sm">View Cart</span>
                </div>
              </div>
              
              <motion.div
                animate={{ y: [-2, 2, -2] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                className="bg-white/20 backdrop-blur-md p-2 rounded-full ring-1 ring-white/30"
              >
                <ChevronUp className="w-6 h-6 text-white" />
              </motion.div>
            </div>
          </div>
          
          {/* Bottom Progress Bar Animation */}
          <motion.div
            className="h-1 bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-400"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.5 }}
            style={{ transformOrigin: "left" }}
          />
        </div>
      </motion.div>
    </motion.div>
  );
}
