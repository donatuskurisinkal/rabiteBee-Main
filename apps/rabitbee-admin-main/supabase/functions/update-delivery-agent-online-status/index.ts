
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

    const { userId, tenantId } = await req.json()

    console.log('Updating online status for delivery agent:', { userId, tenantId })

    if (!userId || !tenantId) {
      return new Response(
        JSON.stringify({ error: 'userId and tenantId are required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // First, get the current status
    const { data: currentAgent, error: fetchError } = await supabaseClient
      .from('delivery_agents')
      .select('is_online')
      .eq('user_id', userId)
      .eq('tenant_id', tenantId)
      .single()

    if (fetchError) {
      console.error('Error fetching current status:', fetchError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch current status' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    if (!currentAgent) {
      return new Response(
        JSON.stringify({ error: 'Delivery agent not found' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Toggle the status
    const newStatus = !currentAgent.is_online

    // Update the status
    const { data, error } = await supabaseClient
      .from('delivery_agents')
      .update({ is_online: newStatus })
      .eq('user_id', userId)
      .eq('tenant_id', tenantId)
      .select('is_online')
      .single()

    if (error) {
      console.error('Database error:', error)
      return new Response(
        JSON.stringify({ error: 'Failed to update online status' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    console.log('Successfully updated online status:', { userId, tenantId, newStatus })

    return new Response(
      JSON.stringify({
        success: true,
        is_online: data.is_online,
        message: `Status updated to ${data.is_online ? 'online' : 'offline'}`
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('Error in update-delivery-agent-online-status function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
