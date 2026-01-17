export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      agent_cash_transactions: {
        Row: {
          agent_id: string | null
          amount: number
          id: string
          reason: string | null
          recorded_at: string | null
          recorded_by: string | null
          type: string
        }
        Insert: {
          agent_id?: string | null
          amount: number
          id?: string
          reason?: string | null
          recorded_at?: string | null
          recorded_by?: string | null
          type: string
        }
        Update: {
          agent_id?: string | null
          amount?: number
          id?: string
          reason?: string | null
          recorded_at?: string | null
          recorded_by?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_cash_transactions_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "delivery_agents"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_order_rejections: {
        Row: {
          agent_id: string
          attempt_number: number
          created_at: string
          device_info: string | null
          id: string
          order_id: string
          reason: string | null
          rejection_type: string | null
          tenant_id: string | null
          updated_at: string
        }
        Insert: {
          agent_id: string
          attempt_number?: number
          created_at?: string
          device_info?: string | null
          id?: string
          order_id: string
          reason?: string | null
          rejection_type?: string | null
          tenant_id?: string | null
          updated_at?: string
        }
        Update: {
          agent_id?: string
          attempt_number?: number
          created_at?: string
          device_info?: string | null
          id?: string
          order_id?: string
          reason?: string | null
          rejection_type?: string | null
          tenant_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_agent_order_rejections_agent_id"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "delivery_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_agent_order_rejections_order_id"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_agent_order_rejections_tenant_id"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_sessions: {
        Row: {
          agent_id: string | null
          check_in_time: string | null
          check_out_time: string | null
          created_at: string | null
          duration: unknown
          id: string
          location_id: string | null
          remarks: string | null
          tenant_id: string | null
        }
        Insert: {
          agent_id?: string | null
          check_in_time?: string | null
          check_out_time?: string | null
          created_at?: string | null
          duration?: unknown
          id?: string
          location_id?: string | null
          remarks?: string | null
          tenant_id?: string | null
        }
        Update: {
          agent_id?: string | null
          check_in_time?: string | null
          check_out_time?: string | null
          created_at?: string | null
          duration?: unknown
          id?: string
          location_id?: string | null
          remarks?: string | null
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_sessions_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "delivery_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_sessions_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_sessions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      area_zones: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean
          latitude: number | null
          longitude: number | null
          name: string
          price: number
          tenant_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          latitude?: number | null
          longitude?: number | null
          name: string
          price?: number
          tenant_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          latitude?: number | null
          longitude?: number | null
          name?: string
          price?: number
          tenant_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "area_zones_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      areas: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean
          name: string
          pincode: string | null
          updated_at: string | null
          zone_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean
          name: string
          pincode?: string | null
          updated_at?: string | null
          zone_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean
          name?: string
          pincode?: string | null
          updated_at?: string | null
          zone_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "areas_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      banners: {
        Row: {
          asset_type: string
          created_at: string | null
          description: string | null
          display_order: number | null
          id: string
          image_url: string
          is_active: boolean | null
          name: string
          screen: string
          screen_id: string | null
          secondary_description: string | null
          tenant_id: string | null
        }
        Insert: {
          asset_type?: string
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          image_url: string
          is_active?: boolean | null
          name: string
          screen: string
          screen_id?: string | null
          secondary_description?: string | null
          tenant_id?: string | null
        }
        Update: {
          asset_type?: string
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          image_url?: string
          is_active?: boolean | null
          name?: string
          screen?: string
          screen_id?: string | null
          secondary_description?: string | null
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "banners_screen_id_fkey"
            columns: ["screen_id"]
            isOneToOne: false
            referencedRelation: "screens"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "banners_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      cart_items: {
        Row: {
          created_at: string
          id: string
          menu_item_id: string | null
          notes: string | null
          order_type: Database["public"]["Enums"]["order_type"] | null
          product_id: string | null
          quantity: number | null
          selected_addons: Json | null
          tenant_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          menu_item_id?: string | null
          notes?: string | null
          order_type?: Database["public"]["Enums"]["order_type"] | null
          product_id?: string | null
          quantity?: number | null
          selected_addons?: Json | null
          tenant_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          menu_item_id?: string | null
          notes?: string | null
          order_type?: Database["public"]["Enums"]["order_type"] | null
          product_id?: string | null
          quantity?: number | null
          selected_addons?: Json | null
          tenant_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          color: string | null
          created_at: string
          display_order: number | null
          icon_family: string | null
          icon_name: string | null
          id: string
          is_active: boolean | null
          name: string
          tenant_id: string | null
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string
          display_order?: number | null
          icon_family?: string | null
          icon_name?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          tenant_id?: string | null
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string
          display_order?: number | null
          icon_family?: string | null
          icon_name?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          tenant_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "categories_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_agents: {
        Row: {
          aadhaar_number: string | null
          address: string | null
          battery_level: number | null
          blood_group: string | null
          created_at: string
          device_token: string | null
          id: string
          is_active: boolean
          is_online: boolean | null
          last_tracked_at: string | null
          lat: number | null
          lng: number | null
          location_accuracy: number | null
          location_id: string | null
          name: string | null
          pending_orders: number | null
          phone_number: string | null
          profile_photo: string | null
          rating: number | null
          scheduled_orders: number | null
          status: Database["public"]["Enums"]["delivery_status"]
          tenant_id: string | null
          today_earnings: number | null
          updated_at: string | null
          user_id: string
          vehicle_number: string | null
          vehicle_type: string | null
          verified: boolean | null
        }
        Insert: {
          aadhaar_number?: string | null
          address?: string | null
          battery_level?: number | null
          blood_group?: string | null
          created_at?: string
          device_token?: string | null
          id?: string
          is_active?: boolean
          is_online?: boolean | null
          last_tracked_at?: string | null
          lat?: number | null
          lng?: number | null
          location_accuracy?: number | null
          location_id?: string | null
          name?: string | null
          pending_orders?: number | null
          phone_number?: string | null
          profile_photo?: string | null
          rating?: number | null
          scheduled_orders?: number | null
          status?: Database["public"]["Enums"]["delivery_status"]
          tenant_id?: string | null
          today_earnings?: number | null
          updated_at?: string | null
          user_id: string
          vehicle_number?: string | null
          vehicle_type?: string | null
          verified?: boolean | null
        }
        Update: {
          aadhaar_number?: string | null
          address?: string | null
          battery_level?: number | null
          blood_group?: string | null
          created_at?: string
          device_token?: string | null
          id?: string
          is_active?: boolean
          is_online?: boolean | null
          last_tracked_at?: string | null
          lat?: number | null
          lng?: number | null
          location_accuracy?: number | null
          location_id?: string | null
          name?: string | null
          pending_orders?: number | null
          phone_number?: string | null
          profile_photo?: string | null
          rating?: number | null
          scheduled_orders?: number | null
          status?: Database["public"]["Enums"]["delivery_status"]
          tenant_id?: string | null
          today_earnings?: number | null
          updated_at?: string | null
          user_id?: string
          vehicle_number?: string | null
          vehicle_type?: string | null
          verified?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "delivery_agents_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_agents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_payouts: {
        Row: {
          agent_id: string | null
          base_pay: number
          created_at: string | null
          id: string
          order_id: string | null
          status: string | null
          tip_amount: number | null
        }
        Insert: {
          agent_id?: string | null
          base_pay: number
          created_at?: string | null
          id?: string
          order_id?: string | null
          status?: string | null
          tip_amount?: number | null
        }
        Update: {
          agent_id?: string | null
          base_pay?: number
          created_at?: string | null
          id?: string
          order_id?: string | null
          status?: string | null
          tip_amount?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "delivery_payouts_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "delivery_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_payouts_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_reassignments: {
        Row: {
          created_at: string
          from_agent_id: string | null
          id: string
          note: string | null
          order_id: string
          reason: string
          status_after:
            | Database["public"]["Enums"]["delivery_agent_status"]
            | null
          status_before:
            | Database["public"]["Enums"]["delivery_agent_status"]
            | null
          tenant_id: string | null
          timestamp: string
          to_agent_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          from_agent_id?: string | null
          id?: string
          note?: string | null
          order_id: string
          reason: string
          status_after?:
            | Database["public"]["Enums"]["delivery_agent_status"]
            | null
          status_before?:
            | Database["public"]["Enums"]["delivery_agent_status"]
            | null
          tenant_id?: string | null
          timestamp?: string
          to_agent_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          from_agent_id?: string | null
          id?: string
          note?: string | null
          order_id?: string
          reason?: string
          status_after?:
            | Database["public"]["Enums"]["delivery_agent_status"]
            | null
          status_before?:
            | Database["public"]["Enums"]["delivery_agent_status"]
            | null
          tenant_id?: string | null
          timestamp?: string
          to_agent_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "delivery_reassignments_from_agent_id_fkey"
            columns: ["from_agent_id"]
            isOneToOne: false
            referencedRelation: "delivery_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_reassignments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_reassignments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_reassignments_to_agent_id_fkey"
            columns: ["to_agent_id"]
            isOneToOne: false
            referencedRelation: "delivery_agents"
            referencedColumns: ["id"]
          },
        ]
      }
      distance_brackets: {
        Row: {
          created_at: string | null
          flat_fare: number
          id: string
          is_active: boolean
          max_km: number | null
          min_km: number
          tenant_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          flat_fare: number
          id?: string
          is_active?: boolean
          max_km?: number | null
          min_km: number
          tenant_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          flat_fare?: number
          id?: string
          is_active?: boolean
          max_km?: number | null
          min_km?: number
          tenant_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "distance_brackets_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      districts: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean
          name: string
          state_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean
          name: string
          state_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean
          name?: string
          state_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "districts_state_id_fkey"
            columns: ["state_id"]
            isOneToOne: false
            referencedRelation: "states"
            referencedColumns: ["id"]
          },
        ]
      }
      echo_items: {
        Row: {
          base_price: number
          created_at: string
          icon_url: string | null
          id: string
          is_active: boolean
          name: string
          tenant_id: string | null
          unit: string
          updated_at: string
        }
        Insert: {
          base_price?: number
          created_at?: string
          icon_url?: string | null
          id?: string
          is_active?: boolean
          name: string
          tenant_id?: string | null
          unit: string
          updated_at?: string
        }
        Update: {
          base_price?: number
          created_at?: string
          icon_url?: string | null
          id?: string
          is_active?: boolean
          name?: string
          tenant_id?: string | null
          unit?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "echo_items_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      favourite_restaurants: {
        Row: {
          created_at: string | null
          id: string
          restaurant_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          restaurant_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          restaurant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favourite_restaurants_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      godowns: {
        Row: {
          area: string
          created_at: string | null
          id: string
          is_active: boolean | null
          location_id: string | null
          name: string
          updated_at: string | null
        }
        Insert: {
          area: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          location_id?: string | null
          name: string
          updated_at?: string | null
        }
        Update: {
          area?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          location_id?: string | null
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "godowns_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "areas"
            referencedColumns: ["id"]
          },
        ]
      }
      group_users: {
        Row: {
          added_at: string | null
          group_id: string | null
          id: string
          tenant_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          added_at?: string | null
          group_id?: string | null
          id?: string
          tenant_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          added_at?: string | null
          group_id?: string | null
          id?: string
          tenant_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "group_users_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_users_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_users_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      groups: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean
          name: string
          tenant_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          tenant_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          tenant_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "groups_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      holiday_surcharges: {
        Row: {
          created_at: string | null
          extra_flat: number | null
          holiday_id: string | null
          id: string
          multiplier: number | null
          tenant_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          extra_flat?: number | null
          holiday_id?: string | null
          id?: string
          multiplier?: number | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          extra_flat?: number | null
          holiday_id?: string | null
          id?: string
          multiplier?: number | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "holiday_surcharges_holiday_id_fkey"
            columns: ["holiday_id"]
            isOneToOne: false
            referencedRelation: "holidays"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "holiday_surcharges_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      holidays: {
        Row: {
          created_at: string | null
          date: string
          holiday_name: string
          id: string
          is_active: boolean | null
          tenant_id: string | null
        }
        Insert: {
          created_at?: string | null
          date: string
          holiday_name: string
          id?: string
          is_active?: boolean | null
          tenant_id?: string | null
        }
        Update: {
          created_at?: string | null
          date?: string
          holiday_name?: string
          id?: string
          is_active?: boolean | null
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "holidays_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      item_addons: {
        Row: {
          created_at: string | null
          id: string
          is_default: boolean | null
          is_mandatory: boolean | null
          menu_item_id: string | null
          name: string
          price: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          is_mandatory?: boolean | null
          menu_item_id?: string | null
          name: string
          price: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          is_mandatory?: boolean | null
          menu_item_id?: string | null
          name?: string
          price?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "item_addons_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_requests: {
        Row: {
          agent_id: string | null
          applied_at: string | null
          end_date: string
          id: string
          leave_type: string | null
          reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          start_date: string
          status: string | null
          tenant_id: string | null
        }
        Insert: {
          agent_id?: string | null
          applied_at?: string | null
          end_date: string
          id?: string
          leave_type?: string | null
          reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          start_date: string
          status?: string | null
          tenant_id?: string | null
        }
        Update: {
          agent_id?: string | null
          applied_at?: string | null
          end_date?: string
          id?: string
          leave_type?: string | null
          reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          start_date?: string
          status?: string | null
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leave_requests_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "delivery_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_requests_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      locations: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
        }
        Relationships: []
      }
      menu_items: {
        Row: {
          availability_window: string | null
          available: boolean | null
          category_id: string | null
          combo_description: string[] | null
          created_at: string | null
          description: string | null
          discount_percent: number | null
          id: string
          image_url: string | null
          is_customisable: boolean | null
          is_popular: boolean
          is_sold_out: boolean | null
          is_veg: boolean | null
          iscombo: boolean | null
          name: string
          offer_price: number | null
          preparation_time: number | null
          price: number
          product_tags: string[] | null
          quantity_label: string | null
          rating_count: number | null
          rating_value: number | null
          restaurant_id: string | null
          subtitle: string | null
          unavailable_reason: string | null
          updated_at: string | null
        }
        Insert: {
          availability_window?: string | null
          available?: boolean | null
          category_id?: string | null
          combo_description?: string[] | null
          created_at?: string | null
          description?: string | null
          discount_percent?: number | null
          id?: string
          image_url?: string | null
          is_customisable?: boolean | null
          is_popular?: boolean
          is_sold_out?: boolean | null
          is_veg?: boolean | null
          iscombo?: boolean | null
          name: string
          offer_price?: number | null
          preparation_time?: number | null
          price: number
          product_tags?: string[] | null
          quantity_label?: string | null
          rating_count?: number | null
          rating_value?: number | null
          restaurant_id?: string | null
          subtitle?: string | null
          unavailable_reason?: string | null
          updated_at?: string | null
        }
        Update: {
          availability_window?: string | null
          available?: boolean | null
          category_id?: string | null
          combo_description?: string[] | null
          created_at?: string | null
          description?: string | null
          discount_percent?: number | null
          id?: string
          image_url?: string | null
          is_customisable?: boolean | null
          is_popular?: boolean
          is_sold_out?: boolean | null
          is_veg?: boolean | null
          iscombo?: boolean | null
          name?: string
          offer_price?: number | null
          preparation_time?: number | null
          price?: number
          product_tags?: string[] | null
          quantity_label?: string | null
          rating_count?: number | null
          rating_value?: number | null
          restaurant_id?: string | null
          subtitle?: string | null
          unavailable_reason?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "menu_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "restaurant_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "menu_items_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      order_food_items: {
        Row: {
          addons: Json | null
          created_at: string | null
          id: string
          menu_item_id: string | null
          notes: string | null
          order_id: string | null
          price: number
          quantity: number
          restaurant_id: string | null
          updated_at: string | null
        }
        Insert: {
          addons?: Json | null
          created_at?: string | null
          id?: string
          menu_item_id?: string | null
          notes?: string | null
          order_id?: string | null
          price: number
          quantity?: number
          restaurant_id?: string | null
          updated_at?: string | null
        }
        Update: {
          addons?: Json | null
          created_at?: string | null
          id?: string
          menu_item_id?: string | null
          notes?: string | null
          order_id?: string | null
          price?: number
          quantity?: number
          restaurant_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_food_items_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_food_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_food_items_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          assigned_at: string | null
          assignment_attempts: number | null
          change_amount: number | null
          change_reason: string | null
          collected_amount: number | null
          collected_at: string | null
          created_at: string | null
          delivered_at: string | null
          delivery_agent_id: string | null
          delivery_agent_status:
            | Database["public"]["Enums"]["delivery_agent_status"]
            | null
          delivery_charge: number | null
          delivery_tip: number | null
          discount: number | null
          final_amount: number | null
          id: string
          is_scheduled: boolean | null
          note_for_delivery: string | null
          order_type: string
          orderno: string | null
          payment_mode: Database["public"]["Enums"]["payment_mode"] | null
          payment_status: Database["public"]["Enums"]["payment_status"] | null
          promo_code_id: string | null
          scheduled_at: string | null
          status: Database["public"]["Enums"]["order_status"] | null
          tenantId: string | null
          total_amount: number
          updated_at: string | null
          updated_by: string | null
          user_address: string | null
          user_id: string | null
          user_latitude: number | null
          user_longitude: number | null
        }
        Insert: {
          assigned_at?: string | null
          assignment_attempts?: number | null
          change_amount?: number | null
          change_reason?: string | null
          collected_amount?: number | null
          collected_at?: string | null
          created_at?: string | null
          delivered_at?: string | null
          delivery_agent_id?: string | null
          delivery_agent_status?:
            | Database["public"]["Enums"]["delivery_agent_status"]
            | null
          delivery_charge?: number | null
          delivery_tip?: number | null
          discount?: number | null
          final_amount?: number | null
          id?: string
          is_scheduled?: boolean | null
          note_for_delivery?: string | null
          order_type: string
          orderno?: string | null
          payment_mode?: Database["public"]["Enums"]["payment_mode"] | null
          payment_status?: Database["public"]["Enums"]["payment_status"] | null
          promo_code_id?: string | null
          scheduled_at?: string | null
          status?: Database["public"]["Enums"]["order_status"] | null
          tenantId?: string | null
          total_amount: number
          updated_at?: string | null
          updated_by?: string | null
          user_address?: string | null
          user_id?: string | null
          user_latitude?: number | null
          user_longitude?: number | null
        }
        Update: {
          assigned_at?: string | null
          assignment_attempts?: number | null
          change_amount?: number | null
          change_reason?: string | null
          collected_amount?: number | null
          collected_at?: string | null
          created_at?: string | null
          delivered_at?: string | null
          delivery_agent_id?: string | null
          delivery_agent_status?:
            | Database["public"]["Enums"]["delivery_agent_status"]
            | null
          delivery_charge?: number | null
          delivery_tip?: number | null
          discount?: number | null
          final_amount?: number | null
          id?: string
          is_scheduled?: boolean | null
          note_for_delivery?: string | null
          order_type?: string
          orderno?: string | null
          payment_mode?: Database["public"]["Enums"]["payment_mode"] | null
          payment_status?: Database["public"]["Enums"]["payment_status"] | null
          promo_code_id?: string | null
          scheduled_at?: string | null
          status?: Database["public"]["Enums"]["order_status"] | null
          tenantId?: string | null
          total_amount?: number
          updated_at?: string | null
          updated_by?: string | null
          user_address?: string | null
          user_id?: string | null
          user_latitude?: number | null
          user_longitude?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_delivery_agent_id_fkey"
            columns: ["delivery_agent_id"]
            isOneToOne: false
            referencedRelation: "delivery_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_promo_code_id_fkey"
            columns: ["promo_code_id"]
            isOneToOne: false
            referencedRelation: "promo_codes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_tenant_id_fkey"
            columns: ["tenantId"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          booking_id: string | null
          created_at: string | null
          currency: string | null
          delivery_tip: number | null
          id: string
          method: string | null
          paid_at: string | null
          razorpay_order_id: string | null
          razorpay_payment_id: string | null
          razorpay_signature: string | null
          status: string | null
          tenant_id: string | null
          user_id: string | null
        }
        Insert: {
          amount: number
          booking_id?: string | null
          created_at?: string | null
          currency?: string | null
          delivery_tip?: number | null
          id?: string
          method?: string | null
          paid_at?: string | null
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          razorpay_signature?: string | null
          status?: string | null
          tenant_id?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number
          booking_id?: string | null
          created_at?: string | null
          currency?: string | null
          delivery_tip?: number | null
          id?: string
          method?: string | null
          paid_at?: string | null
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          razorpay_signature?: string | null
          status?: string | null
          tenant_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      peak_hours: {
        Row: {
          created_at: string | null
          day_of_week: Database["public"]["Enums"]["day_of_week"] | null
          end_time: string
          id: string
          is_active: boolean | null
          multiplier: number | null
          start_time: string
          tenant_id: string | null
        }
        Insert: {
          created_at?: string | null
          day_of_week?: Database["public"]["Enums"]["day_of_week"] | null
          end_time: string
          id?: string
          is_active?: boolean | null
          multiplier?: number | null
          start_time: string
          tenant_id?: string | null
        }
        Update: {
          created_at?: string | null
          day_of_week?: Database["public"]["Enums"]["day_of_week"] | null
          end_time?: string
          id?: string
          is_active?: boolean | null
          multiplier?: number | null
          start_time?: string
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "peak_hours_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      permissions: {
        Row: {
          created_at: string | null
          id: string
          key: string
          label: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          key: string
          label: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          key?: string
          label?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      product_combos: {
        Row: {
          combo_product_id: string
          created_at: string | null
          id: string
          is_active: boolean | null
          item_product_id: string
          quantity: number | null
          unit_id: string | null
          updated_at: string | null
        }
        Insert: {
          combo_product_id: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          item_product_id: string
          quantity?: number | null
          unit_id?: string | null
          updated_at?: string | null
        }
        Update: {
          combo_product_id?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          item_product_id?: string
          quantity?: number | null
          unit_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_combos_combo_product_id_fkey"
            columns: ["combo_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_combos_item_product_id_fkey"
            columns: ["item_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_combos_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      product_godown_stock: {
        Row: {
          created_at: string | null
          godown_id: string | null
          id: string
          product_id: string | null
          stock_count: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          godown_id?: string | null
          id?: string
          product_id?: string | null
          stock_count?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          godown_id?: string | null
          id?: string
          product_id?: string | null
          stock_count?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_godown_stock_godown_id_fkey"
            columns: ["godown_id"]
            isOneToOne: false
            referencedRelation: "godowns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_godown_stock_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_tags: {
        Row: {
          id: string
          product_id: string | null
          tag_id: string | null
        }
        Insert: {
          id?: string
          product_id?: string | null
          tag_id?: string | null
        }
        Update: {
          id?: string
          product_id?: string | null
          tag_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_tags_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          available_end_time: string | null
          available_start_time: string | null
          category_id: string
          coming_soon: boolean | null
          created_at: string
          discount_percent: number | null
          id: string
          image_url: string | null
          is_active: boolean
          is_combo: boolean | null
          is_flash: boolean | null
          is_popular: boolean | null
          name: string
          name_ml: string | null
          offer_price: number | null
          price: number
          provider_id: string
          quantity: number
          stock_quantity: number | null
          tags: string[] | null
          tenant_id: string | null
          unit_id: string
          updated_at: string | null
        }
        Insert: {
          available_end_time?: string | null
          available_start_time?: string | null
          category_id: string
          coming_soon?: boolean | null
          created_at?: string
          discount_percent?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_combo?: boolean | null
          is_flash?: boolean | null
          is_popular?: boolean | null
          name: string
          name_ml?: string | null
          offer_price?: number | null
          price: number
          provider_id: string
          quantity?: number
          stock_quantity?: number | null
          tags?: string[] | null
          tenant_id?: string | null
          unit_id: string
          updated_at?: string | null
        }
        Update: {
          available_end_time?: string | null
          available_start_time?: string | null
          category_id?: string
          coming_soon?: boolean | null
          created_at?: string
          discount_percent?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_combo?: boolean | null
          is_flash?: boolean | null
          is_popular?: boolean | null
          name?: string
          name_ml?: string | null
          offer_price?: number | null
          price?: number
          provider_id?: string
          quantity?: number
          stock_quantity?: number | null
          tags?: string[] | null
          tenant_id?: string | null
          unit_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_category"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_service_provider"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "service_providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_unit"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      promo_code_usages: {
        Row: {
          discount_applied: number | null
          id: string
          order_id: string | null
          promo_code_id: string | null
          used_at: string | null
          user_id: string | null
        }
        Insert: {
          discount_applied?: number | null
          id?: string
          order_id?: string | null
          promo_code_id?: string | null
          used_at?: string | null
          user_id?: string | null
        }
        Update: {
          discount_applied?: number | null
          id?: string
          order_id?: string | null
          promo_code_id?: string | null
          used_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "promo_code_usages_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promo_code_usages_promo_code_id_fkey"
            columns: ["promo_code_id"]
            isOneToOne: false
            referencedRelation: "promo_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      promo_codes: {
        Row: {
          category: string | null
          code: string
          created_at: string | null
          discount_type: string
          discount_value: number
          end_date: string
          id: string
          is_active: boolean | null
          max_discount: number | null
          min_order_amount: number | null
          promo_target: string | null
          screen_id: string | null
          start_date: string
          tenant_id: string | null
          usage_limit: number | null
          used_count: number | null
        }
        Insert: {
          category?: string | null
          code: string
          created_at?: string | null
          discount_type: string
          discount_value: number
          end_date: string
          id?: string
          is_active?: boolean | null
          max_discount?: number | null
          min_order_amount?: number | null
          promo_target?: string | null
          screen_id?: string | null
          start_date: string
          tenant_id?: string | null
          usage_limit?: number | null
          used_count?: number | null
        }
        Update: {
          category?: string | null
          code?: string
          created_at?: string | null
          discount_type?: string
          discount_value?: number
          end_date?: string
          id?: string
          is_active?: boolean | null
          max_discount?: number | null
          min_order_amount?: number | null
          promo_target?: string | null
          screen_id?: string | null
          start_date?: string
          tenant_id?: string | null
          usage_limit?: number | null
          used_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "promo_codes_screen_id_fkey"
            columns: ["screen_id"]
            isOneToOne: false
            referencedRelation: "screens"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promo_codes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      promocode_groups: {
        Row: {
          created_at: string | null
          group_id: string | null
          id: string
          promo_code_id: string | null
        }
        Insert: {
          created_at?: string | null
          group_id?: string | null
          id?: string
          promo_code_id?: string | null
        }
        Update: {
          created_at?: string | null
          group_id?: string | null
          id?: string
          promo_code_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "promocode_groups_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promocode_groups_promo_code_id_fkey"
            columns: ["promo_code_id"]
            isOneToOne: false
            referencedRelation: "promo_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_payouts: {
        Row: {
          amount: number
          commission_taken: number | null
          created_at: string | null
          id: string
          order_id: string | null
          paid_at: string | null
          payout_method: string | null
          scheduled_at: string | null
          status: string | null
          tenant_id: string | null
          transaction_id: string | null
        }
        Insert: {
          amount: number
          commission_taken?: number | null
          created_at?: string | null
          id?: string
          order_id?: string | null
          paid_at?: string | null
          payout_method?: string | null
          scheduled_at?: string | null
          status?: string | null
          tenant_id?: string | null
          transaction_id?: string | null
        }
        Update: {
          amount?: number
          commission_taken?: number | null
          created_at?: string | null
          id?: string
          order_id?: string | null
          paid_at?: string | null
          payout_method?: string | null
          scheduled_at?: string | null
          status?: string | null
          tenant_id?: string | null
          transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "provider_payouts_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_payouts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      providers: {
        Row: {
          address: string | null
          category: string
          createdOn: string
          id: string
          is_active: boolean
          latitude: number | null
          longitude: number | null
          name: string
          updatedOn: string | null
        }
        Insert: {
          address?: string | null
          category: string
          createdOn?: string
          id?: string
          is_active?: boolean
          latitude?: number | null
          longitude?: number | null
          name: string
          updatedOn?: string | null
        }
        Update: {
          address?: string | null
          category?: string
          createdOn?: string
          id?: string
          is_active?: boolean
          latitude?: number | null
          longitude?: number | null
          name?: string
          updatedOn?: string | null
        }
        Relationships: []
      }
      restaurant_categories: {
        Row: {
          created_at: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          is_veg_only: boolean | null
          name: string
          restaurant_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          is_veg_only?: boolean | null
          name: string
          restaurant_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          is_veg_only?: boolean | null
          name?: string
          restaurant_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_categories_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurant_earnings: {
        Row: {
          commission_amount: number
          created_at: string
          gross_amount: number
          id: string
          net_amount: number
          order_id: string
          restaurant_id: string
          settled: boolean
          settlement_batch_id: string | null
          updated_at: string
        }
        Insert: {
          commission_amount?: number
          created_at?: string
          gross_amount: number
          id?: string
          net_amount: number
          order_id: string
          restaurant_id: string
          settled?: boolean
          settlement_batch_id?: string | null
          updated_at?: string
        }
        Update: {
          commission_amount?: number
          created_at?: string
          gross_amount?: number
          id?: string
          net_amount?: number
          order_id?: string
          restaurant_id?: string
          settled?: boolean
          settlement_batch_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_earnings_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "restaurant_earnings_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurant_offers: {
        Row: {
          created_at: string | null
          description: string | null
          discount_percent: number
          id: string
          image_url: string | null
          is_active: boolean | null
          min_order: number | null
          restaurant_id: string | null
          title: string
          updated_at: string | null
          valid_from: string
          valid_to: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          discount_percent: number
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          min_order?: number | null
          restaurant_id?: string | null
          title: string
          updated_at?: string | null
          valid_from: string
          valid_to: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          discount_percent?: number
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          min_order?: number | null
          restaurant_id?: string | null
          title?: string
          updated_at?: string | null
          valid_from?: string
          valid_to?: string
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_offers_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurants: {
        Row: {
          address: string | null
          availability_window: string | null
          closing_time: string
          cover_image_url: string | null
          created_at: string | null
          delivery_fee: number | null
          description: string | null
          food_type: string
          id: string
          is_open: boolean | null
          is_sold_out: boolean | null
          isactive: boolean | null
          latitude: number | null
          logo_url: string | null
          longitude: number | null
          min_order_value: number | null
          name: string
          opening_time: string
          prep_time_mins: number | null
          rating: number | null
          rating_count: number | null
          slug: string
          subtitle: string | null
          tags: string[] | null
          tenant_id: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          availability_window?: string | null
          closing_time: string
          cover_image_url?: string | null
          created_at?: string | null
          delivery_fee?: number | null
          description?: string | null
          food_type?: string
          id?: string
          is_open?: boolean | null
          is_sold_out?: boolean | null
          isactive?: boolean | null
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          min_order_value?: number | null
          name: string
          opening_time: string
          prep_time_mins?: number | null
          rating?: number | null
          rating_count?: number | null
          slug: string
          subtitle?: string | null
          tags?: string[] | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          availability_window?: string | null
          closing_time?: string
          cover_image_url?: string | null
          created_at?: string | null
          delivery_fee?: number | null
          description?: string | null
          food_type?: string
          id?: string
          is_open?: boolean | null
          is_sold_out?: boolean | null
          isactive?: boolean | null
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          min_order_value?: number | null
          name?: string
          opening_time?: string
          prep_time_mins?: number | null
          rating?: number | null
          rating_count?: number | null
          slug?: string
          subtitle?: string | null
          tags?: string[] | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "restaurants_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          created_at: string | null
          id: string
          permission_id: string
          role_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          permission_id: string
          role_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          permission_id?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          created_at: string
          id: string
          is_system_role: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_system_role?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_system_role?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      screens: {
        Row: {
          created_at: string
          display_order: number
          id: string
          is_active: boolean
          is_maintenance_mode: boolean
          name: string
          tenant_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          is_maintenance_mode?: boolean
          name: string
          tenant_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          is_maintenance_mode?: boolean
          name?: string
          tenant_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "screens_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      service_charges: {
        Row: {
          base_distance: number
          base_price: number
          category_id: string | null
          created_at: string
          extra_price_per_km: number
          id: string
          name: string
          product_id: string | null
          provider_id: string | null
          updated_at: string | null
        }
        Insert: {
          base_distance: number
          base_price: number
          category_id?: string | null
          created_at?: string
          extra_price_per_km: number
          id?: string
          name: string
          product_id?: string | null
          provider_id?: string | null
          updated_at?: string | null
        }
        Update: {
          base_distance?: number
          base_price?: number
          category_id?: string | null
          created_at?: string
          extra_price_per_km?: number
          id?: string
          name?: string
          product_id?: string | null
          provider_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_charges_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_charges_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_charges_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      service_provider_peak_exceptions: {
        Row: {
          created_at: string | null
          id: string
          is_excluded: boolean | null
          peak_hour_id: string | null
          service_provider_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_excluded?: boolean | null
          peak_hour_id?: string | null
          service_provider_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_excluded?: boolean | null
          peak_hour_id?: string | null
          service_provider_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_peak_exceptions_peak_hour"
            columns: ["peak_hour_id"]
            isOneToOne: false
            referencedRelation: "peak_hours"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_peak_exceptions_service_provider"
            columns: ["service_provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      service_provider_surge_exceptions: {
        Row: {
          created_at: string | null
          id: string
          is_excluded: boolean | null
          service_provider_id: string | null
          surge_pricing_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_excluded?: boolean | null
          service_provider_id?: string | null
          surge_pricing_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_excluded?: boolean | null
          service_provider_id?: string | null
          surge_pricing_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_surge_exceptions_service_provider"
            columns: ["service_provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_surge_exceptions_surge_pricing"
            columns: ["surge_pricing_id"]
            isOneToOne: false
            referencedRelation: "surge_pricing"
            referencedColumns: ["id"]
          },
        ]
      }
      service_providers: {
        Row: {
          address: string | null
          commission_rate: number
          contact_person: string | null
          created_at: string | null
          email: string | null
          id: string
          is_active: boolean | null
          latitude: number | null
          longitude: number | null
          name: string
          phone_number: string | null
          restaurant_id: string | null
          service_fee: number
          tenant_id: string | null
          updated_at: string | null
          user_id: string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          commission_rate?: number
          contact_person?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          latitude?: number | null
          longitude?: number | null
          name: string
          phone_number?: string | null
          restaurant_id?: string | null
          service_fee?: number
          tenant_id?: string | null
          updated_at?: string | null
          user_id?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          commission_rate?: number
          contact_person?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          latitude?: number | null
          longitude?: number | null
          name?: string
          phone_number?: string | null
          restaurant_id?: string | null
          service_fee?: number
          tenant_id?: string | null
          updated_at?: string | null
          user_id?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_providers_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_providers_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      settlement_batches: {
        Row: {
          batch_name: string
          created_at: string
          created_by: string | null
          id: string
          settlement_date: string
          tenant_id: string | null
          total_amount: number
          total_restaurants: number
          updated_at: string
        }
        Insert: {
          batch_name: string
          created_at?: string
          created_by?: string | null
          id?: string
          settlement_date: string
          tenant_id?: string | null
          total_amount?: number
          total_restaurants?: number
          updated_at?: string
        }
        Update: {
          batch_name?: string
          created_at?: string
          created_by?: string | null
          id?: string
          settlement_date?: string
          tenant_id?: string | null
          total_amount?: number
          total_restaurants?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "settlement_batches_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "settlement_batches_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      slot_availability: {
        Row: {
          date: string
          id: string
          is_available: boolean | null
          slot_id: string | null
          vehicle_type_id: string | null
        }
        Insert: {
          date: string
          id?: string
          is_available?: boolean | null
          slot_id?: string | null
          vehicle_type_id?: string | null
        }
        Update: {
          date?: string
          id?: string
          is_available?: boolean | null
          slot_id?: string | null
          vehicle_type_id?: string | null
        }
        Relationships: []
      }
      slot_overrides: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean
          max_bookings: number
          override_date: string
          slot_id: string | null
          tenant_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean
          max_bookings: number
          override_date: string
          slot_id?: string | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean
          max_bookings?: number
          override_date?: string
          slot_id?: string | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "slot_overrides_slot_id_fkey"
            columns: ["slot_id"]
            isOneToOne: false
            referencedRelation: "wash_time_slots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "slot_overrides_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      states: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      subcategories: {
        Row: {
          category_id: string
          created_at: string
          id: string
          name: string
          tenant_id: string | null
          updated_at: string | null
        }
        Insert: {
          category_id: string
          created_at?: string
          id?: string
          name: string
          tenant_id?: string | null
          updated_at?: string | null
        }
        Update: {
          category_id?: string
          created_at?: string
          id?: string
          name?: string
          tenant_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subcategories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subcategories_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          assigned_to: string | null
          attachments: Json | null
          created_at: string
          description: string
          id: string
          is_viewed: boolean
          issue_category: string
          priority: string
          resolution_notes: string | null
          resolved_at: string | null
          status: string
          subject: string
          tenant_id: string | null
          updated_at: string
          user_id: string | null
          user_role: string
        }
        Insert: {
          assigned_to?: string | null
          attachments?: Json | null
          created_at?: string
          description: string
          id?: string
          is_viewed?: boolean
          issue_category: string
          priority?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          status?: string
          subject: string
          tenant_id?: string | null
          updated_at?: string
          user_id?: string | null
          user_role: string
        }
        Update: {
          assigned_to?: string | null
          attachments?: Json | null
          created_at?: string
          description?: string
          id?: string
          is_viewed?: boolean
          issue_category?: string
          priority?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          status?: string
          subject?: string
          tenant_id?: string | null
          updated_at?: string
          user_id?: string | null
          user_role?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      surge_pricing: {
        Row: {
          created_at: string | null
          end_time: string
          extra_charge_amount: number
          id: string
          is_active: boolean | null
          reason: string
          start_time: string
          tenant_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          end_time: string
          extra_charge_amount: number
          id?: string
          is_active?: boolean | null
          reason: string
          start_time: string
          tenant_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          end_time?: string
          extra_charge_amount?: number
          id?: string
          is_active?: boolean | null
          reason?: string
          start_time?: string
          tenant_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "surge_pricing_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      surge_pricing_area_zones: {
        Row: {
          area_zone_id: string | null
          created_at: string | null
          id: string
          surge_pricing_id: string | null
        }
        Insert: {
          area_zone_id?: string | null
          created_at?: string | null
          id?: string
          surge_pricing_id?: string | null
        }
        Update: {
          area_zone_id?: string | null
          created_at?: string | null
          id?: string
          surge_pricing_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "surge_pricing_area_zones_area_zone_id_fkey"
            columns: ["area_zone_id"]
            isOneToOne: false
            referencedRelation: "area_zones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "surge_pricing_area_zones_surge_pricing_id_fkey"
            columns: ["surge_pricing_id"]
            isOneToOne: false
            referencedRelation: "surge_pricing"
            referencedColumns: ["id"]
          },
        ]
      }
      table_order_cart: {
        Row: {
          created_at: string | null
          id: string
          item_id: string
          item_name: string
          phone_number: string
          price: number
          quantity: number
          restaurant_id: string | null
          table_number: string
          tenant_id: string | null
          username: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          item_id: string
          item_name: string
          phone_number: string
          price: number
          quantity?: number
          restaurant_id?: string | null
          table_number: string
          tenant_id?: string | null
          username: string
        }
        Update: {
          created_at?: string | null
          id?: string
          item_id?: string
          item_name?: string
          phone_number?: string
          price?: number
          quantity?: number
          restaurant_id?: string | null
          table_number?: string
          tenant_id?: string | null
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "table_order_cart_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "table_order_cart_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "table_order_cart_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      table_orders: {
        Row: {
          cancelled_at: string | null
          completed_at: string | null
          confirmed_at: string | null
          created_at: string | null
          id: string
          order_items: Json
          phone_number: string
          preparing_at: string | null
          ready_at: string | null
          restaurant_id: string | null
          status: string
          table_number: string
          tenant_id: string | null
          total_amount: number
          updated_at: string | null
          username: string
        }
        Insert: {
          cancelled_at?: string | null
          completed_at?: string | null
          confirmed_at?: string | null
          created_at?: string | null
          id?: string
          order_items: Json
          phone_number: string
          preparing_at?: string | null
          ready_at?: string | null
          restaurant_id?: string | null
          status?: string
          table_number: string
          tenant_id?: string | null
          total_amount: number
          updated_at?: string | null
          username: string
        }
        Update: {
          cancelled_at?: string | null
          completed_at?: string | null
          confirmed_at?: string | null
          created_at?: string | null
          id?: string
          order_items?: Json
          phone_number?: string
          preparing_at?: string | null
          ready_at?: string | null
          restaurant_id?: string | null
          status?: string
          table_number?: string
          tenant_id?: string | null
          total_amount?: number
          updated_at?: string | null
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "table_orders_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "table_orders_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tags: {
        Row: {
          color: string | null
          description: string | null
          id: string
          name: string
          tenant_id: string | null
        }
        Insert: {
          color?: string | null
          description?: string | null
          id?: string
          name: string
          tenant_id?: string | null
        }
        Update: {
          color?: string | null
          description?: string | null
          id?: string
          name?: string
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tags_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_texts: {
        Row: {
          content: string
          id: string
          language: string | null
          screen: string
          tenant_id: string | null
          updated_at: string | null
        }
        Insert: {
          content: string
          id?: string
          language?: string | null
          screen: string
          tenant_id?: string | null
          updated_at?: string | null
        }
        Update: {
          content?: string
          id?: string
          language?: string | null
          screen?: string
          tenant_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_texts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          address: string | null
          center_lat: number | null
          center_lng: number | null
          created_at: string | null
          email: string | null
          id: string
          is_active: boolean | null
          logo_url: string | null
          name: string
          phone: string | null
          radius_km: number | null
        }
        Insert: {
          address?: string | null
          center_lat?: number | null
          center_lng?: number | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name: string
          phone?: string | null
          radius_km?: number | null
        }
        Update: {
          address?: string | null
          center_lat?: number | null
          center_lng?: number | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name?: string
          phone?: string | null
          radius_km?: number | null
        }
        Relationships: []
      }
      units: {
        Row: {
          abbreviation: string
          created_at: string
          id: string
          name: string
          type: string
          updated_at: string | null
        }
        Insert: {
          abbreviation: string
          created_at?: string
          id?: string
          name: string
          type: string
          updated_at?: string | null
        }
        Update: {
          abbreviation?: string
          created_at?: string
          id?: string
          name?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      user_addresses: {
        Row: {
          address: string
          created_at: string
          id: string
          is_default: boolean | null
          latitude: number | null
          longitude: number | null
          tag: Database["public"]["Enums"]["address_tag"]
          updated_at: string
          user_id: string
        }
        Insert: {
          address: string
          created_at?: string
          id?: string
          is_default?: boolean | null
          latitude?: number | null
          longitude?: number | null
          tag?: Database["public"]["Enums"]["address_tag"]
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string
          created_at?: string
          id?: string
          is_default?: boolean | null
          latitude?: number | null
          longitude?: number | null
          tag?: Database["public"]["Enums"]["address_tag"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_favorites: {
        Row: {
          created_at: string | null
          id: string
          menu_item_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          menu_item_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          menu_item_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_favorites_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string | null
          delivery_discount_percent: number | null
          first_name: string
          id: string
          is_prime: boolean | null
          is_verified: boolean | null
          isActive: boolean
          last_name: string
          phone: string | null
          restaurant_id: string | null
          role: string
          role_id: string
          service_provider_id: string | null
          tenant_id: string | null
          updated_at: string | null
          username: string
        }
        Insert: {
          created_at?: string | null
          delivery_discount_percent?: number | null
          first_name: string
          id: string
          is_prime?: boolean | null
          is_verified?: boolean | null
          isActive?: boolean
          last_name: string
          phone?: string | null
          restaurant_id?: string | null
          role: string
          role_id: string
          service_provider_id?: string | null
          tenant_id?: string | null
          updated_at?: string | null
          username: string
        }
        Update: {
          created_at?: string | null
          delivery_discount_percent?: number | null
          first_name?: string
          id?: string
          is_prime?: boolean | null
          is_verified?: boolean | null
          isActive?: boolean
          last_name?: string
          phone?: string | null
          restaurant_id?: string | null
          role?: string
          role_id?: string
          service_provider_id?: string | null
          tenant_id?: string | null
          updated_at?: string | null
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_service_provider_id_fkey"
            columns: ["service_provider_id"]
            isOneToOne: false
            referencedRelation: "service_providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      wallet_transactions: {
        Row: {
          amount: number
          created_at: string
          id: string
          remarks: string | null
          source_order_id: string | null
          tenant_id: string | null
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          remarks?: string | null
          source_order_id?: string | null
          tenant_id?: string | null
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          remarks?: string | null
          source_order_id?: string | null
          tenant_id?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_transactions_source_order_id_fkey"
            columns: ["source_order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wallet_transactions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      wallets: {
        Row: {
          balance: number
          created_at: string
          last_updated: string
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string
          last_updated?: string
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string
          last_updated?: string
          user_id?: string
        }
        Relationships: []
      }
      wash_bookings: {
        Row: {
          address_id: string | null
          booking_date: string
          created_at: string
          id: string
          tenant_id: string | null
          time_slot_id: string | null
          user_id: string
          vehicle_model_id: string | null
          vehicle_type_id: string | null
          wash_type_id: string | null
        }
        Insert: {
          address_id?: string | null
          booking_date: string
          created_at?: string
          id?: string
          tenant_id?: string | null
          time_slot_id?: string | null
          user_id: string
          vehicle_model_id?: string | null
          vehicle_type_id?: string | null
          wash_type_id?: string | null
        }
        Update: {
          address_id?: string | null
          booking_date?: string
          created_at?: string
          id?: string
          tenant_id?: string | null
          time_slot_id?: string | null
          user_id?: string
          vehicle_model_id?: string | null
          vehicle_type_id?: string | null
          wash_type_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wash_bookings_address_id_fkey"
            columns: ["address_id"]
            isOneToOne: false
            referencedRelation: "user_addresses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wash_bookings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wash_bookings_time_slot_id_fkey"
            columns: ["time_slot_id"]
            isOneToOne: false
            referencedRelation: "wash_time_slots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wash_bookings_vehicle_model_id_fkey"
            columns: ["vehicle_model_id"]
            isOneToOne: false
            referencedRelation: "wash_vehicle_models"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wash_bookings_vehicle_type_id_fkey"
            columns: ["vehicle_type_id"]
            isOneToOne: false
            referencedRelation: "wash_vehicle_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wash_bookings_wash_type_id_fkey"
            columns: ["wash_type_id"]
            isOneToOne: false
            referencedRelation: "wash_types"
            referencedColumns: ["id"]
          },
        ]
      }
      wash_daily_time_slot_statuses: {
        Row: {
          booked_count: number | null
          booking_date: string
          created_at: string | null
          id: string
          is_available: boolean | null
          max_bookings: number
          tenant_id: string | null
          time_slot_id: string | null
          updated_at: string | null
        }
        Insert: {
          booked_count?: number | null
          booking_date: string
          created_at?: string | null
          id?: string
          is_available?: boolean | null
          max_bookings: number
          tenant_id?: string | null
          time_slot_id?: string | null
          updated_at?: string | null
        }
        Update: {
          booked_count?: number | null
          booking_date?: string
          created_at?: string | null
          id?: string
          is_available?: boolean | null
          max_bookings?: number
          tenant_id?: string | null
          time_slot_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wash_daily_time_slot_statuses_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wash_daily_time_slot_statuses_time_slot_id_fkey"
            columns: ["time_slot_id"]
            isOneToOne: false
            referencedRelation: "wash_time_slots"
            referencedColumns: ["id"]
          },
        ]
      }
      wash_time_slots: {
        Row: {
          end_time: string
          id: string
          is_active: boolean
          max_bookings: number
          start_time: string
          tenant_id: string | null
        }
        Insert: {
          end_time: string
          id?: string
          is_active?: boolean
          max_bookings: number
          start_time: string
          tenant_id?: string | null
        }
        Update: {
          end_time?: string
          id?: string
          is_active?: boolean
          max_bookings?: number
          start_time?: string
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wash_time_slots_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      wash_types: {
        Row: {
          base_price: number
          description: string | null
          discount_percent: number | null
          gst_percent: number | null
          id: string
          is_active: boolean
          name: string
          offer_price: number | null
          service_charge: number | null
          tenant_id: string | null
          vehicle_model_id: string | null
          vehicle_type_id: string | null
        }
        Insert: {
          base_price: number
          description?: string | null
          discount_percent?: number | null
          gst_percent?: number | null
          id?: string
          is_active?: boolean
          name: string
          offer_price?: number | null
          service_charge?: number | null
          tenant_id?: string | null
          vehicle_model_id?: string | null
          vehicle_type_id?: string | null
        }
        Update: {
          base_price?: number
          description?: string | null
          discount_percent?: number | null
          gst_percent?: number | null
          id?: string
          is_active?: boolean
          name?: string
          offer_price?: number | null
          service_charge?: number | null
          tenant_id?: string | null
          vehicle_model_id?: string | null
          vehicle_type_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wash_types_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wash_types_vehicle_model_id_fkey"
            columns: ["vehicle_model_id"]
            isOneToOne: false
            referencedRelation: "wash_vehicle_models"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wash_types_vehicle_type_id_fkey"
            columns: ["vehicle_type_id"]
            isOneToOne: false
            referencedRelation: "wash_vehicle_types"
            referencedColumns: ["id"]
          },
        ]
      }
      wash_vehicle_models: {
        Row: {
          id: string
          is_active: boolean
          name: string
          tenant_id: string | null
          type_id: string | null
        }
        Insert: {
          id?: string
          is_active?: boolean
          name: string
          tenant_id?: string | null
          type_id?: string | null
        }
        Update: {
          id?: string
          is_active?: boolean
          name?: string
          tenant_id?: string | null
          type_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wash_vehicle_models_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wash_vehicle_models_type_id_fkey"
            columns: ["type_id"]
            isOneToOne: false
            referencedRelation: "wash_vehicle_types"
            referencedColumns: ["id"]
          },
        ]
      }
      wash_vehicle_types: {
        Row: {
          icon_url: string | null
          id: string
          name: string
          tenant_id: string | null
        }
        Insert: {
          icon_url?: string | null
          id?: string
          name: string
          tenant_id?: string | null
        }
        Update: {
          icon_url?: string | null
          id?: string
          name?: string
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wash_vehicle_types_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      zones: {
        Row: {
          created_at: string | null
          district_id: string
          id: string
          is_active: boolean
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          district_id: string
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          district_id?: string
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "zones_district_id_fkey"
            columns: ["district_id"]
            isOneToOne: false
            referencedRelation: "districts"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      belongs_to_tenant: {
        Args: { record_tenant_id: string }
        Returns: boolean
      }
      can_access_tenant: { Args: { tenant_uuid: string }; Returns: boolean }
      check_user_email_exists: {
        Args: { email_to_check: string }
        Returns: boolean
      }
      check_user_verification: { Args: { user_id: string }; Returns: boolean }
      check_username_exists: {
        Args: { username_to_check: string }
        Returns: boolean
      }
      create_auth_user_for_existing: {
        Args: { p_email: string; p_password: string; p_user_id: string }
        Returns: Json
      }
      decrement_time_slot_booked_count: {
        Args: {
          p_booking_date: string
          p_tenant_id: string
          p_time_slot_id: string
        }
        Returns: boolean
      }
      generate_order_number: { Args: never; Returns: string }
      get_current_tenant_id: { Args: never; Returns: string }
      get_screens_paginated: {
        Args: { p_page?: number; p_page_size?: number }
        Returns: {
          created_at: string
          display_order: number
          id: string
          is_active: boolean
          is_maintenance_mode: boolean
          name: string
          total_count: number
          updated_at: string
        }[]
      }
      get_service_provider_by_user_id: {
        Args: { p_user_id: string }
        Returns: {
          email: string
          id: string
          is_active: boolean
          name: string
          phone_number: string
          restaurant_id: string
        }[]
      }
      get_user_permissions: {
        Args: { user_id: string }
        Returns: {
          permission_key: string
        }[]
      }
      get_user_tenant_id: { Args: never; Returns: string }
      get_users_paginated: {
        Args: {
          filter_role?: string
          page_number?: number
          page_size?: number
          search_term?: string
        }
        Returns: {
          created_at: string
          email: string
          first_name: string
          id: string
          is_active: boolean
          is_verified: boolean
          last_name: string
          phone: string
          role_id: string
          role_name: string
          total_count: number
          updated_at: string
          username: string
        }[]
      }
      increment_time_slot_booked_count: {
        Args: {
          p_booking_date: string
          p_tenant_id: string
          p_time_slot_id: string
        }
        Returns: boolean
      }
      is_superadmin: { Args: never; Returns: boolean }
      update_wallet_balance: {
        Args: {
          p_amount: number
          p_remarks?: string
          p_source_order_id?: string
          p_tenant_id?: string
          p_transaction_type: string
          p_user_id: string
        }
        Returns: boolean
      }
      user_has_permission: {
        Args: { permission_key: string }
        Returns: boolean
      }
    }
    Enums: {
      address_tag: "home" | "work" | "other"
      day_of_week:
        | "monday"
        | "tuesday"
        | "wednesday"
        | "thursday"
        | "friday"
        | "saturday"
        | "sunday"
      delivery_agent_status:
        | "pending"
        | "assigned"
        | "accepted"
        | "picked_up"
        | "out_for_delivery"
        | "delivered"
        | "cancelled"
      delivery_status: "online" | "offline" | "busy" | "on_delivery"
      order_status:
        | "pending"
        | "confirmed"
        | "cancelled"
        | "out for delivery"
        | "delivered"
      order_type: "food" | "grocery"
      payment_mode: "cash" | "upi" | "card" | "wallet"
      payment_status: "pending" | "paid" | "failed"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      address_tag: ["home", "work", "other"],
      day_of_week: [
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
        "sunday",
      ],
      delivery_agent_status: [
        "pending",
        "assigned",
        "accepted",
        "picked_up",
        "out_for_delivery",
        "delivered",
        "cancelled",
      ],
      delivery_status: ["online", "offline", "busy", "on_delivery"],
      order_status: [
        "pending",
        "confirmed",
        "cancelled",
        "out for delivery",
        "delivered",
      ],
      order_type: ["food", "grocery"],
      payment_mode: ["cash", "upi", "card", "wallet"],
      payment_status: ["pending", "paid", "failed"],
    },
  },
} as const
