import { z } from 'zod';

/**
 * Time range options for metrics - matches backend TimeRange
 */
export enum TimeRange {
  OneHour = 'OneHour',
  TwentyFourHours = 'TwentyFourHours',
  SevenDays = 'SevenDays',
  ThirtyDays = 'ThirtyDays',
  Hour = 'OneHour',
  Day = 'TwentyFourHours',
  Week = 'SevenDays',
  Month = 'ThirtyDays',
  // Legacy aliases for backward compatibility
  ONE_HOUR = 'OneHour',
  TWENTY_FOUR_HOURS = 'TwentyFourHours',
  SEVEN_DAYS = 'SevenDays',
  THIRTY_DAYS = 'ThirtyDays'
}

/**
 * Metric trend direction - matches backend MetricTrend
 */
export enum MetricTrend {
  Up = 'Up',
  Down = 'Down',
  Stable = 'Stable'
}

/**
 * Metric types for monitoring
 */
export enum MetricType {
  RESPONSE_TIME = 'responseTime',
  UPTIME = 'uptime',
  CPU = 'cpu',
  MEMORY = 'memory',
  REQUESTS = 'requests',
  ERRORS = 'errors',
  ERROR_RATE = 'errorRate',
  THROUGHPUT = 'throughput',
  LATENCY = 'latency'
}

/**
 * Aggregation types for metrics
 */
export enum AggregationType {
  AVERAGE = 'average',
  SUM = 'sum',
  MIN = 'min',
  MAX = 'max',
  COUNT = 'count',
  PERCENTILE_50 = 'p50',
  PERCENTILE_95 = 'p95',
  PERCENTILE_99 = 'p99'
}

/**
 * Zod schema for time-series metric data point
 */
export const MetricDataPointSchema = z.object({
  timestamp: z.date(),
  value: z.number(),
  label: z.string().optional()
});

export interface MetricDataPoint extends z.infer<typeof MetricDataPointSchema> {}

/**
 * Zod schema for metric data
 */
export const MetricDataSchema = z.object({
  metricType: z.nativeEnum(MetricType),
  portalId: z.string().uuid().optional(),
  timeRange: z.nativeEnum(TimeRange),
  dataPoints: z.array(MetricDataPointSchema),
  aggregationType: z.nativeEnum(AggregationType).default(AggregationType.AVERAGE),
  unit: z.string().optional(),
  threshold: z.number().optional(),
  trend: z.nativeEnum(MetricTrend).optional()
});

/**
 * TypeScript interface for MetricData
 * @interface MetricData
 * @description Time-series data for system metrics
 */
export interface MetricData extends z.infer<typeof MetricDataSchema> {}

/**
 * Zod schema for system statistics
 */
export const SystemStatsSchema = z.object({
  // Portal statistics
  totalPortals: z.number().nonnegative(),
  operationalPortals: z.number().nonnegative(),
  activePortals: z.number().nonnegative(),
  inactivePortals: z.number().nonnegative(),

  // Health statistics
  healthScore: z.number().min(0).max(100),
  systemUptime: z.number().min(0).max(100),
  averageResponseTime: z.number().nonnegative(),

  // Performance statistics
  totalRequests: z.number().nonnegative(),
  totalErrors: z.number().nonnegative(),
  errorRate: z.number().min(0).max(100),
  throughput: z.number().nonnegative(),

  // Resource statistics
  averageCpu: z.number().min(0).max(100),
  averageMemory: z.number().min(0).max(100),
  diskUsage: z.number().min(0).max(100),
  networkLatency: z.number().nonnegative(),

  // Incident statistics
  activeIncidents: z.number().nonnegative(),
  resolvedToday: z.number().nonnegative(),
  mttr: z.number().nonnegative(), // Mean Time To Recovery
  mtbf: z.number().nonnegative(), // Mean Time Between Failures

  // User statistics
  activeUsers: z.number().nonnegative(),
  totalUsers: z.number().nonnegative(),
  concurrentSessions: z.number().nonnegative(),

  // Time-based statistics
  lastUpdated: z.date(),
  timeRange: z.nativeEnum(TimeRange),
  dataQuality: z.number().min(0).max(100) // Percentage of complete data
});

/**
 * TypeScript interface for SystemStats
 * @interface SystemStats
 * @description Aggregated system-wide statistics for dashboard
 */
export interface SystemStats extends z.infer<typeof SystemStatsSchema> {}

/**
 * Dashboard widget configuration
 */
export const DashboardWidgetSchema = z.object({
  id: z.string().uuid(),
  type: z.enum(['chart', 'stat', 'list', 'map', 'gauge', 'table']),
  title: z.string().min(1).max(100),
  metricType: z.nativeEnum(MetricType),
  position: z.object({
    x: z.number().nonnegative(),
    y: z.number().nonnegative(),
    width: z.number().positive(),
    height: z.number().positive()
  }),
  config: z.record(z.any()).optional(),
  refreshInterval: z.number().positive().optional(), // in seconds
  visible: z.boolean().default(true)
});

export interface DashboardWidget extends z.infer<typeof DashboardWidgetSchema> {}

/**
 * Performance benchmark data
 */
export const PerformanceBenchmarkSchema = z.object({
  metricType: z.nativeEnum(MetricType),
  baseline: z.number(),
  target: z.number(),
  actual: z.number(),
  timestamp: z.date(),
  status: z.enum(['exceeding', 'meeting', 'below', 'critical']),
  improvementPercentage: z.number()
});

export interface PerformanceBenchmark extends z.infer<typeof PerformanceBenchmarkSchema> {}

/**
 * Alert threshold configuration
 */
export const AlertThresholdSchema = z.object({
  id: z.string().uuid(),
  metricType: z.nativeEnum(MetricType),
  portalId: z.string().uuid().optional(),
  warningThreshold: z.number(),
  criticalThreshold: z.number(),
  duration: z.number().positive(), // in seconds
  enabled: z.boolean().default(true),
  notificationChannels: z.array(z.enum(['email', 'sms', 'slack', 'teams', 'webhook'])),
  cooldownPeriod: z.number().nonnegative().default(300) // in seconds
});

export interface AlertThreshold extends z.infer<typeof AlertThresholdSchema> {}

/**
 * Metric comparison data
 */
export const MetricComparisonSchema = z.object({
  metricType: z.nativeEnum(MetricType),
  currentPeriod: MetricDataSchema,
  previousPeriod: MetricDataSchema,
  changePercentage: z.number(),
  changeDirection: z.enum(['increase', 'decrease', 'stable']),
  isImprovement: z.boolean()
});

export interface MetricComparison extends z.infer<typeof MetricComparisonSchema> {}

/**
 * Health check result
 */
export const HealthCheckResultSchema = z.object({
  portalId: z.string().uuid(),
  timestamp: z.date(),
  isHealthy: z.boolean(),
  responseTime: z.number().nonnegative(),
  statusCode: z.number().optional(),
  checks: z.array(z.object({
    name: z.string(),
    passed: z.boolean(),
    message: z.string().optional(),
    duration: z.number().nonnegative()
  }))
});

export interface HealthCheckResult extends z.infer<typeof HealthCheckResultSchema> {}

/**
 * Main statistics response - matches backend StatisticsResponse
 */
export const StatisticsResponseSchema = z.object({
  stats: SystemStatsSchema,
  portalStats: z.object({
    total: z.number().nonnegative(),
    active: z.number().nonnegative(),
    degraded: z.number().nonnegative(),
    down: z.number().nonnegative(),
    maintenance: z.number().nonnegative(),
    unknown: z.number().nonnegative(),
    byCategory: z.record(z.number()),
    byEnvironment: z.record(z.number()),
    byPriority: z.record(z.number()),
    averageUptime: z.number().min(0).max(100),
    averageResponseTime: z.number().nonnegative(),
    byStatus: z.record(z.number()),
    averageMetrics: z.record(z.number())
  }),
  incidentStats: z.object({
    total: z.number().nonnegative(),
    open: z.number().nonnegative(),
    inProgress: z.number().nonnegative(),
    resolved: z.number().nonnegative(),
    closed: z.number().nonnegative(),
    acknowledgedIncidents: z.number().nonnegative(),
    criticalIncidents: z.number().nonnegative(),
    highIncidents: z.number().nonnegative(),
    mediumIncidents: z.number().nonnegative(),
    lowIncidents: z.number().nonnegative(),
    bySeverity: z.record(z.number()),
    byType: z.record(z.number()),
    last24Hours: z.number().nonnegative(),
    last7Days: z.number().nonnegative(),
    averageMTTR: z.number().nonnegative(),
    averageMTBF: z.number().nonnegative()
  }),
  sparklines: z.record(z.array(z.object({
    timestamp: z.date(),
    value: z.number(),
    label: z.string().optional().nullable()
  }))),
  totalPortals: z.number().nonnegative(),
  healthyPortals: z.number().nonnegative(),
  activeIncidents: z.number().nonnegative(),
  incidentTypeBreakdown: z.record(z.number()),
  averageResponseTime: z.number().nonnegative(),
  averageUptime: z.number().min(0).max(100),
  averageErrorRate: z.number().min(0).max(100),
  downPortals: z.number().nonnegative(),
  degradedPortals: z.number().nonnegative(),
  criticalIncidents: z.number().nonnegative(),
  totalRequests: z.number().nonnegative(),
  timestamp: z.date(),
  warningPortals: z.number().nonnegative(),
  lastUpdated: z.date(),
  recentIncidents: z.array(z.object({
    id: z.string().uuid(),
    title: z.string(),
    severity: z.string(),
    status: z.string(),
    createdAt: z.date()
  })),
  portalStatusBreakdown: z.record(z.number())
});

export interface StatisticsResponse extends z.infer<typeof StatisticsResponseSchema> {}

/**
 * Sparkline data response - matches backend SparklineDataResponse
 */
export const SparklineDataResponseSchema = z.object({
  metricName: z.string(),
  dataPoints: z.array(MetricDataPointSchema),
  currentValue: z.number(),
  previousValue: z.number(),
  changePercentage: z.number(),
  trend: z.string(),
  data: z.array(z.number()),
  labels: z.array(z.string()),
  timeRange: z.nativeEnum(TimeRange),
  generatedAt: z.date(),
  values: z.array(z.number())
});

export interface SparklineDataResponse extends z.infer<typeof SparklineDataResponseSchema> {}