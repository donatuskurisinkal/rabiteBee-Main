
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Search, Plus, Edit, Trash2 } from "lucide-react";

// Schema definition for State
const stateSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, "State name is required"),
  is_active: z.boolean().default(true),
});

type StateFormValues = z.infer<typeof stateSchema>;

export default function States() {
  const { user, userPermissions } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterActive, setFilterActive] = useState<boolean | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [stateToDelete, setStateToDelete] = useState<string | null>(null);
  
  // Form setup
  const form = useForm<StateFormValues>({
    resolver: zodResolver(stateSchema),
    defaultValues: {
      name: "",
      is_active: true,
    },
  });

  // Fetch states
  const { data: states, isLoading } = useQuery({
    queryKey: ["states", searchQuery, filterActive],
    queryFn: async () => {
      let query = supabase.from("states").select("*");
      
      if (searchQuery) {
        query = query.ilike("name", `%${searchQuery}%`);
      }
      
      if (filterActive !== null) {
        query = query.eq("is_active", filterActive);
      }
      
      const { data, error } = await query.order("name");
      
      if (error) {
        throw new Error(error.message);
      }
      
      return data || [];
    },
    enabled: userPermissions.includes("manage_states") || userPermissions.includes("manage_all"),
  });

  // Create state mutation
  const createMutation = useMutation({
    mutationFn: async (values: StateFormValues) => {
      const { data, error } = await supabase
        .from("states")
        .insert([{ name: values.name, is_active: values.is_active }])
        .select();
      
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      toast({
        title: "State created",
        description: "State was successfully created",
      });
      queryClient.invalidateQueries({ queryKey: ["states"] });
      form.reset();
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    },
  });

  // Update state mutation
  const updateMutation = useMutation({
    mutationFn: async (values: StateFormValues) => {
      if (!values.id) throw new Error("State ID is required");
      
      const { data, error } = await supabase
        .from("states")
        .update({ name: values.name, is_active: values.is_active })
        .eq("id", values.id)
        .select();
      
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      toast({
        title: "State updated",
        description: "State was successfully updated",
      });
      queryClient.invalidateQueries({ queryKey: ["states"] });
      form.reset();
      setIsEditing(false);
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    },
  });

  // Delete state mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("states")
        .delete()
        .eq("id", id);
      
      if (error) throw new Error(error.message);
      return id;
    },
    onSuccess: () => {
      toast({
        title: "State deleted",
        description: "State was successfully deleted",
      });
      queryClient.invalidateQueries({ queryKey: ["states"] });
      setStateToDelete(null);
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    },
  });

  const onSubmit = (values: StateFormValues) => {
    if (isEditing && values.id) {
      updateMutation.mutate(values);
    } else {
      createMutation.mutate(values);
    }
  };

  const handleEdit = (state: any) => {
    form.reset({
      id: state.id,
      name: state.name,
      is_active: state.is_active,
    });
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    form.reset({
      id: undefined,
      name: "",
      is_active: true,
    });
    setIsEditing(false);
  };

  const handleDelete = (id: string) => {
    setStateToDelete(id);
  };

  const confirmDelete = () => {
    if (stateToDelete) {
      deleteMutation.mutate(stateToDelete);
    }
  };

  const canManageStates = userPermissions.includes("manage_states") || userPermissions.includes("manage_all");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold tracking-tight">States Management</h1>
        <p className="text-muted-foreground">
          Manage geographical states in the system.
        </p>
      </div>

      {canManageStates && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>{isEditing ? "Edit State" : "Create New State"}</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>State Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter state name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="is_active"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 gap-4">
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
                  
                  <div className="flex gap-2">
                    <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                      {isEditing ? "Update" : "Create"}
                    </Button>
                    {isEditing && (
                      <Button type="button" variant="outline" onClick={handleCancelEdit}>
                        Cancel
                      </Button>
                    )}
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>States List</span>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <label htmlFor="active-filter" className="text-sm">Status:</label>
                    <select
                      id="active-filter"
                      className="text-sm p-1 border rounded"
                      value={filterActive === null ? 'all' : filterActive ? 'active' : 'inactive'}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === 'all') setFilterActive(null);
                        else if (value === 'active') setFilterActive(true);
                        else setFilterActive(false);
                      }}
                    >
                      <option value="all">All</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Search states..."
                      className="pl-8 w-[200px]"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p>Loading states...</p>
              ) : states && states.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {states.map((state) => (
                      <TableRow key={state.id}>
                        <TableCell className="font-medium">{state.name}</TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              state.is_active
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {state.is_active ? "Active" : "Inactive"}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(state)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-red-500 hover:text-red-600"
                                  onClick={() => handleDelete(state.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will permanently delete the state "{state.name}". 
                                    This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={confirmDelete} className="bg-red-500 hover:bg-red-600">
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center py-4 text-muted-foreground">
                  {searchQuery
                    ? "No states found matching your search."
                    : "No states have been created yet."}
                </p>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {!canManageStates && (
        <Card className="mt-6">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center p-8 text-center">
              <div>
                <p className="text-lg font-semibold">Access Restricted</p>
                <p className="text-muted-foreground mt-2">
                  You do not have permission to manage states.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
