
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const twilioAccountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
const twilioAuthToken = Deno.env.get("TWILIO_AUTH_TOKEN");
const twilioPhoneNumber = Deno.env.get("TWILIO_PHONE_NUMBER");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse the request body
    const body = await req.json();
    console.log("Received SMS provider request:", body);

    // Supabase passes these parameters
    const { phone, message } = body;

    if (!phone || !message) {
      console.error("Missing required parameters: phone or message");
      return new Response(
        JSON.stringify({ error: "Missing required parameters" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Format phone number
    const formattedPhone = formatPhoneNumber(phone);

    // Extract the OTP from the message
    // This assumes the OTP is a number with 4-6 digits in the message
    const otpMatch = message.match(/(\d{4,6})/);
    const otp = otpMatch ? otpMatch[0] : null;

    if (!otp) {
      console.error("Could not extract OTP from message:", message);
      return new Response(
        JSON.stringify({ error: "Could not extract OTP from message" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log(`Sending OTP ${otp} to ${formattedPhone}`);

    // Call Twilio API to send SMS
    const twilioResponse = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${btoa(`${twilioAccountSid}:${twilioAuthToken}`)}`,
        },
        body: new URLSearchParams({
          To: formattedPhone,
          From: twilioPhoneNumber,
          Body: `Your verification code is: ${otp}`,
        }),
      }
    );

    const twilioData = await twilioResponse.json();

    if (!twilioResponse.ok) {
      console.error("Twilio API error:", twilioData);
      return new Response(
        JSON.stringify({ error: "Failed to send SMS via Twilio" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log("SMS sent successfully:", twilioData.sid);

    // Return success response
    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error) {
    console.error("Error in sms-provider function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Unknown error" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});

// Helper function to format phone number to E.164 format
function formatPhoneNumber(phone: string): string {
  // Remove any non-digit characters
  let digits = phone.replace(/\D/g, "");

  // If the number doesn't start with +, add the + sign
  if (!phone.startsWith("+")) {
    // If the number doesn't have a country code (assuming India +91 as default)
    // Check if it's a 10-digit number without country code
    if (digits.length === 10) {
      digits = "91" + digits; // Add India country code
    }
    return "+" + digits;
  }

  return phone;
}
