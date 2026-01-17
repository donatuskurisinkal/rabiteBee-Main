
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log("[DEBUG] Starting admin-dashboard-stats function...")
    console.log(`[DEBUG] SUPABASE_URL: ${supabaseUrl ? "Set" : "Not set"}`)
    console.log(`[DEBUG] SUPABASE_ANON_KEY: ${supabaseAnonKey ? "Set" : "Not set"}`)
    
    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    console.log("[DEBUG] Supabase client created")
    
    // Parse request
    const body = req.method === 'POST' ? await req.json() : null
    const url = new URL(req.url)
    const tenantId = body?.tenantId || url.searchParams.get('tenantId')
    
    console.log(`[DEBUG] Request received with tenantId: ${tenantId}`)
    
    if (!tenantId) {
      console.log("[DEBUG] Error: Tenant ID is missing")
      return new Response(
        JSON.stringify({ error: 'Tenant ID is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Get counts for key entities
    console.log("[DEBUG] Fetching entity counts for dashboard...")
    
    // Get users count
    const { count: usersCount, error: usersError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
    
    if (usersError) {
      console.log("[DEBUG] Error fetching users:", usersError)
    } else {
      console.log(`[DEBUG] Users count: ${usersCount}`)
    }
    
    // Get restaurants count
    const { count: restaurantsCount, error: restaurantsError } = await supabase
      .from('restaurants')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('isactive', true)
    
    if (restaurantsError) {
      console.log("[DEBUG] Error fetching restaurants:", restaurantsError)
    } else {
      console.log(`[DEBUG] Active restaurants count: ${restaurantsCount}`)
    }
    
    // Get orders count (if you have an orders table)
    const { count: ordersCount, error: ordersError } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('tenantId', tenantId)
    
    if (ordersError) {
      console.log("[DEBUG] Error fetching orders:", ordersError)
    } else {
      console.log(`[DEBUG] Orders count: ${ordersCount}`)
    }

    // Build response object
    const stats = {
      users: usersCount || 0,
      restaurants: restaurantsCount || 0,
      orders: ordersCount || 0,
      generated_at: new Date().toISOString()
    }
    
    console.log("[DEBUG] Dashboard stats generated:", stats)
    
    return new Response(
      JSON.stringify(stats),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  } catch (e) {
    console.error('[DEBUG] Unexpected error:', e)
    console.error('[DEBUG] Error stack:', e.stack)
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred', details: e.message, stack: e.stack }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
