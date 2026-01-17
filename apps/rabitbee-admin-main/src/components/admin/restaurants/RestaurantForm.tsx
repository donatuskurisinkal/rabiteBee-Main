import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTenant } from "@/contexts/TenantContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { FileUpload } from "@/components/admin/FileUpload";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LocationPicker } from "./LocationPicker";

// UI component imports
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { 
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const formSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Restaurant name is required"),
  description: z.string().optional(),
  address: z.string().min(1, "Address is required"),
  logo_url: z.string().optional(),
  cover_image_url: z.string().optional(),
  opening_time: z.string().min(1, "Opening time is required"),
  closing_time: z.string().min(1, "Closing time is required"),
  min_order_value: z.number().min(0),
  delivery_fee: z.number().min(0),
  prep_time_mins: z.number().min(1, "Preparation time is required"),
  isActive: z.boolean().default(false),
  is_open: z.boolean().default(true),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  tags: z.array(z.string()).default([]),
  food_type: z.enum(['Veg', 'Non-veg', 'All']).default('All'),
  is_sold_out: z.boolean().default(false),
  subtitle: z.string().optional(),
  availability_window: z.enum(['All Day', 'Morning', 'Afternoon', 'Evening', 'Night']).default('All Day'),
});

type FormValues = z.infer<typeof formSchema>;

interface RestaurantFormProps {
  restaurant?: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

export function RestaurantForm({ restaurant, open, onOpenChange, onSaved }: RestaurantFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { selectedTenant } = useTenant();
  const [tagInput, setTagInput] = useState("");

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      id: "",
      name: "",
      description: "",
      address: "",
      logo_url: "",
      cover_image_url: "",
      opening_time: "09:00",
      closing_time: "22:00",
      min_order_value: 0,
      delivery_fee: 0,
      prep_time_mins: 30,
      isActive: false,
      is_open: true,
      latitude: undefined,
      longitude: undefined,
      tags: [],
      food_type: 'All',
      is_sold_out: false,
      subtitle: "",
      availability_window: 'All Day',
    },
  });

  useEffect(() => {
    if (open) {
      console.log("Restaurant data for form:", restaurant);
      
      form.reset({
        id: restaurant?.id || "",
        name: restaurant?.name || "",
        description: restaurant?.description || "",
        address: restaurant?.address || "",
        logo_url: restaurant?.logo_url || "",
        cover_image_url: restaurant?.cover_image_url || "",
        opening_time: restaurant?.opening_time || "09:00",
        closing_time: restaurant?.closing_time || "22:00",
        min_order_value: restaurant?.min_order_value || 0,
        delivery_fee: restaurant?.delivery_fee || 0,
        prep_time_mins: restaurant?.prep_time_mins || 30,
        isActive: restaurant?.isActive || false,
        is_open: restaurant?.is_open !== false,
        latitude: restaurant?.latitude || undefined,
        longitude: restaurant?.longitude || undefined,
        tags: restaurant?.tags || [],
        food_type: restaurant?.food_type || 'All',
        is_sold_out: restaurant?.is_sold_out || false,
        subtitle: restaurant?.subtitle || "",
        availability_window: restaurant?.availability_window || 'All Day',
      });
    }
  }, [restaurant, open, form]);

  const handleAddTag = () => {
    if (tagInput.trim()) {
      const currentTags = form.getValues("tags");
      if (!currentTags.includes(tagInput.trim())) {
        form.setValue("tags", [...currentTags, tagInput.trim()]);
      }
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const currentTags = form.getValues("tags");
    form.setValue("tags", currentTags.filter(tag => tag !== tagToRemove));
  };

  const handleLocationSelect = (location: { lat: number; lng: number }) => {
    form.setValue("latitude", location.lat);
    form.setValue("longitude", location.lng);
  };

  const handleLocationChange = (lat: number, lng: number) => {
    form.setValue("latitude", lat);
    form.setValue("longitude", lng);
  };

  const handleImageUpload = (type: 'logo' | 'cover', url: string) => {
    console.log(`Setting ${type} image URL:`, url);
    form.setValue(type === 'logo' ? 'logo_url' : 'cover_image_url', url);
  };

  const onSubmit = async (values: FormValues) => {
    if (!selectedTenant) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select a tenant first",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const slug = values.name
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w-]+/g, '');

      const restaurantData = {
        name: values.name,
        description: values.description || "",
        address: values.address,
        logo_url: values.logo_url || "",
        cover_image_url: values.cover_image_url || "",
        opening_time: values.opening_time,
        closing_time: values.closing_time,
        min_order_value: values.min_order_value,
        delivery_fee: values.delivery_fee,
        prep_time_mins: values.prep_time_mins,
        isactive: values.isActive,
        is_open: values.is_open,
        tenant_id: selectedTenant.id,
        slug: slug,
        latitude: values.latitude,
        longitude: values.longitude,
        tags: values.tags,
        food_type: values.food_type,
        is_sold_out: values.is_sold_out,
        subtitle: values.subtitle || "",
        availability_window: values.availability_window,
      };

      let response;
      if (values.id) {
        response = await supabase
          .from('restaurants')
          .update(restaurantData)
          .eq('id', values.id);
      } else {
        response = await supabase
          .from('restaurants')
          .insert(restaurantData);
      }

      if (response.error) throw response.error;

      toast({
        title: `Restaurant ${values.id ? "updated" : "created"} successfully`,
        description: `${values.name} has been ${values.id ? "updated" : "created"}.`,
      });

      onSaved();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error saving restaurant:", error);
      toast({
        variant: "destructive",
        title: "Error saving restaurant",
        description: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>
            {restaurant ? "Edit Restaurant" : "Add New Restaurant"}
          </DialogTitle>
          <DialogDescription>
            {restaurant ? "Make changes to the restaurant details below." : "Enter the details for the new restaurant."}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-8rem)]">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Restaurant Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter restaurant name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter address" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="food_type"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Food Type</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex space-x-4"
                      >
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="Veg" />
                          </FormControl>
                          <FormLabel className="font-normal text-green-600">Veg Only</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="Non-veg" />
                          </FormControl>
                          <FormLabel className="font-normal text-red-600">Non-veg</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="All" />
                          </FormControl>
                          <FormLabel className="font-normal">All</FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormDescription>
                      Select the type of food served at this restaurant
                    </FormDescription>
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
                      <Input placeholder="e.g., Fast delivery, Great taste" {...field} />
                    </FormControl>
                    <FormMessage />
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
                        placeholder="Enter restaurant description"
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <FormLabel>Logo Image</FormLabel>
                  <FileUpload
                    bucket="restaurants"
                    folder={restaurant?.id || 'temp'}
                    onUploadComplete={(url) => handleImageUpload('logo', url)}
                    accept="image/*"
                    existingUrl={form.watch('logo_url')}
                  />
                </div>

                <div>
                  <FormLabel>Cover Image</FormLabel>
                  <FileUpload
                    bucket="restaurants"
                    folder={restaurant?.id || 'temp'}
                    onUploadComplete={(url) => handleImageUpload('cover', url)}
                    accept="image/*"
                    existingUrl={form.watch('cover_image_url')}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="opening_time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Opening Time</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="closing_time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Closing Time</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="min_order_value"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Minimum Order Value</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field}
                          onChange={e => field.onChange(parseFloat(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="delivery_fee"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Delivery Fee</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field}
                          onChange={e => field.onChange(parseFloat(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="prep_time_mins"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prep Time (mins)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field}
                          onChange={e => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Active Restaurant</FormLabel>
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
                  name="is_open"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Restaurant Open</FormLabel>
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

                <FormField
                  control={form.control}
                  name="availability_window"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Availability Window</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select availability" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectGroup>
                            <SelectItem value="All Day">All Day</SelectItem>
                            <SelectItem value="Morning">Morning</SelectItem>
                            <SelectItem value="Afternoon">Afternoon</SelectItem>
                            <SelectItem value="Evening">Evening</SelectItem>
                            <SelectItem value="Night">Night</SelectItem>
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="tags"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tags</FormLabel>
                    <FormControl>
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <Input
                            value={tagInput}
                            onChange={(e) => setTagInput(e.target.value)}
                            placeholder="Enter a tag"
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddTag();
                              }
                            }}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={handleAddTag}
                          >
                            Add
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {field.value.map((tag) => (
                            <div
                              key={tag}
                              className="flex items-center gap-1 bg-primary/10 px-2 py-1 rounded-md"
                            >
                              <span>{tag}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveTag(tag)}
                                className="text-muted-foreground hover:text-destructive"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormItem>
                <FormLabel>Location</FormLabel>
                <LocationPicker
                  defaultLocation={
                    form.getValues("latitude") && form.getValues("longitude")
                      ? {
                          lat: form.getValues("latitude")!,
                          lng: form.getValues("longitude")!,
                        }
                      : undefined
                  }
                  onLocationSelect={handleLocationSelect}
                  onLocationChange={handleLocationChange}
                  latitude={form.getValues("latitude")}
                  longitude={form.getValues("longitude")}
                />
              </FormItem>

              <DialogFooter className="mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : "Save"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
