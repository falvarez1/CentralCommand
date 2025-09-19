import type {
  PortalResponse,
  PortalCreateRequest,
  PortalUpdateRequest,
  HealthCheckResponse,
  PortalMetricsResponse
} from '../../types/service.types';
import type { PagedResult } from '../../types/api.types';

export interface IPortalService {
  getPortals(params?: {
    page?: number;
    pageSize?: number;
    status?: string;
    category?: string;
    environment?: string;
    search?: string;
  }): Promise<PagedResult<PortalResponse>>;

  getPortalById(id: string): Promise<PortalResponse>;

  createPortal(portal: PortalCreateRequest): Promise<PortalResponse>;

  updatePortal(id: string, portal: PortalUpdateRequest): Promise<PortalResponse>;

  deletePortal(id: string): Promise<void>;

  checkHealth(id: string): Promise<HealthCheckResponse>;

  getHealthHistory(id: string, days?: number): Promise<HealthCheckResponse[]>;

  getMetrics(id: string): Promise<PortalMetricsResponse>;

  updateStatus(id: string, status: string, reason?: string): Promise<PortalResponse>;

  getFavorites(): Promise<PortalResponse[]>;

  toggleFavorite(id: string): Promise<void>;

  getRelatedIncidents(id: string): Promise<any[]>;
}