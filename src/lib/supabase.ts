import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

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

