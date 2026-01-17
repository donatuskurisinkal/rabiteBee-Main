
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useSupabaseOtp } from "@/hooks/useSupabaseOtp";
import { Loader2 } from "lucide-react";

interface OtpVerificationProps {
  userId?: string;
  initialPhoneNumber?: string;
  onVerificationComplete?: (success: boolean) => void;
  firstName?: string;
  lastName?: string;
}

export function OtpVerification({ 
  userId, 
  initialPhoneNumber = "", 
  onVerificationComplete,
  firstName = "",
  lastName = ""
}: OtpVerificationProps) {
  const [phoneNumber, setPhoneNumber] = useState(initialPhoneNumber);
  const [otp, setOtp] = useState("");
  const { isLoading, otpSent, sendOtp, verifyOtp, setOtpSent } = useSupabaseOtp();

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber.trim()) return;
    await sendOtp(phoneNumber);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber.trim() || !otp.trim()) return;
    
    const result = await verifyOtp(phoneNumber, otp);
    
    if (onVerificationComplete) {
      onVerificationComplete(result.success);
    }
  };

  const handleChangePhone = () => {
    setOtpSent(false);
    setOtp("");
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Phone Verification</CardTitle>
        <CardDescription>
          {otpSent 
            ? "Enter the verification code sent to your phone" 
            : "Verify your phone number with a one-time code"}
        </CardDescription>
      </CardHeader>

      {!otpSent ? (
        <form onSubmit={handleSendOtp}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Phone Number</Label>
              <Input
                id="phoneNumber"
                type="tel"
                placeholder="+91 9876543210"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                disabled={isLoading}
                required
              />
              <p className="text-xs text-muted-foreground">
                Include your country code (e.g., +91 for India)
              </p>
            </div>
          </CardContent>

          <CardFooter>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending Code...
                </>
              ) : (
                "Send Verification Code"
              )}
            </Button>
          </CardFooter>
        </form>
      ) : (
        <form onSubmit={handleVerifyOtp}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="otp">Verification Code</Label>
              <InputOTP
                maxLength={6}
                value={otp}
                onChange={(value) => setOtp(value)}
                disabled={isLoading}
                render={({ slots }) => (
                  <InputOTPGroup>
                    {slots.map((slot, index) => (
                      <InputOTPSlot key={index} {...slot} index={index} />
                    ))}
                  </InputOTPGroup>
                )}
              />
              <p className="text-xs text-muted-foreground">
                Enter the 6-digit code sent to {phoneNumber}
              </p>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-2">
            <Button type="submit" className="w-full" disabled={isLoading || otp.length !== 6}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Verify Code"
              )}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={handleChangePhone}
              className="w-full"
              disabled={isLoading}
            >
              Change Phone Number
            </Button>
          </CardFooter>
        </form>
      )}
    </Card>
  );
}
