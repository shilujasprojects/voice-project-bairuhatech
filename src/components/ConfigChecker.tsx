import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertCircle, Loader, Database, Brain } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { openai } from '@/lib/openai';

interface ConfigStatus {
  supabase: 'checking' | 'connected' | 'error';
  openai: 'checking' | 'connected' | 'error';
  vector: 'checking' | 'available' | 'error';
}

export const ConfigChecker: React.FC = () => {
  const [status, setStatus] = useState<ConfigStatus>({
    supabase: 'checking',
    openai: 'checking',
    vector: 'checking',
  });
  const [isChecking, setIsChecking] = useState(false);
  const [errorMessages, setErrorMessages] = useState<Record<string, string>>({});

  const checkConfiguration = async () => {
    setIsChecking(true);
    setStatus({
      supabase: 'checking',
      openai: 'checking',
      vector: 'checking',
    });
    setErrorMessages({});

    try {
      // Check Supabase connection
      try {
        const { data, error } = await supabase.from('documents').select('count', { count: 'exact', head: true });
        if (error) throw error;
        setStatus(prev => ({ ...prev, supabase: 'connected' }));
      } catch (error) {
        setStatus(prev => ({ ...prev, supabase: 'error' }));
        setErrorMessages(prev => ({ 
          ...prev, 
          supabase: error instanceof Error ? error.message : 'Unknown error' 
        }));
      }

      // Check OpenAI connection
      try {
        await openai.models.list();
        setStatus(prev => ({ ...prev, openai: 'connected' }));
      } catch (error) {
        setStatus(prev => ({ ...prev, openai: 'error' }));
        setErrorMessages(prev => ({ 
          ...prev, 
          openai: error instanceof Error ? error.message : 'Unknown error' 
        }));
      }

      // Check vector extension
      try {
        const { data, error } = await supabase.rpc('match_documents', {
          query_embedding: new Array(1536).fill(0),
          match_threshold: 0.1,
          match_count: 1,
        });
        if (error) throw error;
        setStatus(prev => ({ ...prev, vector: 'available' }));
      } catch (error) {
        setStatus(prev => ({ ...prev, vector: 'error' }));
        setErrorMessages(prev => ({ 
          ...prev, 
          vector: error instanceof Error ? error.message : 'Unknown error' 
        }));
      }
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    checkConfiguration();
  }, []);

  const getStatusIcon = (status: ConfigStatus[keyof ConfigStatus]) => {
    switch (status) {
      case 'checking':
        return <Loader className="w-4 h-4 animate-spin text-voice-accent" />;
      case 'connected':
      case 'available':
        return <CheckCircle className="w-4 h-4 text-voice-success" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-destructive" />;
      default:
        return <AlertCircle className="w-4 h-4 text-voice-warning" />;
    }
  };

  const getStatusText = (status: ConfigStatus[keyof ConfigStatus]) => {
    switch (status) {
      case 'checking':
        return 'Checking...';
      case 'connected':
      case 'available':
        return 'Connected';
      case 'error':
        return 'Error';
      default:
        return 'Unknown';
    }
  };

  const getStatusColor = (status: ConfigStatus[keyof ConfigStatus]) => {
    switch (status) {
      case 'checking':
        return 'bg-voice-accent/20 text-voice-accent';
      case 'connected':
      case 'available':
        return 'bg-voice-success/20 text-voice-success';
      case 'error':
        return 'bg-destructive/20 text-destructive';
      default:
        return 'bg-voice-warning/20 text-voice-warning';
    }
  };

  const allConnected = Object.values(status).every(s => s === 'connected' || s === 'available');

  return (
    <Card className="glass">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Database className="w-5 h-5 text-voice-primary" />
          <span>Configuration Status</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center space-x-3 p-3 rounded-lg bg-secondary/30">
            <Database className="w-5 h-5 text-voice-primary" />
            <div className="flex-1">
              <p className="text-sm font-medium">Supabase</p>
              <div className="flex items-center space-x-2">
                {getStatusIcon(status.supabase)}
                <Badge variant="outline" className={getStatusColor(status.supabase)}>
                  {getStatusText(status.supabase)}
                </Badge>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-3 rounded-lg bg-secondary/30">
            <Brain className="w-5 h-5 text-voice-primary" />
            <div className="flex-1">
              <p className="text-sm font-medium">OpenAI</p>
              <div className="flex items-center space-x-2">
                {getStatusIcon(status.openai)}
                <Badge variant="outline" className={getStatusColor(status.openai)}>
                  {getStatusText(status.openai)}
                </Badge>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-3 rounded-lg bg-secondary/30">
            <Database className="w-5 h-5 text-voice-primary" />
            <div className="flex-1">
              <p className="text-sm font-medium">Vector Search</p>
              <div className="flex items-center space-x-2">
                {getStatusIcon(status.vector)}
                <Badge variant="outline" className={getStatusColor(status.vector)}>
                  {getStatusText(status.vector)}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Error Messages */}
        {Object.keys(errorMessages).length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-destructive">Configuration Issues:</h4>
            {Object.entries(errorMessages).map(([key, message]) => (
              <div key={key} className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                <p className="text-sm font-medium text-destructive capitalize">{key}:</p>
                <p className="text-xs text-destructive/80">{message}</p>
              </div>
            ))}
          </div>
        )}

        {/* Overall Status */}
        <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/20">
          <div className="flex items-center space-x-2">
            {allConnected ? (
              <CheckCircle className="w-5 h-5 text-voice-success" />
            ) : (
              <AlertCircle className="w-5 h-5 text-voice-warning" />
            )}
            <span className="font-medium">
              {allConnected ? 'All systems operational' : 'Configuration issues detected'}
            </span>
          </div>
          
          <Button
            onClick={checkConfiguration}
            disabled={isChecking}
            variant="outline"
            size="sm"
          >
            {isChecking ? (
              <>
                <Loader className="w-4 h-4 mr-2 animate-spin" />
                Checking...
              </>
            ) : (
              'Recheck'
            )}
          </Button>
        </div>

        {/* Setup Instructions */}
        {!allConnected && (
          <div className="p-4 rounded-lg bg-voice-warning/10 border border-voice-warning/20">
            <h4 className="text-sm font-medium text-voice-warning mb-2">
              Setup Required
            </h4>
            <p className="text-xs text-muted-foreground mb-3">
              Follow the setup guide to configure Supabase and OpenAI:
            </p>
            <div className="text-xs space-y-1 text-muted-foreground">
              <p>1. Create a `.env` file with your API keys</p>
              <p>2. Set up Supabase database tables and vector extension</p>
              <p>3. Restart your development server</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

