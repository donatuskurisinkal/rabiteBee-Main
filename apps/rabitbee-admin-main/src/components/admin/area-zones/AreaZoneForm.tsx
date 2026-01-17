
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useTenant } from "@/hooks/use-tenant";

interface AreaZoneFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  areaZone?: {
    id: string;
    name: string;
    description: string | null;
    latitude: number | null;
    longitude: number | null;
    price: number;
    is_active: boolean;
    tenant_id: string | null;
  };
}

const formSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters long"),
  description: z.string().optional(),
  latitude: z.coerce.number().optional().nullable(),
  longitude: z.coerce.number().optional().nullable(),
  price: z.coerce.number().min(0, "Price cannot be negative"),
  is_active: z.boolean().default(true),
});

type FormValues = z.infer<typeof formSchema>;

const AreaZoneForm = ({
  isOpen,
  onClose,
  onSuccess,
  areaZone,
}: AreaZoneFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { selectedTenant } = useTenant();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: areaZone
      ? {
          name: areaZone.name,
          description: areaZone.description || "",
          latitude: areaZone.latitude,
          longitude: areaZone.longitude,
          price: areaZone.price,
          is_active: areaZone.is_active || false,
        }
      : {
          name: "",
          description: "",
          latitude: null,
          longitude: null,
          price: 0,
          is_active: true,
        },
  });

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      if (areaZone) {
        // Update existing area zone
        const { error } = await supabase
          .from("area_zones")
          .update({
            name: values.name,
            description: values.description || null,
            latitude: values.latitude,
            longitude: values.longitude,
            price: values.price,
            is_active: values.is_active,
          })
          .eq("id", areaZone.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Area zone updated successfully",
        });
      } else {
        // Create new area zone
        const { error } = await supabase.from("area_zones").insert({
          name: values.name,
          description: values.description || null,
          latitude: values.latitude,
          longitude: values.longitude,
          price: values.price,
          is_active: values.is_active,
          tenant_id: selectedTenant?.id || null,
        });

        if (error) throw error;

        toast({
          title: "Success",
          description: "Area zone created successfully",
        });
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Error saving area zone:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "An error occurred while saving",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {areaZone ? "Edit Area Zone" : "Add Area Zone"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter zone name" 
                      {...field} 
                    />
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
                      placeholder="Enter description (optional)"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="latitude"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Latitude</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="any"
                        placeholder="Enter latitude"
                        {...field}
                        value={field.value === null ? "" : field.value}
                        onChange={(e) => {
                          const value = e.target.value === "" ? null : Number(e.target.value);
                          field.onChange(value);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="longitude"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Longitude</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="any"
                        placeholder="Enter longitude"
                        {...field}
                        value={field.value === null ? "" : field.value}
                        onChange={(e) => {
                          const value = e.target.value === "" ? null : Number(e.target.value);
                          field.onChange(value);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      step="any"
                      placeholder="0"
                      {...field}
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
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Active</FormLabel>
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

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? "Saving..."
                  : areaZone
                  ? "Update"
                  : "Create"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AreaZoneForm;
