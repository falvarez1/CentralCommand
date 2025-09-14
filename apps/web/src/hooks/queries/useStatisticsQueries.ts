import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { statisticsService, DashboardStats, SparklineData } from '../../lib/api/services/statistics.service';
import {
  SystemStats,
  DetailedMetrics,
  TrendData,
  MetricCategory
} from '../../types/stats.types';

// Query keys factory
export const statsKeys = {
  all: ['statistics'] as const,
  dashboard: () => [...statsKeys.all, 'dashboard'] as const,
  system: () => [...statsKeys.all, 'system'] as const,
  metrics: (category?: MetricCategory) => [...statsKeys.all, 'metrics', category] as const,
  sparkline: (metric: string, period?: string) => [...statsKeys.all, 'sparkline', metric, period] as const,
  trends: (params?: any) => [...statsKeys.all, 'trends', params] as const,
  performance: () => [...statsKeys.all, 'performance'] as const,
  availability: () => [...statsKeys.all, 'availability'] as const,
  errors: (params?: any) => [...statsKeys.all, 'errors', params] as const,
  capacity: () => [...statsKeys.all, 'capacity'] as const,
  realtime: () => [...statsKeys.all, 'realtime'] as const,
  historical: (params?: any) => [...statsKeys.all, 'historical', params] as const,
  aggregations: (params?: any) => [...statsKeys.all, 'aggregations', params] as const,
};

// Dashboard stats with frequent refresh
export const useDashboardStats = (options?: UseQueryOptions<DashboardStats>) => {
  return useQuery({
    queryKey: statsKeys.dashboard(),
    queryFn: () => statisticsService.getDashboardStats(),
    staleTime: 5 * 1000, // 5 seconds
    refetchInterval: 10 * 1000, // Auto-refresh every 10 seconds
    refetchIntervalInBackground: true,
    ...options,
  });
};

// System statistics
export const useSystemStats = (options?: UseQueryOptions<SystemStats>) => {
  return useQuery({
    queryKey: statsKeys.system(),
    queryFn: () => statisticsService.getSystemStats(),
    staleTime: 10 * 1000, // 10 seconds
    refetchInterval: 30 * 1000, // Auto-refresh every 30 seconds
    ...options,
  });
};

// Detailed metrics
export const useDetailedMetrics = (
  category?: MetricCategory,
  options?: UseQueryOptions<DetailedMetrics>
) => {
  return useQuery({
    queryKey: statsKeys.metrics(category),
    queryFn: () => statisticsService.getDetailedMetrics(category),
    staleTime: 15 * 1000, // 15 seconds
    refetchInterval: 30 * 1000, // Auto-refresh every 30 seconds
    ...options,
  });
};

// Sparkline data for charts
export const useSparklineData = (
  metric: string,
  period: '1h' | '6h' | '24h' | '7d' = '24h',
  options?: UseQueryOptions<SparklineData[]>
) => {
  return useQuery({
    queryKey: statsKeys.sparkline(metric, period),
    queryFn: () => statisticsService.getSparklineData(metric, period),
    staleTime: 5 * 1000, // 5 seconds for real-time feel
    refetchInterval: 10 * 1000, // Update every 10 seconds
    enabled: !!metric,
    ...options,
  });
};

// Trend data
export const useTrendData = (
  params: {
    metric: string;
    startDate?: string;
    endDate?: string;
    interval?: 'hour' | 'day' | 'week' | 'month';
  },
  options?: UseQueryOptions<TrendData[]>
) => {
  return useQuery({
    queryKey: statsKeys.trends(params),
    queryFn: () => statisticsService.getTrendData(params),
    staleTime: 60 * 1000, // 1 minute
    enabled: !!params.metric,
    ...options,
  });
};

// Performance metrics
export const usePerformanceMetrics = (options?: UseQueryOptions<any>) => {
  return useQuery({
    queryKey: statsKeys.performance(),
    queryFn: () => statisticsService.getPerformanceMetrics(),
    staleTime: 15 * 1000, // 15 seconds
    refetchInterval: 30 * 1000, // Auto-refresh every 30 seconds
    ...options,
  });
};

// Availability metrics
export const useAvailabilityMetrics = (options?: UseQueryOptions<any>) => {
  return useQuery({
    queryKey: statsKeys.availability(),
    queryFn: () => statisticsService.getAvailabilityMetrics(),
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Auto-refresh every minute
    ...options,
  });
};

// Error metrics
export const useErrorMetrics = (
  params?: {
    startDate?: string;
    endDate?: string;
    groupBy?: 'hour' | 'day' | 'portal';
  },
  options?: UseQueryOptions<any>
) => {
  return useQuery({
    queryKey: statsKeys.errors(params),
    queryFn: () => statisticsService.getErrorMetrics(params),
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Auto-refresh every minute
    ...options,
  });
};

// Capacity metrics
export const useCapacityMetrics = (options?: UseQueryOptions<any>) => {
  return useQuery({
    queryKey: statsKeys.capacity(),
    queryFn: () => statisticsService.getCapacityMetrics(),
    staleTime: 60 * 1000, // 1 minute
    refetchInterval: 5 * 60 * 1000, // Auto-refresh every 5 minutes
    ...options,
  });
};

// Real-time metrics (polling fallback)
export const useRealTimeMetrics = (options?: UseQueryOptions<any>) => {
  return useQuery({
    queryKey: statsKeys.realtime(),
    queryFn: () => statisticsService.getRealTimeMetrics(),
    staleTime: 1000, // 1 second for real-time
    refetchInterval: 2000, // Update every 2 seconds
    refetchIntervalInBackground: true,
    ...options,
  });
};

// Historical data
export const useHistoricalData = (
  params: {
    metrics: string[];
    startDate: string;
    endDate: string;
    resolution?: 'minute' | 'hour' | 'day';
  },
  options?: UseQueryOptions<any>
) => {
  return useQuery({
    queryKey: statsKeys.historical(params),
    queryFn: () => statisticsService.getHistoricalData(params),
    staleTime: 5 * 60 * 1000, // 5 minutes for historical data
    enabled: params.metrics.length > 0 && !!params.startDate && !!params.endDate,
    ...options,
  });
};

// Aggregations
export const useMetricAggregations = (
  params: {
    metric: string;
    aggregationType: 'avg' | 'sum' | 'min' | 'max' | 'count';
    groupBy?: 'hour' | 'day' | 'week' | 'month';
    startDate?: string;
    endDate?: string;
  },
  options?: UseQueryOptions<any>
) => {
  return useQuery({
    queryKey: statsKeys.aggregations(params),
    queryFn: () => statisticsService.getAggregations(params),
    staleTime: 60 * 1000, // 1 minute
    enabled: !!params.metric && !!params.aggregationType,
    ...options,
  });
};

// Combined dashboard query for initial load
export const useDashboardData = () => {
  const dashboardStats = useDashboardStats();
  const systemStats = useSystemStats();
  const performanceMetrics = usePerformanceMetrics();

  return {
    dashboardStats,
    systemStats,
    performanceMetrics,
    isLoading: dashboardStats.isLoading || systemStats.isLoading || performanceMetrics.isLoading,
    isError: dashboardStats.isError || systemStats.isError || performanceMetrics.isError,
    refetchAll: () => {
      dashboardStats.refetch();
      systemStats.refetch();
      performanceMetrics.refetch();
    },
  };
};