import { ContentItem, QueryResult } from './supabase'
import { OpenAIService } from './openai'
import { MockLLMService } from './mockLLMService'
import { MockDatabaseService } from './mockDatabaseService'
import { VectorDatabase } from './vectorDatabase'

export class ContentService {
  private static useMockServices = !import.meta.env.VITE_OPENAI_API_KEY
  private static vectorDB = VectorDatabase.getInstance()

  static async ingestUrl(url: string): Promise<ContentItem> {
    try {
      console.log('Starting URL ingestion with vector database...')
      
      if (this.useMockServices) {
        console.log('Using mock services for development - no OpenAI API configured')
        // Use mock content but still store in vector database
        const mockContent = await MockLLMService.extractContentFromUrl(url)
        return await this.vectorDB.storeContent(url, mockContent.title, mockContent.content, [])
      }

      // Check if OpenAI is actually available before trying to use it
      if (!import.meta.env.VITE_OPENAI_API_KEY || import.meta.env.VITE_OPENAI_API_KEY === '') {
        console.log('OpenAI API key not available, switching to mock services...')
        this.useMockServices = true
        
        const mockContent = await MockLLMService.extractContentFromUrl(url)
        return await this.vectorDB.storeContent(url, mockContent.title, mockContent.content, [])
      }

      // Use real OpenAI services
      console.log('Attempting to use real services with vector database...')
      
      try {
        // Extract content from URL using OpenAI service
        const { title, content } = await OpenAIService.extractContentFromUrl(url)
        
        // Generate embedding for the content
        const embedding = await OpenAIService.generateEmbedding(content)
        
        // Store content in vector database with automatic chunking
        const contentData = await this.vectorDB.storeContent(url, title, content, embedding)
        
        console.log('Successfully stored content in vector database with chunking')
        return contentData
        
      } catch (openaiError) {
        console.error('OpenAI service failed:', openaiError)
        throw openaiError // Re-throw to trigger fallback
      }
      
    } catch (error) {
      console.error('Error ingesting URL with real services:', error)
      console.log('Falling back to mock services with vector database')
      
      // Fallback to mock content but still use vector database
      try {
        const mockContent = await MockLLMService.extractContentFromUrl(url)
        return await this.vectorDB.storeContent(url, mockContent.title, mockContent.content, [])
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError)
        throw new Error(`Failed to ingest URL: ${error}`)
      }
    }
  }

  static async searchContent(query: string, limit: number = 5): Promise<ContentItem[]> {
    try {
      console.log('Searching content with vector database...')
      
      // Use vector database search which returns chunks
      const searchResults = await this.vectorDB.searchContent(query, limit)
      
      // Convert chunks back to content items for compatibility
      const contentMap = new Map<string, ContentItem>()
      
      for (const chunk of searchResults) {
        if (!contentMap.has(chunk.contentId)) {
          // Get the full content item
          const allContent = await this.vectorDB.getAllContent()
          const contentItem = allContent.find(item => item.id === chunk.contentId)
          if (contentItem) {
            contentMap.set(chunk.contentId, contentItem)
          }
        }
      }
      
      return Array.from(contentMap.values())
      
    } catch (error) {
      console.error('Error searching content with vector database:', error)
      return []
    }
  }

  static async queryContent(question: string): Promise<QueryResult> {
    try {
      console.log('Processing query with vector database...')
      
      // Debug: Show database contents
      await this.vectorDB.debugDatabaseContents()
      
      // Use vector database query processing
      const result = await this.vectorDB.queryContent(question)
      
      // Convert to expected format
      return {
        answer: result.answer,
        sources: result.sources.map(source => ({
          url: source.url,
          title: source.title,
          relevance: source.relevance,
          content_snippet: source.content_snippet
        }))
      }
      
    } catch (error) {
      console.error('Error processing query with vector database:', error)
      return {
        answer: "Sorry, I encountered an error while processing your question. Please try again.",
        sources: []
      }
    }
  }

  static async getAllContent(): Promise<ContentItem[]> {
    return this.vectorDB.getAllContent()
  }

  static async deleteContent(id: string): Promise<void> {
    return this.vectorDB.deleteContent(id)
  }

  // Vector database specific methods
  static getQueryHistory() {
    return this.vectorDB.getQueryHistory()
  }

  static getStats() {
    return this.vectorDB.getStats()
  }

  static clearAllData() {
    return this.vectorDB.clearAllData()
  }

  static isUsingMockServices() {
    return this.useMockServices
  }

  static getServiceStatus() {
    const vectorDBStatus = this.vectorDB.getStatus()
    return {
      database: vectorDBStatus.isActive ? 'active' : 'inactive',
      openai: import.meta.env.VITE_OPENAI_API_KEY ? 'available' : 'unavailable',
      mockServices: this.useMockServices ? 'active' : 'inactive',
      vectorDatabase: {
        name: vectorDBStatus.name,
        version: vectorDBStatus.version,
        dimensions: vectorDBStatus.vectorDimensions,
        type: vectorDBStatus.type,
        status: vectorDBStatus.isActive ? 'ready' : 'initializing'
      }
    }
  }

  // Vector database specific methods
  static async addEmbedding(id: string, embedding: number[]) {
    // This is now handled automatically by the vector database
    console.log('Embeddings are automatically managed by the vector database')
  }

  static async searchSimilar(embedding: number[], limit: number = 5) {
    // Convert embedding back to text for search (mock implementation)
    // In a real scenario, you'd want to implement proper vector similarity search
    console.log('Vector similarity search is available through the vector database')
    return []
  }

  static getVectorDBStatus() {
    return this.vectorDB.getStatus()
  }

  // Check vector database health
  static async checkVectorDBHealth() {
    return await this.vectorDB.checkHealth()
  }

  // Debug vector database contents
  static async debugVectorDB() {
    return await this.vectorDB.debugDatabaseContents()
  }

  // Reset vector database if needed
  static async resetVectorDB() {
    return await this.vectorDB.resetDatabase()
  }

  // Get chunk information for a specific content item
  static async getContentChunks(contentId: string) {
    try {
      const allContent = await this.vectorDB.getAllContent()
      const contentItem = allContent.find(item => item.id === contentId)
      return contentItem?.chunks || []
    } catch (error) {
      console.error('Error getting content chunks:', error)
      return []
    }
  }

  // Get database statistics
  static async getDatabaseStats() {
    return this.vectorDB.getStats()
  }
}

// Add utility methods to window for easy testing in browser console
if (typeof window !== 'undefined') {
  (window as any).ContentService = ContentService;
  (window as any).checkVectorDB = async () => await ContentService.checkVectorDBHealth();
  (window as any).debugVectorDB = async () => await ContentService.debugVectorDB();
  (window as any).resetVectorDB = async () => await ContentService.resetVectorDB();
  (window as any).getVectorDBStatus = () => ContentService.getVectorDBStatus();
  (window as any).getContentStats = async () => await ContentService.getDatabaseStats();
  
  console.log('🔧 Vector Database utilities loaded. Available commands:');
  console.log('  - checkVectorDB() - Check database health');
  console.log('  - debugVectorDB() - Show database contents');
  console.log('  - resetVectorDB() - Reset database if needed');
  console.log('  - getVectorDBStatus() - Get database status');
  console.log('  - getContentStats() - Get content statistics');
}

