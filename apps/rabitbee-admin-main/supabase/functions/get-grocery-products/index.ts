import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import { corsHeaders } from "../_shared/cors.ts"

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    // Parse request parameters from POST body
    const { tenantId, page = 1, pageSize = 10, categoryId, search = '' } = await req.json();

    console.log("Request params:", { page, pageSize, categoryId, search, tenantId });

    if (!tenantId) {
      return new Response(
        JSON.stringify({ error: 'Tenant ID is required' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const offset = (page - 1) * pageSize;

    let query = supabase
      .from('products')
      .select(`
        id,
        name,
        name_ml,
        category:category_id (
          id,
          name
        ),
        provider:provider_id (
          id,
          name
        ),
        price,
        offer_price,
        unit:unit_id (
          name,
          abbreviation
        ),
        stock_quantity,
        quantity,
        discount_percent,
        tags,
        is_active,
        coming_soon,
        is_popular,
        is_flash,
        image_url,
        is_combo,
        product_combos!product_combos_combo_product_id_fkey (
          quantity,
          unit:unit_id (
            name,
            abbreviation
          ),
          item:item_product_id (
            name,
            name_ml
          )
        )
      `)
      .eq('is_active', true)
      .eq('tenant_id', tenantId)

    if (categoryId && categoryId !== 'All') {
      query = query.eq('category_id', categoryId)
    }

    if (search && search.trim() !== '') {
      query = query.or(`name.ilike.%${search}%,name_ml.ilike.%${search}%`)
    }

    // Get total count
    console.log("Getting product count for tenant:", tenantId)
    let countQuery = supabase
      .from('products')
      .select('id', { count: 'exact' })
      .eq('is_active', true)
      .eq('tenant_id', tenantId)
    
    if (categoryId && categoryId !== 'All') {
      countQuery = countQuery.eq('category_id', categoryId)
    }
    
    let totalCount = 0;
    
    if (search && search.trim() !== '') {
      const [result1, result2] = await Promise.all([
        supabase
          .from('products')
          .select('id', { count: 'exact' })
          .eq('is_active', true)
          .eq('tenant_id', tenantId)
          .ilike('name', `%${search}%`),
        supabase
          .from('products')
          .select('id', { count: 'exact' })
          .eq('is_active', true)
          .eq('tenant_id', tenantId)
          .ilike('name_ml', `%${search}%`)
      ])
      
      if (result1.error || result2.error) {
        console.error('Error in search count queries:', result1.error || result2.error)
        const { count, error } = await countQuery
        totalCount = error ? 0 : count || 0
      } else {
        const idsSet = new Set()
        result1.data?.forEach(item => idsSet.add(item.id))
        result2.data?.forEach(item => idsSet.add(item.id))
        totalCount = idsSet.size
      }
    } else {
      const { count, error } = await countQuery
      if (error) {
        console.error('Error getting count:', error)
        totalCount = 0
      } else {
        totalCount = count || 0
      }
    }
    
    console.log("Total product count:", totalCount)

    query = query
      .range(offset, offset + pageSize - 1)
      .order('created_at', { ascending: false })

    const { data: products, error } = await query

    if (error) {
      console.error('Error fetching products:', error)
      return new Response(
        JSON.stringify({ error: 'Error fetching products' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Transform the data
    const transformedProducts = products.map(product => ({
      id: product.id,
      name: product.name,
      ml_name: product.name_ml,
      category: product.category?.name,
      provider: product.provider?.name,
      price: product.price,
      offer_price: product.offer_price,
      unit: `${product.unit?.name}`,
      stock_quantity: product.stock_quantity,
      quantity: product.quantity,
      discount: product.discount_percent,
      tags: product.tags || [],
      is_active: product.is_active,
      is_coming_soon: product.coming_soon,
      is_popular: product.is_popular,
      is_flash_deal: product.is_flash,
      image_url: product.image_url,
      combo: product.is_combo ? {
        is_combo: true,
        items: product.product_combos?.map(combo => ({
          product_name: combo.item?.name,
          quantity: combo.quantity,
          unit: combo.unit?.abbreviation
        })) || []
      } : null
    }))

    return new Response(
      JSON.stringify({
        data: transformedProducts,
        pagination: {
          currentPage: page,
          pageSize,
          totalItems: totalCount,
          totalPages: Math.ceil(totalCount / pageSize)
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (err) {
    console.error('Server error:', err)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
