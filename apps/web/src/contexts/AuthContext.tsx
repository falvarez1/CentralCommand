/**
 * Authentication Context Provider
 * Provides authentication state and methods throughout the app
 */

import React, { createContext, useContext, useEffect, useRef, useCallback, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/useAuthStore';
import { sessionManager } from '@/lib/cookies';
import { toast } from 'sonner';
import type { User, UserRole } from '@/types/auth.types';

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  hasPermission: (resource: string, action: string) => boolean;
  hasRole: (role: UserRole | UserRole[]) => boolean;
  hasAnyRole: (roles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const refreshIntervalRef = useRef<NodeJS.Timeout>();
  const warningIntervalRef = useRef<NodeJS.Timeout>();
  const [hasShownWarning, setHasShownWarning] = useState(false);

  const {
    user,
    isAuthenticated,
    isLoading,
    error,
    login: storeLogin,
    register: storeRegister,
    logout: storeLogout,
    clearError,
    hasPermission,
    hasRole,
    hasAnyRole,
    initializeAuth,
    refreshSession,
    getTimeUntilExpiry,
    isTokenExpired
  } = useAuthStore();

  // Initialize authentication on mount
  useEffect(() => {
    initializeAuth().catch(console.error);
  }, [initializeAuth]);

  // Setup automatic token refresh and session warnings
  useEffect(() => {
    if (!isAuthenticated) {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
      if (warningIntervalRef.current) {
        clearInterval(warningIntervalRef.current);
      }
      setHasShownWarning(false);
      return;
    }

    const setupRefreshTimer = () => {
      const timeUntilExpiry = getTimeUntilExpiry();

      // Refresh token 5 minutes before expiry
      const refreshTime = Math.max(0, timeUntilExpiry - 5 * 60 * 1000);

      if (refreshTime > 0) {
        refreshIntervalRef.current = setTimeout(async () => {
          try {
            await refreshSession();
            setHasShownWarning(false); // Reset warning flag after refresh
            setupRefreshTimer(); // Setup next refresh
          } catch (error) {
            console.error('Token refresh failed:', error);
            await storeLogout();
            navigate('/auth/login', { state: { from: location.pathname } });
          }
        }, refreshTime);
      }

      // Setup warning timer
      const warningTime = Math.max(0, timeUntilExpiry - sessionManager.warningTime);
      if (warningTime > 0 && !hasShownWarning) {
        warningIntervalRef.current = setTimeout(() => {
          const expiryTime = Date.now() + sessionManager.warningTime;
          const timeLeft = sessionManager.getTimeUntilExpiry(expiryTime);

          toast.warning('Session Expiring Soon', {
            description: `Your session will expire in ${timeLeft}. Please save your work.`,
            duration: 10000,
            action: {
              label: 'Refresh Session',
              onClick: async () => {
                try {
                  await refreshSession();
                  toast.success('Session refreshed successfully');
                  setHasShownWarning(false);
                } catch (error) {
                  toast.error('Failed to refresh session');
                }
              }
            }
          });
          setHasShownWarning(true);
        }, warningTime);
      }
    };

    setupRefreshTimer();

    return () => {
      if (refreshIntervalRef.current) {
        clearTimeout(refreshIntervalRef.current);
      }
      if (warningIntervalRef.current) {
        clearTimeout(warningIntervalRef.current);
      }
    };
  }, [isAuthenticated, getTimeUntilExpiry, refreshSession, storeLogout, navigate, location, hasShownWarning]);

  // Check token expiry periodically
  useEffect(() => {
    if (!isAuthenticated) return;

    const checkInterval = setInterval(() => {
      if (isTokenExpired()) {
        refreshSession().catch(async (error) => {
          console.error('Token refresh failed:', error);
          await storeLogout();
          navigate('/auth/login', { state: { from: location.pathname } });
        });
      }
    }, 60000); // Check every minute

    return () => clearInterval(checkInterval);
  }, [isAuthenticated, isTokenExpired, refreshSession, storeLogout, navigate, location]);

  // Wrapped login function
  const login = useCallback(async (email: string, password: string, rememberMe = false) => {
    try {
      await storeLogin({ email, password, rememberMe });

      // Redirect to the page user was trying to access, or dashboard
      const from = location.state?.from || '/';
      navigate(from, { replace: true });
    } catch (error) {
      // Error is handled in the store
      throw error;
    }
  }, [storeLogin, navigate, location]);

  // Wrapped register function
  const register = useCallback(async (email: string, password: string, name: string) => {
    try {
      await storeRegister({ email, password, name });

      // Redirect to dashboard after successful registration
      navigate('/', { replace: true });
    } catch (error) {
      // Error is handled in the store
      throw error;
    }
  }, [storeRegister, navigate]);

  // Wrapped logout function
  const logout = useCallback(async () => {
    try {
      await storeLogout();
      navigate('/auth/login');
    } catch (error) {
      console.error('Logout error:', error);
      // Still navigate to login even if logout fails
      navigate('/login');
    }
  }, [storeLogout, navigate]);

  const value: AuthContextValue = {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout,
    clearError,
    hasPermission,
    hasRole,
    hasAnyRole
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Custom hook for checking permissions
export function usePermission(resource: string, action: string): boolean {
  const { hasPermission } = useAuth();
  return hasPermission(resource, action);
}

// Custom hook for checking roles
export function useRole(role: UserRole | UserRole[]): boolean {
  const { hasRole } = useAuth();
  return hasRole(role);
}