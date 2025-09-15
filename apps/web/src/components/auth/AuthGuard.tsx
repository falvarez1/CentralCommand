/**
 * AuthGuard Component
 * Protects routes that require authentication
 */

import { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types/auth.types';
import { LoadingWrapper } from '@/components/ui/loading-wrapper';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Shield, AlertCircle } from 'lucide-react';
import { env } from '@/config/env';

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRole?: UserRole | UserRole[];
  requiredPermission?: {
    resource: string;
    action: string;
  };
  fallback?: React.ReactNode;
  redirectTo?: string;
}

export function AuthGuard({
  children,
  requiredRole,
  requiredPermission,
  fallback,
  redirectTo = '/auth/login'
}: AuthGuardProps) {
  const location = useLocation();
  const {
    isAuthenticated,
    isLoading,
    user,
    hasRole,
    hasPermission
  } = useAuth();

  // Bypass authentication in mock mode
  if (env.api.enableMock) {
    return <>{children}</>;
  }

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <LoadingWrapper
        isLoading={true}
        loadingText="Verifying authentication..."
        className="min-h-screen"
      >
        <div />
      </LoadingWrapper>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated || !user) {
    return (
      <Navigate
        to={redirectTo}
        state={{ from: location.pathname }}
        replace
      />
    );
  }

  // Check role requirements
  if (requiredRole) {
    const hasRequiredRole = hasRole(requiredRole);

    if (!hasRequiredRole) {
      if (fallback) {
        return <>{fallback}</>;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <Alert variant="destructive" className="max-w-md">
            <Shield className="h-4 w-4" />
            <AlertTitle>Access Denied</AlertTitle>
            <AlertDescription>
              You don't have the required role to access this page.
              {Array.isArray(requiredRole) ? (
                <span className="block mt-2 text-sm">
                  Required roles: {requiredRole.join(', ')}
                </span>
              ) : (
                <span className="block mt-2 text-sm">
                  Required role: {requiredRole}
                </span>
              )}
            </AlertDescription>
          </Alert>
        </div>
      );
    }
  }

  // Check permission requirements
  if (requiredPermission) {
    const hasRequiredPermission = hasPermission(
      requiredPermission.resource,
      requiredPermission.action
    );

    if (!hasRequiredPermission) {
      if (fallback) {
        return <>{fallback}</>;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <Alert variant="destructive" className="max-w-md">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Insufficient Permissions</AlertTitle>
            <AlertDescription>
              You don't have permission to perform this action.
              <span className="block mt-2 text-sm">
                Required: {requiredPermission.action} on {requiredPermission.resource}
              </span>
            </AlertDescription>
          </Alert>
        </div>
      );
    }
  }

  // All checks passed, render children
  return <>{children}</>;
}

// Higher-order component for protecting routes
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  options?: Omit<AuthGuardProps, 'children'>
) {
  return function ProtectedComponent(props: P) {
    return (
      <AuthGuard {...options}>
        <Component {...props} />
      </AuthGuard>
    );
  };
}

// Hook for programmatic authentication checks
export function useAuthGuard(
  requiredRole?: UserRole | UserRole[],
  requiredPermission?: { resource: string; action: string }
) {
  const location = useLocation();
  const {
    isAuthenticated,
    isLoading,
    user,
    hasRole,
    hasPermission
  } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // Store the current location for redirect after login
      window.location.href = `/auth/login?redirect=${encodeURIComponent(location.pathname)}`;
    }
  }, [isLoading, isAuthenticated, location]);

  const checkAccess = () => {
    if (!isAuthenticated || !user) {
      return { hasAccess: false, reason: 'Not authenticated' };
    }

    if (requiredRole) {
      const hasRequiredRole = hasRole(requiredRole);
      if (!hasRequiredRole) {
        return { hasAccess: false, reason: 'Insufficient role' };
      }
    }

    if (requiredPermission) {
      const hasRequiredPermission = hasPermission(
        requiredPermission.resource,
        requiredPermission.action
      );
      if (!hasRequiredPermission) {
        return { hasAccess: false, reason: 'Insufficient permissions' };
      }
    }

    return { hasAccess: true, reason: null };
  };

  return {
    isLoading,
    isAuthenticated,
    user,
    ...checkAccess()
  };
}