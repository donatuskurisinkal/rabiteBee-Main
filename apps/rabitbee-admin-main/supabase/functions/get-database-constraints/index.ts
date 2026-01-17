
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.22.0"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Create a Supabase client with the Admin key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    const body = await req.json();
    const { table_name } = body;

    if (!table_name) {
      return new Response(
        JSON.stringify({ error: 'Missing table_name parameter' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Query to get table constraints including check constraints
    const { data: checkConstraints, error: checkError } = await supabaseAdmin.rpc(
      'get_table_constraints',
      { table_name }
    );

    if (checkError) {
      console.error('Error fetching constraints:', checkError);
      // Try an alternative approach using information_schema if the RPC call fails
      const { data: altConstraints, error: altError } = await supabaseAdmin
        .from('information_schema.table_constraints')
        .select('constraint_name, constraint_type')
        .eq('table_name', table_name)
        .eq('table_schema', 'public');

      if (altError) {
        return new Response(
          JSON.stringify({ error: `Failed to fetch constraints: ${altError.message}` }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }
      
      console.log('Alternative constraints info:', altConstraints);
    }

    // Also get table columns
    const { data: columnData, error: columnError } = await supabaseAdmin
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_name', table_name);

    if (columnError) {
      console.error('Error fetching columns:', columnError);
      return new Response(
        JSON.stringify({ error: `Failed to fetch columns: ${columnError.message}` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Get foreign keys using pg_get_constraintdef
    const { data: foreignKeys, error: fkError } = await supabaseAdmin.rpc('get_foreign_keys', {
      p_table_name: table_name
    });

    if (fkError && fkError.message !== 'function get_foreign_keys(p_table_name) does not exist') {
      console.error('Error fetching foreign keys:', fkError);
      
      // Try alternate method
      const { data: altFKs, error: altFKError } = await supabaseAdmin
        .from('information_schema.key_column_usage')
        .select('constraint_name, column_name, referenced_table_name, referenced_column_name')
        .eq('table_name', table_name)
        .eq('table_schema', 'public');
        
      if (altFKError) {
        console.error('Error fetching foreign keys (alternate method):', altFKError);
      } else {
        console.log('Alternative foreign keys info:', altFKs);
      }
    }
    
    // Try to get any check constraints directly through SQL
    const { data: directCheckConstraints, error: directCheckError } = await supabaseAdmin.rpc(
      'get_check_constraints', 
      { table_name_param: table_name }
    );
    
    if (directCheckError && directCheckError.message !== 'function get_check_constraints(table_name_param) does not exist') {
      console.error('Error fetching direct check constraints:', directCheckError);
    } else if (directCheckConstraints) {
      console.log('Direct check constraints:', directCheckConstraints);
    }

    return new Response(
      JSON.stringify({
        constraints: checkConstraints || [],
        columns: columnData || [],
        foreign_keys: foreignKeys || [],
        direct_checks: directCheckConstraints || []
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('Error in get-database-constraints function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Unknown error',
        details: error.toString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
})
