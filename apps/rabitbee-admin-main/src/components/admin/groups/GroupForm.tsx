
import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useTenant } from "@/contexts/TenantContext";
import { DialogTitle } from "@/components/ui/dialog";
import { UserGroupSelector } from "./UserGroupSelector";

// Define the form schema
const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  description: z.string().optional(),
  is_active: z.boolean().default(true),
});

type FormValues = z.infer<typeof formSchema>;

interface GroupFormProps {
  group?: any;
  onSaved?: () => void;
}

export function GroupForm({ group, onSaved }: GroupFormProps) {
  const { selectedTenant } = useTenant();
  
  // Initialize the form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: group?.name || "",
      description: group?.description || "",
      is_active: group?.is_active !== undefined ? group.is_active : true,
    },
  });
  
  // Update form values when group data is loaded
  useEffect(() => {
    if (group) {
      form.reset({
        name: group.name || "",
        description: group.description || "",
        is_active: group.is_active !== undefined ? group.is_active : true,
      });
    } else {
      form.reset({
        name: "",
        description: "",
        is_active: true,
      });
    }
  }, [group, form]);
  
  // Handle form submission
  const onSubmit = async (values: FormValues) => {
    try {
      // First, save or update the group
      let groupId = group?.id;
      
      if (group) {
        // Update existing group
        const { error } = await supabase
          .from("groups")
          .update({
            name: values.name,
            description: values.description,
            is_active: values.is_active,
            tenant_id: selectedTenant?.id || null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", group.id);
          
        if (error) throw error;
      } else {
        // Create new group
        const { data, error } = await supabase
          .from("groups")
          .insert({
            name: values.name,
            description: values.description,
            is_active: values.is_active,
            tenant_id: selectedTenant?.id || null,
          })
          .select("id")
          .single();
          
        if (error) throw error;
        groupId = data.id;
      }
      
      toast.success(`Group ${group ? "updated" : "created"} successfully`);
      if (onSaved) onSaved();
    } catch (error: any) {
      console.error("Error saving group:", error);
      toast.error(`Failed to ${group ? "update" : "create"} group: ${error.message}`);
    }
  };
  
  return (
    <div className="space-y-6 p-1">
      <DialogTitle className="text-lg font-medium">
        {group ? "Edit" : "Create"} Group
      </DialogTitle>
      <p className="text-sm text-muted-foreground">
        {group ? "Update group details." : "Create a new group."}
      </p>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Group Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter group name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Enter group description" 
                    className="min-h-20" 
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
            name="is_active"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Active Status</FormLabel>
                  <p className="text-sm text-muted-foreground">
                    Enable or disable this group.
                  </p>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onSaved && onSaved()}>
              Cancel
            </Button>
            <Button type="submit">
              {group ? "Save Changes" : "Create Group"}
            </Button>
          </div>
        </form>
      </Form>

      {group && (
        <div className="pt-4 border-t">
          <h3 className="text-lg font-medium mb-4">Group Members</h3>
          <UserGroupSelector 
            groupId={group.id} 
            groupName={group.name}
            onUserAdded={onSaved}
          />
        </div>
      )}
    </div>
  );
}
