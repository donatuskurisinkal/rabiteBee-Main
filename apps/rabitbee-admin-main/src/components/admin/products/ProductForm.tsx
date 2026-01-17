
import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Plus, Trash, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Switch } from "@/components/ui/switch";
import { useTenant } from "@/hooks/use-tenant";
import { ensureStorageBucket } from "@/utils/storageHelpers";

interface ProductFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  product?: any;
}

const productSchema = z.object({
  name: z.string().min(1, "Name is required"),
  name_ml: z.string().optional(),
  price: z.coerce.number().min(0, "Price must be a positive number"),
  offer_price: z.coerce.number().min(0, "Offer price must be a positive number").nullable().optional(),
  stock_quantity: z.coerce.number().int().min(0, "Stock must be a positive integer"),
  discount_percent: z.coerce.number().min(0).max(100, "Discount must be between 0 and 100"),
  category_id: z.string().min(1, "Category is required"),
  provider_id: z.string().min(1, "Provider is required"),
  unit_id: z.string().min(1, "Unit is required"),
  quantity: z.coerce.number().int().min(1, "Quantity must be at least 1"),
  is_combo: z.boolean().default(false),
  is_active: z.boolean().default(true),
  is_popular: z.boolean().default(false),
  is_flash: z.boolean().default(false),
  coming_soon: z.boolean().default(false),
  available_start_time: z.string(),
  available_end_time: z.string(),
  image: z.instanceof(File).optional(),
  tags: z.array(z.string()).default([]),
});

type ProductFormValues = z.infer<typeof productSchema>;

const ProductForm = ({ isOpen, onClose, onSuccess, product }: ProductFormProps) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedComboProducts, setSelectedComboProducts] = useState<Array<{ id: string; name: string; quantity: number; unit_id: string }>>([]);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [availableProducts, setAvailableProducts] = useState<any[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const { selectedTenant } = useTenant();

  // Initialize storage bucket when component mounts
  useEffect(() => {
    const initBucket = async () => {
      try {
        await ensureStorageBucket("products");
        console.log("Products bucket initialized successfully");
      } catch (error) {
        console.error("Failed to initialize products bucket:", error);
      }
    };
    
    initBucket();
  }, []);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      name_ml: "",
      price: 0,
      offer_price: null,
      stock_quantity: 0,
      discount_percent: 0,
      category_id: "",
      provider_id: "",
      unit_id: "",
      quantity: 1,
      is_combo: false,
      is_active: true,
      is_popular: false,
      is_flash: false,
      coming_soon: false,
      available_start_time: "00:00:00",
      available_end_time: "23:59:59",
      tags: [],
    },
  });

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("is_active", true)
        .order("name", { ascending: true });
      
      if (error) {
        toast({
          variant: "destructive",
          title: "Error fetching categories",
          description: error.message,
        });
        throw error;
      }

      return data || [];
    },
  });

  const { data: providers } = useQuery({
    queryKey: ["service-providers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_providers")
        .select("*")
        .eq("is_active", true)
        .order("name", { ascending: true });
      
      if (error) {
        toast({
          variant: "destructive",
          title: "Error fetching service providers",
          description: error.message,
        });
        throw error;
      }

      return data || [];
    },
  });

  const { data: units } = useQuery({
    queryKey: ["units"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("units")
        .select("*")
        .order("name", { ascending: true });
      
      if (error) {
        toast({
          variant: "destructive",
          title: "Error fetching units",
          description: error.message,
        });
        throw error;
      }

      return data || [];
    },
  });

  const { data: allProducts } = useQuery({
    queryKey: ["all_products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name")
        .eq("is_active", true)
        .eq("is_combo", false)
        .order("name", { ascending: true });
      
      if (error) {
        toast({
          variant: "destructive",
          title: "Error fetching products",
          description: error.message,
        });
        throw error;
      }

      return data || [];
    }
  });

  useEffect(() => {
    if (product?.id && product.is_combo) {
      const fetchComboItems = async () => {
        const { data, error } = await supabase
          .from("product_combos")
          .select(`
            item_product_id,
            quantity,
            items:item_product_id(id, name)
          `)
          .eq("combo_product_id", product.id);
          
        if (error) {
          toast({
            variant: "destructive",
            title: "Error fetching combo items",
            description: error.message,
          });
          return;
        }

        if (data && data.length > 0) {
          const comboItems = data.map((item: any) => ({
            id: item.item_product_id,
            name: item.items?.name || "Unknown",
            quantity: item.quantity,
            unit_id: null
          }));
          setSelectedComboProducts(comboItems);
        }
      };

      fetchComboItems();
    }
  }, [product, toast]);

  // Fix for tags not showing in UI when editing
  useEffect(() => {
    if (product?.id) {
      console.log("Product data for tags:", product);
      let tagArray: string[] = [];
      
      if (product.tags) {
        // Handle different tag formats that might come from the API
        if (Array.isArray(product.tags)) {
          // If tags is already an array of strings
          tagArray = product.tags.filter(tag => typeof tag === 'string');
        }
      }
      
      console.log("Setting selected tags:", tagArray);
      setSelectedTags(tagArray);
      form.setValue('tags', tagArray);
    }
  }, [product, form]);

  useEffect(() => {
    if (product) {
      form.reset({
        name: product.name || "",
        name_ml: product.name_ml || "",
        price: product.price || 0,
        offer_price: product.offer_price || null,
        stock_quantity: product.stock_quantity || 0,
        discount_percent: product.discount_percent || 0,
        category_id: product.category_id || "",
        provider_id: product.provider_id || "",
        unit_id: product.unit_id || "",
        quantity: product.quantity || 1,
        is_combo: product.is_combo || false,
        is_active: product.is_active || false,
        is_popular: product.is_popular || false,
        is_flash: product.is_flash || false,
        coming_soon: product.coming_soon || false,
        available_start_time: product.available_start_time || "00:00:00",
        available_end_time: product.available_end_time || "23:59:59",
        tags: [], // This will be set in the other useEffect specifically for tags
      });

      if (product.image_url) {
        setImagePreview(product.image_url);
      }
    }
  }, [product, form]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    form.setValue('image', file);

    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const addComboProduct = (productId: string) => {
    const productToAdd = allProducts?.find(p => p.id === productId);
    if (productToAdd) {
      setSelectedComboProducts([
        ...selectedComboProducts,
        { 
          id: productToAdd.id, 
          name: productToAdd.name, 
          quantity: 1,
          unit_id: null
        }
      ]);
    }
  };

  const removeComboProduct = (productId: string) => {
    setSelectedComboProducts(selectedComboProducts.filter(p => p.id !== productId));
  };

  const updateComboProductQuantity = (productId: string, quantity: number) => {
    setSelectedComboProducts(selectedComboProducts.map(p => 
      p.id === productId ? { ...p, quantity } : p
    ));
  };

  const updateComboProductUnit = (productId: string, unit_id: string) => {
    setSelectedComboProducts(selectedComboProducts.map(p => 
      p.id === productId ? { ...p, unit_id } : p
    ));
  };

  const handleAddTag = () => {
    if (tagInput.trim() !== '') {
      const newTag = tagInput.trim();
      if (!selectedTags.includes(newTag)) {
        const updatedTags = [...selectedTags, newTag];
        setSelectedTags(updatedTags);
        form.setValue('tags', updatedTags);
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const updatedTags = selectedTags.filter(tag => tag !== tagToRemove);
    setSelectedTags(updatedTags);
    form.setValue('tags', updatedTags);
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const onSubmit = async (values: ProductFormValues) => {
    console.log("Submitting form with values:", values);
    console.log("Tags being submitted:", values.tags);
    setIsSubmitting(true);
    try {
      let imageUrl = product?.image_url || null;
      let productId = product?.id || undefined;
      
      if (product) {
        console.log("Updating product with tags:", values.tags);
        const { error } = await supabase
          .from("products")
          .update({
            name: values.name,
            name_ml: values.name_ml || null,
            price: values.price,
            offer_price: values.offer_price,
            stock_quantity: values.stock_quantity,
            discount_percent: values.discount_percent,
            category_id: values.category_id,
            provider_id: values.provider_id,
            unit_id: values.unit_id,
            is_combo: values.is_combo,
            is_active: values.is_active,
            is_popular: values.is_popular,
            is_flash: values.is_flash,
            coming_soon: values.coming_soon,
            available_start_time: values.available_start_time,
            available_end_time: values.available_end_time,
            tags: values.tags,
            tenant_id: selectedTenant?.id,
            updated_at: new Date().toISOString(),
          })
          .eq("id", product.id);

        if (error) throw error;
        productId = product.id;
      } else {
        console.log("Creating new product with tags:", values.tags);
        const { data, error } = await supabase
          .from("products")
          .insert([{
            name: values.name,
            name_ml: values.name_ml || null,
            price: values.price,
            offer_price: values.offer_price,
            stock_quantity: values.stock_quantity,
            discount_percent: values.discount_percent,
            category_id: values.category_id,
            provider_id: values.provider_id,
            unit_id: values.unit_id,
            is_combo: values.is_combo,
            is_active: values.is_active,
            is_popular: values.is_popular,
            is_flash: values.is_flash,
            coming_soon: values.coming_soon,
            available_start_time: values.available_start_time,
            available_end_time: values.available_end_time,
            tags: values.tags,
            tenant_id: selectedTenant?.id,
          }])
          .select();

        if (error) throw error;
        productId = data[0].id;
      }

      if (values.image) {
        await ensureStorageBucket("products");
        
        const imagePath = `products/${productId}/main.jpg`;
        
        const { error: uploadError } = await supabase.storage
          .from('products')
          .upload(imagePath, values.image, {
            upsert: true,
            contentType: values.image.type
          });
          
        if (uploadError) throw uploadError;
        
        const { data: urlData } = supabase.storage
          .from('products')
          .getPublicUrl(imagePath);
          
        imageUrl = urlData.publicUrl;
        
        const { error: updateError } = await supabase
          .from("products")
          .update({ image_url: imageUrl })
          .eq("id", productId);
          
        if (updateError) throw updateError;
      }
      
      if (values.is_combo) {
        if (product) {
          await supabase
            .from("product_combos")
            .delete()
            .eq("combo_product_id", productId);
        }
        
        if (selectedComboProducts.length > 0) {
          const comboItems = selectedComboProducts.map(comboProduct => ({
            combo_product_id: productId,
            item_product_id: comboProduct.id,
            quantity: comboProduct.quantity,
            unit_id: comboProduct.unit_id
          }));
          
          const { error: comboError } = await supabase
            .from("product_combos")
            .insert(comboItems);
            
          if (comboError) throw comboError;
        }
      }
      
      toast({
        title: `Product ${product ? 'Updated' : 'Created'}`,
        description: `${values.name} has been ${product ? 'updated' : 'created'} successfully.`
      });
      
      onSuccess();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: `Error ${product ? 'updating' : 'creating'} product`,
        description: error.message
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {product ? `Edit ${product.name}` : "Add New Product"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Product name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="name_ml"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Malayalam Name (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Malayalam name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price (₹)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="0" 
                          step="0.01"
                          placeholder="0.00"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="offer_price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Offer Price (₹) (Optional)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="0" 
                          step="0.01"
                          placeholder="0.00"
                          {...field} 
                          value={field.value === null ? '' : field.value}
                          onChange={(e) => field.onChange(e.target.value === '' ? null : Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="stock_quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stock Quantity</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="0" 
                          step="1"
                          placeholder="0"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="discount_percent"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Discount (%)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="0" 
                          max="100" 
                          step="1"
                          placeholder="0"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tags"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product Tags</FormLabel>
                      <div className="flex flex-col gap-2">
                        <div className="flex gap-2">
                          <Input
                            placeholder="Add tag and press Enter"
                            value={tagInput}
                            onChange={(e) => setTagInput(e.target.value)}
                            onKeyDown={handleTagInputKeyDown}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={handleAddTag}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        {selectedTags.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {selectedTags.map((tag, index) => (
                              <div 
                                key={index} 
                                className="flex items-center bg-gray-100 rounded-md px-2 py-1 text-sm"
                              >
                                {tag}
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="ml-2 h-4 w-4"
                                  onClick={() => handleRemoveTag(tag)}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="category_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories?.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="provider_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Provider</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select provider" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {providers?.map((provider) => (
                            <SelectItem key={provider.id} value={provider.id}>
                              {provider.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="unit_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Unit</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select unit" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {units?.map((unit) => (
                              <SelectItem key={unit.id} value={unit.id}>
                                {unit.name} ({unit.abbreviation})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="quantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quantity</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            step="1"
                            placeholder="1"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="available_start_time"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Available From</FormLabel>
                        <FormControl>
                          <Input
                            type="time"
                            step="1"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="available_end_time"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Available To</FormLabel>
                        <FormControl>
                          <Input
                            type="time"
                            step="1"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="is_active"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel>Active</FormLabel>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="coming_soon"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel>Coming Soon</FormLabel>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="is_popular"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel>Popular Item</FormLabel>
                          <p className="text-xs text-muted-foreground">Mark this item as featured/popular</p>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="is_flash"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel>Flash Deal</FormLabel>
                          <p className="text-xs text-muted-foreground">Mark this item as a flash deal</p>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>

            <div className="p-4 border rounded-lg">
              <Label htmlFor="image" className="block mb-2">Product Image</Label>
              <div className="flex gap-4 items-start">
                <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-sm text-muted-foreground">No image</span>
                  )}
                </div>
                <div className="flex-1">
                  <Input
                    id="image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Upload a product image. Recommended size: 500x500px.
                  </p>
                </div>
              </div>
            </div>

            <FormField
              control={form.control}
              name="is_combo"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center gap-2">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel>This is a combo product</FormLabel>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {form.watch("is_combo") && (
              <div className="border p-4 rounded-lg space-y-4">
                <h3 className="font-medium">Combo Items</h3>
                
                <div className="space-y-2">
                  {selectedComboProducts.map((comboProduct) => (
                    <div key={comboProduct.id} className="flex items-center gap-2 p-2 border rounded-md">
                      <div className="flex-1">{comboProduct.name}</div>
                      <div className="w-20 mr-2">
                        <Input
                          type="number"
                          min="1"
                          value={comboProduct.quantity}
                          onChange={(e) => updateComboProductQuantity(comboProduct.id, parseInt(e.target.value))}
                          className="h-8"
                        />
                      </div>
                      <div className="w-32">
                        <Select
                          value={comboProduct.unit_id || ""}
                          onValueChange={(unit_id) => updateComboProductUnit(comboProduct.id, unit_id)}
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue placeholder="Select unit" />
                          </SelectTrigger>
                          <SelectContent>
                            {units?.map((unit) => (
                              <SelectItem key={unit.id} value={unit.id}>
                                {unit.name} ({unit.abbreviation})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => removeComboProduct(comboProduct.id)}
                        className="h-8 w-8"
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}

                  {selectedComboProducts.length === 0 && (
                    <div className="text-center p-4 text-sm text-muted-foreground">
                      No items added to this combo yet.
                    </div>
                  )}
                </div>
                
                {allProducts && allProducts.length > 0 && (
                  <div className="pt-2">
                    <Label>Add Product to Combo</Label>
                    <div className="flex gap-2 mt-1">
                      <Select onValueChange={addComboProduct}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a product" />
                        </SelectTrigger>
                        <SelectContent>
                          {allProducts.map((product) => (
                            <SelectItem key={product.id} value={product.id}>
                              {product.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button type="button" variant="outline" size="icon">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {product ? "Update" : "Create"} Product
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default ProductForm;
