import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Send, MessageSquare, ExternalLink, Loader } from 'lucide-react';
import { VoiceRecorder } from './VoiceRecorder';
import { TextToSpeech } from './TextToSpeech';
import { ContentService, QueryResult } from '@/lib/contentService';

interface QueryInterfaceProps {
  isLoading?: boolean;
}

export const QueryInterface: React.FC<QueryInterfaceProps> = ({ 
  isLoading = false 
}) => {
  const [question, setQuestion] = useState('');
  const [result, setResult] = useState<QueryResult | null>(null);
  const [isQuerying, setIsQuerying] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || isQuerying) return;

    setIsQuerying(true);
    try {
      const queryResult = await ContentService.queryContent(question.trim());
      setResult(queryResult);
    } catch (error) {
      console.error('Query error:', error);
    } finally {
      setIsQuerying(false);
    }
  };

  const handleVoiceTranscript = async (transcript: string) => {
    setQuestion(transcript);
    if (transcript.trim()) {
      setIsQuerying(true);
      try {
        const queryResult = await ContentService.queryContent(transcript.trim());
        setResult(queryResult);
      } catch (error) {
        console.error('Voice query error:', error);
      } finally {
        setIsQuerying(false);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Query Input */}
      <Card className="glass">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MessageSquare className="w-5 h-5 text-voice-primary" />
            <span className="gradient-text">Ask a Question</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-4">
              <Input
                type="text"
                placeholder="Type your question here..."
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                disabled={isQuerying}
                className="text-lg"
              />
              
              <div className="flex items-center justify-between">
                <VoiceRecorder 
                  onTranscript={handleVoiceTranscript}
                  isLoading={isQuerying}
                />
                
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    type="submit"
                    variant="hero"
                    disabled={!question.trim() || isQuerying}
                    className="px-8"
                  >
                    {isQuerying ? (
                      <>
                        <Loader className="w-4 h-4 mr-2 animate-spin" />
                        Thinking...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Ask
                      </>
                    )}
                  </Button>
                </motion.div>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Query Result */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="glass">
              <CardContent className="pt-6 space-y-4">
                {/* Answer */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold gradient-text">
                      Answer
                    </h3>
                    <TextToSpeech 
                      text={result.answer} 
                      autoPlay={true}
                    />
                  </div>
                  
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="p-4 rounded-lg bg-secondary/30 border border-voice-primary/20"
                  >
                    <p className="text-foreground leading-relaxed">
                      {result.answer}
                    </p>
                  </motion.div>
                </div>

                {/* Sources */}
                {result.sources && result.sources.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="space-y-3"
                  >
                    <h4 className="text-sm font-medium text-muted-foreground">
                      Sources ({result.sources.length})
                    </h4>
                    <div className="space-y-2">
                      {result.sources.map((source, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.1 * index }}
                        >
                          <Badge 
                            variant="outline"
                            className="flex items-center justify-between w-full p-3 h-auto"
                          >
                            <div className="flex items-center space-x-2 flex-1 min-w-0">
                              <ExternalLink className="w-3 h-3 flex-shrink-0" />
                              <span className="text-xs truncate">
                                {source.title || source.url}
                              </span>
                            </div>
                            {source.relevance && (
                              <span className="text-xs text-voice-primary ml-2">
                                {(source.relevance * 100).toFixed(0)}%
                              </span>
                            )}
                          </Badge>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};