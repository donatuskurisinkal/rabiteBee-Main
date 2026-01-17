
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Razorpay from "https://esm.sh/razorpay";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get Razorpay credentials from environment variables
    const keyId = Deno.env.get("RAZORPAY_KEY_ID");
    const keySecret = Deno.env.get("RAZORPAY_KEY_SECRET");

    if (!keyId || !keySecret) {
      console.error('Razorpay credentials missing');
      return new Response(
        JSON.stringify({ error: 'Razorpay configuration missing' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Razorpay
    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    // Parse request body
    const { amount, currency = "INR", receipt, notes } = await req.json();

    // Validate required parameters
    if (!amount) {
      return new Response(
        JSON.stringify({ error: 'Amount is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Creating Razorpay order: amount=${amount}, currency=${currency}, receipt=${receipt}`);

    // Create order
    const order = await razorpay.orders.create({
      amount, // amount in smallest currency unit (paise for INR): 50000 = ₹500
      currency,
      receipt,
      notes,
    });

    console.log('Razorpay order created:', order.id);

    // Return successful response with order details
    return new Response(
      JSON.stringify({ data: order }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('Error creating Razorpay order:', err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
