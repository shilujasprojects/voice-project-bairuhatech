// Test file to verify VectorDatabase functionality
import { VectorDatabase } from './vectorDatabase';

export async function testVectorDatabase() {
  console.log('🧪 === VECTOR DATABASE TEST ===');
  
  try {
    // Test 1: Database Initialization
    console.log('\n1️⃣ Testing database initialization...');
    const vectorDB = VectorDatabase.getInstance();
    const status = vectorDB.getStatus();
    console.log('✅ Database status:', status);
    
    // Test 2: Content Storage
    console.log('\n2️⃣ Testing content storage...');
    const testContent = {
      url: 'https://test.example.com',
      title: 'Test Article',
      content: 'This is a test article about artificial intelligence and machine learning. It contains information about neural networks, algorithms, and data processing. The content is designed to test the vector database functionality and search capabilities.',
      embedding: []
    };
    
    const storedContent = await vectorDB.storeContent(
      testContent.url,
      testContent.title,
      testContent.content,
      testContent.embedding
    );
    console.log('✅ Content stored successfully:', storedContent.id);
    console.log('   Chunks created:', storedContent.chunks.length);
    
    // Test 3: Content Retrieval
    console.log('\n3️⃣ Testing content retrieval...');
    const allContent = await vectorDB.getAllContent();
    console.log('✅ Retrieved content items:', allContent.length);
    
    // Test 4: Search Functionality
    console.log('\n4️⃣ Testing search functionality...');
    const searchResults = await vectorDB.searchContent('artificial intelligence', 3);
    console.log('✅ Search results:', searchResults.length);
    if (searchResults.length > 0) {
      console.log('   Top result relevance:', searchResults[0].relevance);
      console.log('   Top result content preview:', searchResults[0].content.substring(0, 100));
    }
    
    // Test 5: Query Processing
    console.log('\n5️⃣ Testing query processing...');
    const queryResult = await vectorDB.queryContent('What is artificial intelligence?');
    console.log('✅ Query processed successfully');
    console.log('   Answer length:', queryResult.answer.length);
    console.log('   Sources found:', queryResult.sources.length);
    console.log('   Answer preview:', queryResult.answer.substring(0, 150));
    
    // Test 6: Database Statistics
    console.log('\n6️⃣ Testing database statistics...');
    const stats = await vectorDB.getStats();
    console.log('✅ Database stats:', {
      totalContent: stats.totalContent,
      totalChunks: stats.totalChunks,
      totalQueries: stats.totalQueries,
      vectorDimensions: stats.vectorDimensions
    });
    
    // Test 7: Debug Information
    console.log('\n7️⃣ Testing debug functionality...');
    await vectorDB.debugDatabaseContents();
    
    // Test 8: Health Check
    console.log('\n8️⃣ Testing database health...');
    const health = await vectorDB.checkHealth();
    console.log('✅ Health check result:', health);
    
    if (!health.healthy) {
      console.warn('⚠️ Database has issues:', health.issues);
    }
    
    console.log('\n🎉 === ALL TESTS PASSED ===');
    return true;
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    return false;
  }
}

// Test specific methods
export async function testChunking() {
  console.log('\n🔧 Testing content chunking...');
  const vectorDB = VectorDatabase.getInstance();
  
  const longContent = 'This is a very long piece of content. '.repeat(100);
  const chunks = (vectorDB as any).chunkContent(longContent, 100, 20);
  
  console.log('✅ Chunks created:', chunks.length);
  console.log('   First chunk length:', chunks[0]?.length || 0);
  console.log('   Last chunk length:', chunks[chunks.length - 1]?.length || 0);
  
  return chunks.length > 0;
}

export async function testEmbeddingGeneration() {
  console.log('\n🔧 Testing embedding generation...');
  const vectorDB = VectorDatabase.getInstance();
  
  const testText = 'Test content for embedding generation';
  const embedding = (vectorDB as any).generateMockEmbedding(testText);
  
  console.log('✅ Embedding generated:', embedding.length, 'dimensions');
  console.log('   First few values:', embedding.slice(0, 5));
  
  return embedding.length === 1536;
}

// Run tests if this file is executed directly
if (typeof window !== 'undefined') {
  // Browser environment
  (window as any).testVectorDatabase = testVectorDatabase;
  (window as any).testChunking = testChunking;
  (window as any).testEmbeddingGeneration = testEmbeddingGeneration;
  
  // Add health check and reset methods
  (window as any).checkVectorDBHealth = async () => {
    const vectorDB = VectorDatabase.getInstance();
    return await vectorDB.checkHealth();
  };
  
  (window as any).resetVectorDB = async () => {
    const vectorDB = VectorDatabase.getInstance();
    return await vectorDB.resetDatabase();
  };
  
  console.log('🧪 Vector Database tests loaded. Available commands:');
  console.log('  - testVectorDatabase() - Run full test suite');
  console.log('  - testChunking() - Test content chunking');
  console.log('  - testEmbeddingGeneration() - Test embedding generation');
  console.log('  - checkVectorDBHealth() - Check database health');
  console.log('  - resetVectorDB() - Reset database if needed');
}
