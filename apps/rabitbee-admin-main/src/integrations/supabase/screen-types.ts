
// Define Screen types based on the database schema
export interface Screen {
  id: string;
  name: string;
  is_active: boolean;
  is_maintenance_mode: boolean;
  display_order: number;
  tenant_id?: string | null;
  created_at: string;
  updated_at: string;
}

// For pagination results with total count
export interface ScreenWithCount extends Screen {
  total_count: number;
}

// For banners with screen information
export interface BannerWithScreen {
  id: string;
  name: string;
  image_url: string;
  screen_id: string;
  screen_name: string;
  is_active: boolean;
  display_order: number;
  description?: string;
  secondary_description?: string;
  asset_type: 'image' | 'lottie';
  created_at: string;
  total_count: number;
}
