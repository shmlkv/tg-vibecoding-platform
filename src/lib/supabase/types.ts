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
          v0_chat_id: string;
          v0_demo_url: string;
          v0_project_id: string;
          v0_project_web_url: string | null;
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
          v0_chat_id: string;
          v0_demo_url: string;
          v0_project_id: string;
          v0_project_web_url?: string | null;
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
          v0_chat_id?: string;
          v0_demo_url?: string;
          v0_project_id?: string;
          v0_project_web_url?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'posts_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
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
