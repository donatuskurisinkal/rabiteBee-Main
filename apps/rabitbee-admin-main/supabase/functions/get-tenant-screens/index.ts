
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get tenant ID from request body
    const { tenantId } = await req.json()

    if (!tenantId) {
      throw new Error('Tenant ID is required')
    }

    console.log('Fetching screens for tenant:', tenantId)

    // Query screens for the specified tenant
    const { data: screens, error } = await supabaseClient
      .from('screens')
      .select('id, name, display_order, is_maintenance_mode, is_active')
      .eq('tenant_id', tenantId)
      .order('display_order', { ascending: true })
      .order('name')

    if (error) {
      throw error
    }

    console.log('Found screens:', screens?.length || 0)

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: screens 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Error:', error.message)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})
