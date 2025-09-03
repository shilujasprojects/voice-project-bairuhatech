// Mock LLM Service for Development
// This simulates OpenAI API functionality without requiring external API keys

export class MockLLMService {
  private static mockEmbeddings: Map<string, number[]> = new Map()
  private static mockResponses: Map<string, string> = new Map()

  static async generateEmbedding(text: string): Promise<number[]> {
    // Generate a deterministic mock embedding based on text content
    const hash = this.hashString(text).toString()
    if (!this.mockEmbeddings.has(hash)) {
      // Create a mock 1536-dimensional vector
      const embedding = new Array(1536).fill(0).map((_, i) => {
        const seed = this.hashString(text) + i
        return (Math.sin(seed) * 0.5 + 0.5) // Values between 0 and 1
      })
      this.mockEmbeddings.set(hash, embedding)
    }
    return this.mockEmbeddings.get(hash)!
  }

  static async generateAnswer(question: string, context: string): Promise<string> {
    // Generate a contextual answer based on the question and context
    const prompt = `${question}\n\nContext: ${context}`
    const hash = this.hashString(prompt).toString()
    
    if (!this.mockResponses.has(hash)) {
      const answer = this.generateMockAnswer(question, context)
      this.mockResponses.set(hash, answer)
    }
    
    return this.mockResponses.get(hash)!
  }

  static async extractContentFromUrl(url: string): Promise<{ title: string; content: string }> {
    try {
      // Try to fetch real content from the URL using a CORS proxy
      const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`
      const response = await fetch(proxyUrl)
      
      if (response.ok) {
        const data = await response.json()
        const html = data.contents || ''
        
        // Extract title from HTML
        const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
        const title = titleMatch ? titleMatch[1].trim() : this.extractTitleFromUrl(url)
        
        // Clean HTML content and extract text
        const content = this.cleanHtmlContent(html)
        
        if (content.length > 100) {
          return { title, content }
        }
      }
    } catch (error) {
      console.log('Failed to fetch real content, using fallback:', error)
    }

    // Fallback to intelligent mock content based on URL
    return this.generateIntelligentMockContent(url)
  }

  private static extractTitleFromUrl(url: string): string {
    try {
      const urlObj = new URL(url)
      const hostname = urlObj.hostname
      const pathname = urlObj.pathname
      
      // Generate meaningful titles from URL parts
      if (hostname.includes('wikipedia')) {
        return 'Wikipedia Article'
      } else if (hostname.includes('react') || hostname.includes('js')) {
        return 'React Documentation'
      } else if (hostname.includes('python')) {
        return 'Python Tutorial'
      } else if (hostname.includes('ai') || hostname.includes('intelligence')) {
        return 'AI & Machine Learning Guide'
      } else if (hostname.includes('github')) {
        return 'GitHub Repository'
      } else if (hostname.includes('stackoverflow')) {
        return 'Stack Overflow Discussion'
      } else if (hostname.includes('medium')) {
        return 'Medium Article'
      } else if (hostname.includes('dev.to')) {
        return 'Dev.to Blog Post'
      } else {
        // Generate title from pathname
        const pathParts = pathname.split('/').filter(part => part.length > 0)
        if (pathParts.length > 0) {
          const lastPart = pathParts[pathParts.length - 1]
            .replace(/[-_]/g, ' ')
            .replace(/\.[^/.]+$/, '') // Remove file extension
          return lastPart.charAt(0).toUpperCase() + lastPart.slice(1)
        }
        return hostname.replace('www.', '').replace('.com', '').replace('.org', '').replace('.net', '')
      }
    } catch {
      return 'Web Content'
    }
  }

  private static cleanHtmlContent(html: string): string {
    // Remove script and style tags
    let content = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
      .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
      .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
      .replace(/<aside[^>]*>[\s\S]*?<\/aside>/gi, '')
    
    // Remove HTML tags but keep line breaks
    content = content
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n')
      .replace(/<\/div>/gi, '\n')
      .replace(/<\/h[1-6]>/gi, '\n')
      .replace(/<[^>]+>/g, ' ')
    
    // Decode HTML entities
    content = content
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
    
    // Clean up whitespace
    content = content
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n/g, '\n')
      .trim()
    
    return content
  }

  private static generateIntelligentMockContent(url: string): { title: string; content: string } {
    const urlLower = url.toLowerCase()
    const hostname = new URL(url).hostname.toLowerCase()
    
    // Dynamic content based on URL analysis
    if (urlLower.includes('wikipedia') || hostname.includes('wikipedia')) {
      return {
        title: 'Wikipedia Article',
        content: `This is a comprehensive Wikipedia article covering various aspects of the topic. The content includes detailed explanations, historical context, and relevant examples. Wikipedia articles are collaboratively edited and provide reliable information from multiple sources. The article contains sections covering different aspects, references to external sources, and links to related topics for further exploration.`
      }
    } else if (urlLower.includes('react') || urlLower.includes('js') || hostname.includes('react')) {
      return {
        title: 'React Documentation & Tutorials',
        content: `React is a powerful JavaScript library for building user interfaces. This documentation covers React fundamentals, component lifecycle, state management, and advanced patterns. It includes practical examples, code snippets, and best practices for building scalable applications. The content explains React hooks, context API, and modern React patterns for optimal performance and maintainability.`
      }
    } else if (urlLower.includes('python') || hostname.includes('python')) {
      return {
        title: 'Python Programming Guide',
        content: `Python is a versatile high-level programming language known for its simplicity and readability. This guide covers Python syntax, data structures, object-oriented programming, and popular frameworks. It includes practical examples, coding exercises, and real-world applications in web development, data science, machine learning, and automation. The content explains Python best practices and design patterns.`
      }
    } else if (urlLower.includes('ai') || urlLower.includes('intelligence') || hostname.includes('ai')) {
      return {
        title: 'Artificial Intelligence & Machine Learning',
        content: `Artificial Intelligence (AI) is a branch of computer science that aims to create intelligent machines capable of performing tasks that typically require human intelligence. AI encompasses machine learning, neural networks, deep learning, natural language processing, and computer vision. Machine learning is a subset of AI that enables computers to learn and improve from experience without being explicitly programmed. Neural networks are computational models inspired by biological neural networks in the human brain. Deep learning uses multiple layers of neural networks to analyze various factors of data. AI applications include virtual assistants, autonomous vehicles, medical diagnosis, financial analysis, and creative content generation. The field continues to evolve with breakthroughs in large language models, reinforcement learning, and explainable AI.`
      }
    } else if (urlLower.includes('web') || urlLower.includes('frontend') || hostname.includes('web')) {
      return {
        title: 'Web Development & Frontend Technologies',
        content: `Modern web development involves HTML5, CSS3, JavaScript, and various frameworks. This content covers responsive design, progressive web apps, modern JavaScript features, and frontend build tools. It includes tutorials on creating interactive user interfaces, optimizing performance, and implementing modern web standards. The content explains best practices for accessibility, SEO, and cross-browser compatibility.`
      }
    } else if (urlLower.includes('programming') || urlLower.includes('coding') || hostname.includes('programming')) {
      return {
        title: 'Programming & Software Development',
        content: `Software development encompasses various programming languages, design patterns, and development methodologies. This resource covers software architecture, clean code principles, testing strategies, and deployment practices. It includes tutorials on version control, debugging techniques, and collaborative development workflows. The content explains modern development practices and tools used in professional software engineering.`
      }
    } else {
      // Generic but intelligent content based on domain
      return {
        title: this.extractTitleFromUrl(url),
        content: `This is a comprehensive resource covering various aspects of the topic. The content includes detailed explanations, practical examples, and relevant information suitable for learning and reference. The material is regularly updated and maintained to provide accurate and current information. It covers both theoretical concepts and practical applications, making it useful for beginners and advanced users alike.`
      }
    }
  }

  private static hashString(str: string): number {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash)
  }

  private static generateMockAnswer(question: string, context: string): string {
    const questionLower = question.toLowerCase()
    
    // Generate contextual answers based on question keywords
    if (questionLower.includes('what is') || questionLower.includes('define')) {
      return `Based on the provided context, this refers to a comprehensive concept that encompasses various aspects and applications. The information suggests it's an important topic with multiple dimensions worth exploring further. The context provides detailed explanations and examples that help clarify the concept and its practical implications.`
    } else if (questionLower.includes('how') || questionLower.includes('process')) {
      return `The process involves several key steps as outlined in the context. First, you need to understand the fundamentals, then apply the appropriate methodology, and finally implement the solution while following best practices. The context provides specific guidance on each step and common pitfalls to avoid.`
    } else if (questionLower.includes('why') || questionLower.includes('benefit')) {
      return `The benefits are numerous and well-documented in the context. This approach offers improved efficiency, better results, and enhanced user experience compared to traditional methods. The context explains the advantages in detail and provides examples of successful implementations.`
    } else if (questionLower.includes('example') || questionLower.includes('instance')) {
      return `Examples can be found throughout the context, demonstrating various use cases and implementation scenarios. These examples show practical applications and real-world usage patterns that help illustrate the concepts discussed. The context provides concrete instances that make the information more accessible and understandable.`
    } else {
      return `Based on the provided context, I can provide you with a comprehensive answer. The information suggests that this topic is well-covered and includes various aspects that would be helpful for your understanding. The context provides detailed explanations, practical insights, and relevant examples that support the answer.`
    }
  }

  // Simulate API delay for realistic experience
  static async simulateDelay(ms: number = 1000): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}
