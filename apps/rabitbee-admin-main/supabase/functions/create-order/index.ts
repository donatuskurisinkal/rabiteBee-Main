

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4'
import { corsHeaders } from '../_shared/cors.ts'

interface OrderItem {
  menu_item_id?: string;
  product_id?: string;
  restaurant_id?: string;
  quantity: number;
  price: number;
  notes?: string;
  addons?: any[];
}

interface CreateOrderRequest {
  order_type: 'food' | 'grocery';
  items: OrderItem[];
  user_address: string;
  user_latitude: number;
  user_longitude: number;
  delivery_tip?: number;
  promo_code_id?: string;
  note_for_delivery?: string;
  payment_mode: 'cash' | 'card' | 'upi';
  is_scheduled?: boolean;
  scheduled_at?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create a Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Get the JWT from the request header
    const authHeader = req.headers.get('Authorization') || '';
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract the token
    const token = authHeader.substring('Bearer '.length);
    
    // Get the user from the token
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      console.error('Auth error:', userError);
      return new Response(
        JSON.stringify({ error: 'Authentication failed', details: userError?.message }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const requestData: CreateOrderRequest = await req.json();
    
    if (!requestData.order_type || !requestData.items || !Array.isArray(requestData.items) || requestData.items.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid request data. Must provide order_type and items array.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate order_type - use lowercase values
    if (!['food', 'grocery'].includes(requestData.order_type)) {
      return new Response(
        JSON.stringify({ error: 'Invalid order_type. Must be "food" or "grocery".' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get tenant ID from headers
    const tenantId = req.headers.get('x-tenant-id');

    // Calculate total amount
    let totalAmount = 0;
    for (const item of requestData.items) {
      totalAmount += item.price * item.quantity;
    }

    // Add delivery tip if provided
    if (requestData.delivery_tip) {
      totalAmount += requestData.delivery_tip;
    }

    let discount = 0;
    let finalAmount = totalAmount;

    // Apply promo code if provided
    if (requestData.promo_code_id) {
      const { data: promoCode, error: promoError } = await supabase
        .from('promo_codes')
        .select('*')
        .eq('id', requestData.promo_code_id)
        .eq('is_active', true)
        .single();

      if (!promoError && promoCode) {
        // Check if promo code is valid
        const now = new Date();
        const startDate = new Date(promoCode.start_date);
        const endDate = new Date(promoCode.end_date);

        if (now >= startDate && now <= endDate) {
          // Check usage limit
          if (!promoCode.usage_limit || promoCode.used_count < promoCode.usage_limit) {
            // Check minimum order amount
            if (totalAmount >= (promoCode.min_order_amount || 0)) {
              // Calculate discount
              if (promoCode.discount_type === 'percentage') {
                discount = (totalAmount * promoCode.discount_value) / 100;
                if (promoCode.max_discount) {
                  discount = Math.min(discount, promoCode.max_discount);
                }
              } else if (promoCode.discount_type === 'flat') {
                discount = promoCode.discount_value;
              }

              finalAmount = totalAmount - discount;

              // Update promo code usage count
              await supabase
                .from('promo_codes')
                .update({ used_count: promoCode.used_count + 1 })
                .eq('id', requestData.promo_code_id);
            }
          }
        }
      }
    }

    // Create the order with lowercase order_type
    const orderData = {
      user_id: user.id,
      order_type: requestData.order_type, // This will be 'food' or 'grocery'
      user_address: requestData.user_address,
      user_latitude: requestData.user_latitude,
      user_longitude: requestData.user_longitude,
      total_amount: totalAmount,
      discount: discount,
      delivery_tip: requestData.delivery_tip || 0,
      promo_code_id: requestData.promo_code_id,
      note_for_delivery: requestData.note_for_delivery,
      payment_mode: requestData.payment_mode,
      payment_status: 'pending',
      status: 'pending',
      is_scheduled: requestData.is_scheduled || false,
      scheduled_at: requestData.scheduled_at ? new Date(requestData.scheduled_at) : null,
      tenantId: tenantId,
    };

    console.log('Creating order with data:', orderData);

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert([orderData])
      .select()
      .single();

    if (orderError) {
      console.error('Error creating order:', orderError);
      return new Response(
        JSON.stringify({ error: 'Failed to create order', details: orderError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create order items based on order type
    if (requestData.order_type === 'food') {
      // Create order food items
      const foodItems = requestData.items.map(item => ({
        order_id: order.id,
        menu_item_id: item.menu_item_id,
        restaurant_id: item.restaurant_id,
        quantity: item.quantity,
        price: item.price,
        notes: item.notes,
        addons: item.addons || [],
      }));

      const { error: foodItemsError } = await supabase
        .from('order_food_items')
        .insert(foodItems);

      if (foodItemsError) {
        console.error('Error creating food items:', foodItemsError);
        // Rollback order creation
        await supabase.from('orders').delete().eq('id', order.id);
        return new Response(
          JSON.stringify({ error: 'Failed to create order items', details: foodItemsError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Record promo code usage if applicable
    if (requestData.promo_code_id && discount > 0) {
      await supabase
        .from('promo_code_usages')
        .insert([{
          promo_code_id: requestData.promo_code_id,
          user_id: user.id,
          order_id: order.id,
          discount_applied: discount,
        }]);
    }

    // Clear user's cart items for this order type
    await supabase
      .from('cart_items')
      .delete()
      .eq('user_id', user.id)
      .eq('order_type', requestData.order_type.toLowerCase());

    console.log('Order created successfully:', order.id);

    // Track restaurant earnings if it's a food order
    if (requestData.order_type.toLowerCase() === 'food') {
      try {
        const trackingResponse = await supabase.functions.invoke('track-restaurant-earnings', {
          body: { orderId: order.id }
        });
        
        if (trackingResponse.error) {
          console.error('Error tracking restaurant earnings:', trackingResponse.error);
        } else {
          console.log('Restaurant earnings tracked successfully');
        }
      } catch (trackingError) {
        console.error('Failed to track restaurant earnings:', trackingError);
        // Don't fail the order creation if earnings tracking fails
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: {
          order,
          items_count: requestData.items.length,
          total_amount: totalAmount,
          discount_applied: discount,
          final_amount: finalAmount
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unhandled error:', error);
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

