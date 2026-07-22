import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, ArrowUp, Mic, AudioLines, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { uploadFile } from '../services/api';

interface ChatInputProps {
  onSend: (message: string) => void;
  onVoiceSend?: (message: string) => void;
  isLoading: boolean;
  onFileUpload?: (fileName: string) => void;
}

interface Toast {
  type: 'success' | 'error';
  message: string;
}

export default function ChatInput({ onSend, onVoiceSend, isLoading, onFileUpload }: ChatInputProps) {
  const [input, setInput] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      await uploadFile(file);
      showToast('success', `"${file.name}" ajouté à la base de connaissances !`);
      if (onFileUpload) {
        onFileUpload(file.name);
      }
    } catch (error) {
      console.error('Upload failed', error);
      showToast('error', "Erreur lors de l'upload du fichier.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  /**
   * Dictation mode: mic button fills the text input.
   */
  const toggleDictation = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      showToast('error', "Votre navigateur ne supporte pas la reconnaissance vocale.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'fr-FR';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput((prev) => {
        const space = prev && !prev.endsWith(' ') ? ' ' : '';
        return prev + space + transcript;
      });
    };

    recognition.onerror = (event: any) => {
      console.error("Erreur vocale:", event.error);
      if (event.error !== 'no-speech') {
        showToast('error', "Erreur lors de l'écoute vocale.");
      }
      setIsListening(false);
    };

    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
    recognition.start();
  };

  /**
   * Voice-to-voice mode: captures speech and sends directly via onVoiceSend.
   * No text appears in the input field.
   */
  const startVoiceConversation = () => {
    if (isVoiceMode) {
      recognitionRef.current?.stop();
      setIsVoiceMode(false);
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      showToast('error', "Votre navigateur ne supporte pas la reconnaissance vocale.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'fr-FR';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsVoiceMode(true);
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      if (transcript.trim()) {
        // Send directly — no text in input
        if (onVoiceSend) {
          onVoiceSend(transcript.trim());
        } else {
          onSend(transcript.trim());
        }
      }
    };

    recognition.onerror = (event: any) => {
      console.error("Erreur vocale:", event.error);
      if (event.error !== 'no-speech') {
        showToast('error', "Erreur lors de l'écoute vocale.");
      }
      setIsVoiceMode(false);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsVoiceMode(false);
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const handleSubmit = () => {
    const trimmed = input.trim();
    if (trimmed && !isLoading) {
      onSend(trimmed);
      setInput('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  }, [input]);

  return (
    <div
      className="mt-4 flex flex-col items-center pt-2 pb-6 px-3 sm:px-10"
      style={{ backgroundColor: 'var(--color-bg-primary)' }}
    >
      {/* Voice Mode Overlay */}
      <AnimatePresence>
        {isVoiceMode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="voice-overlay"
            onClick={startVoiceConversation}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="voice-overlay-content"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Sound waves animation */}
              <div className="voice-waves">
                {[...Array(5)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="voice-wave-bar"
                    animate={{
                      scaleY: [0.3, 1, 0.3],
                    }}
                    transition={{
                      duration: 0.8,
                      repeat: Infinity,
                      delay: i * 0.1,
                      ease: 'easeInOut',
                    }}
                  />
                ))}
              </div>

              <p className="voice-overlay-text">Je vous écoute...</p>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={startVoiceConversation}
                className="voice-stop-btn"
              >
                Arrêter
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="w-full max-w-[900px] mx-auto">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="relative rounded-[2rem] border transition-shadow duration-200 focus-within:shadow-md flex items-center"
          style={{
            backgroundColor: 'var(--color-input-bg)',
            borderColor: 'var(--color-border)',
            minHeight: '60px',
            paddingRight: '14px',
          }}
        >
          <div className="flex items-center w-full pl-3 sm:pl-6 pr-2 sm:pr-4 gap-2 sm:gap-3">
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept=".docx"
              onChange={handleFileChange}
            />

            {/* Plus button */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading || isLoading}
              className="flex flex-shrink-0 items-center justify-center w-10 h-10 rounded-full transition-colors cursor-pointer disabled:opacity-50"
              style={{ color: 'var(--color-text-primary)' }}
              title="Joindre un fichier (.docx)"
            >
              {isUploading ? (
                <Loader2 size={22} strokeWidth={2} className="animate-spin" />
              ) : (
                <Plus size={22} strokeWidth={2} />
              )}
            </motion.button>

            {/* Input */}
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Poser une question"
              rows={1}
              disabled={isLoading}
              className="flex-1 bg-transparent resize-none outline-none text-[15px] py-5 px-0 placeholder-opacity-60 max-h-48 self-center scrollbar-hide"
              style={{
                color: 'var(--color-text-primary)',
              }}
            />

            <div className="flex items-center gap-1">
              {/* Mic button (dictation — fills text input) */}
              <motion.button
                onClick={toggleDictation}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className={`flex flex-shrink-0 items-center justify-center h-10 w-10 rounded-full transition-all duration-200 cursor-pointer mr-2 ${
                  isListening && !isVoiceMode ? 'bg-red-100 text-red-600 animate-pulse' : ''
                }`}
                style={!(isListening && !isVoiceMode) ? { color: 'var(--color-text-primary)' } : {}}
                title={isListening ? "Arrêter l'écoute" : "Saisie vocale (dictée)"}
              >
                <Mic size={22} strokeWidth={2} />
              </motion.button>

              {/* Send or Voice conversation button */}
              <div className="flex flex-shrink-0 items-center justify-end min-w-[44px]">
                {input.trim() ? (
                  <motion.button
                    key="send"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={handleSubmit}
                    disabled={isLoading}
                    className="flex flex-shrink-0 items-center justify-center w-10 h-10 rounded-full transition-all duration-200 cursor-pointer"
                    style={{
                      backgroundColor: 'var(--color-primary)',
                      color: 'var(--color-bg-primary)',
                    }}
                  >
                    <ArrowUp size={18} strokeWidth={2} />
                  </motion.button>
                ) : (
                  <motion.button
                    key="voix"
                    onClick={startVoiceConversation}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.9 }}
                    disabled={isLoading}
                    className={`flex flex-shrink-0 items-center justify-center gap-2 h-10 px-5 rounded-full transition-all duration-200 cursor-pointer whitespace-nowrap ${
                      isVoiceMode ? 'bg-red-100 text-red-600 animate-pulse' : ''
                    }`}
                    style={!isVoiceMode ? {
                      backgroundColor: 'var(--color-hover)',
                      color: 'var(--color-text-primary)',
                    } : {}}
                    title="Conversation vocale (voix-à-voix)"
                  >
                    <AudioLines size={20} strokeWidth={2} />
                    <span className="text-[15px] font-medium">
                      {isVoiceMode ? 'Écoute...' : 'Voix'}
                    </span>
                  </motion.button>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Toast notification */}
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.97 }}
              transition={{ duration: 0.25 }}
              className="mt-3 flex items-center gap-2.5 px-4 py-3 rounded-2xl text-sm font-medium shadow-md"
              style={{
                backgroundColor:
                  toast.type === 'success'
                    ? 'rgba(34,197,94,0.12)'
                    : 'rgba(239,68,68,0.12)',
                color: toast.type === 'success' ? '#16a34a' : '#dc2626',
                border: `1px solid ${
                  toast.type === 'success'
                    ? 'rgba(34,197,94,0.3)'
                    : 'rgba(239,68,68,0.3)'
                }`,
              }}
            >
              {toast.type === 'success' ? (
                <CheckCircle2 size={16} />
              ) : (
                <XCircle size={16} />
              )}
              {toast.message}
            </motion.div>
          )}
        </AnimatePresence>

        <p
          className="text-center text-[10px] mt-2 mb-1"
          style={{ color: 'var(--color-text-muted)' }}
        >
          Q&R Desk peut faire des erreurs. Vérifiez les informations importantes.
        </p>
      </div>
    </div>
  );
}
