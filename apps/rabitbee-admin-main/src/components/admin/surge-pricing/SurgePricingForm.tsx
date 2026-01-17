
import { useState, useEffect } from "react";
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
import { useToast } from "@/hooks/use-toast";
import { useTenant } from "@/hooks/use-tenant";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

interface SurgePricingFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  surgePricing?: {
    id: string;
    reason: string;
    extra_charge_amount: number;
    start_time: string;
    end_time: string;
    is_active: boolean;
    tenant_id: string | null;
  };
}

const formSchema = z.object({
  reason: z.string().min(3, "Reason must be at least 3 characters long"),
  extra_charge_amount: z.coerce
    .number()
    .min(1, "Charge amount must be at least 1")
    .max(10000, "Charge amount cannot exceed 10000"),
  start_time: z.string().min(1, "Start time is required"),
  end_time: z.string().min(1, "End time is required"),
  is_active: z.boolean().default(true),
  area_zones: z.array(z.string()).optional(),
  apply_to_all_zones: z.boolean().default(true),
});

type FormValues = z.infer<typeof formSchema>;

interface AreaZone {
  id: string;
  name: string;
}

const SurgePricingForm = ({
  isOpen,
  onClose,
  onSuccess,
  surgePricing,
}: SurgePricingFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [areaZones, setAreaZones] = useState<AreaZone[]>([]);
  const [selectedZones, setSelectedZones] = useState<string[]>([]);
  const [applyToAll, setApplyToAll] = useState(true);
  const { toast } = useToast();
  const { selectedTenant } = useTenant();

  useEffect(() => {
    // Fetch area zones
    const fetchAreaZones = async () => {
      let query = supabase.from("area_zones").select("id, name");
      
      if (selectedTenant) {
        query = query.eq("tenant_id", selectedTenant.id);
      }
      
      query = query.eq("is_active", true);
      
      const { data, error } = await query.order("name");
      
      if (error) {
        console.error("Error fetching area zones:", error);
        return;
      }
      
      setAreaZones(data || []);
    };
    
    fetchAreaZones();

    // If editing, fetch associated area zones
    if (surgePricing) {
      fetchSurgePricingZones(surgePricing.id);
    }
  }, [selectedTenant, surgePricing]);

  const fetchSurgePricingZones = async (surgePricingId: string) => {
    try {
      const { data, error } = await supabase
        .from("surge_pricing_area_zones")
        .select("area_zone_id")
        .eq("surge_pricing_id", surgePricingId);

      if (error) throw error;
      
      if (data && data.length > 0) {
        const zoneIds = data.map(item => item.area_zone_id);
        setSelectedZones(zoneIds);
        setApplyToAll(false);
      } else {
        setApplyToAll(true);
      }
    } catch (error) {
      console.error("Error fetching surge pricing zones:", error);
    }
  };

  // Format dates for form input
  const formatDateTimeForInput = (dateTimeStr: string) => {
    try {
      const date = new Date(dateTimeStr);
      return date.toISOString().slice(0, 16);  // Format as YYYY-MM-DDTHH:MM
    } catch (e) {
      return "";
    }
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: surgePricing
      ? {
          reason: surgePricing.reason,
          extra_charge_amount: surgePricing.extra_charge_amount,
          start_time: formatDateTimeForInput(surgePricing.start_time),
          end_time: formatDateTimeForInput(surgePricing.end_time),
          is_active: surgePricing.is_active || false,
          area_zones: [],
          apply_to_all_zones: true,
        }
      : {
          reason: "",
          extra_charge_amount: 10,
          start_time: "",
          end_time: "",
          is_active: true,
          area_zones: [],
          apply_to_all_zones: true,
        },
  });

  useEffect(() => {
    if (selectedZones.length > 0) {
      form.setValue('area_zones', selectedZones);
      form.setValue('apply_to_all_zones', false);
    }
  }, [selectedZones, form]);

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      let surgePricingId = surgePricing?.id;

      if (surgePricing) {
        // Update existing surge pricing
        const { error } = await supabase
          .from("surge_pricing")
          .update({
            reason: values.reason,
            extra_charge_amount: values.extra_charge_amount,
            start_time: values.start_time,
            end_time: values.end_time,
            is_active: values.is_active,
          })
          .eq("id", surgePricing.id);

        if (error) throw error;
      } else {
        // Create new surge pricing
        const { data, error } = await supabase.from("surge_pricing").insert({
          reason: values.reason,
          extra_charge_amount: values.extra_charge_amount,
          start_time: values.start_time,
          end_time: values.end_time,
          is_active: values.is_active,
          tenant_id: selectedTenant?.id || null,
        }).select('id');

        if (error) throw error;
        surgePricingId = data?.[0]?.id;
      }

      if (surgePricingId) {
        // First, delete any existing zone associations
        const { error: deleteError } = await supabase
          .from("surge_pricing_area_zones")
          .delete()
          .eq("surge_pricing_id", surgePricingId);

        if (deleteError) throw deleteError;

        // If not applying to all zones, insert the selected zones
        if (!values.apply_to_all_zones && values.area_zones && values.area_zones.length > 0) {
          const zoneInserts = values.area_zones.map(zoneId => ({
            surge_pricing_id: surgePricingId,
            area_zone_id: zoneId
          }));

          const { error: insertError } = await supabase
            .from("surge_pricing_area_zones")
            .insert(zoneInserts);

          if (insertError) throw insertError;
        }
      }

      toast({
        title: "Success",
        description: surgePricing 
          ? "Surge pricing updated successfully" 
          : "Surge pricing created successfully",
      });

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Error saving surge pricing:", error);
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
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {surgePricing ? "Edit Surge Pricing" : "Add Surge Pricing"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter the reason for surge pricing"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="extra_charge_amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Charge Amount</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      max={10000}
                      placeholder="10"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="start_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Time</FormLabel>
                    <FormControl>
                      <Input
                        type="datetime-local"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="end_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Time</FormLabel>
                    <FormControl>
                      <Input
                        type="datetime-local"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="apply_to_all_zones"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Apply to all zones</FormLabel>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={(checked) => {
                        field.onChange(checked);
                        setApplyToAll(checked);
                      }}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {!applyToAll && (
              <FormField
                control={form.control}
                name="area_zones"
                render={() => (
                  <FormItem>
                    <div className="mb-4">
                      <FormLabel>Select Area Zones</FormLabel>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[200px] overflow-y-auto border rounded-md p-2">
                      {areaZones.map((zone) => (
                        <FormItem
                          key={zone.id}
                          className="flex flex-row items-start space-x-3 space-y-0"
                        >
                          <FormControl>
                            <Checkbox
                              checked={selectedZones.includes(zone.id)}
                              onCheckedChange={(checked) => {
                                const updatedZones = checked
                                  ? [...selectedZones, zone.id]
                                  : selectedZones.filter((id) => id !== zone.id);
                                setSelectedZones(updatedZones);
                                form.setValue("area_zones", updatedZones);
                              }}
                            />
                          </FormControl>
                          <FormLabel className="font-normal cursor-pointer">
                            {zone.name}
                          </FormLabel>
                        </FormItem>
                      ))}
                      {areaZones.length === 0 && (
                        <div className="text-sm text-gray-500 p-2">
                          No active area zones found
                        </div>
                      )}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

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
                  : surgePricing
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

export default SurgePricingForm;
