import OpenAI from 'openai';

const openaiApiKey = import.meta.env.VITE_OPENAI_API_KEY;

if (!openaiApiKey) {
  throw new Error('Missing OpenAI API key. Please check your .env file.');
}

export const openai = new OpenAI({
  apiKey: openaiApiKey,
  dangerouslyAllowBrowser: true, // Note: In production, use a backend API
});

export interface EmbeddingResponse {
  embedding: number[];
  usage: {
    prompt_tokens: number;
    total_tokens: number;
  };
}

export interface ChatResponse {
  answer: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class OpenAIService {
  /**
   * Generate embeddings for text content
   */
  static async generateEmbedding(text: string): Promise<EmbeddingResponse> {
    try {
      const response = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: text,
        encoding_format: 'float',
      });

      return {
        embedding: response.data[0].embedding,
        usage: response.usage,
      };
    } catch (error) {
      console.error('Error generating embedding:', error);
      throw new Error('Failed to generate embedding');
    }
  }

  /**
   * Generate answer using chat completion with context
   */
  static async generateAnswer(
    question: string,
    context: string,
    sources: string[]
  ): Promise<ChatResponse> {
    try {
      const systemPrompt = `You are a helpful AI assistant that answers questions based on the provided context. 
      Always cite your sources and provide accurate, helpful information. 
      If the context doesn't contain enough information to answer the question, say so clearly.
      
      Context: ${context}
      
      Sources: ${sources.join(', ')}`;

      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: question }
        ],
        temperature: 0.7,
        max_tokens: 500,
      });

      const answer = response.choices[0]?.message?.content || 'No answer generated';

      return {
        answer,
        usage: response.usage,
      };
    } catch (error) {
      console.error('Error generating answer:', error);
      throw new Error('Failed to generate answer');
    }
  }

  /**
   * Extract and clean text content from HTML
   */
  static cleanTextContent(html: string): string {
    // Remove HTML tags and decode entities
    const text = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/\s+/g, ' ')
      .trim();

    return text;
  }
}

