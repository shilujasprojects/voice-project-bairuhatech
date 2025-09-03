import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Check if we have valid environment variables
const hasValidConfig = supabaseUrl && supabaseAnonKey && 
  supabaseUrl.startsWith('https://') && 
  supabaseAnonKey.length > 0

// Only create the client if we have valid configuration
export const supabase = hasValidConfig 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

// Helper function to check if Supabase is available
export const isSupabaseAvailable = () => !!supabase

// Database types for our content and embeddings
export interface ContentItem {
  id: string
  url: string
  title: string
  content: string
  created_at: string
  updated_at: string
}

export interface Embedding {
  id: string
  content_id: string
  embedding: number[]
  created_at: string
}

export interface QueryResult {
  answer: string
  sources: Array<{
    url: string
    title: string
    relevance: number
    content_snippet: string
  }>
}

