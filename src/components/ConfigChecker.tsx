import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertTriangle, Settings, ExternalLink } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface ConfigStatus {
  supabase: 'configured' | 'missing' | 'error';
  openai: 'configured' | 'missing' | 'error';
  database: 'configured' | 'missing' | 'error';
}

export const ConfigChecker: React.FC = () => {
  const [configStatus, setConfigStatus] = useState<ConfigStatus>({
    supabase: 'missing',
    openai: 'missing',
    database: 'missing'
  });
  const [isChecking, setIsChecking] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    checkConfiguration();
  }, []);

  const checkConfiguration = async () => {
    setIsChecking(true);
    
    try {
      // Check Supabase configuration
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseKey) {
        setConfigStatus(prev => ({ ...prev, supabase: 'missing' }));
      } else {
        setConfigStatus(prev => ({ ...prev, supabase: 'configured' }));
      }

      // Check OpenAI configuration
      const openaiKey = import.meta.env.VITE_OPENAI_API_KEY;
      
      if (!openaiKey) {
        setConfigStatus(prev => ({ ...prev, openai: 'missing' }));
      } else {
        setConfigStatus(prev => ({ ...prev, openai: 'configured' }));
      }

      // Check database connection
      if (supabaseUrl && supabaseKey) {
        try {
          const { createClient } = await import('@supabase/supabase-js');
          const supabase = createClient(supabaseUrl, supabaseKey);
          
          const { data, error } = await supabase
            .from('content')
            .select('count')
            .limit(1);
          
          if (error && error.message.includes('relation "content" does not exist')) {
            setConfigStatus(prev => ({ ...prev, database: 'missing' }));
          } else if (error) {
            setConfigStatus(prev => ({ ...prev, database: 'error' }));
          } else {
            setConfigStatus(prev => ({ ...prev, database: 'configured' }));
          }
        } catch (error) {
          setConfigStatus(prev => ({ ...prev, database: 'error' }));
        }
      } else {
        setConfigStatus(prev => ({ ...prev, database: 'missing' }));
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

  const isFullyConfigured = Object.values(configStatus).every(status => status === 'configured');

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
                {getStatusIcon(configStatus.supabase)}
                <div>
                  <p className="font-medium">Supabase</p>
                  <Badge 
                    variant="outline" 
                    className={`${getStatusColor(configStatus.supabase)} border`}
                  >
                    {getStatusText(configStatus.supabase)}
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
                    {configStatus.supabase === 'missing' && (
                      <li>Configure Supabase environment variables in your <code className="bg-amber-100 px-1 rounded">.env</code> file</li>
                    )}
                    {configStatus.openai === 'missing' && (
                      <li>Add your OpenAI API key to the <code className="bg-amber-100 px-1 rounded">.env</code> file</li>
                    )}
                    {configStatus.database === 'missing' && (
                      <li>Run the SQL setup script in your Supabase SQL editor</li>
                    )}
                  </ol>
                </div>
                
                <div className="flex flex-wrap gap-2 mt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open('https://supabase.com/docs/guides/getting-started', '_blank')}
                  >
                    <ExternalLink className="w-3 h-3 mr-1" />
                    Supabase Setup
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open('https://platform.openai.com/api-keys', '_blank')}
                  >
                    <ExternalLink className="w-3 h-3 mr-1" />
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
          </>
        )}
      </CardContent>
    </Card>
  );
};

