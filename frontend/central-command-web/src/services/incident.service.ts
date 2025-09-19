import { apiClient } from '../lib/api/client';
import type {
  IncidentResponse,
  IncidentCreateRequest,
  IncidentUpdateRequest,
  CommentResponse,
  PagedResult
} from '../types/api';

export class IncidentService {
  private readonly basePath = '/api/incidents';

  async getIncidents(params?: {
    page?: number;
    pageSize?: number;
    status?: string;
    priority?: string;
    search?: string;
  }): Promise<PagedResult<IncidentResponse>> {
    const { data } = await apiClient.get<PagedResult<IncidentResponse>>(this.basePath, { params });
    return data;
  }

  async getIncidentById(id: string): Promise<IncidentResponse> {
    const { data } = await apiClient.get<IncidentResponse>(`${this.basePath}/${id}`);
    return data;
  }

  async createIncident(incident: IncidentCreateRequest): Promise<IncidentResponse> {
    const { data } = await apiClient.post<IncidentResponse>(this.basePath, incident);
    return data;
  }

  async updateIncident(id: string, incident: IncidentUpdateRequest): Promise<IncidentResponse> {
    const { data } = await apiClient.put<IncidentResponse>(`${this.basePath}/${id}`, incident);
    return data;
  }

  async deleteIncident(id: string): Promise<void> {
    await apiClient.delete(`${this.basePath}/${id}`);
  }

  async addComment(incidentId: string, comment: {
    content: string;
    author: string;
    isInternal?: boolean;
  }): Promise<CommentResponse> {
    const { data } = await apiClient.post<CommentResponse>(
      `${this.basePath}/${incidentId}/comments`,
      comment
    );
    return data;
  }

  async getComments(incidentId: string): Promise<CommentResponse[]> {
    const { data } = await apiClient.get<CommentResponse[]>(
      `${this.basePath}/${incidentId}/comments`
    );
    return data;
  }

  async resolveIncident(id: string, resolution: string): Promise<IncidentResponse> {
    const { data } = await apiClient.post<IncidentResponse>(
      `${this.basePath}/${id}/resolve`,
      { resolution }
    );
    return data;
  }

  async reopenIncident(id: string, reason: string): Promise<IncidentResponse> {
    const { data } = await apiClient.post<IncidentResponse>(
      `${this.basePath}/${id}/reopen`,
      { reason }
    );
    return data;
  }

  async assignIncident(id: string, assignee: string): Promise<IncidentResponse> {
    const { data } = await apiClient.post<IncidentResponse>(
      `${this.basePath}/${id}/assign`,
      { assignee }
    );
    return data;
  }
}

export const incidentService = new IncidentService();