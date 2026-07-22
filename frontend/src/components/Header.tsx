import { motion } from 'framer-motion';
import {
  PanelLeftClose,
  PanelLeft,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface HeaderProps {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  conversationTitle?: string;
}

export default function Header({
  sidebarOpen,
  onToggleSidebar,
  conversationTitle,
}: HeaderProps) {
  const { username, isAdmin } = useAuth();

  return (
    <header
      className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 border-b backdrop-blur-xl"
      style={{
        backgroundColor: 'color-mix(in srgb, var(--color-bg-primary) 80%, transparent)',
        borderColor: 'var(--color-border)',
      }}
    >
      <div className="flex items-center gap-3">
        {/* Toggle sidebar */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onToggleSidebar}
          className="p-2 rounded-xl transition-colors cursor-pointer"
          style={{ color: 'var(--color-text-secondary)' }}
          title={sidebarOpen ? 'Fermer le panneau' : 'Ouvrir le panneau'}
        >
          {sidebarOpen ? <PanelLeftClose size={20} /> : <PanelLeft size={20} />}
        </motion.button>

        {/* Logo (visible only when sidebar is closed) */}
        {!sidebarOpen && (
          <motion.img
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            src="/addinn-logo.png"
            alt="Addinn"
            className="h-8 object-contain"
          />
        )}

        {/* Title */}
        {conversationTitle && (
          <motion.h2
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-sm font-semibold truncate max-w-[150px] sm:max-w-[300px]"
            style={{ color: 'var(--color-text-primary)' }}
          >
            {conversationTitle}
          </motion.h2>
        )}
      </div>

      <div className="flex items-center gap-4">
        <div className="flex flex-col items-end hidden sm:flex">
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {username}
          </span>
          {isAdmin ? (
            <span className="role-badge-admin">Admin</span>
          ) : (
            <span className="role-badge-user">User</span>
          )}
        </div>
        <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white shadow-sm" style={{ background: isAdmin ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'linear-gradient(135deg, #1565C0 0%, #42A5F5 100%)' }}>
          {username.charAt(0).toUpperCase()}
        </div>
      </div>
    </header>
  );
}
