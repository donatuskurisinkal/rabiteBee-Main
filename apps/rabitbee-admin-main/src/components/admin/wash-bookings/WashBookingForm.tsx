import { useEffect, useState } from "react";
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
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { format } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useTenant } from "@/contexts/TenantContext";

interface User {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
}

interface WashBooking {
  id: string;
  user_id: string;
  booking_date: string;
  time_slot_id: string | null;
  wash_type_id: string | null;
  vehicle_model_id: string | null;
  vehicle_type_id: string | null;
  address_id: string | null;
  tenant_id: string | null;
}

const formSchema = z.object({
  user_id: z.string().min(1, { message: "User is required" }),
  booking_date: z.date(),
  time_slot_id: z.string().min(1, { message: "Time slot is required" }),
  wash_type_id: z.string().min(1, { message: "Wash type is required" }),
  vehicle_model_id: z.string().min(1, { message: "Vehicle model is required" }),
  vehicle_type_id: z.string().min(1, { message: "Vehicle type is required" }),
});

interface WashBookingFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: any) => void;
  booking: WashBooking | null;
  isSubmitting: boolean;
  tenantId?: string;
}

export function WashBookingForm({
  open,
  onOpenChange,
  onSubmit,
  booking,
  isSubmitting,
  tenantId,
}: WashBookingFormProps) {
  const isEditMode = !!booking;
  const { selectedTenant } = useTenant();
  const [users, setUsers] = useState<User[]>([]);
  
  // Load users for dropdown
  useQuery({
    queryKey: ['users-for-booking-form'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .select('id, username, first_name, last_name');
      
      if (error) throw error;
      
      // Handle and fix type issues - ensure the data matches the User interface
      if (data) {
        const typeSafeUsers = data.map(user => ({
          id: user.id,
          email: user.username || 'Unknown',
          first_name: user.first_name,
          last_name: user.last_name,
        }));
        setUsers(typeSafeUsers);
      }
      
      return data;
    },
  });

  const { data: timeSlots = [] } = useQuery({
    queryKey: ['wash-time-slots', selectedTenant?.id],
    queryFn: async () => {
      let query = supabase
        .from('wash_time_slots')
        .select('id, start_time, end_time');
      
      if (selectedTenant?.id) {
        query = query.eq('tenant_id', selectedTenant.id);
      }
      
      const { data, error } = await query.order('start_time');
      
      if (error) throw error;
      return data;
    },
  });

  const { data: washTypes = [] } = useQuery({
    queryKey: ['wash-types', selectedTenant?.id],
    queryFn: async () => {
      let query = supabase
        .from('wash_types')
        .select('id, name');
      
      if (selectedTenant?.id) {
        query = query.eq('tenant_id', selectedTenant.id);
      }
      
      const { data, error } = await query.order('name');
      
      if (error) throw error;
      return data;
    },
  });

  const { data: vehicleModels = [] } = useQuery({
    queryKey: ['vehicle-models', selectedTenant?.id],
    queryFn: async () => {
      let query = supabase
        .from('wash_vehicle_models')
        .select('id, name');
      
      if (selectedTenant?.id) {
        query = query.eq('tenant_id', selectedTenant.id);
      }
      
      const { data, error } = await query.order('name');
      
      if (error) throw error;
      return data;
    },
  });

  const { data: vehicleTypes = [] } = useQuery({
    queryKey: ['vehicle-types', selectedTenant?.id],
    queryFn: async () => {
      let query = supabase
        .from('wash_vehicle_types')
        .select('id, name');
      
      if (selectedTenant?.id) {
        query = query.eq('tenant_id', selectedTenant.id);
      }
      
      const { data, error } = await query.order('name');
      
      if (error) throw error;
      return data;
    },
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      user_id: booking?.user_id || "",
      booking_date: booking?.booking_date ? new Date(booking.booking_date) : new Date(),
      time_slot_id: booking?.time_slot_id || "",
      wash_type_id: booking?.wash_type_id || "",
      vehicle_model_id: booking?.vehicle_model_id || "",
      vehicle_type_id: booking?.vehicle_type_id || "",
    },
  });

  useEffect(() => {
    if (open && booking) {
      form.reset({
        user_id: booking.user_id,
        booking_date: booking.booking_date ? new Date(booking.booking_date) : new Date(),
        time_slot_id: booking.time_slot_id || "",
        wash_type_id: booking.wash_type_id || "",
        vehicle_model_id: booking.vehicle_model_id || "",
        vehicle_type_id: booking.vehicle_type_id || "",
      });
    } else if (open) {
      form.reset({
        user_id: "",
        booking_date: new Date(),
        time_slot_id: "",
        wash_type_id: "",
        vehicle_model_id: "",
        vehicle_type_id: "",
      });
    }
  }, [open, booking, form]);

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    const dataWithTenantId = {
      ...values,
      tenant_id: tenantId || selectedTenant?.id || null,
      booking_date: format(values.booking_date, 'yyyy-MM-dd')
    };
    onSubmit(dataWithTenantId);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edit Booking" : "Add Booking"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="user_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>User</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select user" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>{user.email}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="booking_date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Booking Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-[240px] pl-3 text-left font-normal",
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
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date < new Date()
                        }
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
              name="time_slot_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Time Slot</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select time slot" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {timeSlots.map((timeSlot) => (
                        <SelectItem key={timeSlot.id} value={timeSlot.id}>{timeSlot.start_time} - {timeSlot.end_time}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="wash_type_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Wash Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select wash type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {washTypes.map((washType) => (
                        <SelectItem key={washType.id} value={washType.id}>{washType.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="vehicle_model_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vehicle Model</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select vehicle model" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {vehicleModels.map((vehicleModel) => (
                        <SelectItem key={vehicleModel.id} value={vehicleModel.id}>{vehicleModel.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="vehicle_type_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vehicle Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select vehicle type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {vehicleTypes.map((vehicleType) => (
                        <SelectItem key={vehicleType.id} value={vehicleType.id}>{vehicleType.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : isEditMode ? "Update" : "Create"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
