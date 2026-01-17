
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    let tenantId, screenId, userId;

    // Parse request body for POST method
    if (req.method === 'POST') {
      const requestData = await req.json();
      tenantId = requestData.tenant_id;
      screenId = requestData.screen_id;
      userId = requestData.user_id;
    } else {
      // Fallback to GET method (keeping for backward compatibility)
      const url = new URL(req.url);
      tenantId = url.searchParams.get('tenant_id');
      screenId = url.searchParams.get('screen_id');
      userId = url.searchParams.get('user_id');
    }

    // Validate required parameters
    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'user_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create a Supabase client with the project URL and anon key
    const supabaseUrl = Deno.env.get('SUPABASE_URL') as string;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY') as string;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get current date for date range comparison
    const currentDate = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD

    // First, identify the groups the user belongs to
    const { data: userGroups, error: groupsError } = await supabase
      .from('group_users')
      .select('group_id')
      .eq('user_id', userId);

    if (groupsError) {
      console.error('Error fetching user groups:', groupsError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch user groups', details: groupsError }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract group IDs
    const userGroupIds = userGroups?.map(group => group.group_id) || [];
    console.log('User belongs to groups:', userGroupIds);

    // Main query to get promo codes
    let query = supabase
      .from('promo_codes')
      .select(`
        *,
        promocode_groups(
          group_id,
          groups(id, name)
        )
      `)
      .eq('is_active', true)
      .lte('start_date', currentDate)
      .gte('end_date', currentDate);

    // Apply tenant filter if provided
    if (tenantId) {
      query = query.eq('tenant_id', tenantId);
    }

    // Apply screen filter if provided
    if (screenId) {
      query = query.eq('screen_id', screenId);
    }

    // Execute the query
    const { data: allPromoCodes, error: promoError } = await query;

    if (promoError) {
      console.error('Error fetching promo codes:', promoError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch promo codes', details: promoError }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Retrieved promo codes count:', allPromoCodes?.length || 0);

    // Filter promo codes based on usage limits and group access
    const accessiblePromoCodes = allPromoCodes?.filter(promo => {
      // Check usage limits
      const hasUsageLimit = promo.usage_limit !== null;
      const withinUsageLimit = !hasUsageLimit || promo.used_count < promo.usage_limit;
      
      if (!withinUsageLimit) {
        return false;
      }

      // If the promo code has no group associations, it's public and accessible to everyone
      if (!promo.promocode_groups || promo.promocode_groups.length === 0) {
        return true;
      }

      // Check if the user is a member of any of the groups associated with the promo code
      return promo.promocode_groups.some(pg => 
        userGroupIds.includes(pg.group_id)
      );
    }) || [];

    console.log('Accessible promo codes count:', accessiblePromoCodes.length);

    // Format the response
    const formattedPromoCodes = accessiblePromoCodes.map(promo => ({
      ...promo,
      // Transform the nested groups structure to a simpler format for the client
      groups: promo.promocode_groups?.map(pg => ({
        id: pg.groups?.id,
        name: pg.groups?.name
      })) || []
    }));

    return new Response(
      JSON.stringify({ data: formattedPromoCodes }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
