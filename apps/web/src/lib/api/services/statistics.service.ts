import { api } from '../client';
import {
  SystemStats,
  DetailedMetrics,
  TrendData,
  MetricCategory
} from '../../../types/stats.types';
import { ApiResponse } from './portals.service';

export interface SparklineData {
  value: number;
  timestamp: string;
}

export interface DashboardStats {
  systemHealth: number;
  activeIncidents: number;
  totalPortals: number;
  avgResponseTime: number;
  errorRate: number;
  uptime: number;
  sparklines: {
    cpu: SparklineData[];
    memory: SparklineData[];
    network: SparklineData[];
    disk: SparklineData[];
  };
}

export const statisticsService = {
  // Get dashboard statistics
  getDashboardStats: async () => {
    const response = await api.get<ApiResponse<any>>('/api/v1/statistics');
    // Map the API response to DashboardStats format
    const stats = response.data.data;
    return {
      systemHealth: stats.healthScore || 0,
      activeIncidents: stats.activeIncidents || 0,
      totalPortals: stats.totalPortals || 0,
      avgResponseTime: stats.averageResponseTime || 0,
      errorRate: stats.errorRate || 0,
      uptime: stats.uptime || 0,
      sparklines: {
        cpu: [],
        memory: [],
        network: [],
        disk: []
      }
    } as DashboardStats;
  },

  // Get system statistics
  getSystemStats: async () => {
    const response = await api.get<ApiResponse<SystemStats>>('/api/v1/statistics');
    return response.data.data;
  },

  // Get detailed metrics
  getDetailedMetrics: async (category?: MetricCategory) => {
    const response = await api.get<ApiResponse<DetailedMetrics>>('/api/v1/statistics/metrics', {
      params: { category },
    });
    return response.data.data;
  },

  // Get sparkline data for a specific metric
  getSparklineData: async (metric: string, period: '1h' | '6h' | '24h' | '7d' = '24h') => {
    const hoursMap = { '1h': 1, '6h': 6, '24h': 24, '7d': 168 };
    const response = await api.get<ApiResponse<any>>('/api/v1/statistics/sparklines', {
      params: { metrics: metric, hours: hoursMap[period] },
    });
    // The API returns a dictionary of metrics, extract the requested one
    const data = response.data.data;
    if (data && data[metric]) {
      return data[metric].map((point: any) => ({
        value: point.value,
        timestamp: point.timestamp
      }));
    }
    return [];
  },

  // Get trend data
  getTrendData: async (params: {
    metric: string;
    startDate?: string;
    endDate?: string;
    interval?: 'hour' | 'day' | 'week' | 'month';
  }) => {
    const response = await api.get<ApiResponse<TrendData[]>>('/api/v1/statistics/trends', { params });
    return response.data.data;
  },

  // Get performance metrics
  getPerformanceMetrics: async () => {
    const response = await api.get<ApiResponse<any>>('/api/v1/statistics/performance');
    return response.data.data;
  },

  // Get availability metrics
  getAvailabilityMetrics: async () => {
    const response = await api.get<ApiResponse<any>>('/api/v1/statistics/availability');
    return response.data.data;
  },

  // Get error metrics
  getErrorMetrics: async (params?: {
    startDate?: string;
    endDate?: string;
    groupBy?: 'hour' | 'day' | 'portal';
  }) => {
    const response = await api.get<ApiResponse<any>>('/api/v1/statistics/errors', { params });
    return response.data.data;
  },

  // Get capacity metrics
  getCapacityMetrics: async () => {
    const response = await api.get<ApiResponse<any>>('/api/v1/statistics/capacity');
    return response.data.data;
  },

  // Get real-time metrics (polling fallback if SignalR is not available)
  getRealTimeMetrics: async () => {
    const response = await api.get<ApiResponse<any>>('/api/v1/statistics/realtime');
    return response.data.data;
  },

  // Get historical data
  getHistoricalData: async (params: {
    metrics: string[];
    startDate: string;
    endDate: string;
    resolution?: 'minute' | 'hour' | 'day';
  }) => {
    const response = await api.get<ApiResponse<any>>('/api/v1/statistics/historical', { params });
    return response.data.data;
  },

  // Export statistics
  exportStatistics: async (params: {
    format: 'csv' | 'json' | 'pdf';
    metrics?: string[];
    startDate?: string;
    endDate?: string;
  }) => {
    const response = await api.get<ApiResponse<any>>('/api/v1/statistics/export', {
      params,
      responseType: params.format === 'json' ? 'json' : 'blob',
    });
    return params.format === 'json' ? response.data.data : response.data;
  },

  // Get metric aggregations
  getAggregations: async (params: {
    metric: string;
    aggregationType: 'avg' | 'sum' | 'min' | 'max' | 'count';
    groupBy?: 'hour' | 'day' | 'week' | 'month';
    startDate?: string;
    endDate?: string;
  }) => {
    const response = await api.get<ApiResponse<any>>('/api/v1/statistics/aggregate', { params });
    return response.data.data;
  },
};