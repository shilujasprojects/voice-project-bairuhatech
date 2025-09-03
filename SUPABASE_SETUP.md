# Supabase Setup Guide for Voice Transfer Project

This guide will help you set up Supabase with OpenAI embeddings and vector search capabilities for your voice transfer project.

## Prerequisites

- A Supabase account (free tier available)
- An OpenAI API key
- Node.js and npm installed

## Step 1: Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/sign in
2. Click "New Project"
3. Choose your organization
4. Fill in project details:
   - Name: `voice-transfer` (or your preferred name)
   - Database Password: Choose a strong password
   - Region: Select the region closest to your users
5. Click "Create new project"
6. Wait for the project to be created (this may take a few minutes)

## Step 2: Get Your Supabase Credentials

1. In your project dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (looks like: `https://xxxxxxxxxxxxx.supabase.co`)
   - **anon public** key (starts with `eyJ...`)

## Step 3: Set Up Environment Variables

1. In your project root, create a `.env` file:
   ```bash
   # Copy the env.example file
   cp env.example .env
   ```

2. Edit the `.env` file with your actual values:
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   VITE_OPENAI_API_KEY=your-openai-api-key-here
   ```

## Step 4: Set Up the Database

1. In your Supabase dashboard, go to **SQL Editor**
2. Create a new query
3. Copy and paste the contents of `supabase-setup.sql`
4. Click "Run" to execute the SQL

This will:
- Enable the `pgvector` extension for vector operations
- Create the `content` table for storing ingested content
- Create the `queries` table for storing query history
- Set up vector similarity search functions
- Create necessary indexes for performance

## Step 5: Get Your OpenAI API Key

1. Go to [platform.openai.com](https://platform.openai.com)
2. Sign up or sign in
3. Go to **API Keys**
4. Click "Create new secret key"
5. Copy the key and add it to your `.env` file

## Step 6: Test the Setup

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Open your browser and navigate to the app
3. The **Configuration Status** section should show:
   - ✅ Supabase: Configured
   - ✅ OpenAI: Configured
   - ✅ Database: Configured

4. If all are green, you're ready to use the app!

## Step 7: Ingest Your First Content

1. Go to the **Ingest Content** tab
2. Add a URL (e.g., `https://en.wikipedia.org/wiki/Artificial_intelligence`)
3. Click "Ingest Content"
4. Wait for the processing to complete

## Step 8: Ask Questions

1. Go to the **Ask Questions** tab
2. Type or speak your question
3. Get AI-powered answers with cited sources!

## Troubleshooting

### Common Issues

**"Missing Supabase environment variables"**
- Make sure your `.env` file exists and has the correct values
- Restart your development server after making changes

**"Database connection error"**
- Verify your Supabase credentials are correct
- Check that you've run the SQL setup script
- Ensure your project is not paused (free tier projects pause after inactivity)

**"OpenAI API error"**
- Verify your OpenAI API key is correct
- Check your OpenAI account has credits
- Ensure you're using a valid model name

**"Vector search not working"**
- Make sure the `pgvector` extension is enabled
- Verify the `match_content` function was created successfully
- Check that content has been ingested with embeddings

### Database Schema

The setup creates these main tables:

- **`content`**: Stores ingested URLs with their content and embeddings
- **`queries`**: Stores query history and results
- **`match_content`**: Function for vector similarity search

### Performance Tips

- Use the free tier for development and testing
- Upgrade to a paid plan for production use
- Consider implementing caching for frequently accessed content
- Monitor your OpenAI API usage to control costs

## Security Notes

- Never commit your `.env` file to version control
- The `anon` key is safe to use in the browser (it has limited permissions)
- Consider using Row Level Security (RLS) for production applications
- Monitor your API usage and set up alerts

## Next Steps

Once your setup is working:

1. **Customize the UI**: Modify the components to match your brand
2. **Add Authentication**: Implement user accounts and content ownership
3. **Enhance Content Processing**: Add support for more file types
4. **Implement Caching**: Add Redis or similar for better performance
5. **Add Analytics**: Track usage patterns and popular content

## Support

If you encounter issues:

1. Check the [Supabase documentation](https://supabase.com/docs)
2. Review the [OpenAI API documentation](https://platform.openai.com/docs)
3. Check the project's GitHub issues
4. Join the Supabase Discord community

Happy building! 🚀

