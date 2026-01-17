
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface DeliveryOrder {
  id: string;
  orderno: string;
  order_type: string;
  status: string;
  delivery_agent_status: string;
  is_scheduled: boolean;
  scheduled_at: string | null;
  created_at: string;
  assigned_at: string | null;
  user_address: string;
  user_latitude: number;
  user_longitude: number;
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
    const { delivery_agent_id, tenant_id } = await req.json()

    if (!delivery_agent_id || !tenant_id) {
      return new Response(
        JSON.stringify({ error: 'delivery_agent_id and tenant_id are required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log(`Fetching orders for agent: ${delivery_agent_id}, tenant: ${tenant_id}`)

    // Get orders assigned to the delivery agent with restaurant details
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select(`
        id,
        orderno,
        order_type,
        status,
        delivery_agent_status,
        is_scheduled,
        scheduled_at,
        created_at,
        assigned_at,
        user_address,
        user_latitude,
        user_longitude,
        order_food_items (
          menu_items (
            restaurants (
              name,
              latitude,
              longitude
            )
          )
        )
      `)
      .eq('delivery_agent_id', delivery_agent_id)
      .eq('"tenantId"', tenant_id)
      .in('status', ['pending', 'confirmed'])
      .in('delivery_agent_status', ['pending', 'assigned'])
      .order('created_at', { ascending: false })

    if (ordersError) {
      console.error('Error fetching orders:', ordersError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch orders' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Transform the data to match the DeliveryOrder interface
    const deliveryOrders: DeliveryOrder[] = orders?.map(order => {
      // Get restaurant details from the first item (assuming all items are from same restaurant)
      const firstItem = order.order_food_items?.[0]
      const restaurant = firstItem?.menu_items?.restaurants

      return {
        id: order.id,
        orderno: order.orderno || '',
        order_type: order.order_type,
        status: order.status,
        delivery_agent_status: order.delivery_agent_status,
        is_scheduled: order.is_scheduled || false,
        scheduled_at: order.scheduled_at,
        created_at: order.created_at,
        assigned_at: order.assigned_at,
        user_address: order.user_address || '',
        user_latitude: order.user_latitude || 0,
        user_longitude: order.user_longitude || 0,
        restaurant_name: restaurant?.name || 'Unknown Restaurant',
        restaurant_latitude: restaurant?.latitude || 0,
        restaurant_longitude: restaurant?.longitude || 0
      }
    }) || []

    console.log(`Found ${deliveryOrders.length} orders for agent ${delivery_agent_id}`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        orders: deliveryOrders,
        count: deliveryOrders.length 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in get-delivery-agent-orders function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
