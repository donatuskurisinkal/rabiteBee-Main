
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
import { useTenant } from "@/hooks/use-tenant";

interface Holiday {
  id: string;
  holiday_name: string;
  date: string;
}

interface HolidaySurcharge {
  id: string;
  holiday_id: string;
  extra_flat: number | null;
  multiplier: number;
  tenant_id: string | null;
  holiday?: Holiday;
}

const formSchema = z.object({
  holiday_id: z.string({
    required_error: "Please select a holiday",
  }),
  extra_flat: z.coerce.number().nullable().optional(),
  multiplier: z.coerce.number()
    .min(1, { message: "Multiplier must be at least 1.0" })
    .default(1.0),
  tenant_id: z.string().nullable(),
}).refine(data => data.extra_flat != null || data.multiplier > 1.0, {
  message: "You must specify either an extra flat fee or a multiplier greater than 1.0",
  path: ["extra_flat"],
});

interface HolidaySurchargeFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  surcharge?: HolidaySurcharge;
}

export default function HolidaySurchargeForm({
  isOpen,
  onClose,
  onSuccess,
  surcharge
}: HolidaySurchargeFormProps) {
  const { toast } = useToast();
  const { selectedTenant } = useTenant();
  const isEditMode = !!surcharge;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      holiday_id: surcharge?.holiday_id || "",
      extra_flat: surcharge?.extra_flat || null,
      multiplier: surcharge?.multiplier || 1.0,
      tenant_id: surcharge?.tenant_id || selectedTenant?.id || null,
    }
  });

  const { data: holidays, isLoading: holidaysLoading } = useQuery({
    queryKey: ["holidays"],
    queryFn: async () => {
      let query = supabase.from('holidays').select('*');
      
      if (selectedTenant) {
        query = query.eq('tenant_id', selectedTenant.id);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as Holiday[];
    }
  });

  useEffect(() => {
    if (surcharge) {
      form.reset({
        holiday_id: surcharge.holiday_id,
        extra_flat: surcharge.extra_flat,
        multiplier: surcharge.multiplier || 1.0,
        tenant_id: surcharge.tenant_id || selectedTenant?.id || null,
      });
    } else {
      form.reset({
        holiday_id: "",
        extra_flat: null,
        multiplier: 1.0,
        tenant_id: selectedTenant?.id || null,
      });
    }
  }, [surcharge, form, selectedTenant]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const { holiday_id, extra_flat, multiplier, tenant_id } = values;
      
      const tenantId = tenant_id || selectedTenant?.id || null;
      
      if (isEditMode) {
        const { error } = await supabase
          .from("holiday_surcharges")
          .update({
            holiday_id,
            extra_flat,
            multiplier,
            tenant_id: tenantId,
          })
          .eq("id", surcharge?.id)
          .select();

        if (error) throw error;

        toast({
          title: "Holiday surcharge updated",
          description: "Holiday surcharge has been updated successfully",
        });
      } else {
        const { error } = await supabase
          .from("holiday_surcharges")
          .insert({
            holiday_id,
            extra_flat,
            multiplier,
            tenant_id: tenantId,
          })
          .select();

        if (error) throw error;

        toast({
          title: "Holiday surcharge added",
          description: "Holiday surcharge has been added successfully",
        });
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: isEditMode ? "Failed to update holiday surcharge" : "Failed to add holiday surcharge",
        description: error.message,
      });
      console.error("Holiday surcharge form error:", error);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edit Holiday Surcharge" : "Add Holiday Surcharge"}</DialogTitle>
          <DialogDescription>
            Set pricing adjustments that apply during holidays.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="holiday_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Holiday</FormLabel>
                  <Select
                    disabled={holidaysLoading}
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a holiday" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {holidays?.map((holiday) => (
                        <SelectItem key={holiday.id} value={holiday.id}>
                          {holiday.holiday_name} ({new Date(holiday.date).toLocaleDateString()})
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
              name="extra_flat"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Extra Flat Fee</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Leave empty to use multiplier only"
                      value={field.value === null ? '' : field.value}
                      onChange={(e) => field.onChange(e.target.value === '' ? null : parseFloat(e.target.value))}
                      min="0"
                      step="1"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                      placeholder="e.g. 1.5 for 50% increase"
                    />
                  </FormControl>
                  <FormMessage />
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
}
