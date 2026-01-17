
import { useState, useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileUpload } from "@/components/admin/FileUpload";
import { useIsMobile } from "@/hooks/use-mobile";

import { supabase } from "@/integrations/supabase/client";
import { Screen } from "@/integrations/supabase/screen-types";
import { getAllScreens } from "@/integrations/supabase/screenFunctions";
import { getTenantHeaders } from "@/utils/tenantHeaders";

// Define form schema
const formSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  image_url: z.string().min(1, { message: "Asset is required" }),
  screen_id: z.string().min(1, { message: "Screen is required" }),
  description: z.string().optional(),
  secondary_description: z.string().optional(),
  display_order: z.coerce.number().int().min(0),
  is_active: z.boolean().default(true),
  asset_type: z.enum(['image', 'lottie']).default('image'),
});

type FormValues = z.infer<typeof formSchema>;

// Component props interface
interface BannerFormProps {
  banner?: any;
  onSaved: () => void;
  tenantId?: string | null;
}

export default function BannerForm({ banner, onSaved, tenantId }: BannerFormProps) {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [screens, setScreens] = useState<Screen[]>([]);
  const isEditMode = Boolean(banner);
  const isMobile = useIsMobile();

  // Initialize form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: banner?.name || "",
      image_url: banner?.image_url || "",
      screen_id: banner?.screen_id || "",
      description: banner?.description || "",
      secondary_description: banner?.secondary_description || "",
      display_order: banner?.display_order || 0,
      is_active: banner?.is_active ?? true,
      asset_type: banner?.asset_type || "image",
    },
  });

  // Fetch screens on component mount
  useEffect(() => {
    const fetchScreens = async () => {
      try {
        const screens = await getAllScreens(tenantId);
        setScreens(screens);
      } catch (error) {
        console.error("Exception fetching screens:", error);
        toast.error("Failed to load screens");
      }
    };

    fetchScreens();
  }, [tenantId]);

  const handleAssetUpload = (url: string, type: 'image' | 'lottie') => {
    form.setValue("image_url", url);
    form.setValue("asset_type", type);
    form.trigger("image_url");
  };

  // Form submission handler
  const onSubmit = async (values: FormValues) => {
    setIsLoading(true);
    
    try {      
      // Get the screen name for the selected screen_id
      const selectedScreen = screens.find(s => s.id === values.screen_id);
      
      // Prepare banner data
      const bannerData = {
        name: values.name,
        image_url: values.image_url,
        screen_id: values.screen_id,
        screen: selectedScreen?.name || "", // Add the screen name
        description: values.description,
        secondary_description: values.secondary_description,
        display_order: values.display_order,
        is_active: values.is_active,
        asset_type: values.asset_type,
        tenant_id: tenantId
      };
      
      let result;
      
      // For edit mode, update existing banner
      if (isEditMode) {
        result = await supabase
          .from("banners")
          .update(bannerData)
          .eq("id", banner.id)
          .eq("tenant_id", tenantId || null);
      } 
      // For create mode, insert new banner
      else {
        result = await supabase
          .from("banners")
          .insert(bannerData);
      }

      // Handle errors
      if (result.error) {
        console.error("Error saving banner:", result.error);
        toast.error(isEditMode ? "Failed to update banner" : "Failed to create banner");
        return;
      }

      // Show success message and trigger callback
      toast.success(isEditMode ? "Banner updated successfully" : "Banner created successfully");
      onSaved();
    } catch (error) {
      console.error("Exception saving banner:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-h-[calc(100vh-220px)] overflow-y-auto p-1">
        {/* Name field */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Banner name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Description field */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea placeholder="Banner description" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Secondary Description field */}
        <FormField
          control={form.control}
          name="secondary_description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Secondary Description</FormLabel>
              <FormControl>
                <Textarea placeholder="Additional details" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Asset Type field */}
        <FormField
          control={form.control}
          name="asset_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Asset Type</FormLabel>
              <Select 
                onValueChange={field.onChange} 
                value={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select asset type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="image">Image</SelectItem>
                  <SelectItem value="lottie">Lottie Animation</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Image Upload field */}
        <FormField
          control={form.control}
          name="image_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {form.watch("asset_type") === "lottie" ? "Lottie Animation" : "Banner Image"}
              </FormLabel>
              <FormControl>
                <FileUpload 
                  bucket="banners"
                  folder=""
                  maxSize={5}
                  onUploadComplete={handleAssetUpload}
                  existingUrl={field.value}
                  accept={form.watch("asset_type") === "lottie" ? "application/json" : "image/*"}
                  assetType={form.watch("asset_type") as 'image' | 'lottie'}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Screen selector */}
        <FormField
          control={form.control}
          name="screen_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Screen</FormLabel>
              <Select 
                onValueChange={field.onChange} 
                defaultValue={field.value}
                value={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select screen" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className={isMobile ? "w-[calc(100vw-2rem)]" : ""}>
                  {screens.map((screen) => (
                    <SelectItem key={screen.id} value={screen.id}>
                      {screen.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Display order field */}
        <FormField
          control={form.control}
          name="display_order"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Display Order</FormLabel>
              <FormControl>
                <Input type="number" min={0} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Is active switch */}
        <FormField
          control={form.control}
          name="is_active"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
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

        {/* Form buttons */}
        <div className="flex justify-end space-x-4">
          <Button type="submit" disabled={isLoading}>
            {isEditMode ? 'Update' : 'Create'} Banner
          </Button>
        </div>
      </form>
    </Form>
  );
}
