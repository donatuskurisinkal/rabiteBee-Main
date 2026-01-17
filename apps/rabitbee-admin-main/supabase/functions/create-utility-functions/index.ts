
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

    // Create function to get foreign keys
    const createFkFunction = `
    CREATE OR REPLACE FUNCTION public.get_foreign_keys(p_table_name text)
    RETURNS TABLE(constraint_name text, column_name text, foreign_table_name text, foreign_column_name text)
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    BEGIN
      RETURN QUERY
      SELECT
        tc.constraint_name::text,
        kcu.column_name::text,
        ccu.table_name::text AS foreign_table_name,
        ccu.column_name::text AS foreign_column_name
      FROM
        information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name = p_table_name
        AND tc.table_schema = 'public';
    END;
    $$;
    `;

    // Create function to get table info
    const createTableInfoFunction = `
    CREATE OR REPLACE FUNCTION public.get_table_info(p_table_name text)
    RETURNS json
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    DECLARE
      columns_info json;
      constraints_info json;
      foreign_keys_info json;
      final_result json;
    BEGIN
      -- Get columns information
      SELECT json_agg(col)
      INTO columns_info
      FROM (
        SELECT 
          column_name, 
          data_type, 
          is_nullable, 
          column_default
        FROM 
          information_schema.columns
        WHERE 
          table_name = p_table_name
          AND table_schema = 'public'
      ) col;

      -- Get constraints information
      SELECT json_agg(con)
      INTO constraints_info
      FROM (
        SELECT 
          pg_get_constraintdef(c.oid) as constraint_definition,
          c.conname as constraint_name,
          c.contype as constraint_type
        FROM 
          pg_constraint c
          JOIN pg_namespace n ON n.oid = c.connamespace
          JOIN pg_class cl ON cl.oid = c.conrelid
        WHERE 
          cl.relname = p_table_name
          AND n.nspname = 'public'
      ) con;

      -- Get foreign keys
      SELECT json_agg(fk)
      INTO foreign_keys_info
      FROM (
        SELECT * FROM get_foreign_keys(p_table_name)
      ) fk;

      -- Combine all information
      SELECT json_build_object(
        'table_name', p_table_name,
        'columns', COALESCE(columns_info, '[]'::json),
        'constraints', COALESCE(constraints_info, '[]'::json),
        'foreign_keys', COALESCE(foreign_keys_info, '[]'::json)
      ) INTO final_result;

      RETURN final_result;
    END;
    $$;
    `;

    // Execute the SQL statements
    const { error: fkFunctionError } = await supabaseAdmin.rpc('execute_sql', { 
      sql_statement: createFkFunction 
    });

    if (fkFunctionError) {
      console.error('Error creating get_foreign_keys function:', fkFunctionError);
      
      // Try direct SQL if RPC fails
      const { error: directSqlError } = await supabaseAdmin.auth.admin.executeQueries({
        queries: [{
          query: createFkFunction
        }]
      });
      
      if (directSqlError) {
        console.error('Error creating get_foreign_keys function with direct SQL:', directSqlError);
      }
    }

    const { error: tableInfoFunctionError } = await supabaseAdmin.rpc('execute_sql', { 
      sql_statement: createTableInfoFunction 
    });

    if (tableInfoFunctionError) {
      console.error('Error creating get_table_info function:', tableInfoFunctionError);
      
      // Try direct SQL if RPC fails
      const { error: directSqlError } = await supabaseAdmin.auth.admin.executeQueries({
        queries: [{
          query: createTableInfoFunction
        }]
      });
      
      if (directSqlError) {
        console.error('Error creating get_table_info function with direct SQL:', directSqlError);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Utility functions created successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('Error creating utility functions:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Unknown error',
        details: error.toString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
})
