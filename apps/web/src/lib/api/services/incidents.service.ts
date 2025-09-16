import { api } from '../client';
import {
  Incident,
  CreateIncidentInput,
  UpdateIncidentInput,
  IncidentResponse,
  IncidentSummaryResponse,
  CommentResponse,
  TimelineEntryResponse
} from '../../../types/incident.types';
import { PagedResult } from '../../../types/api.types';

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
  }): Promise<PagedResult<IncidentResponse>> => {
    const response = await api.get<PagedResult<IncidentResponse>>('/api/v1/incidents', { params });
    return response.data;
  },

  // Get a single incident by ID
  getIncident: async (id: string): Promise<IncidentResponse> => {
    const response = await api.get<IncidentResponse>(`/api/v1/incidents/${id}`);
    return response.data;
  },

  // Create a new incident
  createIncident: async (data: CreateIncidentInput): Promise<IncidentResponse> => {
    const response = await api.post<IncidentResponse>('/api/v1/incidents', data);
    return response.data;
  },

  // Update an existing incident
  updateIncident: async (id: string, data: UpdateIncidentInput): Promise<IncidentResponse> => {
    const response = await api.put<IncidentResponse>(`/api/v1/incidents/${id}`, data);
    return response.data;
  },

  // Delete an incident
  deleteIncident: async (id: string): Promise<void> => {
    await api.delete(`/api/v1/incidents/${id}`);
  },

  // Bulk update incidents
  bulkUpdateIncidents: async (ids: string[], updates: Partial<UpdateIncidentInput>) => {
    const response = await api.post<{ successCount: number; failureCount: number }>(
      '/api/v1/incidents/bulk-update',
      { ids, updates }
    );
    return response.data;
  },

  // Resolve an incident
  resolveIncident: async (id: string, resolution: string): Promise<IncidentResponse> => {
    const response = await api.post<IncidentResponse>(
      `/api/v1/incidents/${id}/resolve`,
      { resolution }
    );
    return response.data;
  },

  // Acknowledge an incident
  acknowledgeIncident: async (id: string): Promise<IncidentResponse> => {
    const response = await api.post<IncidentResponse>(`/api/v1/incidents/${id}/acknowledge`);
    return response.data;
  },

  // Escalate an incident
  escalateIncident: async (id: string, reason: string): Promise<IncidentResponse> => {
    const response = await api.post<IncidentResponse>(
      `/api/v1/incidents/${id}/escalate`,
      { reason }
    );
    return response.data;
  },

  // Add comment to incident
  addComment: async (id: string, comment: string, isInternal?: boolean): Promise<CommentResponse> => {
    const response = await api.post<CommentResponse>(
      `/api/v1/incidents/${id}/comments`,
      { text: comment, isInternal }
    );
    return response.data;
  },

  // Get incident comments
  getComments: async (id: string): Promise<CommentResponse[]> => {
    const response = await api.get<CommentResponse[]>(`/api/v1/incidents/${id}/comments`);
    return response.data;
  },

  // Get incident timeline
  getIncidentTimeline: async (id: string): Promise<TimelineEntryResponse[]> => {
    const response = await api.get<TimelineEntryResponse[]>(`/api/v1/incidents/${id}/timeline`);
    return response.data;
  },

  // Add timeline entry
  addTimelineEntry: async (
    id: string,
    entry: {
      eventType: string;
      description: string;
      metadata?: Record<string, any>;
    }
  ): Promise<TimelineEntryResponse> => {
    const response = await api.post<TimelineEntryResponse>(
      `/api/v1/incidents/${id}/timeline`,
      entry
    );
    return response.data;
  },

  // Get incident statistics
  getIncidentStats: async (params?: {
    startDate?: string;
    endDate?: string;
    portalId?: string;
  }) => {
    const response = await api.get('/api/v1/incidents/stats', { params });
    return response.data;
  },

  // Get incident trends
  getIncidentTrends: async (period: 'day' | 'week' | 'month' = 'week') => {
    const response = await api.get('/api/v1/incidents/trends', { params: { period } });
    return response.data;
  },

  // Export incidents
  exportIncidents: async (format: 'csv' | 'json' = 'json', filters?: any) => {
    const response = await api.get('/api/v1/incidents/export', {
      params: { format, ...filters },
      responseType: format === 'csv' ? 'blob' : 'json',
    });
    return response.data;
  },

  // Get related incidents
  getRelatedIncidents: async (id: string): Promise<IncidentSummaryResponse[]> => {
    const response = await api.get<IncidentSummaryResponse[]>(`/api/v1/incidents/${id}/related`);
    return response.data;
  },

  // Assign incident to user
  assignIncident: async (id: string, assigneeId: string): Promise<IncidentResponse> => {
    const response = await api.post<IncidentResponse>(
      `/api/v1/incidents/${id}/assign`,
      { assigneeId }
    );
    return response.data;
  },

  // Update incident severity
  updateSeverity: async (id: string, severity: string): Promise<IncidentResponse> => {
    const response = await api.post<IncidentResponse>(
      `/api/v1/incidents/${id}/severity`,
      { severity }
    );
    return response.data;
  },
};
