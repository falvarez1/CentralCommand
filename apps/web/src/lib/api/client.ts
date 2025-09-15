import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { env } from '../../config/env';
import { toast } from 'sonner';
import { getCsrfToken, setCsrfToken } from '../cookies';

// Custom error class for API errors
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public response?: any,
    public originalError?: AxiosError
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Token refresh state to prevent race conditions
let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

// Subscribe to token refresh
function subscribeTokenRefresh(callback: (token: string) => void): void {
  refreshSubscribers.push(callback);
}

// Notify all subscribers when token is refreshed
function onTokenRefreshed(token: string): void {
  refreshSubscribers.forEach(callback => callback(token));
  refreshSubscribers = [];
}

// Create axios instance with base configuration
const createApiClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: env.api.baseUrl,
    timeout: env.api.timeout,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    withCredentials: true, // Required for HttpOnly cookies and CORS
  });

  // Request interceptor for CSRF token and logging
  client.interceptors.request.use(
    (config) => {
      // Add CSRF token for state-changing requests
      const csrfToken = getCsrfToken();
      if (csrfToken && ['post', 'put', 'patch', 'delete'].includes(config.method?.toLowerCase() || '')) {
        config.headers['X-CSRF-Token'] = csrfToken;
      }

      // Log request in development
      if (import.meta.env.DEV) {
        console.log(`🚀 ${config.method?.toUpperCase()} ${config.url}`, {
          params: config.params,
          data: config.data,
        });
      }

      return config;
    },
    (error) => {
      console.error('Request interceptor error:', error);
      return Promise.reject(error);
    }
  );

  // Response interceptor for error handling and CSRF token extraction
  client.interceptors.response.use(
    (response) => {
      // Extract and store CSRF token from response headers
      const csrfToken = response.headers['x-csrf-token'];
      if (csrfToken) {
        setCsrfToken(csrfToken);
      }

      // Log response in development
      if (import.meta.env.DEV) {
        console.log(`✅ Response from ${response.config.url}:`, response.data);
      }
      return response;
    },
    async (error: AxiosError) => {
      const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean; _queued?: boolean };

      // Handle 401 Unauthorized - token expired
      if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url?.includes('/auth/')) {
        // Handle race condition - if already refreshing, queue the request
        if (isRefreshing) {
          return new Promise((resolve) => {
            subscribeTokenRefresh((token: string) => {
              // Retry original request after token refresh
              resolve(client(originalRequest));
            });
          });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          // Attempt to refresh token - backend will handle HttpOnly cookies
          const response = await axios.post(
            `${env.api.baseUrl}/api/auth/refresh`,
            {},
            {
              withCredentials: true,
              headers: {
                'X-CSRF-Token': getCsrfToken() || ''
              }
            }
          );

          // Extract new CSRF token if provided
          const newCsrfToken = response.headers['x-csrf-token'];
          if (newCsrfToken) {
            setCsrfToken(newCsrfToken);
          }

          isRefreshing = false;

          // Notify all queued requests that token is refreshed
          onTokenRefreshed('refreshed');

          // Retry original request
          return client(originalRequest);
        } catch (refreshError) {
          isRefreshing = false;
          refreshSubscribers = [];

          // Refresh failed, redirect to login
          const currentPath = window.location.pathname;
          if (currentPath !== '/auth/login') {
            window.location.href = `/auth/login?redirect=${encodeURIComponent(currentPath)}`;
          }

          return Promise.reject(refreshError);
        }
      }

      // Handle network errors
      if (!error.response) {
        const apiError = new ApiError(
          'Network error. Please check your connection.',
          undefined,
          undefined,
          error
        );

        if (env.features.enableErrorReporting) {
          toast.error('Network Error', {
            description: 'Unable to connect to the server. Please try again.',
          });
        }

        return Promise.reject(apiError);
      }

      // Handle API errors
      const message = error.response?.data?.message || error.message || 'An unexpected error occurred';
      const apiError = new ApiError(
        message,
        error.response?.status,
        error.response?.data,
        error
      );

      // Show error toast for client errors (4xx) and server errors (5xx)
      if (env.features.enableErrorReporting && error.response?.status) {
        const statusCode = error.response.status;

        if (statusCode >= 400 && statusCode < 500) {
          toast.error('Request Error', {
            description: message,
          });
        } else if (statusCode >= 500) {
          toast.error('Server Error', {
            description: 'Something went wrong on our end. Please try again later.',
          });
        }
      }

      // Log error in development
      if (import.meta.env.DEV) {
        console.error(`❌ API Error:`, {
          url: error.config?.url,
          status: error.response?.status,
          message,
          data: error.response?.data,
        });
      }

      return Promise.reject(apiError);
    }
  );

  return client;
};

// Export configured axios instance
export const apiClient = createApiClient();

// Utility functions for common HTTP methods
export const api = {
  get: <T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> =>
    apiClient.get<T>(url, config),

  post: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> =>
    apiClient.post<T>(url, data, config),

  put: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> =>
    apiClient.put<T>(url, data, config),

  patch: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> =>
    apiClient.patch<T>(url, data, config),

  delete: <T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> =>
    apiClient.delete<T>(url, config),
};

// Export types
export type { AxiosResponse, AxiosError };