// Mock Database Service for Development
// This simulates Supabase database functionality without requiring external setup

import { ContentItem, QueryResult } from './supabase'
import { MockLLMService } from './mockLLMService'

export class MockDatabaseService {
  private static contentStore: Map<string, ContentItem> = new Map()
  private static queryHistory: Array<{ question: string; answer: string; timestamp: string }> = []

  static async ingestUrl(url: string): Promise<ContentItem> {
    // Simulate processing delay
    await MockLLMService.simulateDelay(1500)
    
    // Extract content using mock LLM service
    const { title, content } = await MockLLMService.extractContentFromUrl(url)
    
    // Generate mock embedding
    const embedding = await MockLLMService.generateEmbedding(content)
    
    // Create content item
    const contentItem: ContentItem = {
      id: this.generateId(),
      url,
      title,
      content,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    // Store in mock database
    this.contentStore.set(contentItem.id, contentItem)
    
    return contentItem
  }

  static async searchContent(query: string, limit: number = 5): Promise<(ContentItem & { relevance: number })[]> {
    // Simulate search delay
    await MockLLMService.simulateDelay(800)
    
    // Generate query embedding
    const queryEmbedding = await MockLLMService.generateEmbedding(query)
    
    // Mock similarity search - return content based on query keywords
    const queryLower = query.toLowerCase()
    const relevantContent: (ContentItem & { relevance: number })[] = []
    
    for (const item of this.contentStore.values()) {
      const contentLower = item.content.toLowerCase()
      const titleLower = item.title.toLowerCase()
      
      // Simple keyword matching for demo purposes
      let relevance = 0
      if (queryLower.includes('react') && (contentLower.includes('react') || titleLower.includes('react'))) {
        relevance = 0.9
      } else if (queryLower.includes('python') && (contentLower.includes('python') || titleLower.includes('python'))) {
        relevance = 0.9
      } else if (queryLower.includes('ai') && (contentLower.includes('ai') || titleLower.includes('ai'))) {
        relevance = 0.9
      } else if (queryLower.includes('web') && (contentLower.includes('web') || titleLower.includes('web'))) {
        relevance = 0.8
      } else if (queryLower.includes('programming') && (contentLower.includes('programming') || titleLower.includes('programming'))) {
        relevance = 0.8
      } else {
        // Generic relevance for other queries
        relevance = 0.6 + Math.random() * 0.3
      }
      
      if (relevance > 0.5) {
        relevantContent.push({ ...item, relevance })
      }
    }
    
    // Sort by relevance and limit results
    return relevantContent
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, limit)
  }

  static async queryContent(question: string): Promise<QueryResult> {
    // Simulate processing delay
    await MockLLMService.simulateDelay(1200)
    
    // Search for relevant content
    const relevantContent = await this.searchContent(question, 3)
    
    if (relevantContent.length === 0) {
      return {
        answer: "I don't have enough information to answer your question. Please try ingesting some content first by adding URLs in the Content Ingestion tab.",
        sources: []
      }
    }
    
    // Combine relevant content for context
    const context = relevantContent
      .map(item => `${item.title}:\n${item.content}`)
      .join('\n\n')
    
    // Generate answer using mock LLM service
    const answer = await MockLLMService.generateAnswer(question, context)
    
    // Format sources
    const sources = relevantContent.map(item => ({
      url: item.url,
      title: item.title,
      relevance: item.relevance,
      content_snippet: item.content.substring(0, 200) + '...'
    }))
    
    // Store query in history
    this.queryHistory.push({
      question,
      answer,
      timestamp: new Date().toISOString()
    })
    
    return { answer, sources }
  }

  static async getAllContent(): Promise<ContentItem[]> {
    // Simulate database query delay
    await MockLLMService.simulateDelay(500)
    
    return Array.from(this.contentStore.values())
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  }

  static async deleteContent(id: string): Promise<void> {
    // Simulate delete delay
    await MockLLMService.simulateDelay(300)
    
    this.contentStore.delete(id)
  }

  static async getQueryHistory(): Promise<Array<{ question: string; answer: string; timestamp: string }>> {
    return this.queryHistory
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  }

  static async clearAllData(): Promise<void> {
    this.contentStore.clear()
    this.queryHistory = []
  }

  static async getStats(): Promise<{
    totalContent: number
    totalQueries: number
    lastIngestion: string | null
    lastQuery: string | null
  }> {
    const lastIngestion = this.contentStore.size > 0 
      ? Array.from(this.contentStore.values())
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]?.created_at
      : null
    
    const lastQuery = this.queryHistory.length > 0 
      ? this.queryHistory[this.queryHistory.length - 1]?.timestamp
      : null
    
    return {
      totalContent: this.contentStore.size,
      totalQueries: this.queryHistory.length,
      lastIngestion,
      lastQuery
    }
  }

  private static generateId(): string {
    return 'mock-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9)
  }
}
