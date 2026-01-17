import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    const { 
      delivery_agent_id, 
      tenant_id,
      date_from,
      date_to,
      delivery_status,
      page = 1,
      page_size = 20
    } = await req.json()

    if (!delivery_agent_id || !tenant_id) {
      return new Response(
        JSON.stringify({ error: 'delivery_agent_id and tenant_id are required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log(`Fetching order history for agent: ${delivery_agent_id}, tenant: ${tenant_id}`)

    // Build the query
    let query = supabase
      .from('orders')
      .select(`
        id,
        orderno,
        order_type,
        status,
        delivery_agent_status,
        total_amount,
        final_amount,
        delivery_charge,
        delivery_tip,
        created_at,
        delivered_at,
        user_address,
        user_latitude,
        user_longitude,
        order_food_items (
          id,
          quantity,
          price,
          addons,
          menu_items (
            id,
            name,
            image_url,
            restaurants (
              id,
              name,
              address,
              latitude,
              longitude
            )
          )
        )
      `, { count: 'exact' })
      .eq('delivery_agent_id', delivery_agent_id)
      .eq('"tenantId"', tenant_id)

    // Apply date range filter if provided
    if (date_from) {
      query = query.gte('created_at', date_from)
    }
    if (date_to) {
      query = query.lte('created_at', date_to)
    }

    // Apply delivery status filter if provided
    if (delivery_status && delivery_status !== 'all') {
      query = query.eq('delivery_agent_status', delivery_status)
    }

    // Calculate pagination
    const from = (page - 1) * page_size
    const to = from + page_size - 1

    // Execute query with pagination
    const { data: orders, error: ordersError, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to)

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

    // Transform the data to include restaurant info from first item
    const orderHistory = orders?.map(order => {
      const firstItem = order.order_food_items?.[0]
      const restaurant = firstItem?.menu_items?.restaurants

      return {
        id: order.id,
        orderno: order.orderno || '',
        order_type: order.order_type,
        status: order.status,
        delivery_agent_status: order.delivery_agent_status,
        total_amount: order.total_amount,
        final_amount: order.final_amount,
        delivery_charge: order.delivery_charge || 0,
        delivery_tip: order.delivery_tip || 0,
        created_at: order.created_at,
        delivered_at: order.delivered_at,
        order_to: order.user_address || '',
        order_to_latitude: order.user_latitude || 0,
        order_to_longitude: order.user_longitude || 0,
        order_from: restaurant?.name || 'Unknown Restaurant',
        order_from_address: restaurant?.address || '',
        order_from_latitude: restaurant?.latitude || 0,
        order_from_longitude: restaurant?.longitude || 0,
        order_items: order.order_food_items?.map(item => ({
          id: item.id,
          name: item.menu_items?.name || 'Unknown Item',
          quantity: item.quantity,
          price: item.price,
          addons: item.addons,
          image_url: item.menu_items?.image_url
        })) || []
      }
    }) || []

    const totalPages = Math.ceil((count || 0) / page_size)
    const hasMore = page < totalPages

    console.log(`Found ${orderHistory.length} orders (page ${page}/${totalPages})`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        orders: orderHistory,
        pagination: {
          current_page: page,
          page_size: page_size,
          total_count: count || 0,
          total_pages: totalPages,
          has_more: hasMore
        }
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in get-delivery-agent-order-history function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
