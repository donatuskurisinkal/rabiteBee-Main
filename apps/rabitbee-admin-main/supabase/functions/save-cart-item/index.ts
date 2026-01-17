
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4'
import { corsHeaders } from '../_shared/cors.ts'

interface CartItemPayload {
  menu_item_id?: string;
  product_id?: string;
  quantity: number;
  notes?: string;
  selected_addons?: any[];
  order_type: 'food' | 'grocery';
  tenant_id?: string;
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

    // Parse the request body
    const payload: CartItemPayload = await req.json();
    console.log('Received payload:', payload);

    // Validate the payload
    if (!payload) {
      return new Response(
        JSON.stringify({ error: 'Missing request payload' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if ((!payload.menu_item_id && !payload.product_id) || !payload.order_type) {
      return new Response(
        JSON.stringify({ error: 'Required fields missing', details: 'Either menu_item_id or product_id, and order_type are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use the order_type directly without converting to uppercase
    const orderType = payload.order_type;

    // Check if item already exists in cart
    const { data: existingItems, error: queryError } = await supabase
      .from('cart_items')
      .select('id, quantity')
      .eq('user_id', user.id)
      .eq(payload.menu_item_id ? 'menu_item_id' : 'product_id', payload.menu_item_id || payload.product_id);

    if (queryError) {
      console.error('Error checking existing cart item:', queryError);
      return new Response(
        JSON.stringify({ error: 'Database query failed', details: queryError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let result;
    
    // Prepare the cart item data
    const cartItemData = {
      user_id: user.id,  // Explicitly set user_id to the current authenticated user
      quantity: payload.quantity,
      notes: payload.notes,
      order_type: orderType, // Use the original value without uppercase conversion
      selected_addons: payload.selected_addons || [],
      tenant_id: payload.tenant_id, // Save the tenant_id from payload
      ...(payload.menu_item_id ? { menu_item_id: payload.menu_item_id } : {}),
      ...(payload.product_id ? { product_id: payload.product_id } : {})
    };

    // If item exists, update it; otherwise, insert a new one
    if (existingItems && existingItems.length > 0) {
      const existingItem = existingItems[0];
      
      // Update the existing cart item
      const { data: updateData, error: updateError } = await supabase
        .from('cart_items')
        .update({ 
          ...cartItemData,
          quantity: payload.quantity // Replace with new quantity instead of incrementing
        })
        .eq('id', existingItem.id)
        .select();

      if (updateError) {
        console.error('Error updating cart item:', updateError);
        return new Response(
          JSON.stringify({ error: 'Failed to update cart item', details: updateError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      result = updateData;
    } else {
      // Insert a new cart item
      const { data: insertData, error: insertError } = await supabase
        .from('cart_items')
        .insert(cartItemData)
        .select();

      if (insertError) {
        console.error('Error inserting cart item:', insertError);
        return new Response(
          JSON.stringify({ error: 'Failed to add item to cart', details: insertError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      result = insertData;
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Item saved to cart successfully',
        data: result,
        cartItemId: result && result.length > 0 ? result[0].id : null
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
