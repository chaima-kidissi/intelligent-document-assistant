import { Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Admin Pages
import AdminLayout from './layouts/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';
import DocumentManagement from './pages/admin/DocumentManagement';

// Chat UI Components
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Chat from './components/Chat';
import ChatInput from './components/ChatInput';
import Home from './pages/Home';
import { useChat } from './hooks/useChat';

function ChatPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  const {
    conversations,
    activeConversation,
    activeConversationId,
    isLoading,
    sendChat,
    sendVoiceChat,
    setActiveConversationId,
    deleteConversation,
    startNewConversation,
    createConversation,
    setActiveDocument,
  } = useChat();

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) {
        setSidebarOpen(false);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleFileUpload = (fileName: string) => {
    let convId = activeConversationId;
    if (!convId) {
      convId = createConversation(`Document: ${fileName}`);
    }
    setActiveDocument(convId, fileName);
  };

  const hasMessages = activeConversation && activeConversation.messages.length > 0;

  return (
    <div
      className="h-screen flex overflow-hidden"
      style={{ backgroundColor: 'var(--color-bg-primary)' }}
    >
      <Sidebar
        isOpen={sidebarOpen}
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={setActiveConversationId}
        onNewConversation={startNewConversation}
        onDeleteConversation={deleteConversation}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode((d) => !d)}
        onClose={() => setSidebarOpen(false)}
      />

      <div
        className="flex-1 flex flex-col min-w-0 transition-all duration-300 ease-out"
        style={{
          marginLeft: sidebarOpen && !isMobile ? '320px' : '0',
        }}
      >
        <Header
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen((s) => !s)}
          conversationTitle={activeConversation?.title}
        />

        {hasMessages ? (
          <>
            <Chat messages={activeConversation.messages} isLoading={isLoading} />
            <ChatInput onSend={sendChat} onVoiceSend={sendVoiceChat} isLoading={isLoading} onFileUpload={handleFileUpload} />
          </>
        ) : (
          <Home onSendMessage={sendChat} onVoiceSend={sendVoiceChat} onFileUpload={handleFileUpload} />
        )}
      </div>
    </div>
  );
}

export default function App() {
  const { isAdmin } = useAuth();

  return (
    <Routes>
      {/* Root redirect based on role */}
      <Route path="/" element={<Navigate to={isAdmin ? "/admin" : "/chat"} replace />} />
      
      {/* User Portal (Chat) */}
      <Route path="/chat" element={<ChatPage />} />
      
      {/* Admin Portal */}
      <Route 
        path="/admin" 
        element={
          <ProtectedRoute requiredRole="admin">
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="users" element={<UserManagement />} />
        <Route path="documents" element={<DocumentManagement />} />
      </Route>
      
      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
