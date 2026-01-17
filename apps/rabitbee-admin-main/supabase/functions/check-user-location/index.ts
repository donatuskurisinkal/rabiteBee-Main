
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.22.0"

// CORS headers for browser compatibility
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Function to calculate distance between two points using Haversine formula (in kilometers)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  const distance = R * c; // Distance in km
  return distance;
}

function deg2rad(deg: number): number {
  return deg * (Math.PI/180);
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Create a Supabase client with the Admin key
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, { 
      auth: { persistSession: false } 
    });

    // Parse request body
    let body;
    try {
      if (req.body === null) {
        console.error("Request body is null");
        return new Response(
          JSON.stringify({ error: 'Empty request body' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }

      const contentType = req.headers.get('content-type') || '';
      console.log("Content-Type:", contentType);
      
      const raw = await req.text();
      console.log("Raw request body:", raw);
      
      if (!raw || raw.trim() === '') {
        console.error("Empty request body");
        return new Response(
          JSON.stringify({ error: 'Empty request body' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }
      
      try {
        body = JSON.parse(raw);
        console.log("Successfully parsed request body:", body);
      } catch (parseError) {
        console.error("Failed to parse JSON:", parseError);
        return new Response(
          JSON.stringify({ error: 'Invalid JSON format', details: parseError.message }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }
    } catch (err) {
      console.error("Error processing request body:", err);
      return new Response(
        JSON.stringify({ error: 'Failed to process request body', details: err.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Extract user coordinates from request
    const { latitude, longitude, userId } = body;

    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return new Response(
        JSON.stringify({ error: 'Invalid coordinates. Latitude and longitude must be numbers.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log(`Checking location for user coordinates: Lat ${latitude}, Lng ${longitude}`);

    // Fetch all active tenants with their radius information
    const { data: tenants, error: tenantsError } = await supabaseAdmin
      .from('tenants')
      .select('id, name, center_lat, center_lng, radius_km')
      .eq('is_active', true);

    if (tenantsError) {
      console.error("Error fetching tenants:", tenantsError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch tenant data', details: tenantsError.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    console.log(`Found ${tenants.length} active tenants`);

    // Check each tenant to see if the user is within their radius
    let matchingTenant = null;
    for (const tenant of tenants) {
      // Skip tenants with missing location data
      if (tenant.center_lat === null || tenant.center_lng === null || tenant.radius_km === null) {
        console.log(`Tenant ${tenant.name} (${tenant.id}) has incomplete location data. Skipping.`);
        continue;
      }

      const distance = calculateDistance(
        latitude, 
        longitude, 
        tenant.center_lat, 
        tenant.center_lng
      );

      console.log(`Distance to tenant ${tenant.name}: ${distance.toFixed(2)} km (radius: ${tenant.radius_km} km)`);

      if (distance <= tenant.radius_km) {
        matchingTenant = tenant;
        console.log(`User is within radius of tenant: ${tenant.name} (${tenant.id})`);
        break; // Stop at the first matching tenant
      }
    }

    // Update user's tenant_id if we found a matching tenant and userId was provided
    if (matchingTenant && userId) {
      console.log(`Updating user ${userId} with tenant ${matchingTenant.id}`);
      
      const { error: updateError } = await supabaseAdmin
        .from('users')
        .update({ tenant_id: matchingTenant.id })
        .eq('id', userId);

      if (updateError) {
        console.error("Error updating user's tenant:", updateError);
        return new Response(
          JSON.stringify({ 
            error: "Failed to update user's tenant", 
            details: updateError.message,
            matchingTenant 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }
    }

    // Return the result
    return new Response(
      JSON.stringify({ 
        inTenantRadius: !!matchingTenant,
        tenant: matchingTenant,
        userUpdated: matchingTenant && userId ? true : false
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('Error in check-user-location function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Unknown error occurred' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
