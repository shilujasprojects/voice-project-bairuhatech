#!/usr/bin/env node

/**
 * Environment File Creator Script
 * Run this script to create .env.local files for your project
 * 
 * Usage:
 * node create-env.js
 * node create-env.js --type=basic
 * node create-env.js --type=advanced
 * node create-env.js --type=production
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get command line arguments
const args = process.argv.slice(2);
const typeArg = args.find(arg => arg.startsWith('--type='));
const type = typeArg ? typeArg.split('=')[1] : 'basic';

// Environment file templates
const templates = {
  basic: `# Basic Environment Configuration
# Copy this file to .env.local and add your actual credentials

# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# OpenAI Configuration
VITE_OPENAI_API_KEY=your_openai_api_key_here`,

  advanced: `# Advanced Environment Configuration
# Copy this file to .env.local and add your actual credentials

# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# OpenAI Configuration
VITE_OPENAI_API_KEY=your_openai_api_key_here

# Optional: Content Extraction Service
VITE_CONTENT_EXTRACTION_URL=your_backend_url_for_content_extraction

# Optional: Development Settings
VITE_DEBUG_MODE=true
VITE_LOG_LEVEL=info`,

  production: `# Production Environment Configuration
# Copy this file to .env.production and add your actual credentials

# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# OpenAI Configuration
VITE_OPENAI_API_KEY=your_openai_api_key_here

# Production Settings
VITE_DEBUG_MODE=false
VITE_LOG_LEVEL=error
VITE_ENABLE_ANALYTICS=true`
};

// Get the template content
const template = templates[type];
if (!template) {
  console.error(`❌ Invalid type: ${type}`);
  console.log('Available types: basic, advanced, production');
  process.exit(1);
}

// Determine filename
const filename = type === 'production' ? '.env.production' : '.env.local';
const filepath = path.join(process.cwd(), filename);

// Check if file already exists
if (fs.existsSync(filepath)) {
  console.log(`⚠️  File ${filename} already exists!`);
  console.log('Do you want to overwrite it? (y/N)');
  
  process.stdin.once('data', (data) => {
    const input = data.toString().trim().toLowerCase();
    if (input === 'y' || input === 'yes') {
      createFile();
    } else {
      console.log('❌ File creation cancelled.');
      process.exit(0);
    }
  });
} else {
  createFile();
}

function createFile() {
  try {
    fs.writeFileSync(filepath, template);
    console.log(`✅ Successfully created ${filename}!`);
    console.log(`📁 Location: ${filepath}`);
    console.log('');
    console.log('📝 Next steps:');
    console.log('1. Edit the file and add your actual credentials');
    console.log('2. For Supabase: Get URL and API key from your project dashboard');
    console.log('3. For OpenAI: Get API key from platform.openai.com');
    console.log('4. Restart your development server');
    console.log('');
    console.log('🔗 Helpful links:');
    console.log('• Supabase: https://supabase.com/docs/guides/getting-started');
    console.log('• OpenAI: https://platform.openai.com/api-keys');
  } catch (error) {
    console.error(`❌ Error creating file: ${error.message}`);
    process.exit(1);
  }
}
