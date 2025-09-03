import { supabase } from './supabase';
import { OpenAIService } from './openai';

export interface DocumentMetadata {
  url: string;
  title: string;
  content: string;
  wordCount: number;
  extractedAt: string;
}

export interface IngestionResult {
  success: boolean;
  url: string;
  title?: string;
  message: string;
  metadata?: DocumentMetadata;
}

export class ContentService {
  /**
   * Extract content from a URL and store it in Supabase with embeddings
   */
  static async ingestUrl(url: string): Promise<IngestionResult> {
    try {
      // Extract content from URL
      const content = await this.extractContentFromUrl(url);
      if (!content) {
        return {
          success: false,
          url,
          message: 'Failed to extract content from URL',
        };
      }

      // Clean and process the content
      const cleanContent = OpenAIService.cleanTextContent(content.html);
      const title = content.title || url;
      
      // Truncate content if too long (OpenAI has token limits)
      const maxContentLength = 8000; // Conservative limit
      const truncatedContent = cleanContent.length > maxContentLength 
        ? cleanContent.substring(0, maxContentLength) + '...'
        : cleanContent;

      // Generate embedding for the content
      const embedding = await OpenAIService.generateEmbedding(truncatedContent);

      // Store in Supabase
      const { data, error } = await supabase
        .from('documents')
        .insert({
          url,
          title,
          content: truncatedContent,
          embedding: embedding.embedding,
          metadata: {
            wordCount: truncatedContent.split(' ').length,
            extractedAt: new Date().toISOString(),
            originalLength: cleanContent.length,
            truncated: cleanContent.length > maxContentLength,
          },
        })
        .select()
        .single();

      if (error) {
        console.error('Supabase insert error:', error);
        return {
          success: false,
          url,
          message: `Database error: ${error.message}`,
        };
      }

      return {
        success: true,
        url,
        title,
        message: 'Successfully ingested and stored',
        metadata: {
          url,
          title,
          content: truncatedContent,
          wordCount: truncatedContent.split(' ').length,
          extractedAt: new Date().toISOString(),
        },
      };

    } catch (error) {
      console.error('Ingestion error:', error);
      return {
        success: false,
        url,
        message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Extract content from a URL using a CORS proxy
   */
  private static async extractContentFromUrl(url: string): Promise<{ html: string; title: string } | null> {
    try {
      // Use a CORS proxy to fetch the content
      // In production, you should use a backend service or Supabase Edge Functions
      const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
      
      const response = await fetch(proxyUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const html = data.contents || '';

      // Extract title from HTML
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      const title = titleMatch ? titleMatch[1].trim() : url;

      return { html, title };
    } catch (error) {
      console.error('Content extraction error:', error);
      return null;
    }
  }

  /**
   * Search for similar content using vector similarity
   */
  static async searchSimilarContent(query: string, limit: number = 5): Promise<Array<{
    id: string;
    url: string;
    title: string;
    content: string;
    similarity: number;
  }>> {
    try {
      // Generate embedding for the query
      const queryEmbedding = await OpenAIService.generateEmbedding(query);

      // Perform vector similarity search in Supabase
      const { data, error } = await supabase.rpc('match_documents', {
        query_embedding: queryEmbedding.embedding,
        match_threshold: 0.7,
        match_count: limit,
      });

      if (error) {
        console.error('Vector search error:', error);
        throw new Error(`Search error: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Search error:', error);
      throw error;
    }
  }

  /**
   * Get all ingested documents
   */
  static async getAllDocuments(): Promise<Array<{
    id: string;
    url: string;
    title: string;
    created_at: string;
    metadata: any;
  }>> {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('id, url, title, created_at, metadata')
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Get documents error:', error);
      throw error;
    }
  }

  /**
   * Delete a document
   */
  static async deleteDocument(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', id);

      if (error) {
        throw new Error(`Delete error: ${error.message}`);
      }

      return true;
    } catch (error) {
      console.error('Delete document error:', error);
      return false;
    }
  }
}

