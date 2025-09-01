import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UrlIngestion } from '@/components/UrlIngestion';
import { QueryInterface } from '@/components/QueryInterface';
import { useToast } from '@/components/ui/use-toast';
import { Brain, Database, MessageSquare, Zap } from 'lucide-react';

const Index = () => {
  const [activeTab, setActiveTab] = useState('ingest');
  const [isIngested, setIsIngested] = useState(false);
  const { toast } = useToast();

  // Mock functions - these would connect to your Supabase backend
  const handleIngest = async (urls: string[]) => {
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsIngested(true);
    setActiveTab('query');
  };

  const handleQuery = async (question: string) => {
    // Simulate query processing
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Mock response
    return {
      answer: "I don't have access to the ingested content yet. Please connect to Supabase to enable full functionality with OpenAI embeddings and vector search capabilities.",
      sources: [
        { url: "https://example.com", title: "Example Source", relevance: 0.95 },
        { url: "https://docs.example.com", title: "Documentation", relevance: 0.87 }
      ]
    };
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden bg-gradient-to-br from-background via-background to-secondary/20"
      >
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.02'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
        
        <div className="relative container mx-auto px-4 py-16 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="max-w-4xl mx-auto"
          >
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              <span className="gradient-text">Voice-Driven</span>
              <br />
              Q&A Assistant
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Ingest content from websites and ask questions using your voice. 
              Get intelligent answers with cited sources.
            </p>
            
            <div className="flex flex-wrap justify-center gap-4 mb-12">
              {[
                { icon: Database, text: "Content Ingestion" },
                { icon: Brain, text: "AI-Powered Search" },
                { icon: MessageSquare, text: "Voice Interface" },
                { icon: Zap, text: "Instant Answers" }
              ].map((feature, index) => (
                <motion.div
                  key={feature.text}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  className="flex items-center space-x-2 bg-secondary/50 rounded-full px-4 py-2"
                >
                  <feature.icon className="w-4 h-4 text-voice-primary" />
                  <span className="text-sm font-medium">{feature.text}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="max-w-4xl mx-auto"
        >
          {/* Backend Integration Notice */}
          <Card className="glass mb-8 border-voice-warning/20">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-2 h-2 bg-voice-warning rounded-full animate-pulse"></div>
                <h3 className="text-lg font-semibold text-voice-warning">
                  Backend Integration Required
                </h3>
              </div>
              <p className="text-muted-foreground mb-4">
                To enable full functionality including URL content extraction, OpenAI embeddings, 
                vector search, and query processing, connect to Supabase using the green button 
                in the top right corner.
              </p>
              <p className="text-sm text-muted-foreground">
                The current interface shows the frontend design and voice features. 
                Backend functionality will be implemented using Supabase Edge Functions.
              </p>
            </CardContent>
          </Card>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="ingest" className="text-base">
                <Database className="w-4 h-4 mr-2" />
                Ingest Content
              </TabsTrigger>
              <TabsTrigger value="query" className="text-base" disabled={!isIngested}>
                <MessageSquare className="w-4 h-4 mr-2" />
                Ask Questions
              </TabsTrigger>
            </TabsList>

            <TabsContent value="ingest" className="space-y-6">
              <UrlIngestion onIngest={handleIngest} />
              
              <Card className="glass">
                <CardContent className="pt-6">
                  <h3 className="text-lg font-semibold mb-3">Sample URLs for Testing</h3>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>• https://en.wikipedia.org/wiki/Artificial_intelligence</p>
                    <p>• https://docs.python.org/3/tutorial/</p>
                    <p>• https://react.dev/learn</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="query" className="space-y-6">
              <QueryInterface onQuery={handleQuery} />
              
              <Card className="glass">
                <CardContent className="pt-6">
                  <h3 className="text-lg font-semibold mb-3">Sample Questions</h3>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>• "What is artificial intelligence?"</p>
                    <p>• "How do I get started with React?"</p>
                    <p>• "Explain Python functions with examples"</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
};

export default Index;
