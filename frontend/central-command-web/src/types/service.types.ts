// Service layer type exports for compatibility with legacy code

import { Portal, PortalStatus, PortalCategory } from './portal.types';
import { Incident, IncidentSeverity, IncidentStatus, Comment, TimelineEntry } from './incident.types';
import { SystemStats, StatisticsResponse, SparklineDataResponse } from './stats.types';

// Re-export response types for services
export type PortalResponse = Portal;
export type PortalSummaryResponse = Pick<Portal, 'id' | 'name' | 'url' | 'status' | 'category'>;
export type PortalHealthCheckResponse = Portal['healthCheck'];
export type PortalMetricsResponse = Portal['metrics'];
export type PortalMetricsHistoryResponse = Portal['metricsHistory'];

export type IncidentResponse = Incident;
export type IncidentSummaryResponse = Pick<Incident, 'id' | 'title' | 'severity' | 'status'>;
export type CommentResponse = Comment;
export type TimelineEntryResponse = TimelineEntry;

// Create/Update request types
export type PortalCreateRequest = Omit<Portal, 'id' | 'createdAt' | 'updatedAt' | 'lastCheckedAt'>;
export type PortalUpdateRequest = Partial<PortalCreateRequest>;

export type IncidentCreateRequest = Omit<Incident, 'id' | 'createdAt' | 'updatedAt' | 'acknowledgedAt' | 'resolvedAt' | 'closedAt' | 'timeline' | 'comments'>;
export type IncidentUpdateRequest = Partial<IncidentCreateRequest>;

export type HealthCheckResponse = Portal['healthCheck'];

// Statistics types
export type DashboardStats = SystemStats;
export type SystemMetrics = SystemStats;
export type IncidentTrend = {
  date: Date;
  count: number;
  severity: IncidentSeverity;
};

export type PortalHealthSummary = {
  healthy: number;
  degraded: number;
  down: number;
  maintenance: number;
};

// Paginated response wrapper
export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

// API Response wrapper
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
  timestamp: Date;
}

// Export additional types
export type DetailedMetrics = SystemStats;
export type TrendData = {
  metric: string;
  data: Array<{ timestamp: Date; value: number }>;
  trend: 'up' | 'down' | 'stable';
};
export type MetricCategory = 'performance' | 'availability' | 'errors' | 'usage';

// Re-export SparklineData
export type SparklineData = SparklineDataResponse;

// Re-export needed types from other modules
export type {
  Portal,
  PortalStatus,
  PortalCategory,
  Incident,
  IncidentSeverity,
  IncidentStatus,
  SystemStats,
  StatisticsResponse
};