import type { AxiosInstance } from 'axios';
import type {
  DashboardStats,
  SystemMetrics,
  IncidentTrend,
  PortalHealthSummary
} from '../types/service.types';
import type { IStatisticsService } from './interfaces/IStatisticsService';

export class StatisticsService implements IStatisticsService {
  private readonly basePath = '/api/statistics';

  constructor(private readonly apiClient: AxiosInstance) {}

  async getDashboardStats(): Promise<DashboardStats> {
    const { data } = await this.apiClient.get<DashboardStats>(`${this.basePath}/dashboard`);
    return data;
  }

  async getSystemMetrics(): Promise<SystemMetrics> {
    const { data } = await this.apiClient.get<SystemMetrics>(`${this.basePath}/metrics`);
    return data;
  }

  async getIncidentTrends(days: number = 30): Promise<IncidentTrend[]> {
    const { data } = await this.apiClient.get<IncidentTrend[]>(
      `${this.basePath}/incident-trends`,
      { params: { days } }
    );
    return data;
  }

  async getPortalHealthSummary(): Promise<PortalHealthSummary> {
    const { data } = await this.apiClient.get<PortalHealthSummary>(
      `${this.basePath}/portal-health`
    );
    return data;
  }

  async getActivityLog(params?: {
    page?: number;
    pageSize?: number;
    entityType?: string;
    userId?: string;
  }): Promise<any> {
    const { data } = await this.apiClient.get(`${this.basePath}/activity-log`, { params });
    return data;
  }

  async getPerformanceMetrics(timeRange: string = '24h'): Promise<any> {
    const { data } = await this.apiClient.get(
      `${this.basePath}/performance`,
      { params: { timeRange } }
    );
    return data;
  }

  async exportReport(format: 'pdf' | 'csv' | 'excel', params?: any): Promise<Blob> {
    const { data } = await this.apiClient.get(
      `${this.basePath}/export`,
      {
        params: { format, ...params },
        responseType: 'blob'
      }
    );
    return data;
  }
}

// Factory function to create service instance with dependency injection
export const createStatisticsService = (apiClient: AxiosInstance): IStatisticsService => {
  return new StatisticsService(apiClient);
};