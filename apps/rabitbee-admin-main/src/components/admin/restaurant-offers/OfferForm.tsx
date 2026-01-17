
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { FileUpload } from "@/components/admin/FileUpload";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  discount_percent: z.number().min(0).max(100),
  min_order: z.number().min(0),
  valid_from: z.string().min(1, "Valid from date is required"),
  valid_to: z.string().min(1, "Valid to date is required"),
  is_active: z.boolean().default(true),
  image_url: z.string().optional(),
  restaurant_id: z.string().uuid()
});

interface OfferFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  offer?: any;
  onSaved?: () => void;
  restaurantId: string;
}

export function OfferForm({ open, onOpenChange, offer, onSaved, restaurantId }: OfferFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: offer?.title || "",
      description: offer?.description || "",
      discount_percent: offer?.discount_percent || 0,
      min_order: offer?.min_order || 0,
      valid_from: offer?.valid_from ? new Date(offer.valid_from).toISOString().split('T')[0] : "",
      valid_to: offer?.valid_to ? new Date(offer.valid_to).toISOString().split('T')[0] : "",
      is_active: offer?.is_active ?? true,
      image_url: offer?.image_url || "",
      restaurant_id: restaurantId
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsSubmitting(true);
      console.log("Submitting values:", values);
      
      // Ensure numeric fields are properly converted
      const offerData = {
        title: values.title,
        description: values.description || "",
        discount_percent: Number(values.discount_percent),
        min_order: Number(values.min_order),
        valid_from: new Date(values.valid_from).toISOString(),
        valid_to: new Date(values.valid_to).toISOString(),
        is_active: values.is_active,
        image_url: values.image_url || "",
        restaurant_id: values.restaurant_id
      };
      
      console.log("Processed offer data:", offerData);
      
      if (offer) {
        // Update existing offer
        const { error } = await supabase
          .from('restaurant_offers')
          .update(offerData)
          .eq('id', offer.id);

        if (error) {
          console.error("Update error:", error);
          throw error;
        }
        console.log("Offer updated successfully");
        toast.success("Offer updated successfully");
      } else {
        // Create new offer
        console.log("Attempting to insert new offer");
        const { data, error } = await supabase
          .from('restaurant_offers')
          .insert(offerData)
          .select();

        if (error) {
          console.error("Insert error:", error);
          throw error;
        }
        console.log("Offer created successfully:", data);
        toast.success("Offer created successfully");
      }

      onSaved?.();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Submission error:", error);
      toast.error(error.message || "Failed to save offer");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{offer ? "Edit Offer" : "Create New Offer"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input {...field} />
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
                    <Textarea {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="discount_percent"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Discount %</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field} 
                        onChange={e => field.onChange(parseFloat(e.target.value) || 0)} 
                        value={field.value}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="min_order"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Minimum Order (₹)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field} 
                        onChange={e => field.onChange(parseFloat(e.target.value) || 0)} 
                        value={field.value}
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
                name="valid_from"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valid From</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="valid_to"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valid To</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="image_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Offer Image</FormLabel>
                  <FormControl>
                    <FileUpload
                      bucket="restaurant-offers"
                      accept="image/*"
                      onUploadComplete={field.onChange}
                      existingUrl={field.value}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Active</FormLabel>
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

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : (offer ? "Update Offer" : "Create Offer")}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
