
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
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
    // Get tenant ID from request body
    const { tenantId } = await req.json()
    
    if (!tenantId) {
      throw new Error('Tenant ID is required')
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // First get all active categories for the tenant, ordered by display_order
    const { data: categories, error: categoriesError } = await supabaseClient
      .from('categories')
      .select('id, name, display_order, is_active, icon_name, icon_family, color')
      .eq('tenant_id', tenantId)
      .eq('is_active', true)
      .order('display_order', { ascending: true })
      .order('name')

    if (categoriesError) {
      throw categoriesError
    }

    // For each category, get its active subcategories
    const categoriesWithSubs = await Promise.all(
      categories.map(async (category) => {
        const { data: subcategories, error: subError } = await supabaseClient
          .from('subcategories')
          .select('id, name')
          .eq('category_id', category.id)
          .order('name')

        if (subError) {
          console.error(`Error fetching subcategories for category ${category.id}:`, subError)
          return {
            ...category,
            subcategories: []
          }
        }

        return {
          ...category,
          subcategories: subcategories || []
        }
      })
    )

    // Return the structured response
    return new Response(
      JSON.stringify(categoriesWithSubs),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    )

  } catch (error) {
    console.error('Error in get-tenant-categories function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    )
  }
})
