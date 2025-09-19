import { z } from 'zod';

/**
 * Portal status enum - matches backend PortalStatus
 */
export enum PortalStatus {
  Operational = 'Operational',
  Degraded = 'Degraded',
  Maintenance = 'Maintenance',
  Outage = 'Outage',
  Unknown = 'Unknown'
}

/**
 * Portal environment types - matches backend PortalEnvironment
 */
export enum PortalEnvironment {
  Production = 'Production',
  Staging = 'Staging',
  Development = 'Development',
  Testing = 'Testing'
}

/**
 * Portal priority levels - matches backend PortalPriority
 */
export enum PortalPriority {
  Critical = 'Critical',
  High = 'High',
  Medium = 'Medium',
  Low = 'Low'
}

/**
 * Authentication types - matches backend AuthType
 */
export enum AuthType {
  None = 'None',
  Basic = 'Basic',
  OAuth = 'OAuth',
  SAML = 'SAML',
  ApiKey = 'ApiKey',
  JWT = 'JWT'
}

/**
 * Portal categories - matches backend PortalCategory
 */
export enum PortalCategory {
  All = 'All',
  Engineering = 'Engineering',
  Operations = 'Operations',
  Support = 'Support',
  Monitoring = 'Monitoring',
  Analytics = 'Analytics',
  Services = 'Services',
  Infrastructure = 'Infrastructure',
  Databases = 'Databases',
  Security = 'Security',
  Development = 'Development',
  Business = 'Business',
  Communication = 'Communication'
}

/**
 * Zod schema for Portal metrics
 */
export const PortalMetricsSchema = z.object({
  responseTime: z.number().nonnegative(),
  uptime: z.number().min(0).max(100),
  cpu: z.number().min(0).max(100),
  memory: z.number().min(0).max(100),
  requests: z.number().nonnegative(),
  errors: z.number().nonnegative(),
  errorRate: z.number().min(0).max(100),
  throughput: z.number().nonnegative(),
  latency: z.number().nonnegative(),
  requestsPerMinute: z.number().nonnegative().optional(),
  averageLoadTime: z.number().nonnegative().optional(),
  peakResponseTime: z.number().nonnegative().optional(),
  timestamp: z.date().optional(),
  lastUpdated: z.date().optional()
});

export interface PortalMetrics extends z.infer<typeof PortalMetricsSchema> {}

/**
 * Zod schema for Portal configuration
 */
export const PortalConfigSchema = z.object({
  healthCheckEndpoint: z.string().url().optional(),
  healthCheckInterval: z.number().positive().default(30), // seconds
  timeout: z.number().positive().default(5000), // milliseconds
  retryAttempts: z.number().nonnegative().default(3),
  retryDelay: z.number().nonnegative().default(1000), // milliseconds
  customHeaders: z.record(z.string()).optional(),
  enableMonitoring: z.boolean().default(true),
  enableAlerts: z.boolean().default(true),
  enableAutoRecovery: z.boolean().default(false)
});

export interface PortalConfig extends z.infer<typeof PortalConfigSchema> {}

/**
 * Zod schema for Portal
 */
export const PortalSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional().nullable(),
  url: z.string().url(),
  category: z.nativeEnum(PortalCategory),
  status: z.nativeEnum(PortalStatus),
  environment: z.nativeEnum(PortalEnvironment).default(PortalEnvironment.Production),
  priority: z.nativeEnum(PortalPriority).default(PortalPriority.Medium),

  // Authentication
  authType: z.nativeEnum(AuthType).default(AuthType.None),
  authConfig: z.record(z.any()).optional(),

  // Metrics
  metrics: PortalMetricsSchema,
  lastChecked: z.date(),
  lastIncident: z.date().optional().nullable(),
  lastStatusChange: z.date().optional().nullable(),
  statusReason: z.string().max(500).optional().nullable(),

  // Configuration
  config: PortalConfigSchema.optional().default(() => ({ healthCheckInterval: 30, timeout: 5000, retryAttempts: 3, retryDelay: 1000, enableMonitoring: true, enableAlerts: true, enableAutoRecovery: false })),

  // UI properties
  icon: z.string().optional().nullable(),
  color: z.string().optional().nullable(),
  tags: z.array(z.string()).default([]),
  isFavorite: z.boolean().default(false),
  isPublic: z.boolean().default(false),

  // Ownership
  owner: z.string().uuid().optional().nullable(),
  team: z.string().uuid().optional().nullable(),
  maintainers: z.array(z.string().uuid()).default([]),

  // Metadata
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.string().uuid(),
  updatedBy: z.string().uuid(),
  eTag: z.string().optional(),
  metricsHistory: z.array(z.object({
    timestamp: z.date(),
    metrics: PortalMetricsSchema
  })).optional()
});

/**
 * TypeScript interface for Portal
 */
export interface Portal extends z.infer<typeof PortalSchema> {}

/**
 * Zod schema for creating a new portal
 */
export const CreatePortalInputSchema = PortalSchema.omit({
  id: true,
  metrics: true,
  lastChecked: true,
  lastIncident: true,
  createdAt: true,
  updatedAt: true,
  createdBy: true,
  updatedBy: true
}).extend({
  metrics: PortalMetricsSchema.partial().optional()
});

export interface CreatePortalInput extends z.infer<typeof CreatePortalInputSchema> {}

/**
 * Zod schema for updating a portal
 */
export const UpdatePortalInputSchema = PortalSchema.partial().omit({
  id: true,
  createdAt: true,
  createdBy: true
});

export interface UpdatePortalInput extends z.infer<typeof UpdatePortalInputSchema> {}

/**
 * Portal filter options
 */
export const PortalFilterSchema = z.object({
  category: z.nativeEnum(PortalCategory).optional(),
  status: z.array(z.nativeEnum(PortalStatus)).optional(),
  environment: z.array(z.nativeEnum(PortalEnvironment)).optional(),
  priority: z.array(z.nativeEnum(PortalPriority)).optional(),
  searchTerm: z.string().optional(),
  tags: z.array(z.string()).optional(),
  owner: z.string().uuid().optional(),
  team: z.string().uuid().optional(),
  isFavorite: z.boolean().optional(),
  isPublic: z.boolean().optional(),
  hasIncidents: z.boolean().optional()
});

export interface PortalFilter extends z.infer<typeof PortalFilterSchema> {}

/**
 * Portal statistics
 */
export const PortalStatsSchema = z.object({
  total: z.number().nonnegative(),
  operational: z.number().nonnegative(),
  degraded: z.number().nonnegative(),
  maintenance: z.number().nonnegative(),
  outage: z.number().nonnegative(),
  byCategory: z.record(z.nativeEnum(PortalCategory), z.number()),
  byEnvironment: z.record(z.nativeEnum(PortalEnvironment), z.number()),
  byPriority: z.record(z.nativeEnum(PortalPriority), z.number()),
  averageUptime: z.number().min(0).max(100),
  averageResponseTime: z.number().nonnegative()
});

export interface PortalStats extends z.infer<typeof PortalStatsSchema> {}

/**
 * Bulk operation types
 */
export enum BulkOperationType {
  UPDATE_STATUS = 'update_status',
  UPDATE_PRIORITY = 'update_priority',
  UPDATE_ENVIRONMENT = 'update_environment',
  ADD_TAGS = 'add_tags',
  REMOVE_TAGS = 'remove_tags',
  ASSIGN_TEAM = 'assign_team',
  ENABLE_MONITORING = 'enable_monitoring',
  DISABLE_MONITORING = 'disable_monitoring',
  DELETE = 'delete',
  EXPORT = 'export'
}

/**
 * Bulk operation input
 */
export const BulkOperationSchema = z.object({
  operation: z.nativeEnum(BulkOperationType),
  portalIds: z.array(z.string().uuid()).min(1),
  payload: z.record(z.any()).optional()
});

export interface BulkOperation extends z.infer<typeof BulkOperationSchema> {}

/**
 * Portal summary for list views - matches backend PortalSummaryResponse
 */
export const PortalSummarySchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  url: z.string().url(),
  category: z.nativeEnum(PortalCategory),
  status: z.nativeEnum(PortalStatus),
  environment: z.nativeEnum(PortalEnvironment),
  priority: z.nativeEnum(PortalPriority),
  uptime: z.number().min(0).max(100),
  responseTime: z.number().nonnegative(),
  lastChecked: z.date(),
  icon: z.string().optional().nullable(),
  color: z.string().optional().nullable(),
  isFavorite: z.boolean()
});

export interface PortalSummary extends z.infer<typeof PortalSummarySchema> {}

/**
 * Batch operation result - matches backend BatchOperationResult
 */
export const BatchOperationResultSchema = z.object({
  successCount: z.number().nonnegative(),
  failureCount: z.number().nonnegative(),
  totalCount: z.number().nonnegative(),
  results: z.array(z.object({
    portalId: z.string().uuid(),
    success: z.boolean(),
    error: z.string().optional().nullable()
  })),
  errors: z.record(z.string()).optional()
});

export interface BatchOperationResult extends z.infer<typeof BatchOperationResultSchema> {}

/**
 * Portal health check response
 */
export const PortalHealthCheckSchema = z.object({
  portalId: z.string().uuid(),
  portalName: z.string(),
  endpoint: z.string(),
  isEnabled: z.boolean(),
  lastChecked: z.date().optional().nullable(),
  lastStatus: z.nativeEnum(PortalStatus).optional().nullable(),
  lastResponseTime: z.number().optional().nullable(),
  lastError: z.string().optional().nullable(),
  consecutiveFailures: z.number().nonnegative(),
  isHealthy: z.boolean(),
  status: z.string(),
  responseTime: z.number().nonnegative(),
  uptime: z.number().min(0).max(100),
  errorRate: z.number().min(0).max(100)
});

export interface PortalHealthCheck extends z.infer<typeof PortalHealthCheckSchema> {}