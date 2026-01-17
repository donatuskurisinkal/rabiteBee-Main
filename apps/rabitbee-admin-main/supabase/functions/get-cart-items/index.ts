
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4'
import { corsHeaders } from '../_shared/cors.ts'

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

    // Get the tenant ID from query parameters if provided
    const url = new URL(req.url);
    const tenantId = url.searchParams.get('tenant_id');

    // Build the query with join to restaurants table through menu_items
    let query = supabase
      .from('cart_items')
      .select(`
        *,
        menu_items:menu_item_id (
          id,
          name,
          price,
          image_url,
          description,
          offer_price,
          is_customisable,
          product_tags,
          restaurant_id,
          restaurants:restaurant_id (
            id, 
            name,
            latitude,
            longitude
          )
        )
      `)
      .eq('user_id', user.id);

    // Add tenant filter if provided
    if (tenantId) {
      query = query.eq('tenant_id', tenantId);
    }

    // Execute the query
    const { data: cartItems, error: queryError } = await query;

    if (queryError) {
      console.error('Error fetching cart items:', queryError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch cart items', details: queryError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Format the response
    const formattedCartItems = cartItems?.map(item => {
      // Get the restaurant data from the menu_items
      const restaurant = item.menu_items?.restaurants || null;
      
      // Convert order_type to lowercase to match the client-side OrderType
      return {
        ...item,
        order_type: item.order_type?.toLowerCase() || null,
        // Format menu_items to a more user-friendly structure if it exists
        menuItem: item.menu_items ? {
          id: item.menu_items.id,
          name: item.menu_items.name,
          price: item.menu_items.price,
          image: item.menu_items.image_url,
          description: item.menu_items.description,
          offerPrice: item.menu_items.offer_price,
          isCustomisable: item.menu_items.is_customisable,
          tags: item.menu_items.product_tags,
          restaurant_id: item.menu_items.restaurant_id,
          restaurant: restaurant ? {
            id: restaurant.id,
            name: restaurant.name,
            latitude: restaurant.latitude,
            longitude: restaurant.longitude
          } : null
        } : null
      };
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: formattedCartItems 
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
