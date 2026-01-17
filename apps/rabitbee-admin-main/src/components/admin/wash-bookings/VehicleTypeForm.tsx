
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";

interface VehicleType {
  id: string;
  name: string;
  icon_url?: string;
  tenant_id?: string | null;
}

const formSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  icon_url: z.string().optional(),
});

interface VehicleTypeFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: z.infer<typeof formSchema>) => void;
  vehicleType: VehicleType | null;
  isSubmitting: boolean;
}

export function VehicleTypeForm({
  open,
  onOpenChange,
  onSubmit,
  vehicleType,
  isSubmitting,
}: VehicleTypeFormProps) {
  const isEditMode = !!vehicleType;
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: vehicleType?.name || "",
      icon_url: vehicleType?.icon_url || "",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        name: vehicleType?.name || "",
        icon_url: vehicleType?.icon_url || "",
      });
    }
  }, [open, vehicleType, form]);

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    onSubmit(values);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edit Vehicle Type" : "Add Vehicle Type"}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[calc(90vh-10rem)] pr-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter vehicle type name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="icon_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Icon URL</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter icon URL (optional)" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : isEditMode ? "Update" : "Create"}
                </Button>
              </div>
            </form>
          </Form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
