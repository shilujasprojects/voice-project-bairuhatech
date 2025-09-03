// Vector Database Service using IndexedDB for persistent storage
// Implements proper vector operations and content chunking

export interface ContentChunk {
  id: string;
  contentId: string;
  url: string;
  title: string;
  content: string;
  chunkIndex: number;
  embedding: number[];
  metadata: {
    chunkSize: number;
    overlap: number;
    createdAt: string;
  };
}

export interface ContentItem {
  id: string;
  url: string;
  title: string;
  content: string;
  chunks: ContentChunk[];
  created_at: string;
  updated_at: string;
  totalChunks: number;
}

export interface QueryResult {
  answer: string;
  sources: Array<{
    url: string;
    title: string;
    relevance: number;
    content_snippet: string;
    chunkIndex: number;
  }>;
  totalChunks: number;
}

export interface QueryHistory {
  id: string;
  question: string;
  answer: string;
  timestamp: string;
  sources: string[];
  queryEmbedding: number[];
}

export interface DatabaseStats {
  totalContent: number;
  totalChunks: number;
  totalQueries: number;
  databaseSize: number;
  vectorDimensions: number;
}

export class VectorDatabase {
  private static instance: VectorDatabase;
  private db: IDBDatabase | null = null;
  private readonly dbName = 'VoiceTransferVectorDB';
  private readonly version = 1;
  private readonly vectorDimensions = 1536; // OpenAI embedding dimensions

  private constructor() {
    this.initializeDatabase();
  }

  static getInstance(): VectorDatabase {
    if (!VectorDatabase.instance) {
      VectorDatabase.instance = new VectorDatabase();
    }
    return VectorDatabase.instance;
  }

  private initializeDatabase(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Check if IndexedDB is supported
        if (!window.indexedDB) {
          reject(new Error('IndexedDB is not supported in this browser'));
          return;
        }

        const request = indexedDB.open(this.dbName, this.version);

        request.onerror = () => {
          console.error('Failed to open database:', request.error);
          reject(new Error(`Failed to open database: ${request.error?.message || 'Unknown error'}`));
        };

        request.onsuccess = () => {
          try {
            this.db = request.result;
            
            // Add error handling for the database connection
            this.db.onerror = (event) => {
              console.error('Database error:', event);
            };
            
            this.db.onversionchange = () => {
              console.warn('Database version changed, closing connection');
              this.db?.close();
              this.db = null;
            };
            
            console.log('Vector database initialized successfully');
            resolve();
          } catch (error) {
            reject(new Error(`Error setting up database: ${error}`));
          }
        };

        request.onupgradeneeded = (event) => {
          try {
            const db = (event.target as IDBOpenDBRequest).result;

            // Create object stores
            if (!db.objectStoreNames.contains('content')) {
              const contentStore = db.createObjectStore('content', { keyPath: 'id' });
              contentStore.createIndex('url', 'url', { unique: true });
              contentStore.createIndex('created_at', 'created_at', { unique: false });
            }

            if (!db.objectStoreNames.contains('chunks')) {
              const chunksStore = db.createObjectStore('chunks', { keyPath: 'id' });
              chunksStore.createIndex('contentId', 'contentId', { unique: false });
              chunksStore.createIndex('url', 'url', { unique: false });
              chunksStore.createIndex('embedding', 'embedding', { unique: false });
            }

            if (!db.objectStoreNames.contains('queries')) {
              const queriesStore = db.createObjectStore('queries', { keyPath: 'id' });
              queriesStore.createIndex('timestamp', 'timestamp', { unique: false });
            }

            if (!db.objectStoreNames.contains('embeddings')) {
              const embeddingsStore = db.createObjectStore('embeddings', { keyPath: 'id' });
              embeddingsStore.createIndex('contentId', 'contentId', { unique: false });
            }

            console.log('Database schema created/updated');
          } catch (error) {
            reject(new Error(`Error creating database schema: ${error}`));
          }
        };

        request.onblocked = () => {
          console.warn('Database blocked - another tab might have it open');
        };

      } catch (error) {
        reject(new Error(`Error initializing database: ${error}`));
      }
    });
  }

  private async ensureDatabase(): Promise<IDBDatabase> {
    if (!this.db) {
      await this.initializeDatabase();
    }
    return this.db!;
  }

  // Content chunking with overlap for better vector search
  private chunkContent(content: string, chunkSize: number = 1000, overlap: number = 200): string[] {
    const chunks: string[] = [];
    let start = 0;
    
    while (start < content.length) {
      const end = Math.min(start + chunkSize, content.length);
      let chunk = content.substring(start, end);
      
      // Try to break at sentence boundaries for better semantic coherence
      if (end < content.length) {
        const lastPeriod = chunk.lastIndexOf('.');
        const lastExclamation = chunk.lastIndexOf('!');
        const lastQuestion = chunk.lastIndexOf('?');
        const lastBreak = Math.max(lastPeriod, lastExclamation, lastQuestion);
        
        if (lastBreak > start + chunkSize * 0.7) {
          chunk = chunk.substring(0, lastBreak + 1);
          start = start + lastBreak + 1 - overlap;
        } else {
          start = end - overlap;
        }
      } else {
        start = end;
      }
      
      // Only add chunks with meaningful content
      if (chunk.trim().length > 50) {
        chunks.push(chunk.trim());
      }
    }
    
    return chunks;
  }

  // Store content with automatic chunking and vectorization
  async storeContent(url: string, title: string, content: string, embedding: number[]): Promise<ContentItem> {
    try {
      const db = await this.ensureDatabase();
      
      // Generate content ID
      const contentId = `content_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Chunk the content
      const chunks = this.chunkContent(content);
      const contentChunks: ContentChunk[] = [];
      
      // Create chunks with metadata
      for (let i = 0; i < chunks.length; i++) {
        const chunkId = `${contentId}_chunk_${i}`;
        const chunk: ContentChunk = {
          id: chunkId,
          contentId,
          url,
          title,
          content: chunks[i],
          chunkIndex: i,
          embedding: embedding || this.generateMockEmbedding(chunks[i]),
          metadata: {
            chunkSize: chunks[i].length,
            overlap: i > 0 ? 200 : 0,
            createdAt: new Date().toISOString()
          }
        };
        contentChunks.push(chunk);
      }
      
      // Store content item
      const contentItem: ContentItem = {
        id: contentId,
        url,
        title,
        content,
        chunks: contentChunks,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        totalChunks: chunks.length
      };
      
      // Store in database
      await this.storeInTransaction(db, 'content', contentItem);
      
      // Store chunks
      for (const chunk of contentChunks) {
        await this.storeInTransaction(db, 'chunks', chunk);
      }
      
      // Store embeddings separately for efficient vector search
      if (embedding && embedding.length > 0) {
        await this.storeInTransaction(db, 'embeddings', {
          id: contentId,
          contentId,
          embedding,
          url,
          title
        });
      }
      
      console.log(`Successfully stored content: ${url} with ${chunks.length} chunks`);
      return contentItem;
      
    } catch (error) {
      console.error('Error storing content:', error);
      throw new Error(`Failed to store content: ${error}`);
    }
  }

  // Generate mock embedding for development (replace with real OpenAI embeddings)
  private generateMockEmbedding(content: string): number[] {
    // Simple hash-based mock embedding for development
    const hash = content.split('').reduce((a, b) => {
      a = ((a << 5) - a + b.charCodeAt(0)) & 0xffffffff;
      return a;
    }, 0);
    
    const embedding: number[] = [];
    for (let i = 0; i < this.vectorDimensions; i++) {
      embedding.push(Math.sin(hash + i) * 0.1);
    }
    return embedding;
  }

  // Vector similarity search using cosine similarity
  async searchSimilar(query: string, limit: number = 5): Promise<ContentChunk[]> {
    try {
      const db = await this.ensureDatabase();
      
      // Generate query embedding (mock for now, replace with OpenAI)
      const queryEmbedding = this.generateMockEmbedding(query);
      
      // Get all chunks with embeddings
      const chunks = await this.getAllFromStore(db, 'chunks');
      const results: { chunk: ContentChunk; similarity: number }[] = [];
      
      // Calculate cosine similarity for each chunk
      for (const chunk of chunks) {
        if (chunk.embedding && chunk.embedding.length === this.vectorDimensions) {
          const similarity = this.cosineSimilarity(queryEmbedding, chunk.embedding);
          results.push({ chunk, similarity });
        }
      }
      
      // Sort by similarity and return top results
      return results
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, limit)
        .map(result => result.chunk);
        
    } catch (error) {
      console.error('Error in vector search:', error);
      return [];
    }
  }

  // Cosine similarity calculation
  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length) return 0;
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }
    
    if (normA === 0 || normB === 0) return 0;
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  // Hybrid search: combines vector similarity with text relevance
  async searchContent(query: string, limit: number = 5): Promise<(ContentChunk & { relevance: number })[]> {
    try {
      // Get text-based results first (more reliable)
      const textResults = await this.textSearch(query, limit * 2);
      
      // If we have good text results, use them directly
      if (textResults.length > 0) {
        console.log(`🔍 Using text search results: ${textResults.length} chunks found`);
        return textResults.slice(0, limit);
      }
      
      // Fallback to vector similarity if no text results
      console.log(`🔍 Falling back to vector similarity search`);
      const vectorResults = await this.searchSimilar(query, limit);
      
      // Convert vector results to expected format
      return vectorResults.map(chunk => ({
        ...chunk,
        relevance: 0.5 // Default relevance for vector results
      }));
        
    } catch (error) {
      console.error('Error in hybrid search:', error);
      // Fallback to simple text search
      try {
        return await this.textSearch(query, limit);
      } catch (fallbackError) {
        console.error('Fallback search also failed:', fallbackError);
        return [];
      }
    }
  }

  // Text-based search for fallback
  private async textSearch(query: string, limit: number): Promise<(ContentChunk & { relevance: number })[]> {
    try {
      const db = await this.ensureDatabase();
      const chunks = await this.getAllFromStore(db, 'chunks');
      
      console.log(`🔍 Text search: Found ${chunks.length} chunks in database`);
      
      const queryLower = query.toLowerCase();
      const queryWords = queryLower.split(' ').filter(word => word.length > 2);
      const results: (ContentChunk & { relevance: number })[] = [];
      
      for (const chunk of chunks) {
        let relevance = 0;
        
        // Title relevance (exact match gets highest score)
        if (chunk.title.toLowerCase().includes(queryLower)) {
          relevance += 1.0;
          console.log(`✅ Title match: "${chunk.title}" contains "${queryLower}"`);
        }
        
        // Content relevance (exact match gets high score)
        const contentLower = chunk.content.toLowerCase();
        if (contentLower.includes(queryLower)) {
          relevance += 0.8;
          console.log(`✅ Content match: Content contains "${queryLower}"`);
        }
        
        // Partial phrase matching (for multi-word queries)
        const queryPhrases = this.generateQueryPhrases(queryLower);
        for (const phrase of queryPhrases) {
          if (contentLower.includes(phrase)) {
            relevance += 0.6;
            console.log(`✅ Phrase match: Content contains "${phrase}"`);
          }
        }
        
        // Individual word matching with synonyms
        for (const word of queryWords) {
          if (contentLower.includes(word)) {
            relevance += 0.3;
            console.log(`✅ Word match: Content contains "${word}"`);
          }
          // Check for synonyms and related terms
          const synonyms = this.getSynonyms(word);
          for (const synonym of synonyms) {
            if (contentLower.includes(synonym)) {
              relevance += 0.2;
              console.log(`✅ Synonym match: Content contains "${synonym}" (synonym of "${word}")`);
            }
          }
        }
        
        // Semantic relevance for AI/ML terms
        if (this.hasSemanticRelevance(queryLower, chunk.content.toLowerCase())) {
          relevance += 0.4;
          console.log(`✅ Semantic relevance: AI/ML terms detected`);
        }
        
        if (relevance > 0) {
          console.log(`📊 Chunk relevance score: ${relevance.toFixed(2)}`);
          results.push({ ...chunk, relevance });
        }
      }
      
      console.log(`📊 Text search results: ${results.length} chunks with relevance > 0`);
      return results
        .sort((a, b) => b.relevance - a.relevance)
        .slice(0, limit);
        
    } catch (error) {
      console.error('Error in text search:', error);
      return [];
    }
  }

  // Generate query phrases for better matching
  private generateQueryPhrases(query: string): string[] {
    const words = query.split(' ').filter(word => word.length > 2);
    const phrases: string[] = [];
    
    // Add original query
    phrases.push(query);
    
    // Add word combinations
    for (let i = 0; i < words.length - 1; i++) {
      phrases.push(words.slice(i, i + 2).join(' '));
    }
    
    return phrases;
  }

  // Get synonyms for common terms
  private getSynonyms(word: string): string[] {
    const synonymMap: { [key: string]: string[] } = {
      'ai': ['artificial intelligence', 'machine learning', 'intelligence', 'smart'],
      'intelligence': ['ai', 'artificial', 'smart', 'cognitive', 'brain'],
      'artificial': ['ai', 'intelligence', 'synthetic', 'man-made'],
      'machine': ['computer', 'automated', 'system', 'algorithm'],
      'learning': ['training', 'education', 'knowledge', 'understanding'],
      'neural': ['brain', 'network', 'cognitive', 'intelligence'],
      'network': ['system', 'connection', 'web', 'structure'],
      'algorithm': ['method', 'procedure', 'process', 'technique'],
      'data': ['information', 'facts', 'details', 'content'],
      'model': ['system', 'framework', 'structure', 'approach']
    };
    
    return synonymMap[word] || [];
  }

  // Check semantic relevance for AI/ML terms
  private hasSemanticRelevance(query: string, content: string): boolean {
    const aiTerms = ['ai', 'artificial intelligence', 'machine learning', 'neural', 'algorithm', 'data science'];
    const queryLower = query.toLowerCase();
    
    // Check if query contains AI-related terms
    const hasAITerms = aiTerms.some(term => queryLower.includes(term));
    
    if (hasAITerms) {
      // Check if content is AI-related
      const aiContentTerms = ['artificial intelligence', 'machine learning', 'neural network', 'algorithm', 'data', 'intelligence', 'learning'];
      return aiContentTerms.some(term => content.includes(term));
    }
    
    return false;
  }

  // Query content with AI-powered answers
  async queryContent(question: string): Promise<QueryResult> {
    try {
      console.log(`🔍 Searching for: "${question}"`);
      
      // Search for relevant chunks
      const relevantChunks = await this.searchContent(question, 3);
      
      console.log(`📊 Found ${relevantChunks.length} relevant chunks`);
      if (relevantChunks.length > 0) {
        console.log('Top chunk:', relevantChunks[0]);
      }
      
      if (relevantChunks.length === 0) {
        console.log('❌ No relevant chunks found - database might be empty');
        return {
          answer: "I don't have enough information to answer your question. Please try ingesting some content first by adding URLs in the Content Ingestion tab.",
          sources: [],
          totalChunks: 0
        };
      }
      
      // Generate contextual answer
      const answer = this.generateContextualAnswer(question, relevantChunks);
      
      // Format sources
      const sources = relevantChunks.map(item => ({
        url: item.url,
        title: item.title,
        relevance: item.relevance,
        content_snippet: item.content.substring(0, 200) + '...',
        chunkIndex: item.chunkIndex
      }));
      
      // Store query history
      await this.storeQueryHistory(question, answer, sources.map(s => s.url));
      
      return {
        answer,
        sources,
        totalChunks: relevantChunks.length
      };
      
    } catch (error) {
      console.error('Error processing query:', error);
      return {
        answer: "Sorry, I encountered an error while processing your question. Please try again.",
        sources: [],
        totalChunks: 0
      };
    }
  }

  // Generate contextual answers based on relevant chunks
  private generateContextualAnswer(question: string, relevantChunks: (ContentChunk & { relevance: number })[]): string {
    const questionLower = question.toLowerCase();
    const topChunk = relevantChunks[0];
    
    let answer = "Based on the available content, ";
    
    if (questionLower.includes('what') || questionLower.includes('how') || questionLower.includes('why')) {
      answer += `I found information that might help answer your question. `;
      answer += `The most relevant content is from "${topChunk.title}" (chunk ${topChunk.chunkIndex + 1}) which discusses related topics. `;
      
      // Extract relevant snippet
      const snippet = this.extractRelevantSnippet(question, topChunk.content);
      if (snippet) {
        answer += `Here's what I found: "${snippet}" `;
      }
      
      answer += `You can find more details at the source URL.`;
    } else if (questionLower.includes('when') || questionLower.includes('where')) {
      answer += `the information you're looking for appears to be covered in the content from "${topChunk.title}". `;
      answer += `Please refer to the source for specific details.`;
    } else {
      answer += `I have some relevant information from multiple sources. `;
      answer += `The top result is from "${topChunk.title}" with a relevance score of ${topChunk.relevance.toFixed(2)}. `;
      
      if (relevantChunks.length > 1) {
        answer += `I also found ${relevantChunks.length - 1} other relevant chunks. `;
      }
      
      answer += `You can explore the sources below for more detailed information.`;
    }
    
    return answer;
  }

  // Extract relevant snippets from content
  private extractRelevantSnippet(question: string, content: string): string | null {
    const questionWords = question.toLowerCase().split(' ').filter(word => word.length > 3);
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 20);
    
    for (const sentence of sentences) {
      const sentenceLower = sentence.toLowerCase();
      let matchCount = 0;
      
      for (const word of questionWords) {
        if (sentenceLower.includes(word)) {
          matchCount++;
        }
      }
      
      if (matchCount >= Math.min(2, questionWords.length)) {
        return sentence.trim().substring(0, 150) + '...';
      }
    }
    
    return null;
  }

  // Database utility methods
  private async storeInTransaction(db: IDBDatabase, storeName: string, data: any): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.put(data);
        
        request.onsuccess = () => {
          // Wait for transaction to complete before resolving
          transaction.oncomplete = () => resolve();
        };
        
        request.onerror = () => {
          reject(request.error);
        };
        
        transaction.onerror = () => {
          reject(transaction.error);
        };
        
        // Handle transaction abort
        transaction.onabort = () => {
          reject(new Error('Transaction aborted'));
        };
        
      } catch (error) {
        reject(error);
      }
    });
  }

  private async getAllFromStore(db: IDBDatabase, storeName: string): Promise<any[]> {
    return new Promise((resolve, reject) => {
      try {
        const transaction = db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.getAll();
        
        request.onsuccess = () => {
          // Wait for transaction to complete before resolving
          transaction.oncomplete = () => {
            if (request.result && Array.isArray(request.result)) {
              resolve(request.result);
            } else {
              resolve([]);
            }
          };
        };
        
        request.onerror = () => {
          reject(request.error);
        };
        
        transaction.onerror = () => {
          reject(transaction.error);
        };
        
        // Handle transaction abort
        transaction.onabort = () => {
          reject(new Error('Transaction aborted'));
        };
        
      } catch (error) {
        reject(error);
      }
    });
  }

  // Store query history
  private async storeQueryHistory(question: string, answer: string, sources: string[]): Promise<void> {
    try {
      const db = await this.ensureDatabase();
      const queryHistory: QueryHistory = {
        id: `query_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        question,
        answer,
        timestamp: new Date().toISOString(),
        sources,
        queryEmbedding: this.generateMockEmbedding(question)
      };
      
      await this.storeInTransaction(db, 'queries', queryHistory);
    } catch (error) {
      console.error('Error storing query history:', error);
    }
  }

  // Get all content
  async getAllContent(): Promise<ContentItem[]> {
    try {
      const db = await this.ensureDatabase();
      return await this.getAllFromStore(db, 'content');
    } catch (error) {
      console.error('Error getting all content:', error);
      return [];
    }
  }

  // Delete content and all associated chunks
  async deleteContent(id: string): Promise<void> {
    try {
      const db = await this.ensureDatabase();
      
      // Delete content item
      const transaction = db.transaction(['content', 'chunks', 'embeddings'], 'readwrite');
      const contentStore = transaction.objectStore('content');
      const chunksStore = transaction.objectStore('chunks');
      const embeddingsStore = transaction.objectStore('embeddings');
      
      // Delete content
      contentStore.delete(id);
      
      // Delete chunks
      const chunksIndex = chunksStore.index('contentId');
      const chunksRequest = chunksIndex.getAll(id);
      chunksRequest.onsuccess = () => {
        chunksRequest.result.forEach(chunk => {
          chunksStore.delete(chunk.id);
        });
      };
      
      // Delete embeddings
      const embeddingsIndex = embeddingsStore.index('contentId');
      const embeddingsRequest = embeddingsIndex.getAll(id);
      embeddingsRequest.onsuccess = () => {
        embeddingsRequest.result.forEach(embedding => {
          embeddingsStore.delete(embedding.id);
        });
      };
      
      console.log(`Content with ID ${id} and all associated data deleted successfully`);
    } catch (error) {
      console.error('Error deleting content:', error);
      throw error;
    }
  }

  // Get query history
  async getQueryHistory(): Promise<QueryHistory[]> {
    try {
      const db = await this.ensureDatabase();
      const queries = await this.getAllFromStore(db, 'queries');
      return queries.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
    } catch (error) {
      console.error('Error getting query history:', error);
      return [];
    }
  }

  // Get database statistics
  async getStats(): Promise<DatabaseStats> {
    try {
      const db = await this.ensureDatabase();
      
      const content = await this.getAllFromStore(db, 'content');
      const chunks = await this.getAllFromStore(db, 'chunks');
      const queries = await this.getAllFromStore(db, 'queries');
      
      return {
        totalContent: content.length,
        totalChunks: chunks.length,
        totalQueries: queries.length,
        databaseSize: await this.getDatabaseSize(),
        vectorDimensions: this.vectorDimensions
      };
    } catch (error) {
      console.error('Error getting stats:', error);
      return {
        totalContent: 0,
        totalChunks: 0,
        totalQueries: 0,
        databaseSize: 0,
        vectorDimensions: this.vectorDimensions
      };
    }
  }

  // Get database size
  private async getDatabaseSize(): Promise<number> {
    try {
      const db = await this.ensureDatabase();
      let totalSize = 0;
      const stores = ['content', 'chunks', 'queries', 'embeddings'];
      
      // Process each store sequentially to avoid race conditions
      for (const storeName of stores) {
        const storeSize = await this.getStoreSize(db, storeName);
        totalSize += storeSize;
      }
      
      return totalSize;
    } catch (error) {
      console.error('Error calculating database size:', error);
      return 0;
    }
  }

  // Helper method to get size of a single store
  private async getStoreSize(db: IDBDatabase, storeName: string): Promise<number> {
    return new Promise((resolve, reject) => {
      try {
        const transaction = db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.getAll();
        
        request.onsuccess = () => {
          let size = 0;
          if (request.result && Array.isArray(request.result)) {
            request.result.forEach(item => {
              size += JSON.stringify(item).length;
            });
          }
          resolve(size);
        };
        
        request.onerror = () => {
          reject(request.error);
        };
        
        transaction.oncomplete = () => {
          // Transaction completed successfully
        };
        
        transaction.onerror = () => {
          reject(transaction.error);
        };
        
      } catch (error) {
        reject(error);
      }
    });
  }

  // Clear all data
  async clearAllData(): Promise<void> {
    try {
      const db = await this.ensureDatabase();
      const transaction = db.transaction(['content', 'chunks', 'queries', 'embeddings'], 'readwrite');
      
      const stores = ['content', 'chunks', 'queries', 'embeddings'];
      stores.forEach(storeName => {
        const store = transaction.objectStore(storeName);
        store.clear();
      });
      
      console.log('All data cleared successfully');
    } catch (error) {
      console.error('Error clearing data:', error);
      throw error;
    }
  }

  // Get database status
  getStatus() {
    return {
      isActive: !!this.db,
      name: this.dbName,
      version: this.version,
      vectorDimensions: this.vectorDimensions,
      type: 'IndexedDB Vector Database'
    };
  }

  // Check database health and connectivity
  async checkHealth(): Promise<{ healthy: boolean; issues: string[] }> {
    const issues: string[] = [];
    
    try {
      // Check if database is initialized
      if (!this.db) {
        issues.push('Database not initialized');
        return { healthy: false, issues };
      }
      
      // Check if database is open
      if (this.db.readyState !== 'open') {
        issues.push(`Database not ready (state: ${this.db.readyState})`);
        return { healthy: false, issues };
      }
      
      // Test basic operations
      try {
        const testTransaction = this.db.transaction(['content'], 'readonly');
        const testStore = testTransaction.objectStore('content');
        const testRequest = testStore.getAll();
        
        await new Promise<void>((resolve, reject) => {
          testRequest.onsuccess = () => resolve();
          testRequest.onerror = () => reject(testRequest.error);
          testTransaction.onerror = () => reject(testTransaction.error);
        });
        
      } catch (error) {
        issues.push(`Database operations test failed: ${error}`);
      }
      
      // Check object stores
      const expectedStores = ['content', 'chunks', 'queries', 'embeddings'];
      for (const storeName of expectedStores) {
        if (!this.db.objectStoreNames.contains(storeName)) {
          issues.push(`Missing object store: ${storeName}`);
        }
      }
      
      return {
        healthy: issues.length === 0,
        issues
      };
      
    } catch (error) {
      issues.push(`Health check failed: ${error}`);
      return { healthy: false, issues };
    }
  }

  // Reset database if there are issues
  async resetDatabase(): Promise<void> {
    try {
      console.log('🔄 Resetting vector database...');
      
      // Close existing connection
      if (this.db) {
        this.db.close();
        this.db = null;
      }
      
      // Delete the database
      const deleteRequest = indexedDB.deleteDatabase(this.dbName);
      
      await new Promise<void>((resolve, reject) => {
        deleteRequest.onsuccess = () => {
          console.log('✅ Database deleted successfully');
          resolve();
        };
        deleteRequest.onerror = () => {
          reject(deleteRequest.error);
        };
      });
      
      // Reinitialize
      await this.initializeDatabase();
      console.log('✅ Database reset and reinitialized successfully');
      
    } catch (error) {
      console.error('❌ Failed to reset database:', error);
      throw error;
    }
  }

  // Debug method to inspect database contents
  async debugDatabaseContents(): Promise<void> {
    try {
      const db = await this.ensureDatabase();
      
      console.log('🔍 === DATABASE DEBUG INFO ===');
      
      // Check content store
      const content = await this.getAllFromStore(db, 'content');
      console.log(`📚 Content items: ${content.length}`);
      content.forEach((item, index) => {
        console.log(`  ${index + 1}. ${item.title} (${item.url})`);
        console.log(`     Chunks: ${item.chunks?.length || 0}`);
        console.log(`     Content preview: ${item.content.substring(0, 100)}...`);
      });
      
      // Check chunks store
      const chunks = await this.getAllFromStore(db, 'chunks');
      console.log(`🧩 Chunks: ${chunks.length}`);
      chunks.forEach((chunk, index) => {
        console.log(`  ${index + 1}. ${chunk.title} - Chunk ${chunk.chunkIndex}`);
        console.log(`     Content: ${chunk.content.substring(0, 100)}...`);
        console.log(`     Embedding: ${chunk.embedding?.length || 0} dimensions`);
      });
      
      // Check queries store
      const queries = await this.getAllFromStore(db, 'queries');
      console.log(`❓ Queries: ${queries.length}`);
      
      console.log('🔍 === END DEBUG INFO ===');
      
    } catch (error) {
      console.error('Error debugging database:', error);
    }
  }
}
