
import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useTenant } from "@/hooks/use-tenant";

interface DistanceBracket {
  id: string;
  min_km: number;
  max_km: number | null;
  flat_fare: number;
  tenant_id: string | null;
  created_at: string;
  updated_at: string | null;
  is_active: boolean;
}

const formSchema = z.object({
  min_km: z.coerce.number()
    .min(0, { message: "Minimum distance must be at least 0 km" }),
  max_km: z.coerce.number()
    .nullable()
    .refine((val) => val === null || val > 0, {
      message: "Maximum distance must be greater than 0 km",
    }),
  flat_fare: z.coerce.number()
    .min(0, { message: "Flat fare must be at least 0" }),
  is_unlimited: z.boolean().default(false),
  is_active: z.boolean().default(true),
  tenant_id: z.string().nullable(),
}).refine(data => !data.is_unlimited || data.max_km === null, {
  message: "Max km must be empty when unlimited is checked",
  path: ["max_km"],
}).refine(data => data.is_unlimited || (data.max_km !== null && data.max_km > data.min_km), {
  message: "Max km must be greater than min km",
  path: ["max_km"],
});

interface DistanceBracketFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  bracket?: DistanceBracket;
}

export default function DistanceBracketForm({
  isOpen,
  onClose,
  onSuccess,
  bracket
}: DistanceBracketFormProps) {
  const { toast } = useToast();
  const { selectedTenant } = useTenant();
  const isEditMode = !!bracket;
  
  const isUnlimited = !bracket?.max_km;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      min_km: bracket?.min_km || 0,
      max_km: bracket?.max_km || null,
      flat_fare: bracket?.flat_fare || 0,
      is_unlimited: isUnlimited,
      is_active: bracket?.is_active ?? true,
      tenant_id: bracket?.tenant_id || selectedTenant?.id || null,
    }
  });

  useEffect(() => {
    if (bracket) {
      form.reset({
        min_km: bracket.min_km,
        max_km: bracket.max_km,
        flat_fare: bracket.flat_fare,
        is_unlimited: !bracket.max_km,
        is_active: bracket.is_active,
        tenant_id: bracket.tenant_id || selectedTenant?.id || null,
      });
    } else {
      form.reset({
        min_km: 0,
        max_km: null,
        flat_fare: 0,
        is_unlimited: false,
        is_active: true,
        tenant_id: selectedTenant?.id || null,
      });
    }
  }, [bracket, form, selectedTenant]);

  // Watch the is_unlimited field to update max_km accordingly
  const isUnlimitedValue = form.watch("is_unlimited");
  
  // Update max_km when is_unlimited changes
  useEffect(() => {
    if (isUnlimitedValue) {
      form.setValue("max_km", null);
    }
  }, [isUnlimitedValue, form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const { min_km, max_km, flat_fare, is_unlimited, is_active, tenant_id } = values;
      
      const tenantId = tenant_id || selectedTenant?.id || null;
      const maxKm = is_unlimited ? null : max_km;
      
      if (isEditMode) {
        const { error } = await supabase
          .from("distance_brackets")
          .update({
            min_km,
            max_km: maxKm,
            flat_fare,
            tenant_id: tenantId,
            is_active,
          })
          .eq("id", bracket?.id)
          .select();

        if (error) throw error;

        toast({
          title: "Distance bracket updated",
          description: "Distance bracket has been updated successfully",
        });
      } else {
        const { error } = await supabase
          .from("distance_brackets")
          .insert({
            min_km,
            max_km: maxKm,
            flat_fare,
            tenant_id: tenantId,
            is_active,
          })
          .select();

        if (error) throw error;

        toast({
          title: "Distance bracket added",
          description: "Distance bracket has been added successfully",
        });
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: isEditMode ? "Failed to update distance bracket" : "Failed to add distance bracket",
        description: error.message,
      });
      console.error("Distance bracket form error:", error);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edit Distance Bracket" : "Add Distance Bracket"}</DialogTitle>
          <DialogDescription>
            Set pricing brackets for different distance ranges.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="min_km"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Minimum Distance (km)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      step="0.1"
                      min="0"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="is_unlimited"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel>Unlimited (and above)</FormLabel>
                </FormItem>
              )}
            />

            {!form.watch("is_unlimited") && (
              <FormField
                control={form.control}
                name="max_km"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Maximum Distance (km)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        value={field.value === null ? '' : field.value}
                        onChange={(e) => field.onChange(e.target.value === '' ? null : parseFloat(e.target.value))}
                        step="0.1"
                        min="0"
                        disabled={form.watch("is_unlimited")}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="flat_fare"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Flat Fare Amount</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      step="0.01"
                      min="0"
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
                <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel>Active</FormLabel>
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
