import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Minus, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

interface Addon {
  id: string;
  name: string;
  price: number;
  is_mandatory: boolean;
  is_default: boolean;
}

interface SelectedAddon {
  id: string;
  name: string;
  price: number;
}

interface AddonSelectionDialogProps {
  open: boolean;
  onClose: () => void;
  menuItemId: string;
  menuItemName: string;
  basePrice: number;
  onConfirm: (selectedAddons: SelectedAddon[], quantity: number) => void;
}

export default function AddonSelectionDialog({
  open,
  onClose,
  menuItemId,
  menuItemName,
  basePrice,
  onConfirm
}: AddonSelectionDialogProps) {
  const [addons, setAddons] = useState<Addon[]>([]);
  const [selectedAddons, setSelectedAddons] = useState<Set<string>>(new Set());
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open && menuItemId) {
      fetchAddons();
    }
  }, [open, menuItemId]);

  const fetchAddons = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('item_addons')
        .select('*')
        .eq('menu_item_id', menuItemId)
        .order('name');

      if (error) throw error;

      const fetchedAddons = data || [];
      setAddons(fetchedAddons);

      // Auto-select mandatory and default addons
      const autoSelected = new Set<string>(
        fetchedAddons
          .filter(addon => addon.is_mandatory || addon.is_default)
          .map(addon => addon.id)
      );
      setSelectedAddons(autoSelected);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error loading addons",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleAddon = (addonId: string, isMandatory: boolean) => {
    if (isMandatory) return; // Can't deselect mandatory addons

    setSelectedAddons(prev => {
      const newSet = new Set(prev);
      if (newSet.has(addonId)) {
        newSet.delete(addonId);
      } else {
        newSet.add(addonId);
      }
      return newSet;
    });
  };

  const calculateTotal = () => {
    const addonsTotal = addons
      .filter(addon => selectedAddons.has(addon.id))
      .reduce((sum, addon) => sum + addon.price, 0);
    return (basePrice + addonsTotal) * quantity;
  };

  const handleConfirm = () => {
    // Check if all mandatory addons are selected
    const mandatoryAddons = addons.filter(a => a.is_mandatory);
    const allMandatorySelected = mandatoryAddons.every(a => selectedAddons.has(a.id));

    if (!allMandatorySelected) {
      toast({
        variant: "destructive",
        title: "Required selections missing",
        description: "Please select all mandatory addons",
      });
      return;
    }

    const selected = addons
      .filter(addon => selectedAddons.has(addon.id))
      .map(addon => ({
        id: addon.id,
        name: addon.name,
        price: addon.price
      }));

    onConfirm(selected, quantity);
    onClose();
    // Reset state
    setQuantity(1);
    setSelectedAddons(new Set());
  };

  const handleClose = () => {
    onClose();
    setQuantity(1);
    setSelectedAddons(new Set());
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto bg-gradient-to-br from-background via-background to-primary/5">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Sparkles className="w-6 h-6 text-primary" />
            Customize {menuItemName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading options...</div>
          ) : addons.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No customization options available</div>
          ) : (
            <>
              {addons.map((addon, index) => (
                <motion.div
                  key={addon.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                    selectedAddons.has(addon.id)
                      ? 'bg-primary/10 border-primary shadow-sm'
                      : 'bg-card border-border hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <Checkbox
                      id={addon.id}
                      checked={selectedAddons.has(addon.id)}
                      onCheckedChange={() => toggleAddon(addon.id, addon.is_mandatory)}
                      disabled={addon.is_mandatory}
                      className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    />
                    <label
                      htmlFor={addon.id}
                      className="flex-1 cursor-pointer"
                    >
                      <div className="font-medium text-foreground">
                        {addon.name}
                        {addon.is_mandatory && (
                          <span className="ml-2 text-xs text-destructive font-semibold">*Required</span>
                        )}
                      </div>
                    </label>
                  </div>
                  <div className="text-sm font-semibold text-primary">
                    +₹{addon.price.toFixed(2)}
                  </div>
                </motion.div>
              ))}
            </>
          )}

          {/* Quantity Selector */}
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl border border-border">
            <span className="font-medium">Quantity</span>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
                className="h-8 w-8 rounded-full"
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="text-lg font-bold min-w-[2ch] text-center">{quantity}</span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setQuantity(quantity + 1)}
                className="h-8 w-8 rounded-full"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Price Summary */}
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-primary/20 to-primary/10 rounded-xl border border-primary/30">
            <span className="font-semibold text-lg">Total</span>
            <span className="text-2xl font-bold text-primary">₹{calculateTotal().toFixed(2)}</span>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} className="flex-1">
            Add to Cart
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
