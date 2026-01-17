
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Define corsHeaders inline
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { vpa, order_id, amount } = await req.json();

    if (!vpa || !order_id || !amount) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Initiating UPI payment: vpa=${vpa}, order_id=${order_id}, amount=${amount}`);

    const keyId = Deno.env.get("RAZORPAY_KEY_ID");
    const keySecret = Deno.env.get("RAZORPAY_KEY_SECRET");

    if (!keyId || !keySecret) {
      console.error('Razorpay credentials missing');
      return new Response(
        JSON.stringify({ error: "Missing Razorpay credentials" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Basic Auth header for Razorpay API
    const basicAuth = "Basic " + btoa(`${keyId}:${keySecret}`);

    // Call Razorpay API directly
    const razorpayResponse = await fetch("https://api.razorpay.com/v1/payments", {
      method: "POST",
      headers: {
        Authorization: basicAuth,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount,
        currency: "INR",
        order_id,
        method: "upi",
        vpa,
      }),
    });

    const payment = await razorpayResponse.json();

    if (!razorpayResponse.ok) {
      console.error("Razorpay error:", payment);
      throw new Error(payment?.error?.description || "Failed to initiate UPI payment");
    }

    console.log('UPI payment initiated:', payment.id);

    return new Response(
      JSON.stringify({ data: payment }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Error initiating UPI payment:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
