/**
 * Authentication Store
 * Manages authentication state and user session
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { authService } from '@/lib/api/services/auth.service';
import { clearSensitiveData, setCsrfToken } from '@/lib/cookies';
import { env } from '@/config/env';
import type {
  User,
  LoginRequest,
  RegisterRequest,
  AuthState,
  UserRole
} from '@/types/auth.types';

interface AuthStore extends AuthState {
  // Actions
  login: (credentials: LoginRequest) => Promise<void>;
  register: (userData: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  fetchCurrentUser: () => Promise<void>;
  clearError: () => void;

  // Permission helpers
  hasPermission: (resource: string, action: string) => boolean;
  hasRole: (role: UserRole | UserRole[]) => boolean;
  hasAnyRole: (roles: UserRole[]) => boolean;

  // Session management
  updateSessionExpiry: (expiresIn: number) => void;
  isTokenExpired: () => boolean;
  getTimeUntilExpiry: () => number;
  initializeAuth: () => Promise<void>;
  resetAuth: () => void;
}

// Session configuration
const SESSION_CHECK_INTERVAL = 60000; // Check session every minute
const SESSION_WARNING_TIME = 5 * 60 * 1000; // Warn 5 minutes before expiry

export const useAuthStore = create<AuthStore>()(
  persist(
    immer((set, get) => ({
      // Initial state
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      tokenExpiry: null,

      // Login action
      login: async (credentials: LoginRequest) => {
        set((state) => {
          state.isLoading = true;
          state.error = null;
        });

        try {
          const response = await authService.login(credentials);

          // Backend sets HttpOnly cookies, we just track expiry
          // Extract CSRF token if provided
          if (response.csrfToken) {
            setCsrfToken(response.csrfToken);
          }

          set((state) => {
            state.user = response.user;
            state.isAuthenticated = true;
            state.tokenExpiry = Date.now() + response.expiresIn * 1000;
            state.isLoading = false;
            state.error = null;
          });

          // Clear any sensitive form data
          clearSensitiveData();
        } catch (error: any) {
          set((state) => {
            state.isLoading = false;
            state.error = error.message || 'Login failed';
            state.isAuthenticated = false;
          });
          throw error;
        }
      },

      // Register action
      register: async (userData: RegisterRequest) => {
        set((state) => {
          state.isLoading = true;
          state.error = null;
        });

        try {
          const response = await authService.register(userData);

          // Backend sets HttpOnly cookies
          // Extract CSRF token if provided
          if (response.csrfToken) {
            setCsrfToken(response.csrfToken);
          }

          set((state) => {
            state.user = response.user;
            state.isAuthenticated = true;
            state.tokenExpiry = Date.now() + (response.expiresIn || 3600) * 1000;
            state.isLoading = false;
            state.error = null;
          });

          // Clear any sensitive form data
          clearSensitiveData();
        } catch (error: any) {
          set((state) => {
            state.isLoading = false;
            state.error = error.message || 'Registration failed';
            state.isAuthenticated = false;
          });
          throw error;
        }
      },

      // Logout action
      logout: async () => {
        set((state) => {
          state.isLoading = true;
        });

        try {
          await authService.logout();
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          // Backend clears HttpOnly cookies
          // Clear all sensitive data from browser
          clearSensitiveData();

          set((state) => {
            state.user = null;
            state.isAuthenticated = false;
            state.tokenExpiry = null;
            state.isLoading = false;
            state.error = null;
          });
        }
      },

      // Refresh session
      refreshSession: async () => {
        // Skip in mock mode
        if (env.api.enableMock) {
          return;
        }

        try {
          // Backend handles HttpOnly cookies automatically
          const response = await authService.refreshToken();

          // Extract CSRF token if provided
          if (response.csrfToken) {
            setCsrfToken(response.csrfToken);
          }

          set((state) => {
            state.tokenExpiry = Date.now() + response.expiresIn * 1000;
            state.error = null;
          });
        } catch (error: any) {
          get().resetAuth();
          throw error;
        }
      },

      // Fetch current user
      fetchCurrentUser: async () => {
        // Skip in mock mode
        if (env.api.enableMock) {
          set((state) => {
            state.isLoading = false;
            state.isAuthenticated = false;
          });
          return;
        }

        set((state) => {
          state.isLoading = true;
        });

        try {
          const user = await authService.getCurrentUser();

          set((state) => {
            state.user = user;
            state.isAuthenticated = true;
            state.isLoading = false;
            state.error = null;
          });
        } catch (error: any) {
          set((state) => {
            state.isLoading = false;
            state.error = error.message || 'Failed to fetch user';
          });
          throw error;
        }
      },

      // Clear error
      clearError: () => {
        set((state) => {
          state.error = null;
        });
      },

      // Permission helpers
      hasPermission: (resource: string, action: string) => {
        const { user } = get();
        return authService.hasPermission(user, resource, action);
      },

      hasRole: (role: UserRole | UserRole[]) => {
        const { user } = get();
        if (!user) return false;

        const roles = Array.isArray(role) ? role : [role];
        return roles.includes(user.role);
      },

      hasAnyRole: (roles: UserRole[]) => {
        const { user } = get();
        if (!user) return false;
        return roles.includes(user.role);
      },

      // Session management
      updateSessionExpiry: (expiresIn: number) => {
        set((state) => {
          state.tokenExpiry = Date.now() + expiresIn * 1000;
        });
      },

      isTokenExpired: () => {
        const { tokenExpiry } = get();
        if (!tokenExpiry) return true;
        return Date.now() >= tokenExpiry;
      },

      getTimeUntilExpiry: () => {
        const { tokenExpiry } = get();
        if (!tokenExpiry) return 0;
        return Math.max(0, tokenExpiry - Date.now());
      },

      // Initialize authentication from existing session
      initializeAuth: async () => {
        // Skip auth initialization in mock mode
        if (env.api.enableMock) {
          set((state) => {
            state.isLoading = false;
            state.isAuthenticated = false;
          });
          return;
        }

        set((state) => {
          state.isLoading = true;
        });

        try {
          // Try to fetch current user - backend will check HttpOnly cookies
          await get().fetchCurrentUser();
        } catch (error) {
          // Try to refresh session
          try {
            await get().refreshSession();
            await get().fetchCurrentUser();
          } catch (refreshError) {
            get().resetAuth();
          }
        }
      },

      resetAuth: () => {
        // Clear all sensitive data
        clearSensitiveData();

        set((state) => {
          state.user = null;
          state.isAuthenticated = false;
          state.tokenExpiry = null;
          state.isLoading = false;
          state.error = null;
        });
      }
    })),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => sessionStorage), // Use sessionStorage for better security
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        tokenExpiry: state.tokenExpiry
      })
    }
  )
);