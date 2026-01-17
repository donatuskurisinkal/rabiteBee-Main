
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''

// Distance calculation using Haversine formula
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  return R * c; // Distance in km
}

function deg2rad(deg: number): number {
  return deg * (Math.PI/180);
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log("[DEBUG] Starting get-restaurants function...")
    console.log(`[DEBUG] SUPABASE_URL: ${supabaseUrl ? "Set" : "Not set"}`)
    console.log(`[DEBUG] SUPABASE_ANON_KEY: ${supabaseAnonKey ? "Set" : "Not set"}`)
    
    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    console.log("[DEBUG] Supabase client created")
    
    let tenantId, foodType, keyword, cursor, pageSize, sortOrder, userLat, userLng, tags;
    
    // Check if the method is POST, try to parse the body
    if (req.method === 'POST') {
      try {
        const body = await req.json();
        console.log("[DEBUG] Received POST body:", body);
        tenantId = body.tenantId;
        foodType = body.foodType || 'All';
        keyword = body.keyword || '';
        cursor = body.cursor || null;
        pageSize = parseInt(body.pageSize || '10');
        sortOrder = body.sortOrder || 'desc';
        userLat = body.latitude;
        userLng = body.longitude;
        tags = body.tags || [];
        console.log("[DEBUG] Successfully parsed POST body");
      } catch (error) {
        console.log("[DEBUG] Failed to parse POST body:", error);
        console.log("[DEBUG] Falling back to URL params");
      }
    }
    
    // If data was not set from body, use URL params as fallback
    if (!tenantId) {
      console.log("[DEBUG] TenantId not found in body, checking URL params");
      const url = new URL(req.url);
      tenantId = url.searchParams.get('tenantId');
      foodType = url.searchParams.get('foodType') || 'All';
      keyword = url.searchParams.get('keyword') || '';
      cursor = url.searchParams.get('cursor') || null;
      pageSize = parseInt(url.searchParams.get('pageSize') || '10');
      sortOrder = url.searchParams.get('sortOrder') || 'desc';
      userLat = url.searchParams.get('latitude') ? parseFloat(url.searchParams.get('latitude')!) : undefined;
      userLng = url.searchParams.get('longitude') ? parseFloat(url.searchParams.get('longitude')!) : undefined;
      tags = url.searchParams.get('tags') ? url.searchParams.get('tags')!.split(',') : [];
      console.log("[DEBUG] URL params processed");
    }
    
    console.log(`[DEBUG] Fetching restaurants with params:`, {
      tenantId,
      foodType,
      keyword,
      cursor,
      pageSize,
      sortOrder,
      userLat,
      userLng,
      tags
    })

    if (!tenantId) {
      console.log("[DEBUG] Error: Tenant ID is missing");
      return new Response(
        JSON.stringify({ error: 'Tenant ID is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Start building the query
    console.log("[DEBUG] Starting to build query");
    let query = supabase
      .from('restaurants')
      .select(`
        id,
        name,
        description,
        logo_url,
        cover_image_url,
        address,
        rating,
        rating_count,
        is_open,
        tags,
        food_type,
        isactive,
        opening_time,
        closing_time,
        min_order_value,
        delivery_fee,
        prep_time_mins,
        created_at,
        latitude,
        longitude,
        is_sold_out,
        subtitle,
        availability_window
      `)
      .eq('tenant_id', tenantId)
      .eq('isactive', true)

    console.log("[DEBUG] Base query built with tenant_id:", tenantId);

    // Apply food type filter if not "All"
    if (foodType && foodType !== 'All' && foodType !== 'all') {
      console.log(`[DEBUG] Applying food type filter: ${foodType}`);
      query = query.eq('food_type', foodType)
    } else {
      console.log(`[DEBUG] No food type filter applied. foodType=${foodType}`);
    }

    // Apply keyword search if provided and not empty after trimming
    if (keyword && keyword.trim().length > 0) {
      console.log(`[DEBUG] Applying keyword search: "${keyword.trim()}"`);
      query = query.ilike('name', `%${keyword.trim()}%`)
    } else {
      console.log(`[DEBUG] No keyword search applied. keyword="${keyword}"`);
    }

    // Apply tags filter if provided
    if (tags && tags.length > 0) {
      console.log(`[DEBUG] Applying tags filter:`, tags);
      query = query.overlaps('tags', tags)
    }

    // Apply pagination using keyset pagination
    if (cursor) {
      if (sortOrder === 'asc') {
        console.log(`[DEBUG] Applying ascending pagination with cursor: ${cursor}`);
        query = query.gt('id', cursor)
      } else {
        console.log(`[DEBUG] Applying descending pagination with cursor: ${cursor}`);
        query = query.lt('id', cursor)
      }
    } else {
      console.log(`[DEBUG] No pagination cursor applied`);
    }

    // Set order and limit
    console.log(`[DEBUG] Setting order: ${sortOrder}, limit: ${pageSize + 1}`);
    query = query.order('id', { ascending: sortOrder === 'asc' }).limit(pageSize + 1)

    // Execute the query
    console.log("[DEBUG] Executing query to the database");
    const { data, error } = await query
    
    if (error) {
      console.error('[DEBUG] Error fetching restaurants:', error)
      return new Response(
        JSON.stringify({ error: error.message }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log(`[DEBUG] Retrieved ${data ? data.length : 0} restaurants`);
    
    if (!data || data.length === 0) {
      console.log("[DEBUG] No restaurants found, returning empty array");
      return new Response(
        JSON.stringify({ 
          restaurants: [],
          pagination: {
            hasMore: false,
            nextCursor: null,
          }
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }
    
    // Check if there are more results
    const hasMore = data.length > pageSize
    console.log(`[DEBUG] hasMore: ${hasMore}, data.length: ${data.length}, pageSize: ${pageSize}`);
    
    // Remove the extra item we used to check for more results
    const restaurants = hasMore ? data.slice(0, pageSize) : data
    console.log(`[DEBUG] Final restaurants array length: ${restaurants.length}`);

    // Format the response
    console.log("[DEBUG] Formatting restaurant data");
    const formattedRestaurants = restaurants.map(restaurant => {
      let distance = null;
      
      // Calculate distance if user location is provided and restaurant has coordinates
      if (userLat && userLng && restaurant.latitude && restaurant.longitude) {
        distance = calculateDistance(userLat, userLng, restaurant.latitude, restaurant.longitude);
        distance = Math.round(distance * 10) / 10; // Round to 1 decimal place
      }
      
      return {
        id: restaurant.id,
        name: restaurant.name,
        description: restaurant.description,
        logo_url: restaurant.logo_url,
        rating: restaurant.rating,
        rating_count: restaurant.rating_count,
        isOpen: restaurant.is_open,
        tags: restaurant.tags,
        address: restaurant.address,
        food_type: restaurant.food_type,
        isActive: restaurant.isactive,
        opening_time: restaurant.opening_time,
        closing_time: restaurant.closing_time,
        min_order_value: restaurant.min_order_value,
        delivery_fee: restaurant.delivery_fee,
        prep_time_mins: restaurant.prep_time_mins,
        created_at: restaurant.created_at,
        latitude: restaurant.latitude,
        longitude: restaurant.longitude,
        is_sold_out: restaurant.is_sold_out,
        subtitle: restaurant.subtitle,
        availability_window: restaurant.availability_window,
        distance: distance // Distance in km
      }
    })

    // Build the response
    const response = {
      restaurants: formattedRestaurants,
      pagination: {
        hasMore,
        nextCursor: hasMore ? restaurants[restaurants.length - 1].id : null,
      }
    }

    console.log("[DEBUG] Sending successful response");
    return new Response(
      JSON.stringify(response),
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
