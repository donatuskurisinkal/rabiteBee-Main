import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { corsHeaders } from '../_shared/cors.ts';

interface SearchRequest {
  keyword: string;
  tenantId: string;
  pageSize?: number;
  dishesCursor?: string;
  restaurantsCursor?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const body = await req.json();
    console.log('Received search request:', body);

    const { keyword, tenantId, pageSize = 10, dishesCursor, restaurantsCursor }: SearchRequest = body;

    if (!tenantId) {
      console.error('Missing tenantId');
      return new Response(
        JSON.stringify({ error: 'Missing required field: tenantId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!keyword || keyword.trim() === '') {
      console.error('Missing or empty keyword');
      return new Response(
        JSON.stringify({ error: 'Missing required field: keyword' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const searchPattern = `%${keyword}%`;
    const limit = pageSize + 1; // Fetch one extra to check if there's more

    // Search menu items with restaurant details
    let dishesQuery = supabaseClient
      .from('menu_items')
      .select(`
        id,
        name,
        price,
        rating_value,
        rating_count,
        preparation_time,
        image_url,
        product_tags,
        subtitle,
        restaurant_id,
        restaurants!inner (
          id,
          name,
          tenant_id
        )
      `)
      .eq('restaurants.tenant_id', tenantId)
      .eq('available', true)
      .or(`name.ilike.${searchPattern},subtitle.ilike.${searchPattern},product_tags.cs.{${keyword}}`)
      .order('name', { ascending: true })
      .limit(limit);

    if (dishesCursor) {
      dishesQuery = dishesQuery.gt('name', dishesCursor);
    }

    const { data: menuItems, error: menuError } = await dishesQuery;

    if (menuError) {
      console.error('Menu items search error:', menuError);
      return new Response(
        JSON.stringify({ error: 'Failed to search menu items', details: menuError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Search restaurants
    let restaurantsQuery = supabaseClient
      .from('restaurants')
      .select('id, name, rating, logo_url, subtitle, is_open')
      .eq('tenant_id', tenantId)
      .eq('isactive', true)
      .ilike('name', searchPattern)
      .order('name', { ascending: true })
      .limit(limit);

    if (restaurantsCursor) {
      restaurantsQuery = restaurantsQuery.gt('name', restaurantsCursor);
    }

    const { data: restaurantData, error: restaurantError } = await restaurantsQuery;

    if (restaurantError) {
      console.error('Restaurants search error:', restaurantError);
      return new Response(
        JSON.stringify({ error: 'Failed to search restaurants', details: restaurantError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check for more results and format dishes
    const hasMoreDishes = (menuItems || []).length > pageSize;
    const dishesResults = hasMoreDishes ? (menuItems || []).slice(0, pageSize) : (menuItems || []);
    
    const dishes = dishesResults.map((item: any) => ({
      id: item.id,
      name: item.name,
      restaurant: item.restaurants?.name || '',
      rating: item.rating_value,
      rating_count: item.rating_count,
      price: item.price,
      time: item.preparation_time ? `${item.preparation_time} mins` : null,
      image_url: item.image_url,
      tags: item.product_tags || []
    }));

    // Check for more results and format restaurants
    const hasMoreRestaurants = (restaurantData || []).length > pageSize;
    const restaurantsResults = hasMoreRestaurants ? (restaurantData || []).slice(0, pageSize) : (restaurantData || []);
    
    const restaurants = restaurantsResults.map((restaurant: any) => ({
      id: restaurant.id,
      name: restaurant.name,
      rating: restaurant.rating,
      image_url: restaurant.logo_url,
      subtitle: restaurant.subtitle,
      is_open: restaurant.is_open
    }));

    return new Response(
      JSON.stringify({
        success: true,
        dishes,
        restaurants,
        pagination: {
          dishes: {
            hasMore: hasMoreDishes,
            nextCursor: hasMoreDishes && dishesResults.length > 0 
              ? dishesResults[dishesResults.length - 1].name 
              : null
          },
          restaurants: {
            hasMore: hasMoreRestaurants,
            nextCursor: hasMoreRestaurants && restaurantsResults.length > 0 
              ? restaurantsResults[restaurantsResults.length - 1].name 
              : null
          }
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Search error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
