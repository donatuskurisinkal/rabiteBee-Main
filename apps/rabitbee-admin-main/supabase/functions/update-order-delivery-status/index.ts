import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    )

    const { orderId, tenantId, deliveryAgentId, status } = await req.json()

    console.log('Updating order delivery status:', { 
      orderId, 
      tenantId, 
      deliveryAgentId, 
      status
    })

    // Validate required fields
    if (!orderId || !tenantId || !deliveryAgentId || !status) {
      return new Response(
        JSON.stringify({ 
          error: 'orderId, tenantId, deliveryAgentId, and status are required' 
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Validate status value
    const validStatuses = ['assigned', 'picked_up', 'out_for_delivery', 'delivered', 'failed']
    if (!validStatuses.includes(status)) {
      return new Response(
        JSON.stringify({ 
          error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` 
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Verify the delivery agent exists
    const { data: agent, error: agentError } = await supabaseClient
      .from('delivery_agents')
      .select('id, user_id, is_active')
      .eq('id', deliveryAgentId)
      .single()

    if (agentError || !agent) {
      console.error('Delivery agent verification failed:', agentError)
      return new Response(
        JSON.stringify({ error: 'Delivery agent not found' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    if (!agent.is_active) {
      return new Response(
        JSON.stringify({ error: 'Delivery agent is not active' }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Verify the order exists and is assigned to this delivery agent
    const { data: order, error: orderError } = await supabaseClient
      .from('orders')
      .select('id, delivery_agent_id, tenantId, delivery_agent_status, status')
      .eq('id', orderId)
      .eq('tenantId', tenantId)
      .single()

    if (orderError || !order) {
      console.error('Order verification failed:', orderError)
      return new Response(
        JSON.stringify({ error: 'Order not found' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    if (order.delivery_agent_id !== deliveryAgentId) {
      return new Response(
        JSON.stringify({ error: 'Order is not assigned to this delivery agent' }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Prepare update data
    const updateData: any = {
      delivery_agent_status: status,
      updated_at: new Date().toISOString(),
    }

    // If status is delivered, also update the main order status
    if (status === 'delivered') {
      updateData.status = 'delivered'
      updateData.delivered_at = new Date().toISOString()
    }

    // Update the order
    const { data: updatedOrder, error: updateError } = await supabaseClient
      .from('orders')
      .update(updateData)
      .eq('id', orderId)
      .eq('tenantId', tenantId)
      .select()
      .single()

    if (updateError) {
      console.error('Order update failed:', updateError)
      return new Response(
        JSON.stringify({ error: 'Failed to update order status' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    console.log('Successfully updated order delivery status:', {
      orderId,
      newStatus: status,
      deliveryAgentId,
    })

    return new Response(
      JSON.stringify({
        success: true,
        order: updatedOrder,
        message: `Order status updated to ${status}`,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('Error in update-order-delivery-status function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
