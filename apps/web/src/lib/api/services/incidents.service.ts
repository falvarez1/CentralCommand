import { api } from '../client';
import { Incident, CreateIncidentInput, UpdateIncidentInput } from '../../../types/incident.types';
import { PaginatedResponse, ApiResponse } from './portals.service';

// Transform API incident data to match React types
function transformApiIncident(apiIncident: any): Incident {
  return {
    ...apiIncident,
    startedAt: new Date(apiIncident.startedAt),
    resolvedAt: apiIncident.resolvedAt ? new Date(apiIncident.resolvedAt) : undefined,
    createdAt: new Date(apiIncident.createdAt),
    updatedAt: new Date(apiIncident.updatedAt)
  };
}

export const incidentsService = {
  // Get all incidents with optional filtering and pagination
  getIncidents: async (params?: {
    page?: number;
    pageSize?: number;
    status?: string;
    severity?: string;
    portalId?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    startDate?: string;
    endDate?: string;
  }) => {
    const response = await api.get<ApiResponse<PaginatedResponse<any>>>('/api/v1/incidents', { params });

    // Handle API response wrapper
    const paginatedData = response.data.data;

    // Transform each incident in the data array
    const transformedData: PaginatedResponse<Incident> = {
      ...paginatedData,
      data: paginatedData.data.map(transformApiIncident)
    };

    return transformedData;
  },

  // Get a single incident by ID
  getIncident: async (id: string) => {
    const response = await api.get<ApiResponse<any>>(`/api/v1/incidents/${id}`);
    return transformApiIncident(response.data.data);
  },

  // Create a new incident
  createIncident: async (data: CreateIncidentInput) => {
    const response = await api.post<ApiResponse<any>>('/api/v1/incidents', data);
    return transformApiIncident(response.data.data);
  },

  // Update an existing incident
  updateIncident: async (id: string, data: UpdateIncidentInput) => {
    const response = await api.put<ApiResponse<any>>(`/api/v1/incidents/${id}`, data);
    return transformApiIncident(response.data.data);
  },

  // Delete an incident
  deleteIncident: async (id: string) => {
    const response = await api.delete<ApiResponse<any>>(`/api/v1/incidents/${id}`);
    return response.data.data;
  },

  // Bulk update incidents
  bulkUpdateIncidents: async (ids: string[], updates: Partial<UpdateIncidentInput>) => {
    const response = await api.post<ApiResponse<any>>('/api/v1/incidents/bulk-update', { ids, updates });
    return response.data.data;
  },

  // Resolve an incident
  resolveIncident: async (id: string, resolution: string) => {
    const response = await api.post<ApiResponse<any>>(`/api/v1/incidents/${id}/resolve`, { resolution });
    return transformApiIncident(response.data.data);
  },

  // Escalate an incident
  escalateIncident: async (id: string, reason: string) => {
    const response = await api.post<ApiResponse<any>>(`/api/v1/incidents/${id}/escalate`, { reason });
    return transformApiIncident(response.data.data);
  },

  // Add comment to incident
  addComment: async (id: string, comment: string) => {
    const response = await api.post<ApiResponse<any>>(`/api/v1/incidents/${id}/comments`, { comment });
    return response.data.data;
  },

  // Get incident timeline
  getIncidentTimeline: async (id: string) => {
    const response = await api.get<ApiResponse<any>>(`/api/v1/incidents/${id}/timeline`);
    return response.data.data;
  },

  // Get incident statistics
  getIncidentStats: async (params?: {
    startDate?: string;
    endDate?: string;
    portalId?: string;
  }) => {
    const response = await api.get<ApiResponse<any>>('/api/v1/incidents/stats', { params });
    return response.data.data;
  },

  // Get incident trends
  getIncidentTrends: async (period: 'day' | 'week' | 'month' = 'week') => {
    const response = await api.get<ApiResponse<any>>('/api/v1/incidents/trends', { params: { period } });
    return response.data.data;
  },

  // Export incidents
  exportIncidents: async (format: 'csv' | 'json' = 'json', filters?: any) => {
    const response = await api.get<ApiResponse<any>>('/api/v1/incidents/export', {
      params: { format, ...filters },
      responseType: format === 'csv' ? 'blob' : 'json',
    });
    return format === 'csv' ? response.data : response.data.data;
  },

  // Get related incidents
  getRelatedIncidents: async (id: string) => {
    const response = await api.get<ApiResponse<any[]>>(`/api/v1/incidents/${id}/related`);
    return response.data.data.map(transformApiIncident);
  },
};