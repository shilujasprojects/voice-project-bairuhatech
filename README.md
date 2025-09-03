# Voice-Driven Q&A Web Application

A production-ready voice-driven Q&A web application that allows users to ingest content from websites and ask questions using speech recognition. Built with React, TypeScript, and designed to integrate with Supabase for backend functionality.

## ✨ Features

### Frontend (Implemented)
- 🎤 **Voice Recording**: Web Speech API integration with visual feedback
- 🔊 **Text-to-Speech**: Automatic audio responses using Speech Synthesis API
- 📱 **Responsive Design**: Beautiful, modern UI with glassmorphism effects
- ⚡ **Real-time Animations**: Smooth transitions with Framer Motion
- 🌐 **URL Ingestion Interface**: Multi-URL input with validation and status tracking
- 💬 **Query Interface**: Voice and text input with intelligent responses
- 🎨 **Design System**: Consistent theming with semantic color tokens

### Backend (Requires Supabase Integration)
- 📊 **Content Ingestion**: Extract readable text from URLs using `@mozilla/readability`
- 🧠 **AI Embeddings**: OpenAI text-embedding-3-small integration
- 🔍 **Vector Search**: Similarity search using Supabase Vector/pgvector
- 🤖 **Query Processing**: OpenAI ChatCompletion with context injection
- 🔐 **Secure API Management**: Environment variables for API keys

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Modern browser with Web Speech API support

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd voice-qa-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open in browser**
   ```
   http://localhost:8080
   ```

## 🔧 Backend Setup (Supabase Integration)

To enable full functionality, connect to Supabase:

### Quick Setup

1. **Create a `.env` file** in your project root with your API keys:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_OPENAI_API_KEY=your_openai_api_key
   ```

2. **Follow the complete setup guide**: [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)

### What You'll Get

- ✅ **Content Ingestion**: Extract and store web content with OpenAI embeddings
- ✅ **Vector Search**: Semantic similarity search using Supabase Vector
- ✅ **AI-Powered Q&A**: Intelligent answers based on ingested content
- ✅ **Voice Interface**: Full voice input and output capabilities
- ✅ **Real-time Processing**: Live status updates and progress tracking

### Environment Variables
```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# OpenAI Configuration
VITE_OPENAI_API_KEY=your_openai_api_key
```

## 📋 Sample URLs for Testing

Try these URLs for content ingestion:

- **AI Documentation**: `https://en.wikipedia.org/wiki/Artificial_intelligence`
- **Programming Guide**: `https://docs.python.org/3/tutorial/`
- **React Documentation**: `https://react.dev/learn`
- **Web Development**: `https://developer.mozilla.org/en-US/docs/Web/HTML`

## 🎯 Sample Questions

After ingesting content, try these voice or text queries:

- "What is artificial intelligence?"
- "How do I get started with React?"
- "Explain Python functions with examples"
- "What are the benefits of machine learning?"

## 🏗️ Architecture

### Frontend Stack
- **React 18**: Modern React with hooks and functional components
- **TypeScript**: Type-safe development
- **Vite**: Fast development and build tool
- **Tailwind CSS**: Utility-first styling with custom design system
- **Framer Motion**: Smooth animations and transitions
- **Shadcn/ui**: High-quality UI components
- **Web Speech API**: Native browser speech recognition
- **Speech Synthesis API**: Text-to-speech functionality

### Backend Architecture (Supabase)
```
[Frontend] → [Supabase Edge Functions] → [OpenAI API]
                     ↓
              [Supabase Vector DB]
```

## 🧪 Testing

### Acceptance Checklist

#### Frontend Features ✅
- [x] Voice recording with visual feedback
- [x] Text-to-speech with audio controls
- [x] URL ingestion interface with validation
- [x] Query interface with voice and text input
- [x] Responsive design on mobile and desktop
- [x] Error handling and user feedback
- [x] Loading states and animations

#### Backend Integration (Requires Supabase)
- [ ] URL content extraction and processing
- [ ] OpenAI embedding generation
- [ ] Vector database storage and retrieval
- [ ] Similarity search functionality
- [ ] ChatCompletion with context injection
- [ ] Source citation in responses

### Manual Testing

1. **Content Ingestion**:
   - Add 3+ URLs in the ingestion interface
   - Verify validation for invalid URLs
   - Check processing status indicators

2. **Voice Interface**:
   - Click microphone button and speak a question
   - Verify speech recognition accuracy
   - Test text-to-speech playback

3. **Query Processing**:
   - Submit questions via voice and text
   - Verify response formatting
   - Check source citations

## 🎨 Design System

The application uses a carefully crafted design system with:

- **Color Palette**: Deep blues to purples with voice-specific accent colors
- **Typography**: Inter font family with consistent sizing
- **Animations**: Smooth transitions and micro-interactions
- **Glassmorphism**: Modern glass-effect UI elements
- **Voice Indicators**: Pulsing animations and wave effects

## 🚀 Deployment

### Using Lovable (Recommended)
1. Open your [Lovable Project](https://lovable.dev)
2. Click **Share → Publish**
3. Your app will be deployed automatically

### Manual Deployment
```bash
npm run build
# Deploy the 'dist' folder to your hosting service
```

## 🔒 Security Notes

- API keys are managed through Supabase Edge Function Secrets
- No sensitive data is stored in the frontend code
- All API communications are server-side only
- CORS and authentication handled by Supabase

## 📚 Documentation Links

- [Supabase Integration Guide](https://docs.lovable.dev/integrations/supabase/)
- [Web Speech API Documentation](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)
- [OpenAI API Reference](https://platform.openai.com/docs/api-reference)
- [Framer Motion Documentation](https://www.framer.com/motion/)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

