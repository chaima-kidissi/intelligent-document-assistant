import { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { User, Bot, BookOpen, Volume2, VolumeX, Loader2, Mic } from 'lucide-react';
import SourceCard from './SourceCard';
import type { Message as MessageType } from '../types/chat';

interface MessageProps {
  message: MessageType;
}

/**
 * Strip markdown syntax to produce clean plaintext for TTS.
 */
function stripMarkdown(md: string): string {
  return md
    .replace(/#{1,6}\s+/g, '')           // headings
    .replace(/(\*\*|__)(.*?)\1/g, '$2')   // bold
    .replace(/(\*|_)(.*?)\1/g, '$2')      // italic
    .replace(/~~(.*?)~~/g, '$1')          // strikethrough
    .replace(/`{1,3}[^`]*`{1,3}/g, '')   // inline/block code
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // links
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1') // images
    .replace(/^\s*[-*+]\s+/gm, '')        // unordered lists
    .replace(/^\s*\d+\.\s+/gm, '')        // ordered lists
    .replace(/>\s+/g, '')                 // blockquotes
    .replace(/\n{2,}/g, '. ')             // double newlines -> pause
    .replace(/\n/g, ' ')                  // single newlines
    .trim();
}

/**
 * Shared TTS utility: speaks text in French.
 */
function speakText(text: string, callbacks?: {
  onStart?: () => void;
  onEnd?: () => void;
  onError?: () => void;
}) {
  if (!('speechSynthesis' in window)) return;

  window.speechSynthesis.cancel();

  const plainText = stripMarkdown(text);
  const utterance = new SpeechSynthesisUtterance(plainText);
  utterance.lang = 'fr-FR';
  utterance.rate = 1.0;
  utterance.pitch = 1.0;

  const voices = window.speechSynthesis.getVoices();
  const frenchVoice = voices.find(
    (v) => v.lang.startsWith('fr') && v.localService
  ) || voices.find((v) => v.lang.startsWith('fr'));
  if (frenchVoice) {
    utterance.voice = frenchVoice;
  }

  utterance.onstart = () => callbacks?.onStart?.();
  utterance.onend = () => callbacks?.onEnd?.();
  utterance.onerror = () => callbacks?.onError?.();

  window.speechSynthesis.speak(utterance);
  return utterance;
}

function TTSButton({ text, autoPlay = false }: { text: string; autoPlay?: boolean }) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const hasAutoPlayed = useRef(false);

  const stop = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setIsLoading(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  // Auto-play for voice-to-voice responses
  useEffect(() => {
    if (autoPlay && !hasAutoPlayed.current) {
      hasAutoPlayed.current = true;

      // Small delay to let voices load and UI settle
      const timer = setTimeout(() => {
        setIsLoading(true);
        speakText(text, {
          onStart: () => {
            setIsLoading(false);
            setIsSpeaking(true);
          },
          onEnd: () => {
            setIsSpeaking(false);
            setIsLoading(false);
          },
          onError: () => {
            setIsSpeaking(false);
            setIsLoading(false);
          },
        });
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [autoPlay, text]);

  const toggleSpeak = useCallback(() => {
    if (isSpeaking) {
      stop();
      return;
    }

    setIsLoading(true);
    speakText(text, {
      onStart: () => {
        setIsLoading(false);
        setIsSpeaking(true);
      },
      onEnd: () => {
        setIsSpeaking(false);
        setIsLoading(false);
      },
      onError: () => {
        setIsSpeaking(false);
        setIsLoading(false);
      },
    });
  }, [isSpeaking, text, stop]);

  return (
    <motion.button
      onClick={toggleSpeak}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      className="tts-button"
      style={{
        color: isSpeaking
          ? 'var(--color-primary)'
          : 'var(--color-text-muted)',
        backgroundColor: isSpeaking
          ? 'rgba(21, 101, 192, 0.1)'
          : 'transparent',
      }}
      title={isSpeaking ? 'Arrêter la lecture' : 'Écouter la réponse'}
    >
      {isLoading ? (
        <Loader2 size={14} className="animate-spin" />
      ) : isSpeaking ? (
        <VolumeX size={14} />
      ) : (
        <Volume2 size={14} />
      )}
    </motion.button>
  );
}

export default function Message({ message }: MessageProps) {
  const isUser = message.role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      {/* Avatar for assistant */}
      {!isUser && (
        <div
          className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-1"
          style={{ backgroundColor: 'var(--color-primary)' }}
        >
          <Bot size={16} className="text-white" />
        </div>
      )}

      <div className={`max-w-[85%] ${isUser ? 'order-first' : ''}`}>
        {/* Message bubble */}
        <div
          className="rounded-2xl"
          style={{
            display: 'inline-block',
            padding: '12px 20px',
            backgroundColor: isUser
              ? 'var(--color-user-bubble)'
              : 'var(--color-assistant-bubble)',
            color: isUser
              ? 'var(--color-user-text)'
              : 'var(--color-assistant-text)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          {isUser ? (
            <div className="flex items-center gap-2">
              {/* Voice message indicator */}
              {message.isVoiceMessage && (
                <span className="voice-msg-indicator">
                  <Mic size={12} />
                </span>
              )}
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {message.content}
              </p>
            </div>
          ) : (
            <div className="markdown-content text-sm">
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>
          )}
        </div>

        {/* Action bar: Timestamp + TTS button for assistant messages */}
        <div
          className={`flex items-center gap-2 mt-1.5 px-1 ${
            isUser ? 'justify-end' : 'justify-start'
          }`}
        >
          <p
            className="text-[10px]"
            style={{ color: 'var(--color-text-muted)' }}
          >
            {new Date(message.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>

          {/* TTS Button — only on assistant messages, with autoPlay for voice responses */}
          {!isUser && (
            <TTSButton
              text={message.content}
              autoPlay={message.autoSpeak === true}
            />
          )}
        </div>

        {/* Sources */}
        {!isUser && message.sources && message.sources.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-3"
          >
            <div className="flex items-center gap-2 mb-2 px-1">
              <BookOpen size={14} style={{ color: 'var(--color-primary)' }} />
              <span
                className="text-xs font-semibold uppercase tracking-wider"
                style={{ color: 'var(--color-text-muted)' }}
              >
                Sources
              </span>
            </div>
            <div className="grid gap-2">
              {message.sources.map((source, idx) => (
                <SourceCard key={idx} source={source} index={idx} />
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Avatar for user */}
      {isUser && (
        <div
          className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-1"
          style={{
            backgroundColor: 'var(--color-user-bubble)',
          }}
        >
          <User size={16} className="text-white" />
        </div>
      )}
    </motion.div>
  );
}
