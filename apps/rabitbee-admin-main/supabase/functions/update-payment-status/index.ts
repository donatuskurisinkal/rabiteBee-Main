import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    const { orderId, deliveryAgentId, tenantId } = await req.json();

    console.log('Update payment status request:', { orderId, deliveryAgentId, tenantId });

    // Validate required fields
    if (!orderId || !deliveryAgentId || !tenantId) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing required fields: orderId, deliveryAgentId, and tenantId are required' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Verify delivery agent exists and is active
    const { data: agent, error: agentError } = await supabase
      .from('delivery_agents')
      .select('id, is_active, name')
      .eq('id', deliveryAgentId)
      .eq('tenant_id', tenantId)
      .single();

    if (agentError || !agent) {
      console.error('Delivery agent not found:', agentError);
      return new Response(
        JSON.stringify({ error: 'Delivery agent not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (!agent.is_active) {
      return new Response(
        JSON.stringify({ error: 'Delivery agent is not active' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Verify order exists and is assigned to this agent
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, payment_status, delivery_agent_id, tenant_id')
      .eq('id', orderId)
      .eq('tenant_id', tenantId)
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

    if (order.delivery_agent_id !== deliveryAgentId) {
      return new Response(
        JSON.stringify({ error: 'Order is not assigned to this delivery agent' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Update payment status to paid
    const { data: updatedOrder, error: updateError } = await supabase
      .from('orders')
      .update({ 
        payment_status: 'paid',
        collected_at: new Date().toISOString(),
        collected_amount: order.total_amount
      })
      .eq('id', orderId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating payment status:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update payment status', details: updateError.message }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Payment status updated successfully:', updatedOrder);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Payment status updated to paid',
        order: updatedOrder 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
