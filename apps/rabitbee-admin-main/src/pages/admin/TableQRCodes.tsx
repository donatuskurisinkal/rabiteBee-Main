import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { QrCode, Download, Plus, Trash2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function TableQRCodes() {
  const { toast } = useToast();
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState("");
  const [tableNumbers, setTableNumbers] = useState<string[]>([""]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadRestaurants();
  }, []);

  const loadRestaurants = async () => {
    try {
      const { data, error } = await supabase
        .from("restaurants")
        .select("*")
        .eq("isactive", true)
        .order("name");

      if (error) throw error;
      setRestaurants(data || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  const addTableInput = () => {
    setTableNumbers([...tableNumbers, ""]);
  };

  const removeTableInput = (index: number) => {
    setTableNumbers(tableNumbers.filter((_, i) => i !== index));
  };

  const updateTableNumber = (index: number, value: string) => {
    const newTableNumbers = [...tableNumbers];
    newTableNumbers[index] = value;
    setTableNumbers(newTableNumbers);
  };

  const generateQRCodes = () => {
    if (!selectedRestaurant) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select a restaurant",
      });
      return;
    }

    const validTables = tableNumbers.filter(t => t.trim() !== "");
    if (validTables.length === 0) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter at least one table number",
      });
      return;
    }

    // Generate QR codes for each table
    validTables.forEach(tableNumber => {
      const url = `${window.location.origin}/table/${tableNumber}/restaurant/${selectedRestaurant}`;
      
      // Open QR code generator in new tab
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(url)}`;
      window.open(qrUrl, '_blank');
    });

    toast({
      title: "QR Codes Generated",
      description: `Generated ${validTables.length} QR code(s)`,
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Table QR Code Generator</h1>
        <p className="text-muted-foreground mt-2">
          Generate QR codes for table ordering
        </p>
      </div>

      <Card className="p-6 space-y-6">
        <div className="space-y-2">
          <Label>Select Restaurant</Label>
          <Select value={selectedRestaurant} onValueChange={setSelectedRestaurant}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a restaurant" />
            </SelectTrigger>
            <SelectContent>
              {restaurants.map(restaurant => (
                <SelectItem key={restaurant.id} value={restaurant.id}>
                  {restaurant.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Table Numbers</Label>
            <Button
              size="sm"
              variant="outline"
              onClick={addTableInput}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Table
            </Button>
          </div>

          <div className="space-y-2">
            {tableNumbers.map((tableNumber, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  placeholder={`Table #${index + 1}`}
                  value={tableNumber}
                  onChange={(e) => updateTableNumber(index, e.target.value)}
                  className="flex-1"
                />
                {tableNumbers.length > 1 && (
                  <Button
                    size="icon"
                    variant="destructive"
                    onClick={() => removeTableInput(index)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>

        <Button
          onClick={generateQRCodes}
          className="w-full"
          size="lg"
          disabled={loading}
        >
          <QrCode className="w-5 h-5 mr-2" />
          Generate QR Codes
        </Button>
      </Card>

      <Card className="p-6 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
        <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
          How it works
        </h3>
        <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
          <li>• Select a restaurant from the dropdown</li>
          <li>• Enter table numbers (e.g., 1, 2, 3A, etc.)</li>
          <li>• Click "Generate QR Codes" to create QR codes</li>
          <li>• Each QR code will open in a new tab - right-click to save or print</li>
          <li>• Customers scan the QR code to start ordering from their table</li>
        </ul>
      </Card>
    </div>
  );
}
