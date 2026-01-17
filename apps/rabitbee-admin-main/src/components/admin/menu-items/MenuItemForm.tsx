import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormDescription, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { FileUpload } from "@/components/admin/FileUpload";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AddonsForm } from "./AddonsForm";
import { ItemAddon } from "./menuItemColumns";
import { X } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface MenuItemFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: any) => Promise<void>;
  menuItem?: any;
  isSubmitting?: boolean;
  restaurantId: string;
}

export function MenuItemForm({ 
  open, 
  onOpenChange, 
  onSubmit, 
  menuItem, 
  isSubmitting,
  restaurantId 
}: MenuItemFormProps) {
  const [addons, setAddons] = useState<ItemAddon[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState<string>(menuItem?.restaurant_id || restaurantId || "");
  const [tagInput, setTagInput] = useState("");

  const { data: restaurants = [] } = useQuery({
    queryKey: ['restaurants'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data;
    }
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['restaurant-categories', selectedRestaurant],
    queryFn: async () => {
      if (!selectedRestaurant) return [];
      
      const { data, error } = await supabase
        .from('restaurant_categories')
        .select('*')
        .eq('restaurant_id', selectedRestaurant)
        .eq('is_active', true)
        .order('display_order');
      
      if (error) throw error;
      return data;
    },
    enabled: !!selectedRestaurant
  });

  // Fetch addons if editing an existing menu item
  const { data: menuItemAddons = [] } = useQuery({
    queryKey: ['menu-item-addons', menuItem?.id],
    queryFn: async () => {
      if (!menuItem?.id) return [];
      
      const { data, error } = await supabase
        .from('item_addons')
        .select('*')
        .eq('menu_item_id', menuItem.id);
      
      if (error) throw error;
      return data;
    },
    enabled: !!menuItem?.id && !!open
  });

  const form = useForm({
    defaultValues: {
      restaurant_id: menuItem?.restaurant_id || restaurantId || "",
      name: menuItem?.name || "",
      description: menuItem?.description || "",
      subtitle: menuItem?.subtitle || "",
      price: menuItem?.price || 0,
      offer_price: menuItem?.offer_price || 0,
      category_id: menuItem?.category_id || "",
      is_veg: menuItem?.is_veg || false,
      is_customisable: menuItem?.is_customisable || false,
      is_popular: menuItem?.is_popular || false,
      is_sold_out: menuItem?.is_sold_out || false,
      available: menuItem?.available !== false,
      preparation_time: menuItem?.preparation_time || 30,
      quantity_label: menuItem?.quantity_label || "",
      image_url: menuItem?.image_url || "",
      product_tags: menuItem?.product_tags || [],
      rating_value: menuItem?.rating_value || 0,
      rating_count: menuItem?.rating_count || 0,
      availability_window: menuItem?.availability_window || "All Day",
      unavailable_reason: menuItem?.unavailable_reason || "",
      iscombo: menuItem?.iscombo || false,
      combo_description: Array.isArray(menuItem?.combo_description) ? menuItem.combo_description : [],
    }
  });

  useEffect(() => {
    if (open) {
      form.reset({
        restaurant_id: menuItem?.restaurant_id || restaurantId || "",
        name: menuItem?.name || "",
        description: menuItem?.description || "",
        subtitle: menuItem?.subtitle || "",
        price: menuItem?.price || 0,
        offer_price: menuItem?.offer_price || 0,
        category_id: menuItem?.category_id || "",
        is_veg: menuItem?.is_veg || false,
        is_customisable: menuItem?.is_customisable || false,
        is_popular: menuItem?.is_popular || false,
        is_sold_out: menuItem?.is_sold_out || false,
        available: menuItem?.available !== false,
        preparation_time: menuItem?.preparation_time || 30,
        quantity_label: menuItem?.quantity_label || "",
        image_url: menuItem?.image_url || "",
        product_tags: menuItem?.product_tags || [],
        rating_value: menuItem?.rating_value || 0,
        rating_count: menuItem?.rating_count || 0,
        availability_window: menuItem?.availability_window || "All Day",
        unavailable_reason: menuItem?.unavailable_reason || "",
        iscombo: menuItem?.iscombo || false,
        combo_description: Array.isArray(menuItem?.combo_description) ? menuItem.combo_description : [],
      });
      setSelectedRestaurant(menuItem?.restaurant_id || restaurantId || "");
      setTagInput("");
    }
  }, [form, menuItem, open, restaurantId]);

  // Set addons from API when editing an existing menu item
  useEffect(() => {
    if (open && menuItemAddons.length > 0) {
      setAddons(menuItemAddons);
    } else if (open && !menuItem?.id) {
      // Reset addons for new menu items
      setAddons([]);
    }
  }, [open, menuItemAddons, menuItem?.id]);

  const handleAddTag = () => {
    if (tagInput.trim()) {
      const currentTags = form.getValues("product_tags") || [];
      if (!currentTags.includes(tagInput.trim())) {
        form.setValue("product_tags", [...currentTags, tagInput.trim()]);
      }
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const currentTags = form.getValues("product_tags") || [];
    form.setValue("product_tags", currentTags.filter(tag => tag !== tagToRemove));
  };

  const handleSubmit = async (values: any) => {
    await onSubmit({
      ...values,
      addons: addons,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>
            {menuItem ? "Edit Menu Item" : "Add Menu Item"}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-120px)] pr-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Item Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter item name" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter item description"
                        className="resize-none"
                        {...field} 
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="subtitle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subtitle</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter subtitle" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="restaurant_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Restaurant</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={(value) => {
                        field.onChange(value);
                        setSelectedRestaurant(value);
                        form.setValue('category_id', '');
                      }}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a restaurant" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {restaurants.map((restaurant) => (
                          <SelectItem key={restaurant.id} value={restaurant.id}>
                            {restaurant.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={!selectedRestaurant}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={selectedRestaurant ? "Select a category" : "Select a restaurant first"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} min={0} step={0.01} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="offer_price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Offer Price</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} min={0} step={0.01} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="preparation_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preparation Time (minutes)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} min={0} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="image_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Item Image</FormLabel>
                    <FormControl>
                      <FileUpload
                        bucket="menu-items"
                        maxSize={2}
                        onUploadComplete={(url) => {
                          console.log("Image upload complete, setting URL:", url);
                          field.onChange(url);
                        }}
                        accept="image/*"
                        className="w-full"
                        existingUrl={field.value}
                        categoryId={form.getValues("category_id")}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="quantity_label"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity Label</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., per plate, 250g, etc." {...field} />
                    </FormControl>
                    <FormDescription>
                      Specify the serving size or quantity information
                    </FormDescription>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="product_tags"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tags</FormLabel>
                    <div className="flex gap-2">
                      <FormControl>
                        <Input
                          value={tagInput}
                          onChange={(e) => setTagInput(e.target.value)}
                          placeholder="Add a tag"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddTag();
                            }
                          }}
                        />
                      </FormControl>
                      <Button 
                        type="button" 
                        onClick={handleAddTag}
                        variant="outline"
                      >
                        Add
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {field.value?.map((tag: string, index: number) => (
                        <div 
                          key={index}
                          className="flex items-center gap-1 bg-secondary px-2 py-1 rounded-md"
                        >
                          <span>{tag}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveTag(tag)}
                            className="text-muted-foreground hover:text-destructive"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="is_veg"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Vegetarian</FormLabel>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="is_customisable"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Customisable</FormLabel>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="available"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Available</FormLabel>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="is_popular"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Popular</FormLabel>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="is_sold_out"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Sold Out</FormLabel>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="rating_value"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rating Value</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} min={0} max={5} step={0.1} />
                      </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="unavailable_reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Unavailable Reason</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter reason if item is unavailable"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
                  control={form.control}
                  name="rating_count"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rating Count</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} min={0} placeholder="e.g., 100, 250" />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="availability_window"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Availability Window</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select availability" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="All Day">All Day</SelectItem>
                        <SelectItem value="Breakfast">Breakfast</SelectItem>
                        <SelectItem value="Lunch">Lunch</SelectItem>
                        <SelectItem value="Dinner">Dinner</SelectItem>
                        <SelectItem value="Late Night">Late Night</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="iscombo"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Is Combo</FormLabel>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {form.watch("iscombo") && (
                <FormField
                  control={form.control}
                  name="combo_description"
                  render={({ field }) => {
                    const items = field.value || [];
                    
                    return (
                      <FormItem>
                        <FormLabel>Combo Items</FormLabel>
                        <FormControl>
                          <div className="space-y-2">
                            {items.map((item: string, index: number) => (
                              <div key={index} className="flex gap-2">
                                <Input
                                  value={item}
                                  onChange={(e) => {
                                    const newItems = [...items];
                                    newItems[index] = e.target.value;
                                    field.onChange(newItems);
                                  }}
                                  placeholder="e.g. Starter: Garlic Bread"
                                />
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="icon"
                                  onClick={() => {
                                    const newItems = items.filter((_: string, i: number) => i !== index);
                                    field.onChange(newItems);
                                  }}
                                >
                                  ×
                                </Button>
                              </div>
                            ))}
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                field.onChange([...items, ""]);
                              }}
                              className="w-full"
                            >
                              Add Combo Item
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />
              )}

              {form.watch("is_customisable") && (
                <AddonsForm addons={addons} onAddonsChange={setAddons} />
              )}

              <div className="flex justify-end space-x-4">
                <Button 
                  variant="outline" 
                  onClick={() => onOpenChange(false)}
                  type="button"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : menuItem ? "Save Changes" : "Add Item"}
                </Button>
              </div>
            </form>
          </Form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
