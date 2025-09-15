/**
 * Authentication Service
 * Handles all authentication related API calls
 */

import { api } from '../client';
import { getCsrfToken } from '@/lib/cookies';
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  RefreshTokenResponse,
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  ResetPasswordRequest,
  ResetPasswordResponse,
  User
} from '@/types/auth.types';

const AUTH_ENDPOINTS = {
  LOGIN: '/api/auth/login',
  REGISTER: '/api/auth/register',
  REFRESH: '/api/auth/refresh',
  LOGOUT: '/api/auth/logout',
  ME: '/api/auth/me',
  FORGOT_PASSWORD: '/api/auth/forgot-password',
  RESET_PASSWORD: '/api/auth/reset-password',
  VERIFY_EMAIL: '/api/auth/verify-email',
  RESEND_VERIFICATION: '/api/auth/resend-verification'
} as const;

class AuthService {
  /**
   * Login user with email and password
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>(AUTH_ENDPOINTS.LOGIN, credentials);
    return response.data;
  }

  /**
   * Register new user
   */
  async register(userData: RegisterRequest): Promise<RegisterResponse> {
    const response = await api.post<RegisterResponse>(AUTH_ENDPOINTS.REGISTER, userData);
    return response.data;
  }

  /**
   * Refresh access token using HttpOnly refresh token cookie
   */
  async refreshToken(): Promise<RefreshTokenResponse> {
    // Backend reads refresh token from HttpOnly cookie
    const response = await api.post<RefreshTokenResponse>(AUTH_ENDPOINTS.REFRESH, {});
    return response.data;
  }

  /**
   * Logout current user
   */
  async logout(): Promise<void> {
    // Include CSRF token for logout
    await api.post(AUTH_ENDPOINTS.LOGOUT, {}, {
      headers: {
        'X-CSRF-Token': getCsrfToken() || ''
      }
    });
  }

  /**
   * Get current authenticated user
   */
  async getCurrentUser(): Promise<User> {
    const response = await api.get<User>(AUTH_ENDPOINTS.ME);
    return response.data;
  }

  /**
   * Request password reset
   */
  async forgotPassword(request: ForgotPasswordRequest): Promise<ForgotPasswordResponse> {
    const response = await api.post<ForgotPasswordResponse>(AUTH_ENDPOINTS.FORGOT_PASSWORD, request);
    return response.data;
  }

  /**
   * Reset password with token
   */
  async resetPassword(request: ResetPasswordRequest): Promise<ResetPasswordResponse> {
    const response = await api.post<ResetPasswordResponse>(AUTH_ENDPOINTS.RESET_PASSWORD, request);
    return response.data;
  }

  /**
   * Verify email with token
   */
  async verifyEmail(token: string): Promise<{ message: string }> {
    const response = await api.post<{ message: string }>(AUTH_ENDPOINTS.VERIFY_EMAIL, { token });
    return response.data;
  }

  /**
   * Resend verification email
   */
  async resendVerification(email: string): Promise<{ message: string }> {
    const response = await api.post<{ message: string }>(AUTH_ENDPOINTS.RESEND_VERIFICATION, { email });
    return response.data;
  }

  /**
   * Check if user has specific permission
   */
  hasPermission(user: User | null, resource: string, action: string): boolean {
    if (!user) return false;

    // Admin has all permissions
    if (user.role === 'admin') return true;

    // Check specific permissions
    return user.permissions.some(
      p => p.resource === resource && p.action === action
    );
  }

  /**
   * Check if user has specific role
   */
  hasRole(user: User | null, role: string | string[]): boolean {
    if (!user) return false;

    const roles = Array.isArray(role) ? role : [role];
    return roles.includes(user.role);
  }
}

// Export singleton instance
export const authService = new AuthService();