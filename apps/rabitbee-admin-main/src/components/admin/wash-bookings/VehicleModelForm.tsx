
import { useEffect } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";

interface VehicleModel {
  id: string;
  name: string;
  is_active: boolean;
  type_id?: string | null;
  tenant_id?: string | null;
}

interface VehicleType {
  id: string;
  name: string;
}

const formSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  type_id: z.string().min(1, { message: "Vehicle type is required" }),
  is_active: z.boolean().default(true),
});

interface VehicleModelFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: z.infer<typeof formSchema>) => void;
  vehicleModel: VehicleModel | null;
  isSubmitting: boolean;
}

export function VehicleModelForm({
  open,
  onOpenChange,
  onSubmit,
  vehicleModel,
  isSubmitting,
}: VehicleModelFormProps) {
  const isEditMode = !!vehicleModel;
  const { selectedTenant } = useTenant();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: vehicleModel?.name || "",
      type_id: vehicleModel?.type_id || "",
      is_active: vehicleModel?.is_active ?? true,
    },
  });

  // Fetch vehicle types for dropdown
  const { data: vehicleTypes = [], isLoading: typesLoading } = useQuery({
    queryKey: ['vehicle-types-for-dropdown', selectedTenant?.id],
    queryFn: async () => {
      let query = supabase
        .from('wash_vehicle_types')
        .select('id, name');
      
      if (selectedTenant?.id) {
        query = query.eq('tenant_id', selectedTenant.id);
      }
      
      const { data, error } = await query.order('name');
      
      if (error) throw error;
      return data as VehicleType[];
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        name: vehicleModel?.name || "",
        type_id: vehicleModel?.type_id || "",
        is_active: vehicleModel?.is_active ?? true,
      });
    }
  }, [open, vehicleModel, form]);

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    onSubmit(values);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edit Vehicle Model" : "Add Vehicle Model"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter vehicle model name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vehicle Type</FormLabel>
                  <Select 
                    disabled={typesLoading}
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

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : isEditMode ? "Update" : "Create"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
