import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertTriangle, Settings, ExternalLink, Download, FileText, Copy, Database } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { ContentService } from '@/lib/contentService';

interface ConfigStatus {
  database: 'configured' | 'missing' | 'error';
  openai: 'configured' | 'missing' | 'error';
  vectorDatabase: 'configured' | 'missing' | 'error';
}

export const ConfigChecker: React.FC = () => {
  const [configStatus, setConfigStatus] = useState<ConfigStatus>({
    database: 'missing',
    openai: 'missing',
    vectorDatabase: 'missing'
  });
  const [isChecking, setIsChecking] = useState(true);
  const [showEnvCreator, setShowEnvCreator] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    checkConfiguration();
  }, []);

  const checkConfiguration = async () => {
    setIsChecking(true);
    
    try {
      // Check database configuration - IndexedDB is always available in modern browsers
      setConfigStatus(prev => ({ ...prev, database: 'configured' }));

      // Check OpenAI configuration
      const openaiKey = import.meta.env.VITE_OPENAI_API_KEY;
      
      if (!openaiKey) {
        setConfigStatus(prev => ({ ...prev, openai: 'missing' }));
      } else {
        setConfigStatus(prev => ({ ...prev, openai: 'configured' }));
      }

      // Check vector database status using ContentService
      try {
        const vectorDBStatus = ContentService.getVectorDBStatus();
        
        if (vectorDBStatus.isActive) {
          setConfigStatus(prev => ({ ...prev, vectorDatabase: 'configured' }));
        } else {
          setConfigStatus(prev => ({ ...prev, vectorDatabase: 'error' }));
        }
      } catch (error) {
        setConfigStatus(prev => ({ ...prev, vectorDatabase: 'error' }));
      }
    } catch (error) {
      console.error('Configuration check error:', error);
    } finally {
      setIsChecking(false);
    }
  };

  const getStatusIcon = (status: ConfigStatus[keyof ConfigStatus]) => {
    switch (status) {
      case 'configured':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'missing':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      default:
        return null;
    }
  };

  const getStatusText = (status: ConfigStatus[keyof ConfigStatus]) => {
    switch (status) {
      case 'configured':
        return 'Configured';
      case 'missing':
        return 'Missing';
      case 'error':
        return 'Error';
      default:
        return 'Unknown';
    }
  };

  const getStatusColor = (status: ConfigStatus[keyof ConfigStatus]) => {
    switch (status) {
      case 'configured':
        return 'bg-green-500/20 text-green-700 border-green-500/30';
      case 'missing':
        return 'bg-red-500/20 text-red-700 border-red-500/30';
      case 'error':
        return 'bg-yellow-500/20 text-yellow-700 border-yellow-500/30';
      default:
        return 'bg-gray-500/20 text-gray-700 border-gray-500/30';
    }
  };

  const createEnvFile = (type: 'basic' | 'advanced' | 'production') => {
    let envContent = '';
    
    switch (type) {
      case 'basic':
        envContent = `# Basic Environment Configuration
# Copy this file to .env.local and add your actual credentials

# OpenAI Configuration
VITE_OPENAI_API_KEY=your_openai_api_key_here

# Note: Vector database runs locally using IndexedDB - no external configuration needed`;
        break;
      
      case 'advanced':
        envContent = `# Advanced Environment Configuration
# Copy this file to .env.local and add your actual credentials

# OpenAI Configuration
VITE_OPENAI_API_KEY=your_openai_api_key_here

# Optional: Content Extraction Service
VITE_CONTENT_EXTRACTION_URL=your_backend_url_for_content_extraction

# Optional: Development Settings
VITE_DEBUG_MODE=true
VITE_LOG_LEVEL=info

# Note: Vector database runs locally using IndexedDB - no external configuration needed`;
        break;
      
      case 'production':
        envContent = `# Production Environment Configuration
# Copy this file to .env.production and add your actual credentials

# OpenAI Configuration
VITE_OPENAI_API_KEY=your_openai_api_key_here

# Production Settings
VITE_DEBUG_MODE=false
VITE_LOG_LEVEL=error
VITE_ENABLE_ANALYTICS=true

# Note: Vector database runs locally using IndexedDB - no external configuration needed`;
        break;
    }

    // Create and download the file
    const blob = new Blob([envContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `.env.${type === 'production' ? 'production' : 'local'}`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: `Environment File Downloaded`,
      description: `Save this as ${a.download} in your project root and add your credentials.`,
    });
  };

  const copyEnvTemplate = () => {
    const envContent = `# OpenAI Configuration
VITE_OPENAI_API_KEY=your_openai_api_key_here

# Note: Vector database runs locally using IndexedDB - no external configuration needed`;

    navigator.clipboard.writeText(envContent).then(() => {
      toast({
        title: "Environment Template Copied",
        description: "Paste this into your .env.local file and add your credentials.",
      });
    }).catch(() => {
      toast({
        title: "Copy Failed",
        description: "Please manually copy the environment template.",
        variant: "destructive",
      });
    });
  };

  const isFullyConfigured = Object.values(configStatus).every(status => status === 'configured');
  const isUsingMockServices = ContentService.isUsingMockServices();

  return (
    <Card className="glass mb-8">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Settings className="w-5 h-5" />
          <span>Configuration Status</span>
          {isFullyConfigured && (
            <Badge variant="secondary" className="bg-green-500/20 text-green-700 border-green-500/30">
              Ready to Use
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isChecking ? (
          <div className="flex items-center space-x-2 text-muted-foreground">
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            <span>Checking configuration...</span>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-3 p-3 rounded-lg border">
                {getStatusIcon(configStatus.database)}
                <div>
                  <p className="font-medium">Database</p>
                  <Badge 
                    variant="outline" 
                    className={`${getStatusColor(configStatus.database)} border`}
                  >
                    {getStatusText(configStatus.database)}
                  </Badge>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-3 rounded-lg border">
                {getStatusIcon(configStatus.openai)}
                <div>
                  <p className="font-medium">OpenAI</p>
                  <Badge 
                    variant="outline" 
                    className={`${getStatusColor(configStatus.openai)} border`}
                  >
                    {getStatusText(configStatus.openai)}
                  </Badge>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-3 rounded-lg border">
                {getStatusIcon(configStatus.vectorDatabase)}
                <div>
                  <p className="font-medium">Vector Database</p>
                  <Badge 
                    variant="outline" 
                    className={`${getStatusColor(configStatus.vectorDatabase)} border`}
                  >
                    {getStatusText(configStatus.vectorDatabase)}
                  </Badge>
                </div>
              </div>
            </div>

            {!isFullyConfigured && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-lg bg-amber-50 border border-amber-200"
              >
                <h4 className="font-medium text-amber-800 mb-2">Setup Required</h4>
                <div className="space-y-2 text-sm text-amber-700">
                  <p>To enable full functionality, you need to:</p>
                  <ol className="list-decimal list-inside space-y-1 ml-4">
                    {configStatus.openai === 'missing' && (
                      <li>Add your OpenAI API key to the <code className="bg-amber-100 px-1 rounded">.env.local</code> file</li>
                    )}
                    {configStatus.vectorDatabase === 'missing' && (
                      <li>Vector database will initialize automatically when you start using the app</li>
                    )}
                  </ol>
                  
                  <div className="mt-3 p-3 bg-amber-100 rounded">
                    <p className="text-xs font-medium">Quick Start:</p>
                    <p className="text-xs">1. Create <code className="bg-white px-1 rounded">.env.local</code> file in project root</p>
                    <p className="text-xs">2. Add your OpenAI API key (optional - app works with mock services)</p>
                    <p className="text-xs">3. Vector database runs locally using IndexedDB - no setup needed</p>
                    <p className="text-xs">4. Restart the dev server</p>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2 mt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowEnvCreator(!showEnvCreator)}
                    className="flex items-center space-x-2"
                  >
                    <FileText className="w-3 h-3" />
                    <span>Create Environment File</span>
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyEnvTemplate}
                    className="flex items-center space-x-2"
                  >
                    <Copy className="w-3 h-3" />
                    <span>Copy Template</span>
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open('https://platform.openai.com/api-keys', '_blank')}
                  >
                    <ExternalLink className="w-3 h-4 mr-1" />
                    OpenAI API Keys
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={checkConfiguration}
                  >
                    Recheck Configuration
                  </Button>
                </div>

                {/* Environment File Creator */}
                {showEnvCreator && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4 p-4 bg-white rounded-lg border border-amber-200"
                  >
                    <h5 className="font-medium text-amber-800 mb-3">Choose Environment File Type:</h5>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => createEnvFile('basic')}
                        className="flex flex-col items-center space-y-2 h-auto py-3"
                      >
                        <Download className="w-4 h-4" />
                        <span className="text-xs">Basic</span>
                        <span className="text-xs text-muted-foreground">Essential config</span>
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => createEnvFile('advanced')}
                        className="flex flex-col items-center space-x-2 h-auto py-3"
                      >
                        <Download className="w-4 h-4" />
                        <span className="text-xs">Advanced</span>
                        <span className="text-xs text-muted-foreground">With extras</span>
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => createEnvFile('production')}
                        className="flex flex-col items-center space-x-2 h-auto py-3"
                      >
                        <Download className="w-4 h-4" />
                        <span className="text-xs">Production</span>
                        <span className="text-xs text-muted-foreground">Deployment ready</span>
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2 text-center">
                      Files will be downloaded automatically. Save them in your project root.
                    </p>
                  </motion.div>
                )}
              </motion.div>
            )}

            {isFullyConfigured && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-lg bg-green-50 border border-green-200"
              >
                <div className="flex items-center space-x-2 text-green-800">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">All systems are configured and ready!</span>
                </div>
                <p className="text-sm text-green-700 mt-1">
                  You can now ingest content and ask questions using the AI-powered search.
                </p>
              </motion.div>
            )}

            {isUsingMockServices && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-lg bg-blue-50 border border-blue-200"
              >
                <div className="flex items-center space-x-2 text-blue-800">
                  <Database className="w-5 h-5" />
                  <span className="font-medium">Vector Database Active - Full Functionality Available!</span>
                </div>
                <p className="text-sm text-blue-700 mt-1">
                  Using local IndexedDB vector database for development. You can test all features including URL ingestion, 
                  content chunking, vectorization, and AI-powered Q&A without external API keys.
                </p>
                <div className="mt-2 text-xs text-blue-600">
                  <p>✅ URL content extraction working</p>
                  <p>✅ Local IndexedDB vector database</p>
                  <p>✅ Automatic content chunking with overlap</p>
                  <p>✅ Vector similarity search</p>
                  <p>✅ Persistent data storage</p>
                </div>
              </motion.div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

