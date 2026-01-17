
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Session } from "@supabase/supabase-js";

export function useOtpVerification() {
  const [isLoading, setIsLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const { toast } = useToast();

  /**
   * Sends an OTP to the provided phone number
   */
  const sendOtp = async (phoneNumber: string) => {
    try {
      setIsLoading(true);
      console.log(`Requesting OTP for phone: ${phoneNumber}`);

      // Make the function call with stringified JSON body for React Native compatibility
      const { data, error } = await supabase.functions.invoke("twilio-otp", {
        body: {
          action: "send",
          phone: phoneNumber,
        },
        // Explicitly set headers to not include authorization
        headers: {
          "Content-Type": "application/json",
        },
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
   * Verifies the OTP entered by the user and creates a new user upon successful verification
   */
  const verifyOtp = async (phoneNumber: string, otp: string, firstName?: string, lastName?: string) => {
    try {
      setIsLoading(true);
      console.log(`Verifying OTP for phone: ${phoneNumber}, OTP: ${otp}`);

      // Make the function call with stringified JSON body for React Native compatibility
      const { data, error } = await supabase.functions.invoke("twilio-otp", {
        body: {
          action: "verify",
          phone: phoneNumber,
          otp: otp,
          firstName: firstName || "",
          lastName: lastName || "",
        },
        // Explicitly set headers to not include authorization
        headers: {
          "Content-Type": "application/json",
        },
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

      if (data.valid) {
        toast({
          title: "Verification Successful",
          description: "Your phone number has been verified",
        });

        // If we have a session, set it in the Supabase client
        if (data.session) {
          console.log("Setting session from OTP verification:", data.session);
          await supabase.auth.setSession({
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token
          });
          
          // Trigger auth state change
          const { data: authData } = await supabase.auth.getUser();
          console.log("Authenticated user:", authData?.user);
        }

        return { success: true, data };
      } else {
        toast({
          variant: "destructive",
          title: "Verification Failed",
          description: "The code you entered is invalid or has expired",
        });
        return { success: false, data };
      }
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
