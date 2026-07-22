import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Eye, X } from 'lucide-react';
import type { Source } from '../types/chat';

interface SourceCardProps {
  source: Source;
  index: number;
}

export default function SourceCard({ source, index }: SourceCardProps) {
  const [showExcerpt, setShowExcerpt] = useState(false);

  const scoreColor =
    source.score >= 0.9
      ? 'text-emerald-500'
      : source.score >= 0.7
        ? 'text-amber-500'
        : 'text-red-400';

  const scoreBarWidth = `${Math.round(source.score * 100)}%`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.3 }}
      className="group relative"
    >
      <div
        className="rounded-xl border p-3.5 transition-all duration-200 hover:shadow-md cursor-pointer"
        style={{
          backgroundColor: 'var(--color-bg-card)',
          borderColor: 'var(--color-border)',
        }}
      >
        <div className="flex items-start gap-3">
          {/* File icon */}
          <div
            className="flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: 'var(--color-primary)', opacity: 0.1 }}
          >
            <FileText size={18} style={{ color: 'var(--color-primary)' }} />
          </div>
          <div
            className="flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center absolute"
            style={{ backgroundColor: 'transparent' }}
          >
            <FileText size={18} style={{ color: 'var(--color-primary)' }} />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p
              className="text-sm font-medium truncate"
              style={{ color: 'var(--color-text-primary)' }}
            >
              {source.file}
            </p>
            <div className="flex items-center gap-3 mt-1">
              <span
                className="text-xs"
                style={{ color: 'var(--color-text-muted)' }}
              >
                Page {source.page}
              </span>
              <div className="flex items-center gap-1.5">
                <div
                  className="w-12 h-1.5 rounded-full overflow-hidden"
                  style={{ backgroundColor: 'var(--color-border)' }}
                >
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: scoreBarWidth,
                      backgroundColor: 'var(--color-primary)',
                    }}
                  />
                </div>
                <span className={`text-xs font-semibold ${scoreColor}`}>
                  {Math.round(source.score * 100)}%
                </span>
              </div>
            </div>
          </div>

          {/* View button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowExcerpt(!showExcerpt)}
            className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer"
            style={{
              backgroundColor: showExcerpt ? 'var(--color-primary)' : 'var(--color-hover)',
              color: showExcerpt ? '#FFFFFF' : 'var(--color-primary)',
            }}
          >
            {showExcerpt ? <X size={12} /> : <Eye size={12} />}
            {showExcerpt ? 'Close' : 'View excerpt'}
          </motion.button>
        </div>

        {/* Excerpt */}
        <AnimatePresence>
          {showExcerpt && source.excerpt && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <div
                className="mt-3 pt-3 border-t"
                style={{ borderColor: 'var(--color-border)' }}
              >
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  {source.excerpt}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
