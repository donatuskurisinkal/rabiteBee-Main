import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface AcceptedOrder {
  id: string;
  user_latitude: number;
  user_longitude: number;
  user_address: string;
  payment_mode: string;
  total_amount: number;
  payment_status: string;
  order_type: string;
  restaurant_id: string;
  restaurant_name: string;
  restaurant_latitude: number;
  restaurant_longitude: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Get delivery agent ID and tenant ID from request
    const { deliveryAgentId, tenantId } = await req.json()

    if (!deliveryAgentId || !tenantId) {
      return new Response(
        JSON.stringify({ error: 'deliveryAgentId and tenantId are required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log(`Fetching accepted orders for agent: ${deliveryAgentId}, tenant: ${tenantId}`)

    // Get accepted orders with restaurant details
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select(`
        id,
        user_latitude,
        user_longitude,
        user_address,
        payment_mode,
        total_amount,
        payment_status,
        order_type,
        order_food_items (
          restaurant_id,
          menu_items (
            restaurants (
              id,
              name,
              latitude,
              longitude
            )
          )
        )
      `)
      .eq('delivery_agent_id', deliveryAgentId)
      .eq('"tenantId"', tenantId)
      .eq('delivery_agent_status', 'accepted')
      .order('created_at', { ascending: false })

    if (ordersError) {
      console.error('Error fetching accepted orders:', ordersError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch accepted orders' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Transform the data to match the AcceptedOrder interface
    const acceptedOrders: AcceptedOrder[] = orders?.map(order => {
      // Get restaurant details from the first item (assuming all items are from same restaurant)
      const firstItem = order.order_food_items?.[0]
      const restaurant = firstItem?.menu_items?.restaurants

      return {
        id: order.id,
        user_latitude: order.user_latitude || 0,
        user_longitude: order.user_longitude || 0,
        user_address: order.user_address || '',
        payment_mode: order.payment_mode || '',
        total_amount: order.total_amount || 0,
        payment_status: order.payment_status || '',
        order_type: order.order_type || '',
        restaurant_id: firstItem?.restaurant_id || '',
        restaurant_name: restaurant?.name || 'Unknown Restaurant',
        restaurant_latitude: restaurant?.latitude || 0,
        restaurant_longitude: restaurant?.longitude || 0
      }
    }) || []

    console.log(`Found ${acceptedOrders.length} accepted orders for agent ${deliveryAgentId}`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        orders: acceptedOrders,
        count: acceptedOrders.length 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in get-accepted-orders function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})