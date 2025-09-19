import { api } from '../client';
import {
  Portal,
  CreatePortalInput,
  UpdatePortalInput,
  BatchOperationResult
} from '../../../types/portal.types';
import {
  PortalResponse,
  PortalSummaryResponse,
  PortalHealthCheckResponse,
  PortalMetricsHistoryResponse,
  PaginatedResponse
} from '../../../types/service.types';
import { PagedResult } from '../../../types/api.types';

export const portalsService = {
  // Get all portals with optional filtering and pagination
  getPortals: async (params?: {
    page?: number;
    pageSize?: number;
    category?: string;
    status?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<PagedResult<PortalResponse>> => {
    const response = await api.get<PagedResult<PortalResponse>>('/api/v1/portals', { params });
    return response.data;
  },

  // Get a single portal by ID
  getPortal: async (id: string): Promise<PortalResponse> => {
    const response = await api.get<PortalResponse>(`/api/v1/portals/${id}`);
    return response.data;
  },

  // Create a new portal
  createPortal: async (data: CreatePortalInput): Promise<PortalResponse> => {
    const response = await api.post<PortalResponse>('/api/v1/portals', data);
    return response.data;
  },

  // Update an existing portal
  updatePortal: async (id: string, data: UpdatePortalInput): Promise<PortalResponse> => {
    const response = await api.put<PortalResponse>(`/api/v1/portals/${id}`, data);
    return response.data;
  },

  // Delete a portal
  deletePortal: async (id: string): Promise<void> => {
    await api.delete(`/api/v1/portals/${id}`);
  },

  // Batch operations on portals
  batchOperations: async (operations: {
    create?: CreatePortalInput[];
    update?: Array<{ id: string; data: UpdatePortalInput }>;
    delete?: string[];
  }): Promise<BatchOperationResult> => {
    const response = await api.post<BatchOperationResult>('/api/v1/portals/batch', operations);
    return response.data;
  },

  // Bulk delete portals (legacy support)
  bulkDeletePortals: async (ids: string[]): Promise<BatchOperationResult> => {
    return portalsService.batchOperations({ delete: ids });
  },

  // Get portal metrics history
  getPortalMetricsHistory: async (id: string, params?: {
    startDate?: string;
    endDate?: string;
    interval?: 'hour' | 'day' | 'week' | 'month';
  }): Promise<PortalMetricsHistoryResponse> => {
    const response = await api.get<PortalMetricsHistoryResponse>(
      `/api/v1/portals/${id}/metrics/history`,
      { params }
    );
    return response.data;
  },

  // Update portal metrics
  updatePortalMetrics: async (id: string, metrics: {
    uptime?: number;
    responseTime?: number;
    errorRate?: number;
    requestsPerMinute?: number;
    activeUsers?: number;
    cpuUsage?: number;
    memoryUsage?: number;
    diskUsage?: number;
  }): Promise<PortalResponse> => {
    const response = await api.put<PortalResponse>(`/api/v1/portals/${id}/metrics`, metrics);
    return response.data;
  },

  // Check portal health
  checkPortalHealth: async (id: string): Promise<PortalHealthCheckResponse> => {
    const response = await api.get<PortalHealthCheckResponse>(`/api/v1/portals/${id}/health`);
    return response.data;
  },

  // Get portal statistics
  getPortalStats: async () => {
    const response = await api.get<any>('/api/v1/statistics/portals');
    return response.data;
  },

  // Toggle favorite status
  toggleFavorite: async (id: string): Promise<PortalResponse> => {
    const response = await api.post<PortalResponse>(`/api/v1/portals/${id}/favorite`);
    return response.data;
  },

  // Export portals
  exportPortals: async (format: 'csv' | 'json' = 'json', filters?: any) => {
    const response = await api.get('/api/v1/portals/export', {
      params: { format, ...filters },
      responseType: format === 'csv' ? 'blob' : 'json',
    });
    return response.data;
  },
};

// Re-export convenience types
export type { PaginatedResponse };