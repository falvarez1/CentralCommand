import type {
  IncidentResponse,
  IncidentCreateRequest,
  IncidentUpdateRequest,
  CommentResponse
} from '../../types/service.types';
import type { PagedResult } from '../../types/api.types';

export interface IIncidentService {
  getIncidents(params?: {
    page?: number;
    pageSize?: number;
    status?: string;
    priority?: string;
    search?: string;
  }): Promise<PagedResult<IncidentResponse>>;

  getIncidentById(id: string): Promise<IncidentResponse>;

  createIncident(incident: IncidentCreateRequest): Promise<IncidentResponse>;

  updateIncident(id: string, incident: IncidentUpdateRequest): Promise<IncidentResponse>;

  deleteIncident(id: string): Promise<void>;

  addComment(incidentId: string, comment: {
    content: string;
    author: string;
    isInternal?: boolean;
  }): Promise<CommentResponse>;

  getComments(incidentId: string): Promise<CommentResponse[]>;

  resolveIncident(id: string, resolution: string): Promise<IncidentResponse>;

  reopenIncident(id: string, reason: string): Promise<IncidentResponse>;

  assignIncident(id: string, assignee: string): Promise<IncidentResponse>;
}