-- Enable the pgvector extension for vector operations
CREATE EXTENSION IF NOT EXISTS vector;

-- Create the content table to store ingested content
CREATE TABLE IF NOT EXISTS content (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  url TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  embedding vector(1536), -- OpenAI text-embedding-3-small dimension
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create an index on the embedding column for efficient vector search
CREATE INDEX IF NOT EXISTS content_embedding_idx ON content USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Create a function to perform vector similarity search
CREATE OR REPLACE FUNCTION match_content(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  url TEXT,
  title TEXT,
  content TEXT,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    content.id,
    content.url,
    content.title,
    content.content,
    1 - (content.embedding <=> query_embedding) AS similarity
  FROM content
  WHERE 1 - (content.embedding <=> query_embedding) > match_threshold
  ORDER BY content.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically update the updated_at column
CREATE TRIGGER update_content_updated_at
  BEFORE UPDATE ON content
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create the queries table to store query history
CREATE TABLE IF NOT EXISTS queries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  sources JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS content_url_idx ON content(url);
CREATE INDEX IF NOT EXISTS content_created_at_idx ON content(created_at DESC);
CREATE INDEX IF NOT EXISTS queries_created_at_idx ON queries(created_at DESC);

-- Insert some sample data for testing (optional)
-- INSERT INTO content (url, title, content, embedding) VALUES 
-- ('https://example.com', 'Sample Content', 'This is sample content for testing purposes.', '[0.1, 0.2, ...]');
