import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY || 'placeholder-key',
  dangerouslyAllowBrowser: true // Note: In production, use a backend proxy
})

export class OpenAIService {
  static async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: text,
        encoding_format: 'float'
      })
      
      return response.data[0].embedding
    } catch (error) {
      console.error('Error generating embedding:', error)
      throw new Error('Failed to generate embedding')
    }
  }

  static async generateAnswer(question: string, context: string): Promise<string> {
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `You are a helpful AI assistant. Answer the user's question based on the provided context. 
            If the context doesn't contain enough information to answer the question, say so. 
            Always provide accurate and helpful responses.`
          },
          {
            role: 'user',
            content: `Context: ${context}\n\nQuestion: ${question}`
          }
        ],
        max_tokens: 500,
        temperature: 0.7
      })
      
      return response.choices[0].message.content || 'No answer generated'
    } catch (error) {
      console.error('Error generating answer:', error)
      throw new Error('Failed to generate answer')
    }
  }

  static async extractContentFromUrl(url: string): Promise<{ title: string; content: string }> {
    try {
      // This would typically be done on the backend
      // For now, we'll simulate content extraction
      const response = await fetch(`https://api.microlink.io?url=${encodeURIComponent(url)}`)
      const data = await response.json()
      
      if (data.status === 'success') {
        return {
          title: data.data.title || 'Untitled',
          content: data.data.description || 'No content available'
        }
      } else {
        throw new Error('Failed to extract content')
      }
    } catch (error) {
      console.error('Error extracting content:', error)
      // Fallback to a mock response for development
      return {
        title: 'Sample Content',
        content: 'This is sample content extracted from the URL. In production, this would be the actual webpage content.'
      }
    }
  }
}

