
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { useQuery } from "@tanstack/react-query";
import { Switch } from "@/components/ui/switch";

const formSchema = z.object({
  slot_id: z.string().min(1, "Time slot is required"),
  override_date: z.date({
    required_error: "Override date is required",
  }),
  max_bookings: z.number().min(1, "Max bookings must be at least 1").max(999, "Max bookings cannot exceed 999"),
  is_active: z.boolean().default(true),
});

interface SlotOverride {
  id: string;
  slot_id: string;
  override_date: string;
  max_bookings: number;
  is_active: boolean;
  tenant_id?: string | null;
}

interface SlotOverrideFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: any) => Promise<void>;
  slotOverride?: SlotOverride | null;
  isSubmitting: boolean;
}

export function SlotOverrideForm({
  open,
  onOpenChange,
  onSubmit,
  slotOverride,
  isSubmitting
}: SlotOverrideFormProps) {
  const { selectedTenant } = useTenant();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      slot_id: "",
      override_date: new Date(),
      max_bookings: 1,
      is_active: true,
    },
  });

  // Fetch time slots for the dropdown
  const { data: timeSlots = [] } = useQuery({
    queryKey: ['time-slots', selectedTenant?.id],
    queryFn: async () => {
      let query = supabase
        .from('wash_time_slots')
        .select('*')
        .eq('is_active', true);
      
      if (selectedTenant?.id) {
        query = query.eq('tenant_id', selectedTenant.id);
      }
      
      const { data, error } = await query.order('start_time');
      
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (slotOverride) {
      form.reset({
        slot_id: slotOverride.slot_id,
        override_date: new Date(slotOverride.override_date),
        max_bookings: slotOverride.max_bookings,
        is_active: slotOverride.is_active,
      });
    } else {
      form.reset({
        slot_id: "",
        override_date: new Date(),
        max_bookings: 1,
        is_active: true,
      });
    }
  }, [slotOverride, form]);

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    await onSubmit({
      ...values,
      override_date: format(values.override_date, 'yyyy-MM-dd'),
    });
  };

  const formatTime = (timeStr: string) => {
    const date = new Date(`2000-01-01T${timeStr}`);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {slotOverride ? "Edit Slot Override" : "Add Slot Override"}
          </DialogTitle>
          <DialogDescription>
            {slotOverride 
              ? "Update the slot override details below." 
              : "Add a new slot override to adjust capacity for specific dates."
            }
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="slot_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Time Slot</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a time slot" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {timeSlots.map((slot) => (
                        <SelectItem key={slot.id} value={slot.id}>
                          {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
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
              name="override_date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Override Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date < new Date() || date < new Date("1900-01-01")
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="max_bookings"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Max Bookings</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      max="999"
                      {...field}
                      onChange={(e) => {
                        const value = parseInt(e.target.value);
                        field.onChange(isNaN(value) ? 1 : Math.max(1, Math.min(999, value)));
                      }}
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
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Active Status</FormLabel>
                    <div className="text-sm text-muted-foreground">
                      Enable or disable this slot override
                    </div>
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
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : slotOverride ? "Update" : "Create"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
