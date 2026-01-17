
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.24.0'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Get restaurant ID from request
    const url = new URL(req.url)
    const restaurantId = url.searchParams.get('restaurantId')
    
    if (!restaurantId) {
      return new Response(
        JSON.stringify({ error: 'Restaurant ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    
    // First, log all categories for debugging regardless of is_active status
    console.log(`Searching for categories with restaurant_id: ${restaurantId}`)
    
    // Get all categories for this restaurant to debug
    const { data: allCategories, error: allCategoriesError } = await supabase
      .from('restaurant_categories')
      .select('*')
      .eq('restaurant_id', restaurantId)
    
    if (allCategoriesError) {
      console.error('Error fetching all categories:', allCategoriesError)
    } else {
      console.log(`Total categories found (including inactive): ${allCategories?.length || 0}`)
      
      // Log category details for debugging
      allCategories?.forEach(category => {
        console.log(`Category ID: ${category.id}, Name: ${category.name}, Active: ${category.is_active}, Display Order: ${category.display_order}`)
      })
    }
    
    // Now get only active categories
    const { data, error } = await supabase
      .from('restaurant_categories')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .eq('is_active', true)
      .order('display_order', { ascending: true })
    
    if (error) {
      console.error('Error fetching active categories:', error)
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    // Log success and return categories
    console.log(`Found ${data?.length || 0} active categories for restaurant ${restaurantId}`)
    
    return new Response(
      JSON.stringify({ categories: data || [] }),
      { 
        status: 200, 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    )
    
  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
