
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

export type AddressTag = 'home' | 'work' | 'other';

export interface UserAddress {
  id?: string;
  address: string;
  latitude?: number;
  longitude?: number;
  tag: AddressTag;
  isDefault?: boolean;
}

export interface UserProfileData {
  firstName?: string;
  lastName?: string;
  address?: UserAddress;
  roleId?: string; // Optional role ID to assign
}

export function useUserProfile() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  /**
   * Update user profile data including addresses
   */
  const updateUserProfile = async (userData: UserProfileData) => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "You must be logged in to update your profile",
      });
      return { success: false, error: "Not authenticated" };
    }

    try {
      setIsLoading(true);
      console.log("Updating user profile with data:", userData);

      const payload: any = {
        userId: user.id,
      };

      // Add basic profile information if provided
      if (userData.firstName !== undefined) payload.firstName = userData.firstName;
      if (userData.lastName !== undefined) payload.lastName = userData.lastName;
      if (userData.roleId !== undefined) payload.roleId = userData.roleId;
      
      // Add address information if provided
      if (userData.address) {
        // Ensure tag is lowercase to match the enum type in the database
        if (userData.address.tag) {
          userData.address.tag = userData.address.tag.toLowerCase() as AddressTag;
        }
        
        payload.address = userData.address;
        
        // Include addressId if we're updating an existing address
        if (userData.address.id) {
          payload.addressId = userData.address.id;
        }
      }

      const { data, error } = await supabase.functions.invoke("update-user-profile", {
        body: payload
      });

      if (error) {
        console.error("Error updating user profile:", error);
        toast({
          variant: "destructive",
          title: "Update Failed",
          description: error.message || "Failed to update profile",
        });
        return { success: false, error };
      }

      console.log("User profile update response:", data);
      
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully",
      });

      return { success: true, data };
    } catch (error) {
      console.error("Exception updating user profile:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Something went wrong while updating your profile",
      });
      return { success: false, error };
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Fetch user addresses
   */
  const getUserAddresses = async () => {
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('user_addresses')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false });

      if (error) {
        console.error("Error fetching user addresses:", error);
        return { success: false, error };
      }

      // Transform data to match our interface format
      const addresses = data.map(addr => ({
        id: addr.id,
        address: addr.address,
        latitude: addr.latitude,
        longitude: addr.longitude,
        tag: addr.tag,
        isDefault: addr.is_default
      }));

      return { success: true, addresses };
    } catch (error) {
      console.error("Exception fetching user addresses:", error);
      return { success: false, error };
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Delete a user address
   */
  const deleteUserAddress = async (addressId: string) => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "You must be logged in to delete an address",
      });
      return { success: false, error: "Not authenticated" };
    }

    try {
      setIsLoading(true);
      
      const { error } = await supabase
        .from('user_addresses')
        .delete()
        .eq('id', addressId)
        .eq('user_id', user.id);

      if (error) {
        console.error("Error deleting address:", error);
        toast({
          variant: "destructive",
          title: "Delete Failed",
          description: error.message || "Failed to delete address",
        });
        return { success: false, error };
      }
      
      toast({
        title: "Address Deleted",
        description: "Your address has been deleted successfully",
      });

      return { success: true };
    } catch (error) {
      console.error("Exception deleting address:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Something went wrong while deleting your address",
      });
      return { success: false, error };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    updateUserProfile,
    getUserAddresses,
    deleteUserAddress
  };
}
