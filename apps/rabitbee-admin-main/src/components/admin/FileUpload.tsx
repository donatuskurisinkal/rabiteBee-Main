
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, X, Image, FileJson } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { ensureStorageBucket, isLottieFile, getAssetType, generateMenuItemPath } from "@/utils/storageHelpers";
import Lottie from "react-lottie-player";
import { useTenant } from "@/hooks/use-tenant";

interface FileUploadProps {
  bucket: string;
  folder?: string;
  maxSize?: number; // in MB
  onUploadComplete: (url: string, type?: 'image' | 'lottie') => void;
  accept?: string;
  className?: string;
  existingUrl?: string;
  assetType?: 'image' | 'lottie';
  categoryId?: string;
}

export function FileUpload({
  bucket,
  folder = '',
  maxSize = 5, // 5MB default
  onUploadComplete,
  accept = "image/*,application/json",
  className = "",
  existingUrl,
  assetType = 'image',
  categoryId
}: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [lottieData, setLottieData] = useState<any>(null);
  const [fileType, setFileType] = useState<'image' | 'lottie'>(assetType);
  const [bucketChecked, setBucketChecked] = useState(false);
  const { session } = useAuth();
  const { selectedTenant } = useTenant();

  // Ensure Storage client has the latest auth token
  useEffect(() => {
    if (session?.access_token) {
      try {
        (supabase.storage as any).setAuth?.(session.access_token);
      } catch (e) {
        // ignore if method not available
      }
    }
  }, [session]);

  // Initialize preview with existingUrl when component mounts or when existingUrl changes
  useEffect(() => {
    if (existingUrl) {
      setPreview(existingUrl);
      setFileType(assetType);
      
      // If it's a Lottie animation, fetch the JSON data
      if (assetType === 'lottie') {
        fetch(existingUrl)
          .then(response => response.json())
          .then(data => {
            setLottieData(data);
          })
          .catch(error => {
            console.error("Failed to load Lottie JSON:", error);
          });
      }
    } else {
      setPreview(null);
      setLottieData(null);
    }
  }, [existingUrl, assetType]);

  // Only check the bucket once when component mounts
  useEffect(() => {
    const checkBucket = async () => {
      if (!bucketChecked) {
        try {
          console.log(`Checking bucket: ${bucket}`);
          // With our new policies, this should work correctly
          const success = await ensureStorageBucket(bucket);
          setBucketChecked(true);
          
          if (!success) {
            console.warn(`Warning: Bucket ${bucket} might not be fully initialized.`);
            // We'll still try to use the bucket since our policies should handle this
          }
        } catch (err) {
          console.error("Failed to check bucket:", err);
          // We'll still mark as checked to avoid repeated checks
          setBucketChecked(true);
        }
      }
    };
    
    if (bucket) {
      checkBucket();
    }
  }, [bucket, bucketChecked]);

  // Ensure we always use a fresh auth token for Storage uploads
  const getAccessToken = async (): Promise<string | null> => {
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token ?? null;
      if (token) return token;
      const { data: refreshed } = await supabase.auth.refreshSession();
      return refreshed.session?.access_token ?? null;
    } catch {
      return null;
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size
    if (file.size > maxSize * 1024 * 1024) {
      toast.error(`File is too large. Maximum size is ${maxSize}MB`);
      return;
    }

    // Ensure we have a fresh access token
    const token = await getAccessToken();
    if (!token) {
      toast.error("Your session expired. Please log in again.");
      setIsUploading(false);
      return;
    }
    try {
      (supabase.storage as any).setAuth?.(token);
    } catch {}


    setIsUploading(true);
    const newFileType = getAssetType(file);
    setFileType(newFileType);
    console.log("File type detected:", newFileType, "for file:", file.name, "type:", file.type);

    try {
      // Create a temporary preview before upload completes
      if (newFileType === 'lottie') {
        // For Lottie files, read the JSON content
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            if (event.target?.result) {
              const jsonData = JSON.parse(event.target.result as string);
              setLottieData(jsonData);
              console.log("Lottie JSON parsed successfully");
            }
          } catch (error) {
            console.error("Invalid JSON file:", error);
            toast.error("Invalid JSON file. Please upload a valid Lottie animation");
            setIsUploading(false);
            return;
          }
        };
        reader.readAsText(file);
      } else {
        // For images, create a preview URL
        const objectUrl = URL.createObjectURL(file);
        setPreview(objectUrl);
      }
      
      // Generate a unique file name to prevent overwriting
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
      
      // Generate folder path based on tenant and category
      let uploadFolder = '';
      if (bucket === 'menu-items') {
        uploadFolder = generateMenuItemPath(selectedTenant?.id, categoryId);
        console.log("Using generated folder structure:", uploadFolder);
      } else {
        uploadFolder = folder;
      }
      
      // Create final file path
      const filePath = uploadFolder ? `${uploadFolder}/${fileName}` : fileName;
      
      console.log("Uploading file to path:", filePath, "in bucket:", bucket);
      
      // Upload file to Supabase storage (should work with our new policies)
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
          contentType: newFileType === 'lottie' ? 'application/json' : file.type // Ensure proper content type
        });

      if (error) {
        console.error("Supabase upload error:", error);
        throw error;
      }

      console.log("Upload successful, getting public URL for path:", data.path);
      
      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path);

      console.log("Public URL obtained:", publicUrlData.publicUrl);
      
      // Call the callback with the URL and file type
      onUploadComplete(publicUrlData.publicUrl, newFileType);
      toast.success('File uploaded successfully');

      // Set preview URL if it's an image
      if (newFileType === 'image') {
        setPreview(publicUrlData.publicUrl);
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      
      // Improved error messages based on our new understanding
      if (error.message?.includes('row-level security policy')) {
        toast.error('Upload failed: Permission issue. Please check if you are logged in and have access rights.');
      } else {
        toast.error(`Upload failed: ${error.message || 'Unknown error'}`);
      }
      
      // If upload fails but we already set a preview, revert to previous state
      if (existingUrl) {
        setPreview(existingUrl);
        setFileType(assetType);
      } else {
        setPreview(null);
        setLottieData(null);
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = () => {
    // Just clear the preview and notify parent component
    setPreview(null);
    setLottieData(null);
    onUploadComplete('', fileType);
    toast.success('File removed');
  };

  return (
    <div className={`flex flex-col items-center gap-4 ${className}`}>
      {(preview || lottieData) ? (
        <div className="relative w-full h-40 rounded-md overflow-hidden border border-border">
          {fileType === 'lottie' && lottieData ? (
            <Lottie
              loop
              animationData={lottieData}
              play
              style={{ width: '100%', height: '100%' }}
            />
          ) : (
            <img 
              src={preview || '/placeholder.svg'} 
              alt="Banner image preview" 
              className="w-full h-full object-cover" 
              loading="lazy"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.onerror = null;
                target.src = '/placeholder.svg';
              }}
            />
          )}
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-2 right-2 p-1 bg-destructive rounded-full text-destructive-foreground hover:bg-destructive/90 transition-colors"
            aria-label="Remove file"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div className="relative w-full">
          <input
            type="file"
            id="file-upload"
            accept={accept}
            onChange={handleFileChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          />
          <Button
            type="button"
            variant="outline"
            className="w-full h-20 flex flex-col gap-2 justify-center items-center border-dashed"
            disabled={isUploading}
          >
            {isUploading ? (
              <>
                <Loader2 className="h-6 w-6 animate-spin" />
                <span>Uploading...</span>
              </>
            ) : (
              <>
                <div className="flex space-x-2">
                  <Image className="h-6 w-6" />
                  <FileJson className="h-6 w-6" />
                </div>
                <span>Upload image or Lottie</span>
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
