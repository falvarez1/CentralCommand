import { api } from '../client';
import {
  StatisticsResponse,
  SystemStatsResponse,
  PortalStatsResponse,
  IncidentStatsResponse,
  SparklineDataResponse
} from '../../../types/statistics.types';

export const statisticsService = {
  // Get overall system statistics
  getStatistics: async (params?: {
    includeSparklines?: boolean;
    timeRange?: '24h' | '7d' | '30d' | '90d';
  }): Promise<StatisticsResponse> => {
    const response = await api.get<StatisticsResponse>('/api/v1/statistics', { params });
    return response.data;
  },

  // Get system-level statistics
  getSystemStats: async (): Promise<SystemStatsResponse> => {
    const response = await api.get<SystemStatsResponse>('/api/v1/statistics/system');
    return response.data;
  },

  // Get portal statistics
  getPortalStats: async (params?: {
    category?: string;
    environment?: string;
    timeRange?: string;
  }): Promise<PortalStatsResponse> => {
    const response = await api.get<PortalStatsResponse>('/api/v1/statistics/portals', { params });
    return response.data;
  },

  // Get incident statistics
  getIncidentStats: async (params?: {
    severity?: string;
    type?: string;
    timeRange?: string;
  }): Promise<IncidentStatsResponse> => {
    const response = await api.get<IncidentStatsResponse>('/api/v1/statistics/incidents', { params });
    return response.data;
  },

  // Get sparkline data for metrics visualization
  getSparklineData: async (params: {
    metrics: string[];
    interval?: '5m' | '15m' | '1h' | '1d';
    points?: number;
    startDate?: string;
    endDate?: string;
  }): Promise<SparklineDataResponse[]> => {
    const response = await api.get<SparklineDataResponse[]>('/api/v1/statistics/sparkline', { params });
    return response.data;
  },

  // Get health score trends
  getHealthTrends: async (params?: {
    period?: 'day' | 'week' | 'month';
    portalId?: string;
  }) => {
    const response = await api.get('/api/v1/statistics/health-trends', { params });
    return response.data;
  },

  // Get performance metrics
  getPerformanceMetrics: async (params?: {
    metricType?: 'uptime' | 'response-time' | 'error-rate' | 'throughput';
    aggregation?: 'avg' | 'min' | 'max' | 'sum';
    timeRange?: string;
  }) => {
    const response = await api.get('/api/v1/statistics/performance', { params });
    return response.data;
  },

  // Get resource usage statistics
  getResourceStats: async () => {
    const response = await api.get('/api/v1/statistics/resources');
    return response.data;
  },

  // Get dashboard summary data
  getDashboardSummary: async (): Promise<{
    stats: StatisticsResponse;
    recentActivity: any[];
    alerts: any[];
  }> => {
    const response = await api.get('/api/v1/statistics/dashboard');
    return response.data;
  },

  // Get time-series data for charts
  getTimeSeriesData: async (params: {
    metric: string;
    granularity?: 'minute' | 'hour' | 'day' | 'week' | 'month';
    startDate?: string;
    endDate?: string;
    portalId?: string;
  }) => {
    const response = await api.get('/api/v1/statistics/time-series', { params });
    return response.data;
  },

  // Export statistics report
  exportStatistics: async (params: {
    format: 'pdf' | 'csv' | 'json';
    reportType: 'summary' | 'detailed' | 'custom';
    timeRange?: string;
    includeCharts?: boolean;
  }) => {
    const response = await api.get('/api/v1/statistics/export', {
      params,
      responseType: params.format === 'json' ? 'json' : 'blob',
    });
    return response.data;
  },

  // Get comparative statistics
  getComparativeStats: async (params: {
    compareType: 'period' | 'portal' | 'category';
    baseEntity: string;
    compareEntity: string;
    metrics?: string[];
  }) => {
    const response = await api.get('/api/v1/statistics/compare', { params });
    return response.data;
  },
};
