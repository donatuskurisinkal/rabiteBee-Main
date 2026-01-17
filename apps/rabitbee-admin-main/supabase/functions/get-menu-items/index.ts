
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
    // Parse request parameters
    const url = new URL(req.url)
    const categoryId = url.searchParams.get('categoryId')
    const restaurantId = url.searchParams.get('restaurantId')
    const cursor = url.searchParams.get('cursor')
    const pageSize = parseInt(url.searchParams.get('pageSize') || '10')
    const sortOrder = url.searchParams.get('sortOrder') || 'asc'
    
    console.log(`[DEBUG] Fetching menu items with params:`, {
      categoryId: categoryId || 'All',
      restaurantId: restaurantId || 'All',
      cursor,
      pageSize,
      sortOrder
    })

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    
    // Start building the query for menu items
    console.log("[DEBUG] Building menu items query")
    let query = supabase
      .from('menu_items')
      .select('*')
      .eq('available', true)

    // Apply restaurant filter if provided
    if (restaurantId && restaurantId !== 'All') {
      console.log(`[DEBUG] Filtering by restaurant: ${restaurantId}`)
      query = query.eq('restaurant_id', restaurantId)
    } else {
      console.log(`[DEBUG] No restaurant filter applied, showing items from all restaurants`)
    }

    // Apply category filter if not "All"
    if (categoryId && categoryId !== 'All') {
      console.log(`[DEBUG] Filtering by category: ${categoryId}`)
      query = query.eq('category_id', categoryId)
    } else {
      console.log(`[DEBUG] No category filter applied, showing all items`)
    }

    // Apply cursor-based pagination
    if (cursor) {
      if (sortOrder === 'asc') {
        console.log(`[DEBUG] Applying ascending pagination with cursor: ${cursor}`)
        query = query.gt('id', cursor)
      } else {
        console.log(`[DEBUG] Applying descending pagination with cursor: ${cursor}`)
        query = query.lt('id', cursor)
      }
    }

    // Set order and limit (fetch one more to determine if there are more results)
    console.log(`[DEBUG] Setting order: ${sortOrder}, limit: ${pageSize + 1}`)
    query = query.order('name', { ascending: sortOrder === 'asc' }).limit(pageSize + 1)

    // Execute the query
    console.log("[DEBUG] Executing menu items query")
    const { data: menuItems, error } = await query
    
    if (error) {
      console.error('[ERROR] Error fetching menu items:', error)
      return new Response(
        JSON.stringify({ error: error.message }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log(`[DEBUG] Retrieved ${menuItems?.length || 0} menu items`)

    // Check if there are more results
    const hasMore = menuItems && menuItems.length > pageSize
    console.log(`[DEBUG] hasMore: ${hasMore}, items.length: ${menuItems?.length}, pageSize: ${pageSize}`);
    
    // Remove the extra item we used to check for more results
    const items = hasMore ? menuItems.slice(0, pageSize) : menuItems

    // For each menu item, fetch its addons if it's customizable
    const itemsWithAddons = await Promise.all((items || []).map(async (item) => {
      let addons = [];
      
      if (item.is_customisable) {
        console.log(`[DEBUG] Fetching addons for item: ${item.id}`)
        const { data: itemAddons, error: addonsError } = await supabase
          .from('item_addons')
          .select('*')
          .eq('menu_item_id', item.id)
        
        if (addonsError) {
          console.error(`[ERROR] Error fetching addons for item ${item.id}:`, addonsError)
        } else {
          addons = itemAddons || []
          console.log(`[DEBUG] Found ${addons.length} addons for item ${item.id}`)
        }
      }
      
      // Format the menu item with addons in the required format
      return {
        id: item.id,
        name: item.name,
        description: item.description,
        subtitle: item.subtitle,
        price: item.price.toString(),
        image: item.image_url,
        categoryId: item.category_id,
        restaurantId: item.restaurant_id,
        tags: item.product_tags || (item.is_popular ? ['POPULAR'] : []).concat(item.is_veg ? ['VEG'] : ['NON-VEG']),
        isVeg: item.is_veg,
        isCustomisable: item.is_customisable,
        isPopular: item.is_popular,
        isSoldOut: item.is_sold_out,
        isAvailable: item.available,
        offerPrice: item.offer_price ? item.offer_price.toString() : undefined,
        discountPercent: item.discount_percent,
        preparationTime: item.preparation_time,
        quantityLabel: item.quantity_label,
        rating: item.rating_value ? {
          value: item.rating_value,
          count: item.rating_count || 0
        } : undefined,
        availabilityWindow: item.availability_window || 'All Day',
        unavailableReason: item.unavailable_reason,
        isCombo: !!item.iscombo,
        comboDescription: Array.isArray(item.combo_description) ? item.combo_description : (item.combo_description ? [item.combo_description] : []),
        customizations: addons.map(addon => ({
          name: addon.name,
          price: addon.price,
          quantity: 1,
          is_mandatory: addon.is_mandatory,
          is_default: addon.is_default
        }))
      }
    }))

    // Build the response
    const response = {
      items: itemsWithAddons,
      pagination: {
        hasMore,
        nextCursor: hasMore && items.length > 0 ? items[items.length - 1].id : null,
      }
    }

    console.log("[DEBUG] Sending successful response")
    return new Response(
      JSON.stringify(response),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  } catch (e) {
    console.error('[ERROR] Unexpected error:', e)
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred', details: e.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
