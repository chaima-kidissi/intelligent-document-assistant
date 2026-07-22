import { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Message from './Message';
import type { Message as MessageType } from '../types/chat';

interface ChatProps {
  messages: MessageType[];
  isLoading: boolean;
}

function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex gap-3 justify-start"
    >
      <div
        className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center"
        style={{ backgroundColor: 'var(--color-primary)' }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-bg-primary)" strokeWidth="2">
          <path d="M12 8V4H8" />
          <rect width="16" height="12" x="4" y="8" rx="2" />
          <path d="M2 14h2" />
          <path d="M20 14h2" />
          <path d="M15 13v2" />
          <path d="M9 13v2" />
        </svg>
      </div>
      <div
        className="rounded-2xl px-5 py-3.5 flex items-center gap-1.5"
        style={{
          backgroundColor: 'var(--color-assistant-bubble)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <span
          className="typing-dot w-2 h-2 rounded-full inline-block"
          style={{ backgroundColor: 'var(--color-primary)' }}
        />
        <span
          className="typing-dot w-2 h-2 rounded-full inline-block"
          style={{ backgroundColor: 'var(--color-primary)' }}
        />
        <span
          className="typing-dot w-2 h-2 rounded-full inline-block"
          style={{ backgroundColor: 'var(--color-primary)' }}
        />
      </div>
    </motion.div>
  );
}

export default function Chat({ messages, isLoading }: ChatProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-14 py-6 sm:py-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <AnimatePresence mode="popLayout">
          {messages.map((msg) => (
            <Message key={msg.id} message={msg} />
          ))}
        </AnimatePresence>

        <AnimatePresence>
          {isLoading && <TypingIndicator />}
        </AnimatePresence>

        <div ref={bottomRef} />
      </div>
    </div>
  );
}
