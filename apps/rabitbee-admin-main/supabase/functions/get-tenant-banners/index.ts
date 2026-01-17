
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY') || ''
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Parse request payload
    const { tenantId, onlyActive = true } = await req.json()
    
    console.log('Fetching banners for tenant:', tenantId)
    
    if (!tenantId) {
      return new Response(
        JSON.stringify({ error: 'Tenant ID is required' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      )
    }

    // Build the query
    let query = supabase
      .from('banners')
      .select(`
        id, 
        name,
        image_url,
        description,
        secondary_description,
        asset_type,
        is_active,
        display_order,
        screen_id,
        screens:screen_id (name)
      `)
      .eq('tenant_id', tenantId)
      .order('display_order', { ascending: true })
    
    // Apply active filter if required
    if (onlyActive) {
      query = query.eq('is_active', true)
    }
    
    // Execute the query
    const { data, error } = await query
    
    if (error) {
      console.error('Error fetching banners:', error)
      throw error
    }
    
    // Format the response
    const formattedBanners = data.map(banner => ({
      id: banner.id,
      name: banner.name,
      imageUrl: banner.image_url,
      description: banner.description,
      secondaryDescription: banner.secondary_description,
      assetType: banner.asset_type,
      isActive: banner.is_active,
      displayOrder: banner.display_order,
      screenId: banner.screen_id,
      screenName: banner.screens?.name || ''
    }))
    
    console.log(`Found ${formattedBanners.length} banners for tenant ID: ${tenantId}`)
    
    return new Response(
      JSON.stringify(formattedBanners),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})
