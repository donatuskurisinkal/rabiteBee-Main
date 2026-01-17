import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";

const formSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  description: z.string().optional(),
  base_price: z.coerce.number().min(0, { message: "Base price must be non-negative" }),
  offer_price: z.coerce.number().optional(),
  discount_percent: z.coerce.number().min(0).max(100).optional(),
  gst_percent: z.coerce.number().min(0).max(100).optional().default(18),
  service_charge: z.coerce.number().min(0).optional(),
  is_active: z.boolean().default(true),
  vehicle_type_id: z.string().min(1, { message: "Vehicle type is required" }),
  vehicle_model_id: z.string().optional(),
});

interface WashTypeFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: z.infer<typeof formSchema>) => void;
  washType: any;
  isSubmitting: boolean;
}

export function WashTypeForm({
  open,
  onOpenChange,
  onSubmit,
  washType,
  isSubmitting,
}: WashTypeFormProps) {
  const { selectedTenant } = useTenant();
  const isEditMode = !!washType;

  const { data: vehicleTypes = [] } = useQuery({
    queryKey: ['vehicle-types', selectedTenant?.id],
    queryFn: async () => {
      let query = supabase
        .from('wash_vehicle_types')
        .select('*');

      if (selectedTenant?.id) {
        query = query.eq('tenant_id', selectedTenant.id);
      }

      const { data, error } = await query.order('name');
      if (error) throw error;
      return data;
    },
  });

  const { data: allModels = [] } = useQuery({
    queryKey: ['vehicle-models', selectedTenant?.id],
    queryFn: async () => {
      let query = supabase
        .from('wash_vehicle_models')
        .select('id, name, type_id');

      if (selectedTenant?.id) {
        query = query.eq('tenant_id', selectedTenant.id);
      }

      const { data, error } = await query.order('name');
      if (error) throw error;
      return data;
    },
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: washType?.name || "",
      description: washType?.description || "",
      base_price: washType?.base_price || 0,
      offer_price: washType?.offer_price || undefined,
      discount_percent: washType?.discount_percent || undefined,
      gst_percent: washType?.gst_percent || 18,
      service_charge: washType?.service_charge || undefined,
      is_active: washType?.is_active ?? true,
      vehicle_type_id: washType?.vehicle_type_id || "",
      vehicle_model_id: washType?.vehicle_model_id || "",
    },
  });

  const [filteredModels, setFilteredModels] = useState<any[]>([]);

  useEffect(() => {
    const vehicle_type_id = form.watch("vehicle_type_id");
    if (vehicle_type_id && allModels.length > 0) {
      setFilteredModels(
        allModels.filter((model) => model.type_id === vehicle_type_id)
      );
    } else {
      setFilteredModels([]);
    }
  }, [form.watch("vehicle_type_id"), allModels]);

  useEffect(() => {
    if (open) {
      form.reset({
        name: washType?.name || "",
        description: washType?.description || "",
        base_price: washType?.base_price || 0,
        offer_price: washType?.offer_price || undefined,
        discount_percent: washType?.discount_percent || undefined,
        gst_percent: washType?.gst_percent || 18,
        service_charge: washType?.service_charge || undefined,
        is_active: washType?.is_active ?? true,
        vehicle_type_id: washType?.vehicle_type_id || "",
        vehicle_model_id: washType?.vehicle_model_id || "",
      });
    }
  }, [open, washType, form]);

  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === "vehicle_type_id") {
        form.setValue("vehicle_model_id", "");
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    onSubmit(values);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edit Wash Type" : "Add Wash Type"}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[calc(90vh-10rem)] pr-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="vehicle_type_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vehicle Type</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a vehicle type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {vehicleTypes.map((type) => (
                          <SelectItem key={type.id} value={type.id}>
                            {type.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="vehicle_model_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vehicle Model</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      defaultValue={field.value}
                      disabled={!form.watch("vehicle_type_id") || filteredModels.length === 0}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={
                            !form.watch("vehicle_type_id")
                              ? "Select vehicle type first"
                              : filteredModels.length === 0
                                ? "No models for selected type"
                                : "Select vehicle model (optional)"
                          } />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {filteredModels.map((model) => (
                          <SelectItem key={model.id} value={model.id}>
                            {model.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter wash type name" />
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
                      <Input {...field} placeholder="Enter description (optional)" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="base_price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Base Price</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field} 
                        placeholder="Enter base price" 
                        min={0} 
                        step="0.01" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="offer_price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Offer Price (Optional)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field} 
                        placeholder="Enter offer price" 
                        min={0} 
                        step="0.01" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="discount_percent"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Discount Percentage (Optional)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field} 
                        placeholder="Enter discount percentage" 
                        min={0} 
                        max={100} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="gst_percent"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>GST Percentage</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field} 
                        placeholder="Enter GST percentage" 
                        min={0} 
                        max={100} 
                        step="0.01"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="service_charge"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Service Charge (Optional)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field} 
                        placeholder="Enter service charge" 
                        min={0} 
                        step="0.01" 
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
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
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
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : isEditMode ? "Update" : "Create"}
                </Button>
              </div>
            </form>
          </Form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
