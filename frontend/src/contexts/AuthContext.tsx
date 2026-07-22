import { createContext, useContext, useMemo } from 'react';
import type { ReactNode } from 'react';
import keycloak from '../keycloak';
import type { UserInfo } from '../types/auth';

interface AuthContextType extends UserInfo {
  token: string | undefined;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const value = useMemo(() => {
    const tokenParsed = keycloak.tokenParsed as Record<string, any> | undefined;
    const roles = tokenParsed?.realm_access?.roles || [];
    const username = tokenParsed?.preferred_username || 'Unknown';
    return {
      username,
      roles,
      isAdmin: roles.includes('admin'),
      token: keycloak.token,
      logout: () => {
        localStorage.removeItem('kc_token');
        localStorage.removeItem('kc_refreshToken');
        keycloak.logout({ redirectUri: window.location.origin });
      },
    };
  }, []);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
