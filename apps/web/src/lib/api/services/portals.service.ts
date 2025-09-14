import { api } from '../client';
import { Portal, CreatePortalInput, UpdatePortalInput, PortalFilter, PortalStatus, PortalCategory } from '../../../types/portal.types';

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  status: 'success' | 'error';
  data: T;
  message?: string;
}

// Map API status values to React enum values
function mapApiStatusToPortalStatus(apiStatus: string): PortalStatus {
  const statusMap: Record<string, PortalStatus> = {
    'active': PortalStatus.OPERATIONAL,
    'degraded': PortalStatus.DEGRADED,
    'down': PortalStatus.OUTAGE,
    'maintenance': PortalStatus.MAINTENANCE,
    'unknown': PortalStatus.OPERATIONAL
  };
  return statusMap[apiStatus.toLowerCase()] || PortalStatus.OPERATIONAL;
}

// Map React status values to API status values
function mapPortalStatusToApi(status: PortalStatus): string {
  const statusMap: Record<PortalStatus, string> = {
    [PortalStatus.OPERATIONAL]: 'active',
    [PortalStatus.DEGRADED]: 'degraded',
    [PortalStatus.OUTAGE]: 'down',
    [PortalStatus.MAINTENANCE]: 'maintenance'
  };
  return statusMap[status] || 'unknown';
}

// Map API category to React enum
function mapApiCategoryToPortalCategory(apiCategory: string): PortalCategory {
  const categoryUpper = apiCategory.toUpperCase();
  return (PortalCategory[categoryUpper as keyof typeof PortalCategory] || PortalCategory.ALL) as PortalCategory;
}

// Transform API portal data to match React types
function transformApiPortal(apiPortal: any): Portal {
  return {
    ...apiPortal,
    status: mapApiStatusToPortalStatus(apiPortal.status),
    category: mapApiCategoryToPortalCategory(apiPortal.category),
    lastChecked: new Date(apiPortal.lastChecked),
    lastIncident: apiPortal.lastIncident ? new Date(apiPortal.lastIncident) : undefined,
    createdAt: new Date(apiPortal.createdAt),
    updatedAt: new Date(apiPortal.updatedAt)
  };
}

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
  }) => {
    // Convert status if provided
    const apiParams = {
      ...params,
      status: params?.status ? mapPortalStatusToApi(params.status as PortalStatus) : undefined
    };

    const response = await api.get<ApiResponse<PaginatedResponse<any>>>('/api/v1/portals', { params: apiParams });

    // Handle API response wrapper
    const paginatedData = response.data.data;

    // Transform each portal in the data array
    const transformedData: PaginatedResponse<Portal> = {
      ...paginatedData,
      data: paginatedData.data.map(transformApiPortal)
    };

    return transformedData;
  },

  // Get a single portal by ID
  getPortal: async (id: string) => {
    const response = await api.get<ApiResponse<any>>(`/api/v1/portals/${id}`);
    return transformApiPortal(response.data.data);
  },

  // Create a new portal
  createPortal: async (data: CreatePortalInput) => {
    // Transform status and category for API
    const apiData = {
      ...data,
      status: data.status ? mapPortalStatusToApi(data.status) : 'active',
      category: data.category.toLowerCase()
    };

    const response = await api.post<ApiResponse<any>>('/api/v1/portals', apiData);
    return transformApiPortal(response.data.data);
  },

  // Update an existing portal
  updatePortal: async (id: string, data: UpdatePortalInput) => {
    // Transform status and category for API if provided
    const apiData = {
      ...data,
      status: data.status ? mapPortalStatusToApi(data.status) : undefined,
      category: data.category ? data.category.toLowerCase() : undefined
    };

    const response = await api.put<ApiResponse<any>>(`/api/v1/portals/${id}`, apiData);
    return transformApiPortal(response.data.data);
  },

  // Delete a portal
  deletePortal: async (id: string) => {
    const response = await api.delete<ApiResponse<any>>(`/api/v1/portals/${id}`);
    return response.data.data;
  },

  // Bulk delete portals
  bulkDeletePortals: async (ids: string[]) => {
    const response = await api.post<ApiResponse<any>>('/api/v1/portals/bulk-delete', { ids });
    return response.data.data;
  },

  // Get portal metrics
  getPortalMetrics: async (id: string) => {
    const response = await api.get<ApiResponse<any>>(`/api/v1/portals/${id}/metrics`);
    return response.data.data;
  },

  // Update portal metrics
  updatePortalMetrics: async (id: string, metrics: any) => {
    const response = await api.put<ApiResponse<any>>(`/api/v1/portals/${id}/metrics`, metrics);
    return response.data.data;
  },

  // Check portal health
  checkPortalHealth: async (id: string) => {
    const response = await api.get<ApiResponse<any>>(`/api/v1/portals/${id}/health`);
    return response.data.data;
  },

  // Get portal statistics
  getPortalStats: async () => {
    const response = await api.get<ApiResponse<any>>('/api/v1/portals/stats');
    return response.data.data;
  },

  // Toggle favorite status
  toggleFavorite: async (id: string) => {
    const response = await api.post<ApiResponse<any>>(`/api/v1/portals/${id}/favorite`);
    return response.data.data;
  },

  // Export portals
  exportPortals: async (format: 'csv' | 'json' = 'json') => {
    const response = await api.get<ApiResponse<any>>('/api/v1/portals/export', {
      params: { format },
      responseType: format === 'csv' ? 'blob' : 'json',
    });
    return format === 'csv' ? response.data : response.data.data;
  },
};