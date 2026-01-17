
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTenant } from "@/contexts/TenantContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import config from "@/config";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

const userFormSchema = z.object({
  id: z.string().optional(),
  username: z.string().min(1, "Username is required"),
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address").optional().or(z.literal('')),
  phone: z.string().optional(),
  role_id: z.string().min(1, "Role is required"),
  is_active: z.boolean().default(true),
  restaurant_id: z.string().optional(),
  service_provider_id: z.string().optional(),
}).refine((data) => {
  // Email is required only when creating a new user (no id)
  if (!data.id && (!data.email || data.email.trim() === '')) {
    return false;
  }
  return true;
}, {
  message: "Email is required for new users",
  path: ["email"],
});

type UserFormValues = z.infer<typeof userFormSchema>;

interface UserFormProps {
  user?: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

export function UserForm({ user, open, onOpenChange, onSaved }: UserFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const { toast } = useToast();
  const { selectedTenant } = useTenant();
  const { session, user: currentUser } = useAuth();

  // Fetch available roles
  const { data: roles = [] } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const { data, error } = await supabase.from('roles').select('*');
      if (error) throw error;
      return data;
    },
  });

  // Fetch restaurants
  const { data: restaurants = [] } = useQuery({
    queryKey: ['restaurants', selectedTenant?.id],
    queryFn: async () => {
      if (!selectedTenant?.id) return [];
      const { data, error } = await supabase
        .from('restaurants')
        .select('id, name')
        .eq('tenant_id', selectedTenant.id)
        .eq('isactive', true);
      if (error) throw error;
      return data;
    },
    enabled: !!selectedTenant?.id,
  });

  // Fetch existing service provider for this user
  const { data: existingServiceProvider } = useQuery({
    queryKey: ['service-provider', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('service_providers')
        .select('id, restaurant_id')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      id: user?.id || '',
      username: user?.username || '',
      first_name: user?.first_name || '',
      last_name: user?.last_name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      role_id: user?.role_id || '',
      is_active: user?.isActive !== false,
      restaurant_id: '',
      service_provider_id: '',
    },
  });

  // Watch the role_id field to show/hide service provider fields
  const selectedRoleId = form.watch("role_id");
  const selectedRole = roles.find(r => r.id === selectedRoleId);
  const isServiceProviderRole = selectedRole?.name?.toLowerCase().includes('service provider');

  useEffect(() => {
    if (user) {
      form.reset({
        id: user.id,
        username: user.username || '',
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        phone: user.phone || '',
        role_id: user.role_id || '',
        is_active: user.isActive !== false,
        restaurant_id: existingServiceProvider?.restaurant_id || '',
        service_provider_id: existingServiceProvider?.id || '',
      });
    } else {
      form.reset({
        id: '',
        username: '',
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        role_id: '',
        is_active: true,
        restaurant_id: '',
        service_provider_id: '',
      });
    }
  }, [user, existingServiceProvider]);

  const onSubmit = async (values: UserFormValues) => {
    if (!selectedTenant) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select a tenant first",
      });
      return;
    }

    setError(null);
    setTempPassword(null);
    setIsSubmitting(true);
    
    try {
      // Find the selected role to get the role name
      const selectedRole = roles.find(role => role.id === values.role_id);
      
      if (!selectedRole) {
        throw new Error("Selected role not found");
      }

      if (values.id) {
        // Update existing user
        console.log("Updating user:", values.id);
        console.log("Current user ID:", currentUser?.id);
        
        const { data: updateData, error: userError } = await supabase
          .from('users')
          .update({
            username: values.username,
            first_name: values.first_name,
            last_name: values.last_name,
            phone: values.phone,
            role: selectedRole.name, // Add role name
            role_id: values.role_id,
            isActive: values.is_active,
          })
          .eq('id', values.id)
          .select();

        console.log("Update result:", { data: updateData, error: userError });

        if (userError) {
          console.error("Update error details:", userError);
          
          // Check if it's a permission error
          if (userError.code === '42501' || userError.message?.includes('row-level security policy')) {
            throw new Error("You don't have permission to update this user. Only super admins can edit other users.");
          }
          
          throw userError;
        }

        // If role is service provider, update/create service_providers record
        if (isServiceProviderRole && values.restaurant_id) {
          if (existingServiceProvider?.id) {
            // Update existing service provider
            const { error: spError } = await supabase
              .from('service_providers')
              .update({
                restaurant_id: values.restaurant_id,
                name: `${values.first_name} ${values.last_name}`,
                email: values.email,
                phone_number: values.phone,
              })
              .eq('id', existingServiceProvider.id);

            if (spError) throw spError;

            // Update users table with service_provider_id and restaurant_id
            const { error: userUpdateError } = await supabase
              .from('users')
              .update({
                service_provider_id: existingServiceProvider.id,
                restaurant_id: values.restaurant_id,
              })
              .eq('id', values.id);

            if (userUpdateError) throw userUpdateError;
          } else {
            // Create new service provider record
            const { data: newSP, error: spError } = await supabase
              .from('service_providers')
              .insert({
                user_id: values.id,
                restaurant_id: values.restaurant_id,
                name: `${values.first_name} ${values.last_name}`,
                email: values.email,
                phone_number: values.phone,
                tenant_id: selectedTenant.id,
              })
              .select()
              .single();

            if (spError) throw spError;

            // Update users table with the new service_provider_id and restaurant_id
            if (newSP) {
              const { error: userUpdateError } = await supabase
                .from('users')
                .update({
                  service_provider_id: newSP.id,
                  restaurant_id: values.restaurant_id,
                })
                .eq('id', values.id);

              if (userUpdateError) throw userUpdateError;
            }
          }
        }

        toast({
          title: "User updated",
          description: "User has been updated successfully.",
        });
      } else {
        // Create new user using the edge function
        const supabaseUrl = config.supabase.url;
        
        console.log("Creating user via edge function");
        console.log("Current user ID:", currentUser?.id);
        console.log("Session:", session ? "Present" : "Missing");
        
        if (!currentUser?.id) {
          throw new Error("Not authenticated. Please log in again.");
        }
        
        if (!session?.access_token) {
          throw new Error("No access token available. Please log in again.");
        }
        
        // Use the session access token for authorization
        console.log("Using session access token for authorization");
        
        const response = await fetch(`${supabaseUrl}/functions/v1/admin-create-user`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify({
            username: values.username,
            first_name: values.first_name,
            last_name: values.last_name,
            email: values.email,
            phone: values.phone,
            role_id: values.role_id,
            is_active: values.is_active,
            tenant_id: selectedTenant.id,
          })
        });

        console.log("Response status:", response.status);
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error("Error response from edge function:", errorData);
          
          let errorMessage = errorData.error || `Server error: ${response.status}`;
          if (response.status === 401) {
            errorMessage = "Authentication error: Your session may have expired. Please log out and log back in.";
          }
          
          throw new Error(errorMessage);
        }

        const result = await response.json();
        console.log("User creation result:", result);

        if (result.user?.temp_password) {
          setTempPassword(result.user.temp_password);
        }

        // If role is service provider, create service_providers record
        if (isServiceProviderRole && values.restaurant_id && result.user?.id) {
          const { data: newSP, error: spError } = await supabase
            .from('service_providers')
            .insert({
              user_id: result.user.id,
              restaurant_id: values.restaurant_id,
              name: `${values.first_name} ${values.last_name}`,
              email: values.email,
              phone_number: values.phone,
              tenant_id: selectedTenant.id,
            })
            .select()
            .single();

          if (spError) {
            console.error("Error creating service provider:", spError);
            toast({
              variant: "destructive",
              title: "Warning",
              description: "User created but service provider record failed.",
            });
          } else if (newSP) {
            // Update users table with service_provider_id and restaurant_id
            const { error: userUpdateError } = await supabase
              .from('users')
              .update({
                service_provider_id: newSP.id,
                restaurant_id: values.restaurant_id,
              })
              .eq('id', result.user.id);

            if (userUpdateError) {
              console.error("Error updating user with service provider info:", userUpdateError);
            }
          }
        }

        toast({
          title: "User created",
          description: "User has been created successfully.",
        });
      }

      onSaved();
      if (!tempPassword) {
        onOpenChange(false);
      }
    } catch (error: any) {
      console.error("Error saving user:", error);
      setError(error.message);
      toast({
        variant: "destructive",
        title: "Error saving user",
        description: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseWithPassword = () => {
    setTempPassword(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {user ? "Edit User" : "Add New User"}
          </DialogTitle>
        </DialogHeader>

        {tempPassword && (
          <Alert className="bg-green-50 border-green-300">
            <Info className="h-4 w-4" />
            <AlertDescription>
              <p>User created successfully! Temporary password:</p>
              <p className="font-mono bg-green-100 p-2 mt-2 border border-green-300 rounded text-center">{tempPassword}</p>
              <p className="text-sm mt-2">Please save this password as it won't be shown again.</p>
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!tempPassword && (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter username" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="first_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter first name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="last_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter last name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {!user && (
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="Enter email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter phone number" {...field} />
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
                    <FormLabel>Role</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {roles.map(role => (
                          <SelectItem key={role.id} value={role.id}>
                            {role.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {isServiceProviderRole && (
                <FormField
                  control={form.control}
                  name="restaurant_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Restaurant</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a restaurant" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {restaurants.map(restaurant => (
                            <SelectItem key={restaurant.id} value={restaurant.id}>
                              {restaurant.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

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

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : "Save"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}

        {tempPassword && (
          <DialogFooter>
            <Button onClick={handleCloseWithPassword}>
              Close
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
