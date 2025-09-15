/**
 * Authentication Store
 * Manages authentication state and user session with Supabase
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { supabase, signIn, signUp, signOut, getCurrentUser, getSession } from '@/lib/supabase/client';
import { clearSensitiveData, setCsrfToken } from '@/lib/cookies';
import { env } from '@/config/env';
import type { Session, User as SupabaseUser } from '@supabase/supabase-js';
import type {
  User,
  LoginRequest,
  RegisterRequest,
  AuthState,
  UserRole
} from '@/types/auth.types';

interface AuthStore extends AuthState {
  // Supabase specific
  supabaseUser: SupabaseUser | null;
  session: Session | null;

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
  updateSession: (session: Session | null) => void;
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
      supabaseUser: null,
      session: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      tokenExpiry: null,

      // Login action with Supabase
      login: async (credentials: LoginRequest) => {
        set((state) => {
          state.isLoading = true;
          state.error = null;
        });

        try {
          // Sign in with Supabase
          const data = await signIn(credentials.email, credentials.password);

          if (!data.session || !data.user) {
            throw new Error('Login failed');
          }

          // Convert Supabase user to app user format
          const appUser: User = {
            id: data.user.id,
            email: data.user.email || '',
            name: data.user.user_metadata?.name || data.user.email?.split('@')[0] || '',
            avatar: data.user.user_metadata?.avatar_url,
            role: (data.user.user_metadata?.role as UserRole) || 'viewer',
            permissions: data.user.user_metadata?.permissions || [],
            preferences: data.user.user_metadata?.preferences || {},
            createdAt: data.user.created_at,
            updatedAt: data.user.updated_at || data.user.created_at
          };

          set((state) => {
            state.user = appUser;
            state.supabaseUser = data.user;
            state.session = data.session;
            state.isAuthenticated = true;
            state.tokenExpiry = data.session.expires_at ? data.session.expires_at * 1000 : null;
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

      // Register action with Supabase
      register: async (userData: RegisterRequest) => {
        set((state) => {
          state.isLoading = true;
          state.error = null;
        });

        try {
          // Sign up with Supabase
          const data = await signUp(userData.email, userData.password, {
            name: userData.name,
            role: 'viewer',
            permissions: [],
            preferences: {}
          });

          if (!data.user) {
            throw new Error('Registration failed');
          }

          // Note: User may need to confirm email before being fully authenticated
          // depending on Supabase configuration
          if (data.session) {
            // User is immediately logged in
            const appUser: User = {
              id: data.user.id,
              email: data.user.email || '',
              name: userData.name,
              role: 'viewer',
              permissions: [],
              preferences: {},
              createdAt: data.user.created_at,
              updatedAt: data.user.updated_at || data.user.created_at
            };

            set((state) => {
              state.user = appUser;
              state.supabaseUser = data.user;
              state.session = data.session;
              state.isAuthenticated = true;
              state.tokenExpiry = data.session.expires_at ? data.session.expires_at * 1000 : null;
              state.isLoading = false;
              state.error = null;
            });
          } else {
            // Email confirmation required
            set((state) => {
              state.isLoading = false;
              state.error = 'Please check your email to confirm your account';
            });
          }

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

      // Logout action with Supabase
      logout: async () => {
        set((state) => {
          state.isLoading = true;
        });

        try {
          await signOut();
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          // Clear all sensitive data from browser
          clearSensitiveData();

          set((state) => {
            state.user = null;
            state.supabaseUser = null;
            state.session = null;
            state.isAuthenticated = false;
            state.tokenExpiry = null;
            state.isLoading = false;
            state.error = null;
          });
        }
      },

      // Refresh session with Supabase
      refreshSession: async () => {
        try {
          const { data, error } = await supabase.auth.refreshSession();

          if (error) throw error;
          if (!data.session) throw new Error('No session');

          set((state) => {
            state.session = data.session;
            state.supabaseUser = data.user;
            state.tokenExpiry = data.session.expires_at ? data.session.expires_at * 1000 : null;
            state.error = null;
          });
        } catch (error: any) {
          get().resetAuth();
          throw error;
        }
      },

      // Fetch current user with Supabase
      fetchCurrentUser: async () => {
        set((state) => {
          state.isLoading = true;
        });

        try {
          const user = await getCurrentUser();
          const session = await getSession();

          if (!user || !session) {
            throw new Error('No authenticated user');
          }

          // Convert Supabase user to app user format
          const appUser: User = {
            id: user.id,
            email: user.email || '',
            name: user.user_metadata?.name || user.email?.split('@')[0] || '',
            avatar: user.user_metadata?.avatar_url,
            role: (user.user_metadata?.role as UserRole) || 'viewer',
            permissions: user.user_metadata?.permissions || [],
            preferences: user.user_metadata?.preferences || {},
            createdAt: user.created_at,
            updatedAt: user.updated_at || user.created_at
          };

          set((state) => {
            state.user = appUser;
            state.supabaseUser = user;
            state.session = session;
            state.isAuthenticated = true;
            state.tokenExpiry = session.expires_at ? session.expires_at * 1000 : null;
            state.isLoading = false;
            state.error = null;
          });
        } catch (error: any) {
          set((state) => {
            state.isLoading = false;
            state.isAuthenticated = false;
            state.error = null; // Don't show error for initial auth check
          });
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
        if (!user) return false;

        // Admin has all permissions
        if (user.role === 'admin') return true;

        // Check specific permissions
        const permission = `${resource}:${action}`;
        return user.permissions?.includes(permission) || false;
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
      updateSession: (session: Session | null) => {
        set((state) => {
          state.session = session;
          state.tokenExpiry = session?.expires_at ? session.expires_at * 1000 : null;
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
        set((state) => {
          state.isLoading = true;
        });

        try {
          // Check for existing Supabase session
          const { data: { session } } = await supabase.auth.getSession();

          if (session) {
            // Convert Supabase user to app user format
            const appUser: User = {
              id: session.user.id,
              email: session.user.email || '',
              name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || '',
              avatar: session.user.user_metadata?.avatar_url,
              role: (session.user.user_metadata?.role as UserRole) || 'viewer',
              permissions: session.user.user_metadata?.permissions || [],
              preferences: session.user.user_metadata?.preferences || {},
              createdAt: session.user.created_at,
              updatedAt: session.user.updated_at || session.user.created_at
            };

            set((state) => {
              state.user = appUser;
              state.supabaseUser = session.user;
              state.session = session;
              state.isAuthenticated = true;
              state.tokenExpiry = session.expires_at ? session.expires_at * 1000 : null;
              state.isLoading = false;
              state.error = null;
            });
          } else {
            set((state) => {
              state.isLoading = false;
              state.isAuthenticated = false;
            });
          }
        } catch (error) {
          console.error('Auth initialization error:', error);
          get().resetAuth();
        }

        // Setup auth state change listener
        supabase.auth.onAuthStateChange((event, session) => {
          if (event === 'SIGNED_IN' && session) {
            const appUser: User = {
              id: session.user.id,
              email: session.user.email || '',
              name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || '',
              avatar: session.user.user_metadata?.avatar_url,
              role: (session.user.user_metadata?.role as UserRole) || 'viewer',
              permissions: session.user.user_metadata?.permissions || [],
              preferences: session.user.user_metadata?.preferences || {},
              createdAt: session.user.created_at,
              updatedAt: session.user.updated_at || session.user.created_at
            };

            set((state) => {
              state.user = appUser;
              state.supabaseUser = session.user;
              state.session = session;
              state.isAuthenticated = true;
              state.tokenExpiry = session.expires_at ? session.expires_at * 1000 : null;
            });
          } else if (event === 'SIGNED_OUT') {
            get().resetAuth();
          } else if (event === 'TOKEN_REFRESHED' && session) {
            set((state) => {
              state.session = session;
              state.tokenExpiry = session.expires_at ? session.expires_at * 1000 : null;
            });
          }
        });
      },

      resetAuth: () => {
        // Clear all sensitive data
        clearSensitiveData();

        set((state) => {
          state.user = null;
          state.supabaseUser = null;
          state.session = null;
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
        tokenExpiry: state.tokenExpiry,
        session: state.session
      })
    }
  )
);