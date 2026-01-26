export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type SubscriptionTier = 'free' | 'remember' | 'heritage' | 'legacy';
export type PrivacyLevel = 'public' | 'unlisted' | 'private' | 'family_only';
export type CollaboratorRole = 'owner' | 'editor' | 'viewer';

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          first_name: string | null;
          last_name: string | null;
          phone: string | null;
          timezone: string;
          subscription_tier: SubscriptionTier;
          stripe_customer_id: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          first_name?: string | null;
          last_name?: string | null;
          phone?: string | null;
          timezone?: string;
          subscription_tier?: SubscriptionTier;
          stripe_customer_id?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          first_name?: string | null;
          last_name?: string | null;
          phone?: string | null;
          timezone?: string;
          subscription_tier?: SubscriptionTier;
          stripe_customer_id?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      memorials: {
        Row: {
          id: string;
          user_id: string;
          slug: string;
          first_name: string;
          middle_name: string | null;
          last_name: string;
          nickname: string | null;
          birth_date: string | null;
          death_date: string | null;
          birth_place: string | null;
          resting_place: string | null;
          obituary: string | null;
          profile_photo_url: string | null;
          privacy_level: PrivacyLevel;
          is_public: boolean;
          allow_guestbook: boolean;
          allow_candle_lighting: boolean;
          allow_contributions: boolean;
          view_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          slug: string;
          first_name: string;
          middle_name?: string | null;
          last_name: string;
          nickname?: string | null;
          birth_date?: string | null;
          death_date?: string | null;
          birth_place?: string | null;
          resting_place?: string | null;
          obituary?: string | null;
          profile_photo_url?: string | null;
          privacy_level?: PrivacyLevel;
          is_public?: boolean;
          allow_guestbook?: boolean;
          allow_candle_lighting?: boolean;
          allow_contributions?: boolean;
          view_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          slug?: string;
          first_name?: string;
          middle_name?: string | null;
          last_name?: string;
          nickname?: string | null;
          birth_date?: string | null;
          death_date?: string | null;
          birth_place?: string | null;
          resting_place?: string | null;
          obituary?: string | null;
          profile_photo_url?: string | null;
          privacy_level?: PrivacyLevel;
          is_public?: boolean;
          allow_guestbook?: boolean;
          allow_candle_lighting?: boolean;
          allow_contributions?: boolean;
          view_count?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      collaborators: {
        Row: {
          id: string;
          memorial_id: string;
          user_id: string | null;
          role: CollaboratorRole;
          invited_email: string | null;
          accepted_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          memorial_id: string;
          user_id?: string | null;
          role: CollaboratorRole;
          invited_email?: string | null;
          accepted_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          memorial_id?: string;
          user_id?: string | null;
          role?: CollaboratorRole;
          invited_email?: string | null;
          accepted_at?: string | null;
          created_at?: string;
        };
      };
      photos: {
        Row: {
          id: string;
          memorial_id: string;
          uploaded_by: string | null;
          url: string;
          thumbnail_url: string | null;
          caption: string | null;
          estimated_decade: string | null;
          is_profile_photo: boolean;
          is_colorized: boolean;
          is_enhanced: boolean;
          original_url: string | null;
          album_id: string | null;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          memorial_id: string;
          uploaded_by?: string | null;
          url: string;
          thumbnail_url?: string | null;
          caption?: string | null;
          estimated_decade?: string | null;
          is_profile_photo?: boolean;
          is_colorized?: boolean;
          is_enhanced?: boolean;
          original_url?: string | null;
          album_id?: string | null;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          memorial_id?: string;
          uploaded_by?: string | null;
          url?: string;
          thumbnail_url?: string | null;
          caption?: string | null;
          estimated_decade?: string | null;
          is_profile_photo?: boolean;
          is_colorized?: boolean;
          is_enhanced?: boolean;
          original_url?: string | null;
          album_id?: string | null;
          sort_order?: number;
          created_at?: string;
        };
      };
      albums: {
        Row: {
          id: string;
          memorial_id: string;
          name: string;
          description: string | null;
          cover_photo_id: string | null;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          memorial_id: string;
          name: string;
          description?: string | null;
          cover_photo_id?: string | null;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          memorial_id?: string;
          name?: string;
          description?: string | null;
          cover_photo_id?: string | null;
          sort_order?: number;
          created_at?: string;
        };
      };
      stories: {
        Row: {
          id: string;
          memorial_id: string;
          author_id: string | null;
          author_name: string | null;
          title: string | null;
          content: string;
          is_approved: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          memorial_id: string;
          author_id?: string | null;
          author_name?: string | null;
          title?: string | null;
          content: string;
          is_approved?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          memorial_id?: string;
          author_id?: string | null;
          author_name?: string | null;
          title?: string | null;
          content?: string;
          is_approved?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      guestbook_entries: {
        Row: {
          id: string;
          memorial_id: string;
          author_name: string;
          author_email: string | null;
          message: string;
          is_approved: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          memorial_id: string;
          author_name: string;
          author_email?: string | null;
          message: string;
          is_approved?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          memorial_id?: string;
          author_name?: string;
          author_email?: string | null;
          message?: string;
          is_approved?: boolean;
          created_at?: string;
        };
      };
      candle_lightings: {
        Row: {
          id: string;
          memorial_id: string;
          lit_by_name: string | null;
          lit_by_user_id: string | null;
          message: string | null;
          created_at: string;
          expires_at: string;
        };
        Insert: {
          id?: string;
          memorial_id: string;
          lit_by_name?: string | null;
          lit_by_user_id?: string | null;
          message?: string | null;
          created_at?: string;
          expires_at?: string;
        };
        Update: {
          id?: string;
          memorial_id?: string;
          lit_by_name?: string | null;
          lit_by_user_id?: string | null;
          message?: string | null;
          created_at?: string;
          expires_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      subscription_tier: SubscriptionTier;
      privacy_level: PrivacyLevel;
      collaborator_role: CollaboratorRole;
    };
  };
}

// Helper types for easier usage
export type User = Database['public']['Tables']['users']['Row'];
export type Memorial = Database['public']['Tables']['memorials']['Row'];
export type Collaborator = Database['public']['Tables']['collaborators']['Row'];
export type Photo = Database['public']['Tables']['photos']['Row'];
export type Album = Database['public']['Tables']['albums']['Row'];
export type Story = Database['public']['Tables']['stories']['Row'];
export type GuestbookEntry = Database['public']['Tables']['guestbook_entries']['Row'];
export type CandleLighting = Database['public']['Tables']['candle_lightings']['Row'];

// Insert types
export type UserInsert = Database['public']['Tables']['users']['Insert'];
export type MemorialInsert = Database['public']['Tables']['memorials']['Insert'];
export type CollaboratorInsert = Database['public']['Tables']['collaborators']['Insert'];
export type PhotoInsert = Database['public']['Tables']['photos']['Insert'];
export type StoryInsert = Database['public']['Tables']['stories']['Insert'];

// Update types
export type UserUpdate = Database['public']['Tables']['users']['Update'];
export type MemorialUpdate = Database['public']['Tables']['memorials']['Update'];
