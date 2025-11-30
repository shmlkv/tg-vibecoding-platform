export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          created_at: string;
          first_name: string | null;
          id: string;
          language_code: string | null;
          last_name: string | null;
          photo_url: string | null;
          updated_at: string;
          username: string | null;
        };
        Insert: {
          created_at?: string;
          first_name?: string | null;
          id: string;
          language_code?: string | null;
          last_name?: string | null;
          photo_url?: string | null;
          updated_at?: string;
          username?: string | null;
        };
        Update: {
          created_at?: string;
          first_name?: string | null;
          id?: string;
          language_code?: string | null;
          last_name?: string | null;
          photo_url?: string | null;
          updated_at?: string;
          username?: string | null;
        };
        Relationships: [];
      };
      posts: {
        Row: {
          created_at: string;
          id: string;
          likes_count: number;
          prompt: string;
          title: string;
          status: 'pending' | 'ready' | 'failed';
          updated_at: string;
          user_id: string | null;
          generation_error: string | null;
          v0_chat_id: string | null;
          v0_demo_url: string | null;
          v0_project_id: string | null;
          v0_project_web_url: string | null;
          project_id: number | null;
          is_published: boolean | null;
          model_id: string | null;
        };
        Insert: {
          created_at?: string;
          id?: string;
          likes_count?: number;
          prompt: string;
          title: string;
          status?: 'pending' | 'ready' | 'failed';
          updated_at?: string;
          user_id?: string | null;
          generation_error?: string | null;
          v0_chat_id?: string | null;
          v0_demo_url?: string | null;
          v0_project_id?: string | null;
          v0_project_web_url?: string | null;
          project_id?: number | null;
          is_published?: boolean;
          model_id?: string | null;
        };
        Update: {
          created_at?: string;
          id?: string;
          likes_count?: number;
          prompt?: string;
          title?: string;
          status?: 'pending' | 'ready' | 'failed';
          updated_at?: string;
          user_id?: string | null;
          generation_error?: string | null;
          v0_chat_id?: string | null;
          v0_demo_url?: string | null;
          v0_project_id?: string | null;
          v0_project_web_url?: string | null;
          project_id?: number | null;
          is_published?: boolean;
          model_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'posts_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'posts_project_id_fkey';
            columns: ['project_id'];
            referencedRelation: 'projects';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'posts_model_id_fkey';
            columns: ['model_id'];
            referencedRelation: 'models';
            referencedColumns: ['id'];
          },
        ];
      };
      models: {
        Row: {
          id: string;
          name: string;
          provider: string;
          description: string | null;
          avatar_url: string | null;
          is_free: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          name: string;
          provider: string;
          description?: string | null;
          avatar_url?: string | null;
          is_free?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          provider?: string;
          description?: string | null;
          avatar_url?: string | null;
          is_free?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      post_likes: {
        Row: {
          created_at: string;
          post_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          post_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          post_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'post_likes_post_id_fkey';
            columns: ['post_id'];
            referencedRelation: 'posts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'post_likes_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      projects: {
        Row: {
          id: number;
          title: string;
          description: string | null;
          html_content: string;
          user_id: number | null;
          edit_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          title: string;
          description?: string | null;
          html_content: string;
          user_id?: number | null;
          edit_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          title?: string;
          description?: string | null;
          html_content?: string;
          user_id?: number | null;
          edit_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'projects_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      user_settings: {
        Row: {
          user_id: number;
          openrouter_api_key: string | null;
          selected_model: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: number;
          openrouter_api_key?: string | null;
          selected_model?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: number;
          openrouter_api_key?: string | null;
          selected_model?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'user_settings_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

// Helper types for projects
export type Project = Database['public']['Tables']['projects']['Row'];
export type ProjectInsert = Database['public']['Tables']['projects']['Insert'];
export type ProjectUpdate = Database['public']['Tables']['projects']['Update'];

// Helper types for user settings
export type UserSettings = Database['public']['Tables']['user_settings']['Row'];
export type UserSettingsInsert = Database['public']['Tables']['user_settings']['Insert'];
export type UserSettingsUpdate = Database['public']['Tables']['user_settings']['Update'];

// Helper types for models
export type Model = Database['public']['Tables']['models']['Row'];
export type ModelInsert = Database['public']['Tables']['models']['Insert'];
export type ModelUpdate = Database['public']['Tables']['models']['Update'];
