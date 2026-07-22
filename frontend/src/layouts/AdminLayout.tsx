import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  MessageSquare, 
  Shield, 
  LogOut,
  ChevronRight,
  Menu,
  X
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function AdminLayout() {
  const { username, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (!mobile) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const navItems = [
    { to: '/admin', icon: <LayoutDashboard size={20} />, label: 'Tableau de bord', end: true },
    { to: '/admin/users', icon: <Users size={20} />, label: 'Utilisateurs' },
    { to: '/admin/documents', icon: <FileText size={20} />, label: 'Documents' },
  ];

  return (
    <div 
      className="flex h-screen overflow-hidden transition-colors duration-300"
      style={{ 
        backgroundColor: 'var(--color-bg-primary)',
        color: 'var(--color-text-primary)'
      }}
    >
      {/* Mobile Top Header */}
      {isMobile && (
        <div 
          className="fixed top-0 left-0 right-0 h-16 z-30 flex items-center justify-between px-4 border-b"
          style={{ backgroundColor: 'var(--color-bg-primary)', borderColor: 'var(--color-border)' }}
        >
          <div className="flex items-center gap-2">
            <Shield size={20} style={{ color: 'var(--color-primary)' }} />
            <span className="font-bold">Administration</span>
          </div>
          <button 
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg"
          >
            <Menu size={24} />
          </button>
        </div>
      )}

      {/* Mobile Overlay */}
      <AnimatePresence>
        {isMobile && sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <AnimatePresence>
        {(sidebarOpen || !isMobile) && (
          <motion.aside 
            initial={isMobile ? { x: -300 } : false}
            animate={{ x: 0 }}
            exit={isMobile ? { x: -300 } : undefined}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className={`w-64 flex-shrink-0 flex flex-col border-r transition-colors duration-300 ${isMobile ? 'fixed inset-y-0 left-0 z-50' : ''}`}
            style={{
              backgroundColor: 'var(--color-bg-sidebar)',
              borderColor: 'var(--color-border)'
            }}
          >
            <div className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div 
                  className="p-2 rounded-xl backdrop-blur-sm border shadow-sm"
                  style={{ 
                    backgroundColor: 'var(--color-bg-card)',
                    borderColor: 'var(--color-border)' 
                  }}
                >
                  <Shield size={24} style={{ color: 'var(--color-primary)' }} />
                </div>
                <div>
                  <h1 className="font-bold text-lg tracking-wide">Administration</h1>
                  <p className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>Q&R Desk Portal</p>
                </div>
              </div>
              {isMobile && (
                <button onClick={() => setSidebarOpen(false)} className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5">
                  <X size={20} />
                </button>
              )}
            </div>

            <nav className="flex-1 px-4 space-y-2 mt-4 overflow-y-auto">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={() => isMobile && setSidebarOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-300 group`
                  }
                  style={({ isActive }) => ({
                    backgroundColor: isActive ? 'var(--color-bg-primary)' : 'transparent',
                    color: isActive ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                    border: isActive ? '1px solid var(--color-border)' : '1px solid transparent',
                    boxShadow: isActive ? 'var(--shadow-sm)' : 'none'
                  })}
                >
                  {({ isActive }) => (
                    <>
                      <div className="flex items-center gap-3 font-medium text-sm">
                        {item.icon}
                        {item.label}
                      </div>
                      <ChevronRight size={16} className={`transition-opacity ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'}`} />
                    </>
                  )}
                </NavLink>
              ))}

              <div className="pt-6 pb-2">
                <p 
                  className="px-4 text-[10px] font-bold uppercase tracking-widest mb-2"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  Application
                </p>
                <button
                  onClick={() => navigate('/chat')}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-300 group hover:bg-black/5 dark:hover:bg-white/5"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  <div className="flex items-center gap-3 font-medium text-sm">
                    <MessageSquare size={20} />
                    Retour au Chat
                  </div>
                </button>
              </div>
            </nav>

            {/* User Profile Footer */}
            <div 
              className="p-4 border-t"
              style={{ borderColor: 'var(--color-border)' }}
            >
              <div className="flex items-center gap-3 mb-4 px-2">
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-sm"
                  style={{ backgroundColor: 'var(--color-primary)' }}
                >
                  {username.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{username}</p>
                  <p 
                    className="text-[10px] uppercase tracking-wider font-medium mt-0.5"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    Administrateur
                  </p>
                </div>
              </div>
              <button
                onClick={logout}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-medium transition-colors border shadow-sm hover:opacity-80"
                style={{ 
                  backgroundColor: 'var(--color-bg-card)', 
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text-primary)'
                }}
              >
                <LogOut size={16} />
                Se déconnecter
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <main className={`flex-1 flex flex-col min-w-0 overflow-y-auto ${isMobile ? 'pt-16' : ''}`}>
        <div className="flex-1 p-4 sm:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
