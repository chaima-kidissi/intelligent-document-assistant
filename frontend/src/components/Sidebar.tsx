import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import type { Variants } from 'framer-motion';
import {
  Plus,
  MessageSquare,
  Settings,
  Sun,
  Moon,
  Info,
  Trash2,
  PanelLeftClose,
  LogOut,
  Shield,
} from 'lucide-react';
import type { Conversation } from '../types/chat';
import keycloak from '../keycloak';
import { useAuth } from '../contexts/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  onDeleteConversation: (id: string) => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onClose: () => void;
}

export default function Sidebar({
  isOpen,
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  darkMode,
  onToggleDarkMode,
  onClose,
}: SidebarProps) {
  const [showSettings, setShowSettings] = useState(false);
  const [hoveredConv, setHoveredConv] = useState<string | null>(null);
  
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  const sidebarVariants: Variants = {
    open: {
      x: 0,
      width: 320,
      transition: { type: 'spring', stiffness: 300, damping: 30 },
    },
    closed: {
      x: -300,
      width: 0,
      transition: { type: 'spring', stiffness: 300, damping: 30 },
    },
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Mobile overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          />

          <motion.aside
            variants={sidebarVariants}
            initial="closed"
            animate="open"
            exit="closed"
            className="fixed left-0 top-0 bottom-0 z-50 flex flex-col border-r overflow-hidden"
            style={{
              backgroundColor: 'var(--color-bg-sidebar)',
              borderColor: 'var(--color-border)',
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6" style={{ paddingTop: '28px', paddingBottom: '24px' }}>
              <div className="flex items-center gap-3">
                <img
                  src="/addinn-logo.png"
                  alt="Addinn"
                  className="h-9 object-contain"
                />
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="p-1.5 rounded-lg transition-colors cursor-pointer hover:bg-[var(--color-hover)]"
                style={{ color: 'var(--color-text-muted)' }}
              >
                <PanelLeftClose size={18} />
              </motion.button>
            </div>

            {/* New conversation button */}
            <div className="px-5" style={{ marginBottom: '32px' }}>
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={onNewConversation}
                className="w-full flex items-center gap-3 px-3 rounded-xl font-medium text-sm transition-all duration-200 cursor-pointer"
                style={{
                  backgroundColor: 'var(--color-primary)',
                  color: '#FFFFFF',
                  height: '44px',
                }}
              >
                <Plus size={18} />
                Nouvelle conversation
              </motion.button>
            </div>

            {/* Navigation items */}
            <div className="flex-1 overflow-y-auto px-4">
              {isAdmin && (
                <div style={{ marginBottom: '24px' }}>
                  <motion.button
                    whileHover={{ x: 2 }}
                    onClick={() => navigate('/admin')}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-colors cursor-pointer group"
                    style={{ backgroundColor: 'rgba(102, 126, 234, 0.1)' }}
                  >
                    <Shield size={18} style={{ color: '#764ba2' }} />
                    <span className="text-sm font-semibold" style={{ color: '#667eea' }}>
                      Administration
                    </span>
                  </motion.button>
                </div>
              )}

              {/* Conversations section */}
              <p
                className="text-[10px] font-semibold uppercase tracking-widest px-2"
                style={{ color: 'var(--color-text-muted)', marginBottom: '16px' }}
              >
                Conversations
              </p>

              {conversations.length === 0 ? (
                <p
                  className="text-sm text-center"
                  style={{ color: 'var(--color-text-muted)', padding: '20px 12px', marginBottom: '12px' }}
                >
                  Aucune conversation
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
                  {conversations.map((conv) => (
                    <motion.div
                      key={conv.id}
                      whileHover={{ x: 2 }}
                      onHoverStart={() => setHoveredConv(conv.id)}
                      onHoverEnd={() => setHoveredConv(null)}
                      onClick={() => onSelectConversation(conv.id)}
                      className="group flex items-center gap-3 rounded-xl cursor-pointer transition-colors duration-150 relative"
                      style={{
                        backgroundColor:
                          activeConversationId === conv.id
                            ? 'var(--color-hover)'
                            : 'transparent',
                        padding: '12px',
                      }}
                    >
                      <MessageSquare
                        size={18}
                        style={{
                          color:
                            activeConversationId === conv.id
                              ? 'var(--color-primary)'
                              : 'var(--color-text-muted)',
                          flexShrink: 0,
                        }}
                      />
                      <span
                        className="text-sm truncate flex-1"
                        style={{
                          color:
                            activeConversationId === conv.id
                              ? 'var(--color-text-primary)'
                              : 'var(--color-text-secondary)',
                          fontWeight:
                            activeConversationId === conv.id ? 500 : 400,
                        }}
                      >
                        {conv.title}
                      </span>

                      <AnimatePresence>
                        {hoveredConv === conv.id && (
                          <motion.button
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteConversation(conv.id);
                            }}
                            className="absolute right-2 p-1 rounded-lg transition-colors cursor-pointer"
                            style={{ color: 'var(--color-text-muted)' }}
                            title="Supprimer la conversation"
                          >
                            <Trash2 size={14} />
                          </motion.button>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  ))}
                </div>
              )}


            </div>

            {/* Settings */}
            <div
              className="border-t p-5"
              style={{ borderColor: 'var(--color-border)' }}
            >
              <motion.button
                whileHover={{ x: 2 }}
                onClick={() => setShowSettings(!showSettings)}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition-colors cursor-pointer"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                <Settings size={15} />
                <span className="text-sm">Paramètres</span>
              </motion.button>

              <AnimatePresence>
                {showSettings && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="pt-2 space-y-1">
                      {/* Dark mode toggle */}
                      <button
                        onClick={onToggleDarkMode}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-xl transition-colors cursor-pointer"
                        style={{ color: 'var(--color-text-secondary)' }}
                      >
                        <div className="flex items-center gap-2.5">
                          {darkMode ? <Moon size={15} /> : <Sun size={15} />}
                          <span className="text-sm">
                            {darkMode ? 'Mode sombre' : 'Mode clair'}
                          </span>
                        </div>
                        {/* Toggle switch */}
                        <div
                          className="relative w-9 h-5 rounded-full transition-colors duration-200"
                          style={{
                            backgroundColor: darkMode
                              ? 'var(--color-text-primary)'
                              : 'var(--color-border)',
                          }}
                        >
                          <motion.div
                            layout
                            className="absolute top-0.5 w-4 h-4 rounded-full shadow-sm"
                            style={{
                              left: darkMode ? '18px' : '2px',
                              backgroundColor: darkMode ? 'var(--color-bg-primary)' : '#FFFFFF',
                            }}
                            transition={{
                              type: 'spring',
                              stiffness: 500,
                              damping: 30,
                            }}
                          />
                        </div>
                      </button>

                      {/* About */}
                      <div
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl"
                        style={{ color: 'var(--color-text-secondary)' }}
                      >
                        <Info size={15} />
                        <span className="text-sm">À propos</span>
                      </div>

                      {/* Logout */}
                      <button
                        onClick={() => {
                          localStorage.removeItem('kc_token');
                          localStorage.removeItem('kc_refreshToken');
                          keycloak.logout({ redirectUri: window.location.origin });
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition-colors cursor-pointer"
                        style={{ color: 'var(--color-text-secondary)' }}
                      >
                        <LogOut size={15} />
                        <span className="text-sm">Se déconnecter</span>
                      </button>

                      {/* Version */}
                      <div className="px-3 py-1">
                        <p
                          className="text-[10px]"
                          style={{ color: 'var(--color-text-muted)' }}
                        >
                          Version 1.0.0
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
