import { motion } from 'framer-motion';
import ChatInput from '../components/ChatInput';

interface HomeProps {
  onSendMessage: (message: string) => void;
  onVoiceSend?: (message: string) => void;
  isLoading?: boolean;
  onFileUpload?: (fileName: string) => void;
}

export default function Home({ onSendMessage, onVoiceSend, isLoading, onFileUpload }: HomeProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 sm:px-10 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="w-full max-w-4xl mx-auto flex flex-col gap-8"
      >
        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5 }}
          className="text-2xl sm:text-3xl md:text-4xl font-semibold text-center"
          style={{ color: 'var(--color-text-primary)' }}
        >
          Quelle information recherchez-vous dans les documents de l'entreprise ?
        </motion.h1>

        {/* Search Bar on Home (Below the title) */}
        <div className="w-full">
          <ChatInput onSend={onSendMessage} onVoiceSend={onVoiceSend} isLoading={isLoading ?? false} onFileUpload={onFileUpload} />
        </div>
      </motion.div>
    </div>
  );
}

