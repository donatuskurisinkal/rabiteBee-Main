
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function useSupabaseOtp() {
  const [isLoading, setIsLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const { toast } = useToast();

  /**
   * Sends an OTP to the provided phone number using Supabase's native OTP
   */
  const sendOtp = async (phoneNumber: string) => {
    try {
      setIsLoading(true);
      console.log(`Requesting OTP for phone: ${phoneNumber}`);

      const { data, error } = await supabase.auth.signInWithOtp({
        phone: phoneNumber,
        options: {
          shouldCreateUser: true,
        }
      });

      if (error) {
        console.error("Error sending OTP:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message || "Failed to send verification code",
        });
        return { success: false, error };
      }

      console.log("OTP send response:", data);
      setOtpSent(true);
      
      toast({
        title: "Verification Code Sent",
        description: `We've sent a verification code to ${phoneNumber}`,
      });
      
      return { success: true, data };
    } catch (error) {
      console.error("Exception sending OTP:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Something went wrong while sending the verification code",
      });
      return { success: false, error };
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Verifies the OTP entered by the user using Supabase's native OTP verification
   */
  const verifyOtp = async (phoneNumber: string, otp: string) => {
    try {
      setIsLoading(true);
      console.log(`Verifying OTP for phone: ${phoneNumber}, OTP: ${otp}`);

      const { data, error } = await supabase.auth.verifyOtp({
        phone: phoneNumber,
        token: otp,
        type: 'sms'
      });

      if (error) {
        console.error("Error verifying OTP:", error);
        toast({
          variant: "destructive",
          title: "Verification Failed",
          description: error.message || "Failed to verify code",
        });
        return { success: false, error };
      }

      console.log("OTP verification response:", data);

      toast({
        title: "Verification Successful",
        description: "Your phone number has been verified",
      });

      return { success: true, session: data.session, user: data.user };
    } catch (error) {
      console.error("Exception verifying OTP:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Something went wrong during verification",
      });
      return { success: false, error };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    otpSent,
    sendOtp,
    verifyOtp,
    setOtpSent,
  };
}
