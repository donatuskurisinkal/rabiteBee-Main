import React, { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTenant } from "@/hooks/use-tenant";
import { FileUpload } from "@/components/admin/FileUpload";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User } from "lucide-react";
import config from "@/config";
import { useQuery } from "@tanstack/react-query";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Define the delivery status type to match the database enum
type DeliveryStatus = "online" | "offline" | "busy" | "on_delivery";

const deliveryAgentSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone_number: z.string().min(1, "Phone number is required"),
  status: z.enum(["online", "offline", "busy", "on_delivery"] as const),
  vehicle_type: z.string().optional(),
  vehicle_number: z.string().optional(),
  address: z.string().optional(),
  blood_group: z.string().optional(),
  aadhaar_number: z.string().optional(),
  is_active: z.boolean().default(true),
  is_online: z.boolean().default(false),
  verified: z.boolean().default(false),
  profile_photo: z.string().optional(),
  rating: z.number().min(0).max(5).optional(),
  // Make email and role_id optional for editing
  email: z.string().email("Invalid email format").optional(),
  role_id: z.string().uuid("Invalid role ID").optional(),
});

type FormValues = z.infer<typeof deliveryAgentSchema>;

interface DeliveryAgentFormProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: any;
  onSuccess: () => void;
}

export function DeliveryAgentForm({
  isOpen,
  onClose,
  initialData,
  onSuccess,
}: DeliveryAgentFormProps) {
  const { toast } = useToast();
  const { user, session } = useAuth();
  const { selectedTenant } = useTenant();
  const isEditing = !!initialData;
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string>(
    initialData?.profile_photo || ""
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch all roles to filter for delivery roles
  const { data: rolesList, isLoading: rolesLoading } = useQuery({
    queryKey: ['roles-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('roles')
        .select('id, name');
      
      if (error) {
        console.error('Error fetching roles:', error);
        return [];
      }
      
      // Filter roles containing "delivery" (case insensitive)
      return data.filter(role => 
        role.name.toLowerCase().includes('delivery')
      );
    }
  });

  // Fetch the default delivery agent role ID
  const { data: deliveryAgentRole } = useQuery({
    queryKey: ['delivery-agent-role'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('roles')
        .select('id, name')
        .ilike('name', '%delivery%')
        .limit(1)
        .single();
      
      if (error) {
        console.log('No delivery role found, will use first available role');
        return null;
      }
      
      return data;
    }
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(deliveryAgentSchema),
    defaultValues: initialData
      ? {
          ...initialData,
          email: initialData.email || "",
          rating: initialData.rating || 0,
          role_id: initialData.role_id || "",
        }
      : {
          name: "",
          phone_number: "",
          status: "offline" as DeliveryStatus,
          is_active: true,
          is_online: false,
          verified: false,
          rating: 0,
          email: "",
          role_id: "",
        },
  });

  // Set default role_id when deliveryAgentRole is loaded
  useEffect(() => {
    if (deliveryAgentRole && !isEditing && !form.getValues('role_id')) {
      form.setValue('role_id', deliveryAgentRole.id);
    }
  }, [deliveryAgentRole, isEditing, form]);

  const handlePhotoUploaded = (url: string) => {
    setProfilePhotoUrl(url);
    form.setValue("profile_photo", url);
  };

  async function onSubmit(data: FormValues) {
    console.log("Form submit triggered", { isEditing, data });
    setIsSubmitting(true);
    setError(null);
    setTempPassword(null);
    
    try {
      // For editing, we don't need to validate role_id since it's not updated
      if (!isEditing) {
        const finalRoleId = data.role_id || deliveryAgentRole?.id;
        
        if (!finalRoleId) {
          throw new Error("No delivery role selected or available");
        }
      }
      
      if (isEditing) {
        console.log("Updating delivery agent", initialData.id);
        // Just update the existing delivery agent
        const updateData = {
          name: data.name,
          phone_number: data.phone_number,
          status: data.status,
          vehicle_type: data.vehicle_type,
          vehicle_number: data.vehicle_number,
          address: data.address,
          blood_group: data.blood_group,
          aadhaar_number: data.aadhaar_number,
          is_active: data.is_active,
          is_online: data.is_online,
          verified: data.verified,
          rating: data.rating || 0,
          profile_photo: profilePhotoUrl,
          updated_at: new Date().toISOString(),
        };

        console.log("Update data:", updateData);

        const { error } = await supabase
          .from("delivery_agents")
          .update(updateData)
          .eq("id", initialData.id);

        if (error) {
          console.error("Update error:", error);
          throw error;
        }

        console.log("Update successful");
        toast({
          title: "Delivery agent updated",
          description: "The delivery agent has been updated successfully.",
        });
        
        onSuccess();
        onClose();
      } else {
        // For new delivery agents, first create a user in auth and users table
        const supabaseUrl = config.supabase.url;
        
        if (!session?.access_token) {
          throw new Error("No access token available. Please log in again.");
        }
        
        // Parse the name into first name and last name
        const nameParts = data.name.trim().split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';
        
        // Get the final role ID for creating new users
        const finalRoleId = data.role_id || deliveryAgentRole?.id;
        
        // Use the admin-create-user edge function to create the user
        const response = await fetch(`${supabaseUrl}/functions/v1/admin-create-user`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify({
            username: data.email.split('@')[0] || data.phone_number, // Use part before @ as username
            first_name: firstName,
            last_name: lastName,
            email: data.email,
            phone: data.phone_number,
            role_id: finalRoleId, // Use the selected or default delivery role ID
            is_active: data.is_active,
            tenant_id: selectedTenant?.id,
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error("User creation failed:", errorData);
          throw new Error(errorData.error || `Server error: ${response.status}`);
        }

        const result = await response.json();
        console.log("User creation response:", result);
        
        if (!result.success || !result.user?.id) {
          throw new Error("Failed to create user account");
        }
        
        // Store the temporary password
        setTempPassword(result.user.temp_password);
        
        // Now create the delivery agent with the user ID as both user_id and id
        const { error } = await supabase.from("delivery_agents").insert({
          id: result.user.id, // Use the same ID as the user
          user_id: result.user.id,
          name: data.name,
          phone_number: data.phone_number,
          status: data.status,
          vehicle_type: data.vehicle_type,
          vehicle_number: data.vehicle_number,
          address: data.address,
          blood_group: data.blood_group,
          aadhaar_number: data.aadhaar_number,
          is_active: data.is_active,
          is_online: data.is_online,
          verified: data.verified,
          profile_photo: profilePhotoUrl,
          rating: data.rating || 0,
          tenant_id: selectedTenant?.id,
        });

        if (error) throw error;

        toast({
          title: "Delivery agent created",
          description: "The delivery agent and user account have been created successfully.",
        });
        
        onSuccess();
        // Don't close dialog yet if we have a temp password to show
      }
    } catch (error: any) {
      console.error("Error saving delivery agent:", error);
      setError(error.message || "An unexpected error occurred");
      toast({
        variant: "destructive",
        title: "Error saving delivery agent",
        description: error.message || "An unexpected error occurred.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleClose = () => {
    setTempPassword(null);
    setError(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Delivery Agent" : "Add New Delivery Agent"}
          </DialogTitle>
          <DialogDescription>
            Fill in the delivery agent details. All required fields must be completed.
          </DialogDescription>
        </DialogHeader>

        {tempPassword && (
          <Alert className="bg-green-50 border-green-300 mb-4">
            <AlertDescription>
              <p className="font-medium">User account created successfully!</p>
              <p className="mt-2">Username: {form.getValues("email")}</p>
              <p>Temporary password: <span className="font-mono bg-green-100 p-1 rounded">{tempPassword}</span></p>
              <p className="text-sm mt-2">Please save this password as it won't be shown again.</p>
              <Button className="mt-2 w-full" onClick={handleClose}>Close</Button>
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!tempPassword && (
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="grid grid-cols-1 gap-4"
            >
              <div className="flex flex-col items-center mb-4">
                <div className="mb-2">
                  <Avatar className="w-24 h-24">
                    <AvatarImage src={profilePhotoUrl} />
                    <AvatarFallback>
                      <User className="w-12 h-12 text-muted-foreground" />
                    </AvatarFallback>
                  </Avatar>
                </div>
                
                <FileUpload
                  bucket="delivery-agents"
                  folder={selectedTenant?.id ? `${selectedTenant.id}` : 'uncategorized'}
                  onUploadComplete={handlePhotoUploaded}
                  existingUrl={profilePhotoUrl}
                  className="w-full max-w-xs"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name<span className="text-destructive ml-1">*</span></FormLabel>
                      <FormControl>
                        <Input placeholder="Enter name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number<span className="text-destructive ml-1">*</span></FormLabel>
                      <FormControl>
                        <Input placeholder="Enter phone number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {!isEditing && (
                  <>
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email<span className="text-destructive ml-1">*</span></FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="Enter email" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="role_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Delivery Role<span className="text-destructive ml-1">*</span></FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                            defaultValue={deliveryAgentRole?.id}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select delivery role" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {rolesLoading ? (
                                <SelectItem value="loading" disabled>Loading roles...</SelectItem>
                              ) : rolesList?.length ? (
                                rolesList.map(role => (
                                  <SelectItem key={role.id} value={role.id}>
                                    {role.name}
                                  </SelectItem>
                                ))
                              ) : (
                                <SelectItem value="none" disabled>No delivery roles found</SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                          {!rolesList?.length && !rolesLoading && (
                            <p className="text-xs text-amber-600 mt-1">
                              Warning: No delivery roles found. Please create a role with "delivery" in the name first.
                            </p>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status<span className="text-destructive ml-1">*</span></FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="online">Online</SelectItem>
                          <SelectItem value="offline">Offline</SelectItem>
                          <SelectItem value="busy">Busy</SelectItem>
                          <SelectItem value="on_delivery">On Delivery</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="vehicle_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vehicle Type</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter vehicle type"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="vehicle_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vehicle Number</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter vehicle number"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="blood_group"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Blood Group</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter blood group"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="aadhaar_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Aadhaar Number</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter aadhaar number"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="rating"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rating (0-5)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          max={5}
                          step={0.1}
                          {...field}
                          value={field.value || 0}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value === ""
                                ? 0
                                : parseFloat(e.target.value)
                            )
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              
                <div className="col-span-2">
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter address"
                            className="resize-none"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

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
                  name="is_online"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel>Online</FormLabel>
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
                  name="verified"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel>Verified</FormLabel>
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

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" type="button" onClick={handleClose} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : (isEditing ? "Update" : "Create")} Delivery Agent
                </Button>
              </div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
