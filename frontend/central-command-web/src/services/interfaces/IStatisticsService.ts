import type {
  DashboardStats,
  SystemMetrics,
  IncidentTrend,
  PortalHealthSummary
} from '../../types/service.types';

export interface IStatisticsService {
  getDashboardStats(): Promise<DashboardStats>;

  getSystemMetrics(): Promise<SystemMetrics>;

  getIncidentTrends(days?: number): Promise<IncidentTrend[]>;

  getPortalHealthSummary(): Promise<PortalHealthSummary>;

  getActivityLog(params?: {
    page?: number;
    pageSize?: number;
    entityType?: string;
    userId?: string;
  }): Promise<any>;

  getPerformanceMetrics(timeRange?: string): Promise<any>;

  exportReport(format: 'pdf' | 'csv' | 'excel', params?: any): Promise<Blob>;
}