# Voice-Driven Q&A Assistant

A React application that allows you to ingest content from URLs and ask questions using voice or text, with AI-powered answers based on the ingested content.

## Features

- **URL Content Ingestion**: Extract and store content from web pages
- **AI-Powered Q&A**: Ask questions and get intelligent answers based on ingested content
- **Voice Interface**: Ask questions using speech recognition
- **Text-to-Speech**: Listen to answers with natural speech synthesis
- **Vector Search**: Use embeddings for semantic content search
- **Real-time Processing**: Instant content processing and query responses

## Current Status

Your application is currently running with **Mock Services** because the real backend (Supabase + OpenAI) is not configured. This means:

✅ **What's Working (Mock Mode):**
- URL content ingestion (simulated)
- AI-powered Q&A (simulated responses)
- Voice input and text-to-speech
- Content search and retrieval
- Full UI functionality

❌ **What's Missing (Real Backend):**
- Real content extraction from URLs
- OpenAI GPT responses
- Supabase database storage
- Vector embeddings and similarity search

## Quick Setup (To Enable Real Backend)

### 1. Create Environment File

Click the **"Download .env.local Template"** button in the Configuration Status section, or manually create a `.env.local` file in your project root:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# OpenAI Configuration
VITE_OPENAI_API_KEY=your_openai_api_key_here
```

### 2. Get Supabase Credentials

1. Go to [Supabase](https://supabase.com) and create a new project
2. In your project dashboard, go to **Settings** → **API**
3. Copy the **Project URL** and **anon public** key
4. Paste them in your `.env.local` file

### 3. Set Up Database Schema

1. In Supabase dashboard, go to **SQL Editor**
2. Run the SQL script from `supabase-setup.sql` file
3. This creates the necessary tables and vector search functions

### 4. Get OpenAI API Key

1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Create a new API key
3. Add it to your `.env.local` file

### 5. Restart Development Server

```bash
npm run dev
```

## Complete Workflow

### 1. Content Ingestion
- Navigate to the **"Ingest Content"** tab
- Enter URLs (e.g., Wikipedia articles, documentation)
- Click **"Ingest URLs"** to process and store content
- Content is extracted, embedded, and stored in the database

### 2. Asking Questions
- Switch to the **"Ask Questions"** tab
- Type your question or use the voice recorder
- Questions are processed using:
  - Vector similarity search to find relevant content
  - AI generation to create contextual answers
  - Source citation with relevance scores

### 3. Voice Interface
- **Voice Input**: Click the microphone button and speak your question
- **Text-to-Speech**: Click the speaker button to hear answers
- **Real-time Processing**: Instant voice recognition and response

## Technical Architecture

```
Frontend (React + TypeScript)
    ↓
ContentService (API Layer)
    ↓
┌─────────────────┬─────────────────┐
│   Real Services │  Mock Services  │
│                 │                 │
│ Supabase        │ Local Storage   │
│ OpenAI GPT      │ Simulated AI    │
│ pgvector        │ Keyword Search  │
│ URL Extraction  │ Mock Content    │
└─────────────────┴─────────────────┘
```

## Troubleshooting

### Common Issues

1. **"Mock Services Active" Message**
   - This is normal when no `.env.local` file exists
   - Create the environment file with your credentials

2. **"Configuration Missing" Errors**
   - Check that your `.env.local` file is in the project root
   - Verify all required environment variables are set
   - Restart the development server after changes

3. **Voice Recognition Not Working**
   - Ensure microphone permissions are granted
   - Check browser compatibility (Chrome/Edge recommended)
   - Verify HTTPS connection (required for microphone access)

4. **Content Ingestion Fails**
   - Check Supabase connection and database schema
   - Verify OpenAI API key is valid
   - Check browser console for detailed error messages

### Debug Mode

The application includes comprehensive logging. Check the browser console to see:
- Service connection attempts
- API call results
- Fallback to mock services
- Error details and resolutions

## Development

### Running the App

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Type checking
npx tsc --noEmit
```

### Project Structure

```
src/
├── components/          # UI components
│   ├── UrlIngestion.tsx    # URL processing interface
│   ├── QueryInterface.tsx  # Q&A interface
│   ├── VoiceRecorder.tsx   # Speech recognition
│   ├── TextToSpeech.tsx    # Speech synthesis
│   └── ConfigChecker.tsx   # Service status
├── lib/                # Core services
│   ├── contentService.ts   # Main business logic
│   ├── supabase.ts         # Database client
│   ├── openai.ts           # AI service
│   ├── mockLLMService.ts   # Development mock
│   └── mockDatabaseService.ts # Development mock
└── pages/              # Application pages
    └── Index.tsx           # Main application
```

## API Endpoints

When using real services, the application connects to:

- **Supabase**: PostgreSQL database with pgvector extension
- **OpenAI**: GPT models for content generation and embeddings
- **Vector Search**: Semantic similarity search using embeddings

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

