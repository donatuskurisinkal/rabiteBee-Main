import { useState, useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useTenant } from "@/contexts/TenantContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
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

import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import config from "@/config";

// Define form schema
const formSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  address: z.string().optional(),
  latitude: z.coerce.number().optional(),
  longitude: z.coerce.number().optional(),
  commission_rate: z.coerce.number().optional(),
  contact_person: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone_number: z.string().optional(),
  service_fee: z.coerce.number().optional(),
  website: z.string().url().optional().or(z.literal('')),
  is_active: z.boolean().default(true),
});

// Define form types
type FormValues = z.infer<typeof formSchema>;

// Component props interface
interface ServiceProviderFormProps {
  serviceProvider?: any;
  onSuccess: () => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ServiceProviderForm({ 
  serviceProvider, 
  onSuccess, 
  open, 
  onOpenChange 
}: ServiceProviderFormProps) {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const isEditMode = Boolean(serviceProvider);
  const { selectedTenant } = useTenant();
  const isMobile = useIsMobile();
  const { user, session } = useAuth();

  // Fetch the service provider role ID
  const { data: serviceProviderRole } = useQuery({
    queryKey: ['service-provider-role'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('roles')
        .select('id, name')
        .eq('name', 'Service Provider')
        .single();
      
      if (error) {
        console.error('Error fetching service provider role:', error);
        return null;
      }
      
      return data;
    }
  });

  // Initialize form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: serviceProvider?.name || "",
      address: serviceProvider?.address || "",
      latitude: serviceProvider?.latitude || 0,
      longitude: serviceProvider?.longitude || 0,
      commission_rate: serviceProvider?.commission_rate || 0,
      contact_person: serviceProvider?.contact_person || "",
      email: serviceProvider?.email || "",
      phone_number: serviceProvider?.phone_number || "",
      service_fee: serviceProvider?.service_fee || 0,
      website: serviceProvider?.website || "",
      is_active: serviceProvider?.is_active ?? true,
    },
  });

  // Form submission handler
  const onSubmit = async (values: FormValues) => {
    setIsLoading(true);
    setError(null);
    setTempPassword(null);
  
    try {
      // Ensure name is provided (required field)
      if (!values.name || values.name.trim() === '') {
        toast.error("Name is required");
        setIsLoading(false);
        return;
      }

      console.log("Submitting with tenant ID:", selectedTenant?.id);
      
      // Include tenant_id for multi-tenancy support
      const tenantId = selectedTenant?.id || null;
      
      if (isEditMode) {
        // Update existing service provider
        const { error } = await supabase
          .from("service_providers")
          .update({
            name: values.name,
            address: values.address,
            latitude: values.latitude,
            longitude: values.longitude,
            commission_rate: values.commission_rate,
            contact_person: values.contact_person,
            email: values.email,
            phone_number: values.phone_number,
            service_fee: values.service_fee,
            website: values.website,
            is_active: values.is_active,
            // Don't update tenant_id on edit to preserve ownership
          })
          .eq("id", serviceProvider.id);
          
        if (error) {
          console.error("Error updating service provider:", error);
          toast.error("Failed to update service provider");
          return;
        }
        
        // Show success message and trigger callback
        toast.success("Service provider updated successfully");
        onSuccess();
        onOpenChange(false);
      } else {
        // For new service providers, check if we should create a user account
        if (values.email && serviceProviderRole?.id && session?.access_token) {
          console.log("Creating user account for service provider");
          
          const supabaseUrl = config.supabase.url;
          
          // Parse contact person into first name and last name if available
          const contactPerson = values.contact_person || values.name;
          const nameParts = contactPerson.trim().split(' ');
          const firstName = nameParts[0] || '';
          const lastName = nameParts.slice(1).join(' ') || '';
          
          // Generate username from email or contact person
          const username = values.email.split('@')[0] || contactPerson.replace(/\s+/g, '').toLowerCase();
          
          // Use admin-create-user edge function to create the user
          const response = await fetch(`${supabaseUrl}/functions/v1/admin-create-user`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`
            },
            body: JSON.stringify({
              username,
              first_name: firstName,
              last_name: lastName,
              email: values.email,
              phone: values.phone_number,
              role_id: serviceProviderRole.id, // Use the fetched role ID for service providers
              is_active: values.is_active,
              tenant_id: tenantId,
            })
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            console.error("User creation failed:", errorData);
            setError(errorData.error || `Server error: ${response.status}`);
            
            // Continue with creating service provider record without user association
          } else {
            const result = await response.json();
            console.log("User creation response:", result);
            
            if (result.success && result.user?.temp_password) {
              setTempPassword(result.user.temp_password);
            }
          }
        }
        
        // Create new service provider with required name field
        const { error } = await supabase
          .from("service_providers")
          .insert({
            name: values.name,
            address: values.address,
            latitude: values.latitude,
            longitude: values.longitude,
            commission_rate: values.commission_rate,
            contact_person: values.contact_person,
            email: values.email,
            phone_number: values.phone_number,
            service_fee: values.service_fee,
            website: values.website,
            is_active: values.is_active,
            tenant_id: tenantId,
          });

        if (error) {
          console.error("Error saving service provider:", error);
          toast.error("Failed to create service provider");
          return;
        }
        
        // Show success message
        toast.success("Service provider created successfully");
        
        if (!tempPassword) {
          // If no user account was created or there was no temp password, close the dialog
          onSuccess();
          onOpenChange(false);
        } else {
          // Otherwise, keep the dialog open to show the temp password
          onSuccess();
          // Don't close dialog yet
        }
      }
    } catch (error) {
      console.error("Exception saving service provider:", error);
      toast.error("An unexpected error occurred");
      setIsLoading(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setTempPassword(null);
    setError(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className={isMobile ? "w-[95vw] max-w-md p-4" : "sm:max-w-md"}>
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Service Provider' : 'Add New Service Provider'}</DialogTitle>
          <DialogDescription>
            Fill in the details to {isEditMode ? 'update' : 'create'} a service provider.
          </DialogDescription>
        </DialogHeader>
        
        {tempPassword && (
          <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-4">
            <p className="font-medium">User account created successfully!</p>
            <p className="mt-2">Username: {form.getValues("email")}</p>
            <p>Temporary password: <span className="font-mono bg-green-100 p-1 rounded">{tempPassword}</span></p>
            <p className="text-sm mt-2">Please save this password as it won't be shown again.</p>
            <Button className="mt-2 w-full" onClick={handleClose}>Close</Button>
          </div>
        )}
        
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}
        
        {!tempPassword && (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="mt-4">
              <ScrollArea className="max-h-[60vh] overflow-y-auto pr-4">
                <div className="space-y-4 pb-4">
                  {/* Name field */}
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name<span className="text-destructive ml-1">*</span></FormLabel>
                        <FormControl>
                          <Input placeholder="Service provider name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Address field */}
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <Input placeholder="123 Main St" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Latitude field */}
                  <FormField
                    control={form.control}
                    name="latitude"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Latitude</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="34.0522" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Longitude field */}
                  <FormField
                    control={form.control}
                    name="longitude"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Longitude</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="-118.2437" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Commission Rate field */}
                  <FormField
                    control={form.control}
                    name="commission_rate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Commission Rate</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="0.10" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Contact Person field */}
                  <FormField
                    control={form.control}
                    name="contact_person"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Person</FormLabel>
                        <FormControl>
                          <Input placeholder="John Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Email field */}
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="john.doe@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Phone Number field */}
                  <FormField
                    control={form.control}
                    name="phone_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input placeholder="555-123-4567" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Service Fee field */}
                  <FormField
                    control={form.control}
                    name="service_fee"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Service Fee</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="10.00" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Website field */}
                  <FormField
                    control={form.control}
                    name="website"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Website</FormLabel>
                        <FormControl>
                          <Input type="url" placeholder="https://example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Is active switch */}
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
                </div>
              </ScrollArea>

              {/* Form buttons */}
              <DialogFooter className="flex justify-end space-x-4 mt-6">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleClose}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Saving..." : (isEditMode ? "Update" : "Create")} Service Provider
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
