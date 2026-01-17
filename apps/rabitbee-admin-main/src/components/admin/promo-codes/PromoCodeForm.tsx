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
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { Switch } from "@/components/ui/switch";
import { useTenant } from "@/contexts/TenantContext";
import { supabase } from "@/integrations/supabase/client";
import { MultiSelect } from "@/components/admin/groups/MultiSelect";

// Define form schema
const formSchema = z.object({
  code: z.string().min(1, { message: "Promo code is required" }),
  discount_type: z.string().min(1, { message: "Discount type is required" }),
  discount_value: z.coerce.number().positive({ message: "Discount value must be positive" }),
  max_discount: z.coerce.number().positive({ message: "Max discount must be positive" }).optional().nullable(),
  min_order_amount: z.coerce.number().nonnegative({ message: "Min order amount must be non-negative" }).default(0),
  start_date: z.date(),
  end_date: z.date(),
  category: z.string().optional().nullable(),
  promo_target: z.string().default("order"),
  is_active: z.boolean().default(true),
  usage_limit: z.coerce.number().nonnegative().optional().nullable(),
  tenant_id: z.string().uuid().optional().nullable(),
  screen_id: z.string().uuid().optional().nullable(),
});

type FormValues = z.infer<typeof formSchema>;

interface PromoCode {
  id: string;
  code: string;
  discount_type: string;
  discount_value: number;
  max_discount?: number | null;
  min_order_amount: number;
  start_date: string;
  end_date: string;
  category?: string | null;
  promo_target: string;
  is_active: boolean;
  usage_limit?: number | null;
  tenant_id?: string | null;
  screen_id?: string | null;
}

interface PromoCodeFormProps {
  promoCode?: PromoCode;
  onSaved: () => void;
}

type GroupOption = {
  label: string;
  value: string;
};

export default function PromoCodeForm({ promoCode, onSaved }: PromoCodeFormProps) {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [screens, setScreens] = useState<Array<{ id: string, name: string }>>([]);
  const [selectedGroups, setSelectedGroups] = useState<GroupOption[]>([]);
  const [availableGroups, setAvailableGroups] = useState<GroupOption[]>([]);
  const isEditMode = Boolean(promoCode);
  const { selectedTenant, tenants } = useTenant();

  // Initialize form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      code: promoCode?.code || "",
      discount_type: promoCode?.discount_type || "percentage",
      discount_value: promoCode?.discount_value || 0,
      max_discount: promoCode?.max_discount || null,
      min_order_amount: promoCode?.min_order_amount || 0,
      start_date: promoCode ? new Date(promoCode.start_date) : new Date(),
      end_date: promoCode ? new Date(promoCode.end_date) : new Date(new Date().setMonth(new Date().getMonth() + 1)),
      category: promoCode?.category || null,
      promo_target: promoCode?.promo_target || "order",
      is_active: promoCode?.is_active ?? true,
      usage_limit: promoCode?.usage_limit || null,
      tenant_id: promoCode?.tenant_id || selectedTenant?.id || null,
      screen_id: promoCode?.screen_id || null,
    },
  });

  // Load screens when tenant changes
  useEffect(() => {
    const fetchScreens = async () => {
      if (!selectedTenant) return;
      
      try {
        const { data, error } = await supabase
          .from('screens')
          .select('id, name')
          .eq('tenant_id', selectedTenant.id)
          .eq('is_active', true)
          .order('display_order', { ascending: true })
          .order('name');
          
        if (error) throw error;
        setScreens(data || []);
      } catch (error) {
        console.error('Error fetching screens:', error);
        toast.error('Failed to load screens');
      }
    };
    
    fetchScreens();
  }, [selectedTenant]);

  // Fetch available groups
  useEffect(() => {
    const fetchGroups = async () => {
      try {
        let query = supabase.from('groups').select('id, name').eq('is_active', true);
        
        if (selectedTenant) {
          query = query.eq('tenant_id', selectedTenant.id);
        }
        
        const { data, error } = await query.order('name');
        
        if (error) throw error;
        
        if (data && Array.isArray(data)) {
          const formattedGroups = data.map(group => ({
            label: group.name,
            value: group.id
          }));
          
          setAvailableGroups(formattedGroups);
          console.log('Available groups:', formattedGroups);
        } else {
          console.log('No groups data or not an array:', data);
          setAvailableGroups([]);
        }
      } catch (error) {
        console.error('Error fetching groups:', error);
        toast.error('Failed to load groups');
        setAvailableGroups([]);
      }
    };
    
    fetchGroups();
  }, [selectedTenant]);

  // Fetch selected groups if in edit mode
  useEffect(() => {
    const fetchSelectedGroups = async () => {
      if (!isEditMode || !promoCode?.id) return;
      
      try {
        const { data, error } = await supabase
          .from('promocode_groups')
          .select(`
            group_id,
            groups (id, name)
          `)
          .eq('promo_code_id', promoCode.id);
        
        if (error) throw error;
        
        if (data && data.length > 0) {
          const groupOptions = data.map(item => ({
            value: item.groups.id,
            label: item.groups.name
          }));
          
          setSelectedGroups(groupOptions);
          console.log('Selected groups:', groupOptions);
        }
      } catch (error) {
        console.error('Error fetching group associations:', error);
        toast.error('Failed to load associated groups');
      }
    };
    
    fetchSelectedGroups();
  }, [isEditMode, promoCode]);

  // Update tenant_id when selectedTenant changes and we're in create mode
  useEffect(() => {
    if (!isEditMode && selectedTenant) {
      form.setValue('tenant_id', selectedTenant.id);
    }
  }, [selectedTenant, isEditMode, form]);

  // Handle group selection changes
  const handleGroupSelectionChange = (newSelectedGroups: GroupOption[]) => {
    setSelectedGroups(newSelectedGroups);
    console.log('Groups selected:', newSelectedGroups);
  };

  // Form submission handler
  const onSubmit = async (values: FormValues) => {
    setIsLoading(true);
    
    try {
      // Format dates for database
      const dataToSave = {
        ...values,
        start_date: values.start_date.toISOString().split('T')[0],
        end_date: values.end_date.toISOString().split('T')[0],
      };
      
      let promoCodeId: string;
      
      if (isEditMode && promoCode) {
        // Update existing promo code
        const { error } = await supabase
          .from('promo_codes')
          .update(dataToSave)
          .eq('id', promoCode.id);
          
        if (error) throw error;
        promoCodeId = promoCode.id;
        toast.success('Promo code updated successfully');
      } else {
        // Create new promo code - ensure all required fields are present
        const newPromoCode = {
          code: dataToSave.code,
          discount_type: dataToSave.discount_type,
          discount_value: dataToSave.discount_value,
          start_date: dataToSave.start_date,
          end_date: dataToSave.end_date,
          max_discount: dataToSave.max_discount,
          min_order_amount: dataToSave.min_order_amount,
          category: dataToSave.category,
          promo_target: dataToSave.promo_target,
          is_active: dataToSave.is_active,
          usage_limit: dataToSave.usage_limit,
          tenant_id: dataToSave.tenant_id,
          screen_id: dataToSave.screen_id,
        };
        
        const { data, error } = await supabase
          .from('promo_codes')
          .insert(newPromoCode)
          .select('id')
          .single();
          
        if (error) throw error;
        promoCodeId = data.id;
        toast.success('Promo code created successfully');
      }
      
      // Update group associations
      if (promoCodeId) {
        // First, remove all existing group associations
        const { error: deleteError } = await supabase
          .from('promocode_groups')
          .delete()
          .eq('promo_code_id', promoCodeId);
          
        if (deleteError) throw deleteError;
        
        // Then add the new group associations
        if (selectedGroups.length > 0) {
          const groupAssociations = selectedGroups.map(group => ({
            promo_code_id: promoCodeId,
            group_id: group.value
          }));
          
          console.log('Saving group associations:', groupAssociations);
          
          const { error: groupAssocError } = await supabase
            .from('promocode_groups')
            .insert(groupAssociations);
            
          if (groupAssocError) throw groupAssocError;
        }
      }
      
      onSaved();
    } catch (error: any) {
      console.error('Error saving promo code:', error);
      toast.error(isEditMode ? 'Failed to update promo code' : 'Failed to create promo code');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Code</FormLabel>
              <FormControl>
                <Input placeholder="SUMMER2023" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="discount_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Discount Type</FormLabel>
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select discount type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage</SelectItem>
                    <SelectItem value="fixed">Fixed Amount</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="discount_value"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Discount Value</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    step={form.watch('discount_type') === 'percentage' ? 1 : 0.01}
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="max_discount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Max Discount (optional)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    placeholder="No maximum"
                    {...field}
                    value={field.value ?? ''}
                    onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="min_order_amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Min Order Amount</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="start_date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Start Date</FormLabel>
                <FormControl>
                  <DatePicker
                    date={field.value}
                    setDate={field.onChange}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="end_date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>End Date</FormLabel>
                <FormControl>
                  <DatePicker
                    date={field.value}
                    setDate={field.onChange}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category (optional)</FormLabel>
              <FormControl>
                <Input placeholder="Food, Electronics, etc." {...field} value={field.value || ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormItem>
          <FormLabel>Groups</FormLabel>
          <FormControl>
            <MultiSelect
              options={availableGroups}
              value={selectedGroups}
              onChange={handleGroupSelectionChange}
              placeholder="Search groups"
              emptyMessage="No groups found"
            />
          </FormControl>
          <p className="text-xs text-muted-foreground">
            Select groups that can use this promo code.
          </p>
        </FormItem>

        <FormField
          control={form.control}
          name="screen_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Screen</FormLabel>
              <Select
                value={field.value || ''}
                onValueChange={(value) => field.onChange(value === 'none' ? null : value)}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a screen" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="none">None (All Screens)</SelectItem>
                  {screens.map((screen) => (
                    <SelectItem key={screen.id} value={screen.id}>
                      {screen.name}
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
          name="promo_target"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Promo Target</FormLabel>
              <Select
                value={field.value}
                onValueChange={field.onChange}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select target" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="order">Order</SelectItem>
                  <SelectItem value="delivery">Delivery Fee</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="usage_limit"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Usage Limit (optional)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={0}
                  placeholder="Unlimited"
                  {...field}
                  value={field.value ?? ''}
                  onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value, 10) : null)}
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
                value={field.value || ''}
                onValueChange={(value) => field.onChange(value === 'none' ? null : value)}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select tenant" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="none">Global (All Tenants)</SelectItem>
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

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isEditMode ? 'Update' : 'Create'} Promo Code
        </Button>
      </form>
    </Form>
  );
}
