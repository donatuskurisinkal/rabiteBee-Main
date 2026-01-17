
import React, { useState, useEffect } from "react";
import { OtpVerification } from "@/components/OtpVerification";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export default function PhoneVerification() {
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const { user, isLoading } = useAuth();

  // Redirect to dashboard if user is already authenticated
  useEffect(() => {
    if (user && !isLoading) {
      navigate("/admin/dashboard");
    }
  }, [user, isLoading, navigate]);

  const handleVerificationComplete = (success: boolean) => {
    if (success) {
      // After successful verification, redirect to dashboard
      console.log("OTP verification successful, redirecting to dashboard");
      setTimeout(() => {
        navigate("/admin/dashboard");
      }, 1000);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
      <div className="w-full max-w-md">
        <OtpVerification 
          onVerificationComplete={handleVerificationComplete}
          firstName={firstName}
          lastName={lastName}
        />
      </div>
    </div>
  );
}
