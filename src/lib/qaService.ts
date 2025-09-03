import { supabase } from './supabase';
import { OpenAIService } from './openai';
import { ContentService } from './contentService';

export interface QueryResult {
  answer: string;
  sources: Array<{
    url: string;
    title: string;
    relevance: number;
    content: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class QAService {
  /**
   * Process a question and return an answer with sources
   */
  static async processQuestion(question: string): Promise<QueryResult> {
    try {
      // Search for relevant content using vector similarity
      const relevantDocs = await ContentService.searchSimilarContent(question, 3);
      
      if (relevantDocs.length === 0) {
        return {
          answer: "I don't have enough information to answer your question. Please ingest some content first by adding URLs in the Content Ingestion tab.",
          sources: [],
          usage: {
            prompt_tokens: 0,
            completion_tokens: 0,
            total_tokens: 0,
          },
        };
      }

      // Prepare context from relevant documents
      const context = relevantDocs
        .map(doc => `Source: ${doc.title} (${doc.url})\nContent: ${doc.content.substring(0, 1000)}...`)
        .join('\n\n');

      const sources = relevantDocs.map(doc => doc.url);

      // Generate answer using OpenAI
      const chatResponse = await OpenAIService.generateAnswer(question, context, sources);

      // Format sources for response
      const formattedSources = relevantDocs.map(doc => ({
        url: doc.url,
        title: doc.title,
        relevance: doc.similarity,
        content: doc.content.substring(0, 200) + '...',
      }));

      // Store the query and answer for analytics
      await this.storeQuery(question, chatResponse.answer, sources);

      return {
        answer: chatResponse.answer,
        sources: formattedSources,
        usage: chatResponse.usage,
      };

    } catch (error) {
      console.error('Q&A processing error:', error);
      throw new Error(`Failed to process question: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Store query and answer for analytics
   */
  private static async storeQuery(question: string, answer: string, sources: string[]): Promise<void> {
    try {
      await supabase
        .from('queries')
        .insert({
          question,
          answer,
          sources,
        });
    } catch (error) {
      console.error('Failed to store query:', error);
      // Don't throw error as this is not critical for the main functionality
    }
  }

  /**
   * Get query history
   */
  static async getQueryHistory(): Promise<Array<{
    id: string;
    question: string;
    answer: string;
    sources: string[];
    created_at: string;
  }>> {
    try {
      const { data, error } = await supabase
        .from('queries')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Get query history error:', error);
      throw error;
    }
  }

  /**
   * Get statistics about ingested content
   */
  static async getContentStats(): Promise<{
    totalDocuments: number;
    totalQueries: number;
    averageSimilarity: number;
  }> {
    try {
      // Get document count
      const { count: docCount } = await supabase
        .from('documents')
        .select('*', { count: 'exact', head: true });

      // Get query count
      const { count: queryCount } = await supabase
        .from('queries')
        .select('*', { count: 'exact', head: true });

      return {
        totalDocuments: docCount || 0,
        totalQueries: queryCount || 0,
        averageSimilarity: 0, // This would require additional calculation
      };
    } catch (error) {
      console.error('Get stats error:', error);
      return {
        totalDocuments: 0,
        totalQueries: 0,
        averageSimilarity: 0,
      };
    }
  }
}

