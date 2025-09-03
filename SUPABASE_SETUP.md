# Supabase Setup Guide for Voice-Driven Q&A Assistant

This guide will help you set up Supabase to enable full functionality with OpenAI embeddings and vector search capabilities.

## Prerequisites

- A Supabase account (free tier available)
- OpenAI API key
- Node.js and npm/yarn installed

## Step 1: Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/sign in
2. Click "New Project"
3. Choose your organization and enter a project name
4. Set a database password (save this securely)
5. Choose a region close to your users
6. Wait for the project to be created

## Step 2: Get Your Supabase Credentials

1. In your project dashboard, go to Settings → API
2. Copy the following values:
   - Project URL
   - Anon (public) key

## Step 3: Set Up Environment Variables

1. Create a `.env` file in your project root
2. Add the following variables:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_OPENAI_API_KEY=your_openai_api_key
```

3. Replace the placeholder values with your actual credentials

## Step 4: Enable Vector Extension

1. In your Supabase dashboard, go to SQL Editor
2. Run the following SQL command:

```sql
-- Enable the vector extension
CREATE EXTENSION IF NOT EXISTS vector;
```

## Step 5: Create Database Tables

Run the following SQL commands in the SQL Editor:

```sql
-- Create documents table for storing content with embeddings
CREATE TABLE documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  url TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  embedding vector(1536), -- OpenAI text-embedding-3-small dimension
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create queries table for storing Q&A history
CREATE TABLE queries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  sources TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX ON documents USING GIN (metadata);
CREATE INDEX ON documents (created_at);
CREATE INDEX ON queries (created_at);
```

## Step 6: Create Vector Search Function

Run this SQL command to create the vector similarity search function:

```sql
-- Function to match documents based on vector similarity
CREATE OR REPLACE FUNCTION match_documents(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5
)
RETURNS TABLE(
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
    documents.id,
    documents.url,
    documents.title,
    documents.content,
    1 - (documents.embedding <=> query_embedding) AS similarity
  FROM documents
  WHERE 1 - (documents.embedding <=> query_embedding) > match_threshold
  ORDER BY documents.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
```

## Step 7: Set Up Row Level Security (Optional but Recommended)

```sql
-- Enable RLS on tables
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE queries ENABLE ROW LEVEL SECURITY;

-- Create policies (adjust based on your needs)
CREATE POLICY "Allow public read access to documents" ON documents
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert to documents" ON documents
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read access to queries" ON queries
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert to queries" ON queries
  FOR INSERT WITH CHECK (true);
```

## Step 8: Test the Setup

1. Start your development server: `npm run dev`
2. Go to the Content Ingestion tab
3. Try ingesting a URL (e.g., https://en.wikipedia.org/wiki/Artificial_intelligence)
4. Check the Supabase dashboard → Table Editor → documents to see if the content was stored
5. Go to the Ask Questions tab and try asking a question

## Troubleshooting

### Common Issues:

1. **"Missing Supabase environment variables"**
   - Make sure your `.env` file is in the project root
   - Restart your development server after adding environment variables

2. **"Vector extension not available"**
   - Make sure you've enabled the vector extension in Step 4

3. **"Function match_documents does not exist"**
   - Run the SQL command from Step 6 again

4. **CORS errors when fetching URLs**
   - The app uses a CORS proxy (allorigins.win). In production, consider using Supabase Edge Functions

5. **OpenAI API errors**
   - Check your OpenAI API key
   - Ensure you have sufficient credits in your OpenAI account

### Performance Tips:

1. **Content Length**: The system truncates content to 8000 characters to stay within OpenAI's token limits
2. **Vector Search**: Adjust the `match_threshold` in the `match_documents` function for better results
3. **Batch Processing**: For multiple URLs, the system processes them sequentially to avoid rate limiting

## Production Considerations

1. **Rate Limiting**: Implement rate limiting for both URL ingestion and queries
2. **Content Validation**: Add validation for URLs and content before processing
3. **Error Handling**: Implement more robust error handling and retry mechanisms
4. **Monitoring**: Set up monitoring for API usage and costs
5. **Backup**: Regular backups of your Supabase database
6. **Edge Functions**: Consider using Supabase Edge Functions for URL content extraction to avoid CORS issues

## Security Notes

1. **API Keys**: Never commit your `.env` file to version control
2. **Row Level Security**: Consider implementing more restrictive RLS policies for production
3. **Content Moderation**: Implement content filtering for user-submitted URLs
4. **Rate Limiting**: Protect against abuse with proper rate limiting

## Support

If you encounter issues:
1. Check the browser console for error messages
2. Verify your environment variables are correct
3. Check the Supabase dashboard for any database errors
4. Ensure all SQL commands were executed successfully

Your voice-driven Q&A assistant should now be fully functional with Supabase integration!

