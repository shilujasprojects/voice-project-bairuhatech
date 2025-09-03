import { supabase, ContentItem, QueryResult } from './supabase'
import { OpenAIService } from './openai'

export class ContentService {
  static async ingestUrl(url: string): Promise<ContentItem> {
    try {
      // Extract content from URL
      const { title, content } = await OpenAIService.extractContentFromUrl(url)
      
      // Generate embedding for the content
      const embedding = await OpenAIService.generateEmbedding(content)
      
      // Store content in Supabase
      const { data: contentData, error: contentError } = await supabase
        .from('content')
        .insert({
          url,
          title,
          content,
          embedding
        })
        .select()
        .single()
      
      if (contentError) {
        throw new Error(`Failed to store content: ${contentError.message}`)
      }
      
      return contentData
    } catch (error) {
      console.error('Error ingesting URL:', error)
      throw new Error('Failed to ingest URL')
    }
  }

  static async searchContent(query: string, limit: number = 5): Promise<ContentItem[]> {
    try {
      // Generate embedding for the query
      const queryEmbedding = await OpenAIService.generateEmbedding(query)
      
      // Perform vector similarity search
      const { data, error } = await supabase.rpc('match_content', {
        query_embedding: queryEmbedding,
        match_threshold: 0.7,
        match_count: limit
      })
      
      if (error) {
        throw new Error(`Search failed: ${error.message}`)
      }
      
      return data || []
    } catch (error) {
      console.error('Error searching content:', error)
      throw new Error('Failed to search content')
    }
  }

  static async queryContent(question: string): Promise<QueryResult> {
    try {
      // Search for relevant content
      const relevantContent = await this.searchContent(question, 3)
      
      if (relevantContent.length === 0) {
        return {
          answer: "I don't have enough information to answer your question. Please try ingesting some content first.",
          sources: []
        }
      }
      
      // Combine relevant content for context
      const context = relevantContent
        .map(item => `${item.title}:\n${item.content}`)
        .join('\n\n')
      
      // Generate answer using OpenAI
      const answer = await OpenAIService.generateAnswer(question, context)
      
      // Format sources
      const sources = relevantContent.map(item => ({
        url: item.url,
        title: item.title,
        relevance: 0.9, // This would be calculated based on similarity score
        content_snippet: item.content.substring(0, 200) + '...'
      }))
      
      return { answer, sources }
    } catch (error) {
      console.error('Error querying content:', error)
      throw new Error('Failed to process query')
    }
  }

  static async getAllContent(): Promise<ContentItem[]> {
    try {
      const { data, error } = await supabase
        .from('content')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) {
        throw new Error(`Failed to fetch content: ${error.message}`)
      }
      
      return data || []
    } catch (error) {
      console.error('Error fetching content:', error)
      throw new Error('Failed to fetch content')
    }
  }

  static async deleteContent(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('content')
        .delete()
        .eq('id', id)
      
      if (error) {
        throw new Error(`Failed to delete content: ${error.message}`)
      }
    } catch (error) {
      console.error('Error deleting content:', error)
      throw new Error('Failed to delete content')
    }
  }
}

