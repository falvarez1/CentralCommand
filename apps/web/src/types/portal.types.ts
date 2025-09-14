import { z } from 'zod';

/**
 * Portal status enum
 */
export enum PortalStatus {
  OPERATIONAL = 'operational',
  DEGRADED = 'degraded',
  MAINTENANCE = 'maintenance',
  OUTAGE = 'outage'
}

/**
 * Portal environment types
 */
export enum PortalEnvironment {
  PRODUCTION = 'production',
  STAGING = 'staging',
  DEVELOPMENT = 'development',
  TESTING = 'testing'
}

/**
 * Portal priority levels
 */
export enum PortalPriority {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low'
}

/**
 * Authentication types
 */
export enum AuthType {
  NONE = 'none',
  BASIC = 'basic',
  OAUTH = 'oauth',
  SAML = 'saml',
  API_KEY = 'api_key',
  JWT = 'jwt'
}

/**
 * Portal categories
 */
export enum PortalCategory {
  ALL = 'all',
  ENGINEERING = 'engineering',
  OPERATIONS = 'operations',
  SUPPORT = 'support',
  MONITORING = 'monitoring',
  ANALYTICS = 'analytics',
  SERVICES = 'services',
  INFRASTRUCTURE = 'infrastructure',
  DATABASES = 'databases',
  SECURITY = 'security',
  DEVELOPMENT = 'development',
  BUSINESS = 'business',
  COMMUNICATION = 'communication'
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
  latency: z.number().nonnegative()
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
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  url: z.string().url(),
  category: z.nativeEnum(PortalCategory),
  status: z.nativeEnum(PortalStatus),
  environment: z.nativeEnum(PortalEnvironment).default(PortalEnvironment.PRODUCTION),
  priority: z.nativeEnum(PortalPriority).default(PortalPriority.MEDIUM),

  // Authentication
  authType: z.nativeEnum(AuthType).default(AuthType.NONE),
  authConfig: z.record(z.any()).optional(),

  // Metrics
  metrics: PortalMetricsSchema,
  lastChecked: z.date(),
  lastIncident: z.date().optional(),

  // Configuration
  config: PortalConfigSchema.default({}),

  // UI properties
  icon: z.string().optional(),
  color: z.string().optional(),
  tags: z.array(z.string()).default([]),
  isFavorite: z.boolean().default(false),
  isPublic: z.boolean().default(false),

  // Ownership
  owner: z.string().uuid().optional(),
  team: z.string().uuid().optional(),
  maintainers: z.array(z.string().uuid()).default([]),

  // Metadata
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.string().uuid(),
  updatedBy: z.string().uuid()
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