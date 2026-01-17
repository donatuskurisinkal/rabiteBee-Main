import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { corsHeaders } from '../_shared/cors.ts'

console.log("reject-order function initiated")

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Check for Authorization header
    const authHeader = req.headers.get('Authorization')
    console.log('Authorization header present:', !!authHeader)
    
    if (!authHeader) {
      console.log('Missing Authorization header')
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 401 
        },
      )
    }

    // Create a Supabase client with the Auth context of the user that called the function
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    // Get the session or user object
    const {
      data: { user },
      error: authError
    } = await supabaseClient.auth.getUser()

    console.log('Auth user result:', { user: !!user, error: authError })

    if (!user || authError) {
      console.log('User authentication failed:', authError)
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Invalid user session' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 401 
        },
      )
    }

    const { tenantId, userId, orderId, reason, rejectionType = 'manual', deviceInfo } = await req.json()

    if (!tenantId || !userId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: tenantId, userId' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 400 
        },
      )
    }

    console.log('Processing order rejection for user:', userId, 'tenant:', tenantId)

    // Get delivery agent info
    const { data: deliveryAgent, error: agentError } = await supabaseClient
      .from('delivery_agents')
      .select('id, status')
      .eq('user_id', userId)
      .eq('tenant_id', tenantId)
      .eq('is_active', true)
      .single()

    if (agentError || !deliveryAgent) {
      console.error('Error fetching delivery agent:', agentError)
      return new Response(
        JSON.stringify({ error: 'Delivery agent not found or not active' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 404 
        },
      )
    }

    // Find assigned order for this agent
    let orderQuery = supabaseClient
      .from('orders')
      .select('id, delivery_agent_status, assignment_attempts')
      .eq('delivery_agent_id', deliveryAgent.id)
      .eq('"tenantId"', tenantId)
      .in('delivery_agent_status', ['assigned', 'accepted'])

    // If orderId is provided, filter by it, otherwise get the first assigned order
    if (orderId) {
      orderQuery = orderQuery.eq('id', orderId)
    }

    const { data: orders, error: orderError } = await orderQuery

    if (orderError) {
      console.error('Error fetching orders:', orderError)
      return new Response(
        JSON.stringify({ error: 'Error fetching assigned orders' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 500 
        },
      )
    }

    if (!orders || orders.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No assigned orders found for this agent' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 404 
        },
      )
    }

    const order = orders[0]
    const currentAttempts = order.assignment_attempts || 0

    // Log the rejection in agent_order_rejections table
    const { error: rejectionLogError } = await supabaseClient
      .from('agent_order_rejections')
      .insert({
        order_id: order.id,
        agent_id: deliveryAgent.id,
        reason: reason || null,
        rejection_type: rejectionType,
        attempt_number: currentAttempts + 1,
        device_info: deviceInfo || null,
        tenant_id: tenantId
      })

    if (rejectionLogError) {
      console.error('Error logging rejection:', rejectionLogError)
      return new Response(
        JSON.stringify({ error: 'Error logging rejection' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 500 
        },
      )
    }

    // Remove delivery agent assignment from order and update status
    const { error: orderUpdateError } = await supabaseClient
      .from('orders')
      .update({
        delivery_agent_id: null,
        delivery_agent_status: 'pending',
        assignment_attempts: currentAttempts + 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', order.id)

    if (orderUpdateError) {
      console.error('Error updating order:', orderUpdateError)
      return new Response(
        JSON.stringify({ error: 'Error updating order status' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 500 
        },
      )
    }

    // Update delivery agent status to available
    const { error: agentUpdateError } = await supabaseClient
      .from('delivery_agents')
      .update({
        status: 'available',
        updated_at: new Date().toISOString()
      })
      .eq('id', deliveryAgent.id)

    if (agentUpdateError) {
      console.error('Error updating delivery agent status:', agentUpdateError)
      return new Response(
        JSON.stringify({ error: 'Error updating delivery agent status' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 500 
        },
      )
    }

    console.log('Order rejection processed successfully for order:', order.id)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Order rejection processed successfully',
        orderId: order.id,
        attemptNumber: currentAttempts + 1
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 200 
      },
    )

  } catch (error) {
    console.error('Error in reject-order function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 500 
      },
    )
  }
})