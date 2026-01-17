
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { useTenant } from "@/contexts/TenantContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Calendar } from "@/components/ui/calendar";

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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface Holiday {
  id: string;
  holiday_name: string;
  date: string;
  is_active: boolean;
  tenant_id: string | null;
  created_at: string;
}

const formSchema = z.object({
  id: z.string().optional(),
  holiday_name: z.string().min(1, "Holiday name is required"),
  date: z.date({
    required_error: "Date is required",
  }),
  is_active: z.boolean().default(true),
});

type FormValues = z.infer<typeof formSchema>;

interface HolidayFormProps {
  holiday?: Holiday | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

export function HolidayForm({ holiday, open, onOpenChange, onSaved }: HolidayFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { selectedTenant } = useTenant();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      id: '',
      holiday_name: '',
      date: new Date(),
      is_active: true,
    },
  });

  useEffect(() => {
    if (holiday) {
      form.reset({
        id: holiday.id,
        holiday_name: holiday.holiday_name,
        date: new Date(holiday.date),
        is_active: holiday.is_active !== false,
      });
    } else {
      form.reset({
        id: '',
        holiday_name: '',
        date: new Date(),
        is_active: true,
      });
    }
  }, [holiday, form]);

  const onSubmit = async (values: FormValues) => {
    if (!selectedTenant) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select a tenant first",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const formattedDate = format(values.date, 'yyyy-MM-dd');

      if (values.id) {
        // Update existing holiday
        const { error } = await supabase
          .from('holidays')
          .update({
            holiday_name: values.holiday_name,
            date: formattedDate,
            is_active: values.is_active,
          })
          .eq('id', values.id);

        if (error) throw error;

        toast({
          title: "Holiday updated",
          description: "The holiday has been updated successfully.",
        });
      } else {
        // Create new holiday
        const { error } = await supabase
          .from('holidays')
          .insert({
            holiday_name: values.holiday_name,
            date: formattedDate,
            is_active: values.is_active,
            tenant_id: selectedTenant.id,
          });

        if (error) throw error;

        toast({
          title: "Holiday created",
          description: "The holiday has been created successfully.",
        });
      }

      onSaved();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error saving holiday",
        description: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {holiday ? "Edit Holiday" : "Add New Holiday"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="holiday_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Holiday Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter holiday name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Date</FormLabel>
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
      </DialogContent>
    </Dialog>
  );
}
