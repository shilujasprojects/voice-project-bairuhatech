import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, X, Globe, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { ContentService, ContentItem } from '@/lib/contentService';

interface UrlStatus {
  url: string;
  status: 'pending' | 'processing' | 'success' | 'error';
  message?: string;
  title?: string;
  content?: string;
}

interface UrlIngestionProps {
  onIngest: (urls: string[]) => Promise<void>;
  isLoading?: boolean;
}

export const UrlIngestion: React.FC<UrlIngestionProps> = ({ 
  onIngest, 
  isLoading = false 
}) => {
  const [urls, setUrls] = useState<string[]>(['']);
  const [urlStatuses, setUrlStatuses] = useState<UrlStatus[]>([]);
  const { toast } = useToast();

  const addUrlField = () => {
    setUrls([...urls, '']);
  };

  const removeUrlField = (index: number) => {
    if (urls.length > 1) {
      const newUrls = urls.filter((_, i) => i !== index);
      setUrls(newUrls);
    }
  };

  const updateUrl = (index: number, value: string) => {
    const newUrls = [...urls];
    newUrls[index] = value;
    setUrls(newUrls);
  };

  const isValidUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleIngest = async () => {
    const validUrls = urls.filter(url => url.trim() && isValidUrl(url.trim()));
    
    if (validUrls.length === 0) {
      toast({
        title: "No Valid URLs",
        description: "Please add at least one valid URL to ingest.",
        variant: "destructive",
      });
      return;
    }

    // Initialize statuses
    const initialStatuses: UrlStatus[] = validUrls.map(url => ({
      url,
      status: 'processing'
    }));
    setUrlStatuses(initialStatuses);

    try {
      // Process each URL individually
      const results: ContentItem[] = [];
      
      for (let i = 0; i < validUrls.length; i++) {
        const url = validUrls[i];
        try {
          const result = await ContentService.ingestUrl(url);
          results.push(result);
          
          // Update status for this specific URL
          setUrlStatuses(prev => prev.map((status, index) => 
            status.url === url ? {
              ...status,
              status: 'success',
              message: 'Successfully ingested',
              title: result.title,
              content: result.content
            } : status
          ));
        } catch (error) {
          setUrlStatuses(prev => prev.map((status, index) => 
            status.url === url ? {
              ...status,
              status: 'error',
              message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
            } : status
          ));
        }
      }

      // Call the parent callback
      await onIngest(validUrls);
      
      const successCount = results.length;
      const errorCount = validUrls.length - successCount;

      if (errorCount === 0) {
        toast({
          title: "URLs Ingested Successfully",
          description: `Successfully processed ${successCount} URL(s).`,
        });
      } else if (successCount === 0) {
        toast({
          title: "Ingestion Failed",
          description: "Failed to process all URLs. Please try again.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Partial Success",
          description: `Processed ${successCount} URL(s) successfully, ${errorCount} failed.`,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Ingestion Failed",
        description: "Failed to process URLs. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (status: UrlStatus['status']) => {
    switch (status) {
      case 'processing':
        return <Loader className="w-4 h-4 animate-spin text-voice-accent" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-voice-success" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-destructive" />;
      default:
        return null;
    }
  };

  return (
    <Card className="glass">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Globe className="w-5 h-5 text-voice-primary" />
          <span className="gradient-text">Content Ingestion</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {urls.map((url, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center space-x-2"
              >
                <Input
                  type="url"
                  placeholder="https://example.com"
                  value={url}
                  onChange={(e) => updateUrl(index, e.target.value)}
                  className="flex-1"
                  disabled={isLoading}
                />
                {urls.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeUrlField(index)}
                    disabled={isLoading}
                    className="text-destructive hover:text-destructive/80"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button
              variant="outline"
              onClick={addUrlField}
              disabled={isLoading}
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Another URL
            </Button>
          </motion.div>
        </div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Button
            variant="hero"
            onClick={handleIngest}
            disabled={isLoading || urls.every(url => !url.trim())}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader className="w-4 h-4 mr-2 animate-spin" />
                Processing URLs...
              </>
            ) : (
              'Ingest Content'
            )}
          </Button>
        </motion.div>

        {/* URL Status Display */}
        <AnimatePresence>
          {urlStatuses.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-2 pt-4 border-t border-border"
            >
              <h4 className="text-sm font-medium text-muted-foreground">
                Processing Status:
              </h4>
              {urlStatuses.map((status, index) => (
                <motion.div
                  key={status.url}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center space-x-3 p-2 rounded-lg bg-secondary/50"
                >
                  {getStatusIcon(status.status)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {status.title || status.url}
                    </p>
                    {status.message && (
                      <p className="text-xs text-muted-foreground">
                        {status.message}
                      </p>
                    )}
                    {status.content && (
                      <p className="text-xs text-voice-primary">
                        {status.content.length} characters
                      </p>
                    )}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};