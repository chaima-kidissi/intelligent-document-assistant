import { motion } from 'framer-motion';

interface SuggestionCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
}

export default function SuggestionCard({
  icon,
  title,
  description,
  onClick,
}: SuggestionCardProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="group relative rounded-2xl border p-5 text-left transition-all duration-300 cursor-pointer overflow-hidden"
      style={{
        backgroundColor: 'var(--color-bg-card)',
        borderColor: 'var(--color-border)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      {/* Hover glow effect */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"
        style={{
          background:
            'linear-gradient(135deg, rgba(37, 99, 235, 0.05), rgba(59, 130, 246, 0.02))',
        }}
      />

      <div className="relative z-10">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-transform duration-300 group-hover:scale-110"
          style={{
            backgroundColor: 'rgba(37, 99, 235, 0.08)',
            color: 'var(--color-primary)',
          }}
        >
          {icon}
        </div>
        <h3
          className="text-sm font-semibold mb-1"
          style={{ color: 'var(--color-text-primary)' }}
        >
          {title}
        </h3>
        <p
          className="text-xs leading-relaxed"
          style={{ color: 'var(--color-text-muted)' }}
        >
          {description}
        </p>
      </div>
    </motion.button>
  );
}
