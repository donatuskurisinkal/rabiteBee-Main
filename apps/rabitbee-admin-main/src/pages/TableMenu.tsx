import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Plus, Minus, ChefHat, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useTableCart } from "@/hooks/useTableCart";
import CartFloatingBar from "@/components/CartFloatingBar";
import AddonSelectionDialog from "@/components/AddonSelectionDialog";
import { Badge } from "@/components/ui/badge";

export default function TableMenu() {
  const { tableId, restaurantId } = useParams();
  const { toast } = useToast();
  const { addToCart } = useTableCart();
  const [categories, setCategories] = useState<any[]>([]);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [cartItems, setCartItems] = useState<Record<string, number>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [restaurant, setRestaurant] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, [restaurantId]);

  const loadData = async () => {
    try {
      const [restaurantRes, categoriesRes, itemsRes] = await Promise.all([
        supabase
          .from("restaurants")
          .select("*")
          .eq("id", restaurantId)
          .single(),
        supabase
          .from("restaurant_categories")
          .select("*")
          .eq("restaurant_id", restaurantId)
          .eq("is_active", true)
          .order("display_order"),
        supabase
          .from("menu_items")
          .select("*")
          .eq("restaurant_id", restaurantId)
          .eq("available", true)
      ]);

      if (restaurantRes.error) throw restaurantRes.error;
      if (categoriesRes.error) throw categoriesRes.error;
      if (itemsRes.error) throw itemsRes.error;

      setRestaurant(restaurantRes.data);
      setCategories(categoriesRes.data || []);
      setMenuItems(itemsRes.data || []);
      if (categoriesRes.data?.length > 0) {
        setSelectedCategory(categoriesRes.data[0].id);
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

  const [selectedItemForCustomization, setSelectedItemForCustomization] = useState<any>(null);
  const [showAddonDialog, setShowAddonDialog] = useState(false);

  const handleAddToCart = async (item: any) => {
    // If item is customizable, show addon dialog
    if (item.is_customisable) {
      setSelectedItemForCustomization(item);
      setShowAddonDialog(true);
      return;
    }

    // Otherwise add directly to cart
    const currentQty = cartItems[item.id] || 0;
    const newQty = currentQty + 1;
    
    try {
      await addToCart({
        username: 'Guest',
        phone_number: tableId || '',
        table_number: tableId || '',
        item_id: item.id,
        item_name: item.name,
        quantity: 1,
        price: item.offer_price || item.price,
        tenant_id: restaurant?.tenant_id,
        restaurant_id: restaurantId
      });
      
      setCartItems(prev => ({ ...prev, [item.id]: newQty }));
      
      toast({
        title: "Added to cart",
        description: `${item.name} added`,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  const handleAddonConfirm = async (selectedAddons: any[], quantity: number) => {
    if (!selectedItemForCustomization) return;

    const item = selectedItemForCustomization;
    const currentQty = cartItems[item.id] || 0;
    
    try {
      await addToCart({
        username: 'Guest',
        phone_number: tableId || '',
        table_number: tableId || '',
        item_id: item.id,
        item_name: item.name,
        quantity: quantity,
        price: item.offer_price || item.price,
        tenant_id: restaurant?.tenant_id,
        restaurant_id: restaurantId,
        selected_addons: selectedAddons
      });
      
      setCartItems(prev => ({ ...prev, [item.id]: currentQty + quantity }));
      
      toast({
        title: "Added to cart",
        description: `${item.name} with ${selectedAddons.length} addon(s) added`,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  const handleRemoveFromCart = async (item: any) => {
    const currentQty = cartItems[item.id] || 0;
    if (currentQty === 0) return;
    
    const newQty = currentQty - 1;
    
    try {
      if (newQty === 0) {
        setCartItems(prev => {
          const newCart = { ...prev };
          delete newCart[item.id];
          return newCart;
        });
      } else {
        setCartItems(prev => ({ ...prev, [item.id]: newQty }));
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  const filteredItems = menuItems.filter(item => {
    const matchesCategory = !selectedCategory || item.category_id === selectedCategory;
    const matchesSearch = !searchQuery || 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const totalItems = Object.values(cartItems).reduce((sum, qty) => sum + qty, 0);
  const totalAmount = menuItems
    .filter(item => cartItems[item.id])
    .reduce((sum, item) => sum + (item.offer_price || item.price) * cartItems[item.id], 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
          <ChefHat className="w-16 h-16 text-primary" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 pb-32">
      {/* Premium Header with Glassmorphism */}
      <div className="sticky top-0 z-40 backdrop-blur-xl bg-gradient-to-b from-slate-900/95 via-purple-900/90 to-transparent border-b border-white/10">
        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <motion.h1 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-3xl font-bold bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent"
            >
              Menu
            </motion.h1>
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.05 }}
              className="relative"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full blur-md opacity-75" />
              <Badge className="relative bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold px-4 py-2 text-sm shadow-lg border-0">
                Table #{tableId}
              </Badge>
            </motion.div>
          </div>
          
          {/* Premium Search Bar */}
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="relative group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-pink-500/20 to-purple-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all" />
            <div className="relative bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-2xl">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-300" />
              <Input
                placeholder="Search delicious food..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-4 py-6 bg-transparent border-0 text-white placeholder:text-purple-300/60 placeholder:text-sm focus-visible:ring-2 focus-visible:ring-purple-400/50 rounded-2xl"
              />
            </div>
          </motion.div>
        </div>
      </div>

      {/* Premium Category Tabs with Sliding Animation */}
      <div className="sticky top-[156px] z-30 backdrop-blur-xl bg-slate-900/80 border-b border-white/5">
        <div className="relative flex gap-3 p-4 overflow-x-auto no-scrollbar">
          {categories.map((category, index) => (
            <motion.button
              key={category.id}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedCategory(category.id)}
              className={`relative px-8 py-3 rounded-full whitespace-nowrap font-semibold transition-all duration-300 ${
                selectedCategory === category.id
                  ? "text-white shadow-2xl"
                  : "bg-white/5 text-purple-200 hover:bg-white/10 border border-white/10"
              }`}
            >
              {selectedCategory === category.id && (
                <motion.div
                  layoutId="activeCategory"
                  className="absolute inset-0 bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 rounded-full shadow-lg"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <span className="relative z-10">{category.name}</span>
              
              {selectedCategory === category.id && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-slate-900"
                />
              )}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Premium Menu Items with Neumorphic Cards */}
      <div className="p-5 space-y-5">
        <AnimatePresence mode="wait">
          {filteredItems.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -30, scale: 0.95 }}
              transition={{ 
                delay: index * 0.08,
                type: "spring",
                stiffness: 100,
                damping: 15
              }}
              whileHover={{ y: -4 }}
              className="group relative"
            >
              {/* Glow Effect */}
              <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 rounded-3xl opacity-0 group-hover:opacity-30 blur-xl transition-opacity duration-500" />
              
              <div className="relative bg-gradient-to-br from-white/95 to-white/90 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-white/20">
                <div className="flex gap-5 p-5">
                  {/* Premium Item Image */}
                  <motion.div 
                    whileHover={{ scale: 1.05 }}
                    className="relative w-32 h-32 flex-shrink-0"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-pink-400/20 to-purple-400/20 rounded-2xl blur-md" />
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="relative w-full h-full object-cover rounded-2xl shadow-xl ring-2 ring-white/50"
                      />
                    ) : (
                      <div className="relative w-full h-full bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl flex items-center justify-center shadow-xl ring-2 ring-white/50">
                        <ChefHat className="w-12 h-12 text-purple-400" />
                      </div>
                    )}
                    
                    {/* Veg/Non-veg Premium Indicator */}
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: index * 0.08 + 0.2 }}
                      className="absolute -top-2 -left-2 z-10"
                    >
                      <div className={`w-7 h-7 rounded-lg ${
                        item.is_veg 
                          ? 'bg-gradient-to-br from-green-400 to-green-600' 
                          : 'bg-gradient-to-br from-red-400 to-red-600'
                      } flex items-center justify-center shadow-lg ring-2 ring-white`}>
                        <div className="w-3 h-3 rounded-full bg-white" />
                      </div>
                    </motion.div>

                    {/* Discount Badge with Animation */}
                    {item.discount_percent > 0 && (
                      <motion.div 
                        initial={{ scale: 0, rotate: -12 }}
                        animate={{ scale: 1, rotate: -12 }}
                        transition={{ delay: index * 0.08 + 0.3, type: "spring" }}
                        className="absolute -bottom-2 -right-2 z-10"
                      >
                        <div className="bg-gradient-to-r from-orange-500 to-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-xl ring-2 ring-white">
                          {item.discount_percent}% OFF
                        </div>
                      </motion.div>
                    )}
                  </motion.div>

                  {/* Item Details with Enhanced Typography */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    {/* Top Section */}
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-bold text-gray-900 text-lg leading-tight line-clamp-2">
                          {item.name}
                        </h3>
                        {item.is_popular && (
                          <motion.div
                            animate={{ rotate: [0, 5, 0, -5, 0] }}
                            transition={{ duration: 2, repeat: Infinity }}
                          >
                            <Badge className="bg-gradient-to-r from-amber-500 to-orange-600 text-white text-xs shrink-0 shadow-lg border-0">
                              <Star className="w-3 h-3 fill-white mr-1" />
                              Hot
                            </Badge>
                          </motion.div>
                        )}
                      </div>
                      
                      {item.quantity_label && (
                        <p className="text-xs text-purple-600 font-medium mt-1 flex items-center gap-1">
                          <span className="w-1 h-1 rounded-full bg-purple-600" />
                          {item.quantity_label}
                        </p>
                      )}
                      
                      {item.description && (
                        <p className="text-sm text-gray-600 line-clamp-2 mt-2 leading-relaxed">
                          {item.description}
                        </p>
                      )}

                      {item.preparation_time && (
                        <div className="flex items-center gap-1.5 mt-2 text-xs text-gray-500 bg-purple-50 px-2 py-1 rounded-full w-fit">
                          <ChefHat className="w-3 h-3 text-purple-600" />
                          <span className="font-medium">{item.preparation_time} mins</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Bottom Section - Price & Premium Actions */}
                    <div className="flex items-end justify-between mt-4">
                      <div className="flex flex-col">
                        {item.offer_price ? (
                          <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                              ₹{item.offer_price}
                            </span>
                            <span className="text-sm text-gray-400 line-through font-medium">
                              ₹{item.price}
                            </span>
                          </div>
                        ) : (
                          <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                            ₹{item.price}
                          </span>
                        )}
                      </div>

                      {/* Premium Add/Remove Controls with Ripple Effect */}
                      {cartItems[item.id] > 0 ? (
                        <motion.div 
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="relative"
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-pink-600 to-purple-600 rounded-full blur-md opacity-50" />
                          <div className="relative flex items-center gap-4 bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 rounded-full px-5 py-2.5 shadow-2xl">
                            <motion.button 
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleRemoveFromCart(item)} 
                              className="text-white hover:scale-125 transition-transform active:scale-95"
                            >
                              <Minus className="w-5 h-5 font-bold" />
                            </motion.button>
                            <motion.span 
                              key={cartItems[item.id]}
                              initial={{ scale: 1.3 }}
                              animate={{ scale: 1 }}
                              className="text-white font-bold text-lg min-w-[28px] text-center"
                            >
                              {cartItems[item.id]}
                            </motion.span>
                            <motion.button 
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleAddToCart(item)} 
                              className="text-white hover:scale-125 transition-transform active:scale-95"
                            >
                              <Plus className="w-5 h-5 font-bold" />
                            </motion.button>
                          </div>
                        </motion.div>
                      ) : (
                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="relative"
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-pink-600 to-purple-600 rounded-full blur-md opacity-50" />
                          <Button
                            onClick={() => handleAddToCart(item)}
                            className="relative bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 hover:from-pink-700 hover:via-purple-700 hover:to-indigo-700 text-white font-bold rounded-full px-7 py-6 shadow-2xl border-0 text-base"
                          >
                            <Plus className="w-5 h-5 mr-2" />
                            Add
                          </Button>
                        </motion.div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Customizable Floating Badge */}
                {item.is_customisable && (
                  <motion.div 
                    initial={{ scale: 0, rotate: 12 }}
                    animate={{ scale: 1, rotate: 12 }}
                    transition={{ delay: index * 0.08 + 0.4 }}
                    className="absolute top-3 right-3"
                  >
                    <div className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg ring-2 ring-white/50">
                      ⚡ Customizable
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredItems.length === 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <motion.div
              animate={{ 
                rotate: [0, 10, -10, 0],
                scale: [1, 1.1, 1]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <ChefHat className="w-20 h-20 text-purple-300 mx-auto mb-6" />
            </motion.div>
            <p className="text-purple-200 text-xl font-semibold">No items found</p>
            <p className="text-purple-300/60 text-sm mt-2">Try adjusting your search or category</p>
          </motion.div>
        )}
      </div>

      {/* Floating Cart Bar */}
      {totalItems > 0 && (
        <CartFloatingBar
          totalItems={totalItems}
          totalAmount={totalAmount}
          tableId={tableId!}
          restaurantId={restaurantId!}
        />
      )}

      {/* Addon Selection Dialog */}
      <AddonSelectionDialog
        open={showAddonDialog}
        onClose={() => {
          setShowAddonDialog(false);
          setSelectedItemForCustomization(null);
        }}
        menuItemId={selectedItemForCustomization?.id || ''}
        menuItemName={selectedItemForCustomization?.name || ''}
        basePrice={selectedItemForCustomization?.offer_price || selectedItemForCustomization?.price || 0}
        onConfirm={handleAddonConfirm}
      />
    </div>
  );
}
