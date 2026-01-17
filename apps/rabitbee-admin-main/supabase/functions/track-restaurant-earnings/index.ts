import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { orderId, commissionRate = 0.15 } = await req.json();

    console.log('Tracking restaurant earnings for order:', orderId);

    if (!orderId) {
      return new Response(
        JSON.stringify({ error: 'Order ID is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Get order details with restaurant information
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        id,
        total_amount,
        order_food_items!inner(
          restaurant_id,
          restaurants(id, name)
        )
      `)
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      console.error('Order not found:', orderError);
      return new Response(
        JSON.stringify({ error: 'Order not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Group order items by restaurant
    const restaurantGroups = order.order_food_items.reduce((acc: any, item: any) => {
      const restaurantId = item.restaurant_id;
      if (!acc[restaurantId]) {
        acc[restaurantId] = {
          restaurant_id: restaurantId,
          items: []
        };
      }
      acc[restaurantId].items.push(item);
      return acc;
    }, {});

    // Calculate earnings for each restaurant
    const earningsToInsert = [];
    
    for (const restaurantId in restaurantGroups) {
      const group = restaurantGroups[restaurantId];
      
      // For now, we'll use the total order amount as gross amount
      // In a real scenario, you'd calculate per-restaurant amounts
      const grossAmount = order.total_amount;
      const commissionAmount = grossAmount * commissionRate;
      const netAmount = grossAmount - commissionAmount;

      earningsToInsert.push({
        restaurant_id: restaurantId,
        order_id: orderId,
        gross_amount: grossAmount,
        commission_amount: commissionAmount,
        net_amount: netAmount,
      });
    }

    // Insert restaurant earnings
    const { data: earnings, error: earningsError } = await supabase
      .from('restaurant_earnings')
      .insert(earningsToInsert)
      .select();

    if (earningsError) {
      console.error('Error inserting restaurant earnings:', earningsError);
      return new Response(
        JSON.stringify({ error: 'Failed to track restaurant earnings' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('Restaurant earnings tracked successfully:', earnings);

    return new Response(
      JSON.stringify({ 
        success: true, 
        earnings: earnings,
        message: 'Restaurant earnings tracked successfully'
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in track-restaurant-earnings function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});