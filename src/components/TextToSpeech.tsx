import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Volume2, VolumeX, Pause, Play } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface TextToSpeechProps {
  text: string;
  autoPlay?: boolean;
  className?: string;
}

export const TextToSpeech: React.FC<TextToSpeechProps> = ({ 
  text, 
  autoPlay = false,
  className = ""
}) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = speechSynthesis.getVoices();
      setVoices(availableVoices);
    };

    loadVoices();
    speechSynthesis.addEventListener('voiceschanged', loadVoices);

    return () => {
      speechSynthesis.removeEventListener('voiceschanged', loadVoices);
      speechSynthesis.cancel();
    };
  }, []);

  useEffect(() => {
    if (autoPlay && text) {
      speakText();
    }
  }, [text, autoPlay]);

  const speakText = () => {
    if (!text) return;

    // Cancel any existing speech
    speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Try to use a more natural voice
    const preferredVoice = voices.find(voice => 
      voice.name.includes('Google') || 
      voice.name.includes('Microsoft') ||
      voice.name.includes('Natural')
    ) || voices[0];
    
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;

    utterance.onstart = () => {
      setIsSpeaking(true);
      setIsPaused(false);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      setIsPaused(false);
    };

    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event);
      toast({
        title: "Text-to-Speech Error",
        description: "Could not play audio. Please check your browser settings.",
        variant: "destructive",
      });
      setIsSpeaking(false);
      setIsPaused(false);
    };

    utterance.onpause = () => {
      setIsPaused(true);
    };

    utterance.onresume = () => {
      setIsPaused(false);
    };

    speechSynthesis.speak(utterance);
  };

  const pauseSpeech = () => {
    if (isSpeaking && !isPaused) {
      speechSynthesis.pause();
    }
  };

  const resumeSpeech = () => {
    if (isSpeaking && isPaused) {
      speechSynthesis.resume();
    }
  };

  const stopSpeech = () => {
    speechSynthesis.cancel();
    setIsSpeaking(false);
    setIsPaused(false);
  };

  const toggleSpeech = () => {
    if (!isSpeaking) {
      speakText();
    } else if (isPaused) {
      resumeSpeech();
    } else {
      pauseSpeech();
    }
  };

  if (!text) return null;

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleSpeech}
          className="flex items-center space-x-1 text-voice-primary hover:text-voice-secondary"
        >
          {isSpeaking ? (
            isPaused ? (
              <Play className="w-4 h-4" />
            ) : (
              <Pause className="w-4 h-4" />
            )
          ) : (
            <Volume2 className="w-4 h-4" />
          )}
          <span className="text-xs">
            {isSpeaking 
              ? (isPaused ? 'Resume' : 'Pause')
              : 'Listen'
            }
          </span>
        </Button>
      </motion.div>

      {isSpeaking && (
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center space-x-1"
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={stopSpeech}
            className="text-destructive hover:text-destructive/80"
          >
            <VolumeX className="w-4 h-4" />
          </Button>
          
          {/* Sound wave animation */}
          <div className="flex space-x-1">
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                className="w-1 bg-voice-primary rounded-full"
                animate={!isPaused ? {
                  height: [4, 12, 4],
                  opacity: [0.4, 1, 0.4]
                } : { height: 4, opacity: 0.4 }}
                transition={{
                  duration: 0.6,
                  repeat: !isPaused ? Infinity : 0,
                  delay: i * 0.1
                }}
              />
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};