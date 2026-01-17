
import React, { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { WashBookingForm } from "@/components/admin/wash-bookings/WashBookingForm";
import { DataTable } from "@/components/admin/DataTable";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { PaginationComponent } from "@/components/admin/Pagination";
import { supabase } from "@/integrations/supabase/client";
import { ConfirmationDialog } from "@/components/admin/ConfirmationDialog";
import { Input } from "@/components/ui/input";
import { useTenant } from "@/hooks/use-tenant";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

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
  created_at: string;
  wash_time_slots?: {
    start_time: string;
    end_time: string;
  };
  wash_types?: {
    name: string;
  };
  wash_vehicle_models?: {
    name: string;
  };
  wash_vehicle_types?: {
    name: string;
  };
}

const washBookingColumns = [
  {
    key: "user",
    title: "User",
    render: (booking: WashBooking) => {
      return booking.user_id || "Unknown User";
    }
  },
  {
    key: "booking_date",
    title: "Date",
    render: (booking: WashBooking) => format(new Date(booking.booking_date), "MMM dd, yyyy")
  },
  {
    key: "time_slot",
    title: "Time Slot",
    render: (booking: WashBooking) => 
      booking.wash_time_slots 
        ? `${booking.wash_time_slots.start_time} - ${booking.wash_time_slots.end_time}`
        : "N/A"
  },
  {
    key: "wash_type",
    title: "Wash Type",
    render: (booking: WashBooking) => booking.wash_types?.name || "N/A"
  },
  {
    key: "vehicle",
    title: "Vehicle",
    render: (booking: WashBooking) => {
      const model = booking.wash_vehicle_models?.name;
      const type = booking.wash_vehicle_types?.name;
      return model && type ? `${model} (${type})` : model || type || "N/A";
    }
  },
];

const WashBookings = () => {
  const { toast } = useToast();
  const { selectedTenant } = useTenant();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editBooking, setEditBooking] = useState<WashBooking | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [bookingToDelete, setBookingToDelete] = useState<WashBooking | null>(null);

  const fetchWashBookings = useCallback(async () => {
    try {
      let query = supabase
        .from("wash_bookings")
        .select(`
          id,
          user_id,
          booking_date,
          time_slot_id,
          wash_type_id,
          vehicle_model_id,
          vehicle_type_id,
          address_id,
          tenant_id,
          created_at,
          wash_time_slots(start_time, end_time),
          wash_types(name),
          wash_vehicle_models(name),
          wash_vehicle_types(name)
        `, { count: "exact" });

      if (selectedTenant?.id) {
        query = query.eq("tenant_id", selectedTenant.id);
      }

      if (searchTerm) {
        query = query.ilike('user_id', `%${searchTerm}%`);
      }

      const from = (currentPage - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data, count, error } = await query
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) throw error;

      return {
        data: data || [],
        totalCount: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize),
      };
    } catch (error) {
      console.error("Error fetching wash bookings:", error);
      return { data: [], totalCount: 0, totalPages: 0 };
    }
  }, [selectedTenant, searchTerm, currentPage, pageSize]);

  const {
    data: bookingsData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["wash-bookings", selectedTenant?.id, currentPage, searchTerm],
    queryFn: fetchWashBookings,
  });

  const handleAddNew = () => {
    setEditBooking(null);
    setIsFormOpen(true);
  };

  const handleEdit = (booking: WashBooking) => {
    setEditBooking(booking);
    setIsFormOpen(true);
  };

  const handleDelete = (booking: WashBooking) => {
    setBookingToDelete(booking);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!bookingToDelete) return;

    try {
      const { error } = await supabase
        .from("wash_bookings")
        .delete()
        .eq("id", bookingToDelete.id);

      if (error) throw error;

      toast({
        title: "Booking deleted",
        description: "The wash booking has been deleted successfully.",
      });

      refetch();
    } catch (error: any) {
      console.error("Error deleting wash booking:", error);
      toast({
        variant: "destructive",
        title: "Error deleting booking",
        description: error.message || "An unexpected error occurred.",
      });
    } finally {
      setDeleteConfirmOpen(false);
      setBookingToDelete(null);
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      if (editBooking) {
        const { error } = await supabase
          .from("wash_bookings")
          .update(values)
          .eq("id", editBooking.id);

        if (error) throw error;

        toast({
          title: "Booking updated",
          description: "The wash booking has been updated successfully.",
        });
      } else {
        const { error } = await supabase
          .from("wash_bookings")
          .insert(values);

        if (error) throw error;

        toast({
          title: "Booking created",
          description: "The wash booking has been created successfully.",
        });
      }

      setIsFormOpen(false);
      refetch();
    } catch (error: any) {
      console.error("Error saving wash booking:", error);
      toast({
        variant: "destructive",
        title: "Error saving booking",
        description: error.message || "An unexpected error occurred.",
      });
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0">
          <CardTitle>Wash Bookings</CardTitle>
          <Button onClick={handleAddNew}>
            <Plus className="h-4 w-4 mr-2" />
            Add New Booking
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="flex-1">
              <Input
                placeholder="Search by user name"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full"
              />
            </div>
          </div>

          <DataTable
            columns={washBookingColumns}
            data={bookingsData?.data || []}
            onEdit={handleEdit}
            onDelete={handleDelete}
            isLoading={isLoading}
          />

          {bookingsData?.totalPages && bookingsData.totalPages > 1 && (
            <div className="mt-4 flex justify-center">
              <PaginationComponent
                currentPage={currentPage}
                totalPages={bookingsData.totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {isFormOpen && (
        <WashBookingForm
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          onSubmit={handleSubmit}
          booking={editBooking}
          isSubmitting={false}
          tenantId={selectedTenant?.id}
        />
      )}

      <ConfirmationDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        onConfirm={confirmDelete}
        title="Delete Wash Booking"
        description="Are you sure you want to delete this wash booking? This action cannot be undone."
      />
    </div>
  );
};

export default WashBookings;
