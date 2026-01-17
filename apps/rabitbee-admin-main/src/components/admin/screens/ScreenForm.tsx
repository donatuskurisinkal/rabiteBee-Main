
import { useState, useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

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
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { createScreen, updateScreen } from "@/integrations/supabase/screenFunctions";
import { useTenant } from "@/contexts/TenantContext";
import { Screen } from "@/integrations/supabase/screen-types";

// Define form schema
const formSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  is_active: z.boolean().default(true),
  is_maintenance_mode: z.boolean().default(false),
  display_order: z.coerce.number().int().min(0).default(0),
  tenant_id: z.string().nullable().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface ScreenFormProps {
  screen?: Screen;
  onSaved: () => void;
}

export default function ScreenForm({ screen, onSaved }: ScreenFormProps) {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const isEditMode = Boolean(screen);
  const { selectedTenant, tenants } = useTenant();

  console.log("Form initialized with screen:", screen);

  // Initialize form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: screen?.name || "",
      is_active: screen?.is_active ?? true,
      is_maintenance_mode: screen?.is_maintenance_mode ?? false,
      display_order: screen?.display_order ?? 0,
      tenant_id: screen?.tenant_id || selectedTenant?.id || null,
    },
  });

  // Update form values when selectedTenant changes (for new screens)
  useEffect(() => {
    if (!isEditMode && selectedTenant) {
      form.setValue('tenant_id', selectedTenant.id);
    }
  }, [selectedTenant, isEditMode, form]);

  // Form submission handler
  const onSubmit = async (values: FormValues) => {
    setIsLoading(true);
    
    try {
      console.log("Form values to submit:", values);
      console.log("Is edit mode:", isEditMode);
      
      if (isEditMode && screen) {
        console.log("Updating screen with ID:", screen.id);
        
        await updateScreen(
          screen.id,
          values.name,
          values.is_active,
          values.is_maintenance_mode,
          values.display_order,
          values.tenant_id
        );
        
        toast.success("Screen updated successfully");
      } else {
        await createScreen(
          values.name,
          values.is_active,
          values.is_maintenance_mode,
          values.display_order,
          values.tenant_id
        );
        
        toast.success("Screen created successfully");
      }
      
      onSaved();
    } catch (error: any) {
      console.error("Error saving screen:", error);
      toast.error(isEditMode ? "Failed to update screen" : "Failed to create screen");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Screen name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="display_order"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Display Order</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  min={0}
                  {...field}
                  onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 0)}
                  value={field.value}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="tenant_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tenant</FormLabel>
              <Select
                value={field.value || ""}
                onValueChange={(value) => field.onChange(value === "null" ? null : value)}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a tenant" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="null">Global (No Tenant)</SelectItem>
                  {tenants.map((tenant) => (
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

        <FormField
          control={form.control}
          name="is_maintenance_mode"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
              <div className="space-y-0.5">
                <FormLabel>Maintenance Mode</FormLabel>
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

        <div className="flex justify-end space-x-4">
          <Button type="submit" disabled={isLoading}>
            {isEditMode ? 'Update' : 'Create'} Screen
          </Button>
        </div>
      </form>
    </Form>
  );
}
