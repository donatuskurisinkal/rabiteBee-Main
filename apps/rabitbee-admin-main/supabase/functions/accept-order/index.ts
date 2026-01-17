import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      console.error('Authentication error:', authError)
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Parse request body
    const { orderId, tenantId, deliveryAgentId } = await req.json()

    if (!orderId || !tenantId || !deliveryAgentId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: orderId, tenantId, deliveryAgentId' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('Accepting order:', { orderId, tenantId, deliveryAgentId, userId: user.id })

    // Verify the delivery agent exists and belongs to the tenant
    const { data: deliveryAgent, error: agentError } = await supabase
      .from('delivery_agents')
      .select('id, user_id, tenant_id, is_active')
      .eq('id', deliveryAgentId)
      .eq('user_id', user.id)
      .eq('tenant_id', tenantId)
      .eq('is_active', true)
      .maybeSingle()

    if (agentError) {
      console.error('Error fetching delivery agent:', agentError)
      return new Response(
        JSON.stringify({ error: 'Error verifying delivery agent' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (!deliveryAgent) {
      console.error('Delivery agent not found or not authorized')
      return new Response(
        JSON.stringify({ error: 'Delivery agent not found or not authorized' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Check if order exists and is available for assignment
    const { data: order, error: orderCheckError } = await supabase
      .from('orders')
      .select('id, status, delivery_agent_status, "tenantId"')
      .eq('id', orderId)
      .eq('"tenantId"', tenantId)
      .maybeSingle()

    console.log('Order check debug:', { orderId, tenantId, order, orderCheckError })

    if (orderCheckError) {
      console.error('Error checking order:', orderCheckError)
      return new Response(
        JSON.stringify({ error: 'Error checking order' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (!order) {
      return new Response(
        JSON.stringify({ error: 'Order not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Check if order is already assigned to another agent
    if (order.delivery_agent_status && order.delivery_agent_status !== 'pending' && order.delivery_agent_status !== 'assigned') {
      return new Response(
        JSON.stringify({ error: 'Order is no longer available for acceptance' }),
        { 
          status: 409, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Update the order with delivery agent information
    const { data: updatedOrder, error: updateError } = await supabase
      .from('orders')
      .update({
        delivery_agent_id: deliveryAgentId,
        delivery_agent_status: 'accepted',
        assigned_at: new Date().toISOString(),
        status: 'confirmed',
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)
      .eq('"tenantId"', tenantId)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating order:', updateError)
      return new Response(
        JSON.stringify({ error: 'Failed to accept order' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Update delivery agent status to 'busy' when they accept an order
    const { error: agentUpdateError } = await supabase
      .from('delivery_agents')
      .update({
        status: 'busy',
        updated_at: new Date().toISOString()
      })
      .eq('id', deliveryAgentId)
      .eq('user_id', user.id)
      .eq('tenant_id', tenantId)

    if (agentUpdateError) {
      console.error('Error updating delivery agent status:', agentUpdateError)
      return new Response(
        JSON.stringify({ error: 'Failed to update delivery agent status' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('Order accepted successfully:', updatedOrder)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Order accepted successfully',
        order: updatedOrder 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})