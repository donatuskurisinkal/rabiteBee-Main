
import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
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
import { useTenant } from "@/contexts/TenantContext";
import { getTenantHeaders } from "@/utils/tenantHeaders";

interface Tenant {
  id: string;
  name: string;
}

interface PeakHour {
  id: string;
  start_time: string;
  end_time: string;
  tenant_id: string | null;
  day_of_week: string;
  is_active: boolean;
  multiplier: number;
}

const formSchema = z.object({
  tenant_id: z.string().nullable(),
  start_time: z.string().min(1, { message: "Start time is required" }),
  end_time: z.string().min(1, { message: "End time is required" }),
  day_of_week: z.enum(["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"], {
    required_error: "Day of week is required",
  }),
  is_active: z.boolean().default(true),
  multiplier: z.coerce.number()
    .min(1, { message: "Multiplier must be at least 1.0" })
    .default(1.0),
});

type FormValues = z.infer<typeof formSchema>;

interface PeakHourFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  peakHour?: PeakHour;
}

const PeakHourForm: React.FC<PeakHourFormProps> = ({
  isOpen,
  onClose,
  onSuccess,
  peakHour,
}) => {
  const { toast } = useToast();
  const { selectedTenant } = useTenant();
  const isEditMode = !!peakHour;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      tenant_id: peakHour?.tenant_id || selectedTenant?.id || null,
      start_time: peakHour?.start_time || "",
      end_time: peakHour?.end_time || "",
      day_of_week: peakHour?.day_of_week as any || "monday",
      is_active: peakHour?.is_active ?? true,
      multiplier: peakHour?.multiplier ?? 1.0,
    },
    mode: "onChange"
  });

  const { data: tenants, isLoading: tenantsLoading } = useQuery({
    queryKey: ["tenants"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tenants")
        .select("id, name")
        .order("name");

      if (error) throw error;
      return data as Tenant[];
    },
  });

  useEffect(() => {
    if (peakHour) {
      form.reset({
        tenant_id: peakHour.tenant_id || selectedTenant?.id || null,
        start_time: peakHour.start_time || "",
        end_time: peakHour.end_time || "",
        day_of_week: peakHour.day_of_week as any || "monday",
        is_active: peakHour.is_active,
        multiplier: peakHour.multiplier ?? 1.0,
      });
    } else {
      form.reset({
        tenant_id: selectedTenant?.id || null,
        start_time: "",
        end_time: "",
        day_of_week: "monday",
        is_active: true,
        multiplier: 1.0,
      });
    }
  }, [peakHour, form, selectedTenant]);

  const onSubmit = async (values: FormValues) => {
    try {
      // Validate time format
      if (!values.start_time || !values.end_time) {
        toast({
          variant: "destructive",
          title: "Validation error",
          description: "Both start time and end time are required",
        });
        return;
      }

      // Format times properly to ensure they're in HH:MM:SS format
      const formatTime = (timeStr: string) => {
        if (!timeStr.includes(':')) return timeStr + ":00"; // Add seconds if not present
        if (timeStr.split(':').length === 2) return timeStr + ":00"; // Add seconds if not present
        return timeStr;
      };

      const formattedStartTime = formatTime(values.start_time);
      const formattedEndTime = formatTime(values.end_time);
      
      // Ensure tenant_id is null if "null" is selected
      const tenantId = values.tenant_id === "null" ? null : values.tenant_id || selectedTenant?.id || null;
      
      if (isEditMode) {
        const { error } = await supabase
          .from("peak_hours")
          .update({
            tenant_id: tenantId,
            start_time: formattedStartTime,
            end_time: formattedEndTime,
            day_of_week: values.day_of_week,
            is_active: values.is_active,
            multiplier: values.multiplier,
          })
          .eq("id", peakHour?.id)
          .select()
          .single();

        if (error) throw error;

        toast({
          title: "Peak hour updated",
          description: "Peak hour has been updated successfully",
        });
      } else {
        const { error } = await supabase
          .from("peak_hours")
          .insert({
            tenant_id: tenantId,
            start_time: formattedStartTime,
            end_time: formattedEndTime,
            day_of_week: values.day_of_week,
            is_active: values.is_active,
            multiplier: values.multiplier,
          })
          .select()
          .single();

        if (error) throw error;

        toast({
          title: "Peak hour added",
          description: "Peak hour has been added successfully",
        });
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: isEditMode ? "Failed to update peak hour" : "Failed to add peak hour",
        description: error.message,
      });
      console.error("Peak hour form error:", error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edit Peak Hour" : "Add Peak Hour"}</DialogTitle>
          <DialogDescription>
            Set peak hours for increased pricing during busy periods.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="tenant_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tenant</FormLabel>
                  <Select
                    disabled={tenantsLoading}
                    onValueChange={field.onChange}
                    value={field.value || "null"}
                    defaultValue={field.value || "null"}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a tenant" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="null">All Tenants</SelectItem>
                      {tenants?.map((tenant) => (
                        <SelectItem key={tenant.id} value={tenant.id}>
                          {tenant.name}
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
              name="day_of_week"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Day of Week</FormLabel>
                  <Select 
                    onValueChange={field.onChange}
                    value={field.value}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a day" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="monday">Monday</SelectItem>
                      <SelectItem value="tuesday">Tuesday</SelectItem>
                      <SelectItem value="wednesday">Wednesday</SelectItem>
                      <SelectItem value="thursday">Thursday</SelectItem>
                      <SelectItem value="friday">Friday</SelectItem>
                      <SelectItem value="saturday">Saturday</SelectItem>
                      <SelectItem value="sunday">Sunday</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="start_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Time</FormLabel>
                    <FormControl>
                      <Input 
                        type="time" 
                        {...field} 
                        value={field.value || ""} 
                        onChange={(e) => {
                          field.onChange(e.target.value);
                        }}
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
                        type="time" 
                        {...field} 
                        value={field.value || ""} 
                        onChange={(e) => {
                          field.onChange(e.target.value);
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
              name="multiplier"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price Multiplier</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      {...field} 
                      step="0.1"
                      min="1.0"
                      placeholder="e.g. 1.2 for 20% increase"
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

            <div className="flex justify-end space-x-2">
              <Button variant="outline" type="button" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit">
                {isEditMode ? "Update" : "Add"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default PeakHourForm;
