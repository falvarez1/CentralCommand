import type { AxiosInstance } from 'axios';
import type {
  PortalResponse,
  PortalCreateRequest,
  PortalUpdateRequest,
  HealthCheckResponse,
  PortalMetricsResponse
} from '../types/service.types';
import type { PagedResult } from '../types/api.types';
import type { IPortalService } from './interfaces/IPortalService';

export class PortalService implements IPortalService {
  private readonly basePath = '/api/portals';

  constructor(private readonly apiClient: AxiosInstance) {}

  async getPortals(params?: {
    page?: number;
    pageSize?: number;
    status?: string;
    category?: string;
    environment?: string;
    search?: string;
  }): Promise<PagedResult<PortalResponse>> {
    const { data } = await this.apiClient.get<PagedResult<PortalResponse>>(this.basePath, { params });
    return data;
  }

  async getPortalById(id: string): Promise<PortalResponse> {
    const { data } = await this.apiClient.get<PortalResponse>(`${this.basePath}/${id}`);
    return data;
  }

  async createPortal(portal: PortalCreateRequest): Promise<PortalResponse> {
    const { data } = await this.apiClient.post<PortalResponse>(this.basePath, portal);
    return data;
  }

  async updatePortal(id: string, portal: PortalUpdateRequest): Promise<PortalResponse> {
    const { data } = await this.apiClient.put<PortalResponse>(`${this.basePath}/${id}`, portal);
    return data;
  }

  async deletePortal(id: string): Promise<void> {
    await this.apiClient.delete(`${this.basePath}/${id}`);
  }

  async checkHealth(id: string): Promise<HealthCheckResponse> {
    const { data } = await this.apiClient.post<HealthCheckResponse>(
      `${this.basePath}/${id}/health-check`
    );
    return data;
  }

  async getHealthHistory(id: string, days: number = 7): Promise<HealthCheckResponse[]> {
    const { data } = await this.apiClient.get<HealthCheckResponse[]>(
      `${this.basePath}/${id}/health-history`,
      { params: { days } }
    );
    return data;
  }

  async getMetrics(id: string): Promise<PortalMetricsResponse> {
    const { data } = await this.apiClient.get<PortalMetricsResponse>(
      `${this.basePath}/${id}/metrics`
    );
    return data;
  }

  async updateStatus(id: string, status: string, reason?: string): Promise<PortalResponse> {
    const { data } = await this.apiClient.post<PortalResponse>(
      `${this.basePath}/${id}/status`,
      { status, reason }
    );
    return data;
  }

  async getFavorites(): Promise<PortalResponse[]> {
    const { data } = await this.apiClient.get<PortalResponse[]>(`${this.basePath}/favorites`);
    return data;
  }

  async toggleFavorite(id: string): Promise<void> {
    await this.apiClient.post(`${this.basePath}/${id}/favorite`);
  }

  async getRelatedIncidents(id: string): Promise<any[]> {
    const { data } = await this.apiClient.get(`${this.basePath}/${id}/incidents`);
    return data;
  }
}

// Factory function to create service instance with dependency injection
export const createPortalService = (apiClient: AxiosInstance): IPortalService => {
  return new PortalService(apiClient);
};