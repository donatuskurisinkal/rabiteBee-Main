
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4'
import { corsHeaders } from '../_shared/cors.ts'

interface UpdateCartItemPayload {
  id: string;
  quantity?: number;
  notes?: string;
  selected_addons?: any[];
  delete?: boolean;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create a Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Get the JWT from the request header
    const authHeader = req.headers.get('Authorization') || '';
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract the token
    const token = authHeader.substring('Bearer '.length);
    
    // Get the user from the token
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      console.error('Auth error:', userError);
      return new Response(
        JSON.stringify({ error: 'Authentication failed', details: userError?.message }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse the request body
    const payload: UpdateCartItemPayload = await req.json();
    console.log('Received update payload:', payload);

    // Validate the payload
    if (!payload || !payload.id) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields', details: 'Cart item ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle delete operation
    if (payload.delete === true) {
      const { data: deletedItem, error: deleteError } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', payload.id)
        .eq('user_id', user.id)
        .select();

      if (deleteError) {
        console.error('Error deleting cart item:', deleteError);
        return new Response(
          JSON.stringify({ error: 'Failed to delete cart item', details: deleteError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (!deletedItem || deletedItem.length === 0) {
        return new Response(
          JSON.stringify({ error: 'Cart item not found or you do not have permission to delete it' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Cart item deleted successfully',
          data: deletedItem 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Prepare update object with only the fields that are provided
    const updateData: any = {};
    
    if (payload.quantity !== undefined) {
      updateData.quantity = payload.quantity;
    }
    
    if (payload.notes !== undefined) {
      updateData.notes = payload.notes;
    }
    
    if (payload.selected_addons !== undefined) {
      updateData.selected_addons = payload.selected_addons;
    }
    
    // Update the cart item
    const { data: updatedItem, error: updateError } = await supabase
      .from('cart_items')
      .update(updateData)
      .eq('id', payload.id)
      .eq('user_id', user.id) // Ensure the user can only update their own cart items
      .select();

    if (updateError) {
      console.error('Error updating cart item:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update cart item', details: updateError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!updatedItem || updatedItem.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Cart item not found or you do not have permission to update it' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Cart item updated successfully',
        data: updatedItem 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unhandled error:', error);
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
