import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import type { UserRole } from '../types/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
  redirectTo?: string;
}

export default function ProtectedRoute({ children, requiredRole, redirectTo = '/chat' }: ProtectedRouteProps) {
  const { roles } = useAuth();
  if (requiredRole && !roles.includes(requiredRole)) {
    return <Navigate to={redirectTo} replace />;
  }
  return <>{children}</>;
}
