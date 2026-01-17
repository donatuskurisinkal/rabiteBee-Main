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

    console.log('Fetching delivery agent metadata for:', { userId, tenantId })

    if (!userId || !tenantId) {
      return new Response(
        JSON.stringify({ error: 'userId and tenantId are required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Query delivery_agents table
    const { data, error } = await supabaseClient
      .from('delivery_agents')
      .select(`
        name,
        rating,
        is_online,
        pending_orders,
        scheduled_orders,
        today_earnings
      `)
      .eq('user_id', userId)
      .eq('tenant_id', tenantId)
      .single()

    if (error) {
      console.error('Database error:', error)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch delivery agent data' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    if (!data) {
      return new Response(
        JSON.stringify({ error: 'Delivery agent not found' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    console.log('Successfully fetched delivery agent metadata:', data)

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          name: data.name,
          rating: data.rating || 0,
          is_online: data.is_online,
          pending_orders: data.pending_orders || 0,
          scheduled_orders: data.scheduled_orders || 0,
          today_earnings: data.today_earnings || 0,
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('Error in get-delivery-agent-metadata function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})