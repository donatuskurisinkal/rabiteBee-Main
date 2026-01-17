
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ItemAddon } from "./menuItemColumns";
import { Trash2 } from "lucide-react";

interface AddonsFormProps {
  addons: ItemAddon[];
  onAddonsChange: (addons: ItemAddon[]) => void;
}

export function AddonsForm({ addons, onAddonsChange }: AddonsFormProps) {
  const [newAddon, setNewAddon] = useState<Partial<ItemAddon>>({
    name: "",
    price: 0,
    is_mandatory: false,
    is_default: false,
  });

  const handleAddAddon = () => {
    if (!newAddon.name || newAddon.price === undefined) return;

    onAddonsChange([
      ...addons,
      {
        ...newAddon,
        id: crypto.randomUUID(),
        menu_item_id: "",
        name: newAddon.name,
        price: Number(newAddon.price),
        is_mandatory: newAddon.is_mandatory || false,
        is_default: newAddon.is_default || false,
      },
    ]);

    setNewAddon({
      name: "",
      price: 0,
      is_mandatory: false,
      is_default: false,
    });
  };

  const handleRemoveAddon = (addonId: string) => {
    onAddonsChange(addons.filter((addon) => addon.id !== addonId));
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Add-ons</h3>
      
      <div className="space-y-4">
        {addons.map((addon) => (
          <div key={addon.id} className="flex items-center space-x-4 p-4 border rounded-lg">
            <div className="flex-1">
              <p className="font-medium">{addon.name}</p>
              <p className="text-sm text-muted-foreground">₹{addon.price}</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Switch 
                  checked={addon.is_mandatory}
                  onCheckedChange={(checked) => {
                    onAddonsChange(
                      addons.map((a) =>
                        a.id === addon.id ? { ...a, is_mandatory: checked } : a
                      )
                    );
                  }}
                />
                <Label>Mandatory</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={addon.is_default}
                  onCheckedChange={(checked) => {
                    onAddonsChange(
                      addons.map((a) =>
                        a.id === addon.id ? { ...a, is_default: checked } : a
                      )
                    );
                  }}
                />
                <Label>Default</Label>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleRemoveAddon(addon.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Name</Label>
          <Input
            placeholder="Add-on name"
            value={newAddon.name}
            onChange={(e) => setNewAddon({ ...newAddon, name: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label>Price</Label>
          <Input
            type="number"
            placeholder="Price"
            value={newAddon.price}
            onChange={(e) =>
              setNewAddon({ ...newAddon, price: parseFloat(e.target.value) || 0 })
            }
          />
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <Switch
            checked={newAddon.is_mandatory || false}
            onCheckedChange={(checked) =>
              setNewAddon({ ...newAddon, is_mandatory: checked })
            }
          />
          <Label>Mandatory</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Switch
            checked={newAddon.is_default || false}
            onCheckedChange={(checked) =>
              setNewAddon({ ...newAddon, is_default: checked })
            }
          />
          <Label>Default</Label>
        </div>
      </div>

      <Button onClick={handleAddAddon}>Add Add-on</Button>
    </div>
  );
}
