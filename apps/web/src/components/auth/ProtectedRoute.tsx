/**
 * Protected Route Component
 * Ensures user is authenticated before accessing protected pages
 */

import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingWrapper } from '@/components/ui/loading-wrapper';
import type { UserRole } from '@/types/auth.types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: UserRole[];
  requiredPermission?: {
    resource: string;
    action: string;
  };
  fallback?: string;
}

export function ProtectedRoute({
  children,
  requiredRoles,
  requiredPermission,
  fallback = '/auth/login'
}: ProtectedRouteProps) {
  const location = useLocation();
  const { isAuthenticated, isLoading, hasRole, hasPermission } = useAuth();

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <LoadingWrapper>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Verifying authentication...</p>
          </div>
        </div>
      </LoadingWrapper>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to={fallback} state={{ from: location.pathname }} replace />;
  }

  // Check role requirements
  if (requiredRoles && requiredRoles.length > 0) {
    const hasRequiredRole = requiredRoles.some(role => hasRole(role));
    if (!hasRequiredRole) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  // Check permission requirements
  if (requiredPermission) {
    const hasRequiredPermission = hasPermission(
      requiredPermission.resource,
      requiredPermission.action
    );
    if (!hasRequiredPermission) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return <>{children}</>;
}

/**
 * Role-based Protected Route
 * Shorthand for role-specific protection
 */
export function AdminRoute({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute requiredRoles={[UserRole.ADMIN]}>
      {children}
    </ProtectedRoute>
  );
}

export function ManagerRoute({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute requiredRoles={[UserRole.ADMIN, UserRole.MANAGER]}>
      {children}
    </ProtectedRoute>
  );
}

export function OperatorRoute({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute requiredRoles={[UserRole.ADMIN, UserRole.MANAGER, UserRole.OPERATOR]}>
      {children}
    </ProtectedRoute>
  );
}