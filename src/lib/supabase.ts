import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types for TypeScript
export interface Database {
  public: {
    Tables: {
      documents: {
        Row: {
          id: string;
          url: string;
          title: string;
          content: string;
          embedding: number[];
          metadata: Record<string, any>;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          url: string;
          title: string;
          content: string;
          embedding: number[];
          metadata?: Record<string, any>;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          url?: string;
          title?: string;
          content?: string;
          embedding?: number[];
          metadata?: Record<string, any>;
          created_at?: string;
          updated_at?: string;
        };
      };
      queries: {
        Row: {
          id: string;
          question: string;
          answer: string;
          sources: string[];
          created_at: string;
        };
        Insert: {
          id?: string;
          question: string;
          answer: string;
          sources?: string[];
          created_at?: string;
        };
        Update: {
          id?: string;
          question?: string;
          answer?: string;
          sources?: string[];
          created_at?: string;
        };
      };
    };
  };
}

