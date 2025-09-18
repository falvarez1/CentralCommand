import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { env } from '../../config/env';
import { toast } from 'sonner';
import { useAppConfigStore } from '../../stores/useAppConfigStore';

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

// Get the current API URL based on mode
const getApiUrl = (): string => {
  const store = useAppConfigStore.getState();
  return store.dataSourceMode === 'mock' ? env.api.mockUrl : env.api.baseUrl;
};

// Create axios instance with base configuration
const createApiClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: getApiUrl(),
    timeout: env.api.timeout,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    withCredentials: true, // Required for SignalR and CORS with credentials
  });

  // Request interceptor for auth and logging
  client.interceptors.request.use(
    (config) => {
      // Dynamically update baseURL based on current mode
      config.baseURL = getApiUrl();

      // Add auth token if available
      const token = localStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
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

  // Response interceptor for error handling
  client.interceptors.response.use(
    (response) => {
      // Log response in development
      if (import.meta.env.DEV) {
        console.log(`✅ Response from ${response.config.url}:`, response.data);
      }
      return response;
    },
    async (error: AxiosError) => {
      const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

      // Handle 401 Unauthorized - token expired
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        try {
          // Attempt to refresh token
          const refreshToken = localStorage.getItem('refreshToken');
          if (refreshToken) {
            const response = await axios.post(`${env.api.baseUrl}/auth/refresh`, {
              refreshToken,
            });

            const { accessToken } = response.data;
            localStorage.setItem('authToken', accessToken);

            // Retry original request with new token
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            }
            return client(originalRequest);
          }
        } catch (refreshError) {
          // Refresh failed, redirect to login
          localStorage.removeItem('authToken');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
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

// Function to test API connectivity
export const testApiConnection = async (url?: string): Promise<boolean> => {
  try {
    const testUrl = url || getApiUrl();
    const response = await axios.get(`${testUrl}/health`, {
      timeout: 5000,
      validateStatus: () => true,
    });
    return response.status === 200;
  } catch (error) {
    console.error('API connection test failed:', error);
    return false;
  }
};

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