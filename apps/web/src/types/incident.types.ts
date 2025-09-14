import { z } from 'zod';

/**
 * Incident severity levels
 */
export enum IncidentSeverity {
  CRITICAL = 'critical',
  WARNING = 'warning',
  INFO = 'info',
  SUCCESS = 'success'
}

/**
 * Incident types
 */
export enum IncidentType {
  OUTAGE = 'outage',
  PERFORMANCE = 'performance',
  MAINTENANCE = 'maintenance',
  SECURITY = 'security',
  DATABASE = 'database',
  SERVICE = 'service',
  INFRASTRUCTURE = 'infrastructure',
  NETWORK = 'network'
}

/**
 * Incident resolution status
 */
export enum IncidentStatus {
  OPEN = 'open',
  INVESTIGATING = 'investigating',
  IDENTIFIED = 'identified',
  MONITORING = 'monitoring',
  RESOLVED = 'resolved',
  CLOSED = 'closed'
}

/**
 * Zod schema for Incident validation
 */
export const IncidentSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(200),
  description: z.string().max(2000),
  type: z.nativeEnum(IncidentType),
  severity: z.nativeEnum(IncidentSeverity),
  status: z.nativeEnum(IncidentStatus),
  affectedPortals: z.array(z.string()).default([]),
  affectedServices: z.array(z.string()).default([]),
  impactedUsers: z.number().nonnegative().optional(),
  assignee: z.string().uuid().optional(),
  team: z.string().uuid().optional(),
  reportedBy: z.string().uuid().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  resolvedAt: z.date().optional().nullable(),
  acknowledgedAt: z.date().optional().nullable(),
  rootCause: z.string().max(1000).optional(),
  resolution: z.string().max(1000).optional(),
  postmortemUrl: z.string().url().optional(),
  tags: z.array(z.string()).default([]),
  timeline: z.array(z.object({
    id: z.string().uuid(),
    timestamp: z.date(),
    action: z.string(),
    description: z.string(),
    performedBy: z.string().uuid()
  })).default([]),
  metrics: z.object({
    mttr: z.number().optional(),
    mtbf: z.number().optional(),
    impactDuration: z.number().optional(),
    severityChanges: z.number().default(0)
  }).optional(),
  notifications: z.object({
    emailSent: z.boolean(),
    slackSent: z.boolean(),
    smsSent: z.boolean(),
    teamsNotified: z.array(z.string())
  }).optional(),
  relatedIncidents: z.array(z.string()).default([]),
  isPublic: z.boolean().default(false),
  createdBy: z.string().uuid(),
  updatedBy: z.string().uuid()
});

/**
 * TypeScript interface for Incident
 * @interface Incident
 * @description Represents a system incident with tracking and resolution details
 */
export interface Incident extends z.infer<typeof IncidentSchema> {}

/**
 * Incident creation input schema
 */
export const CreateIncidentSchema = IncidentSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  resolvedAt: true,
  acknowledgedAt: true,
  timeline: true,
  metrics: true,
  createdBy: true,
  updatedBy: true
}).partial({
  affectedPortals: true,
  affectedServices: true,
  assignee: true,
  team: true,
  reportedBy: true,
  notifications: true,
  relatedIncidents: true,
  isPublic: true
});

export type CreateIncidentInput = z.infer<typeof CreateIncidentSchema>;

/**
 * Incident update input schema
 */
export const UpdateIncidentSchema = IncidentSchema.partial().omit({
  id: true,
  createdAt: true,
  createdBy: true,
  timeline: true
});

export type UpdateIncidentInput = z.infer<typeof UpdateIncidentSchema>;

/**
 * Incident timeline entry
 */
export const IncidentTimelineEntrySchema = z.object({
  id: z.string().uuid(),
  incidentId: z.string().uuid(),
  timestamp: z.date(),
  action: z.string().max(500),
  performedBy: z.string().email(),
  details: z.string().max(1000).optional(),
  status: z.nativeEnum(IncidentStatus).optional()
});

export interface IncidentTimelineEntry extends z.infer<typeof IncidentTimelineEntrySchema> {}

/**
 * Incident filter options
 */
export const IncidentFilterSchema = z.object({
  status: z.array(z.nativeEnum(IncidentStatus)).optional(),
  severity: z.array(z.nativeEnum(IncidentSeverity)).optional(),
  type: z.array(z.nativeEnum(IncidentType)).optional(),
  dateRange: z.object({
    from: z.date().optional(),
    to: z.date().optional()
  }).optional(),
  searchTerm: z.string().optional(),
  assignee: z.string().uuid().optional(),
  team: z.string().uuid().optional(),
  affectedPortal: z.string().uuid().optional(),
  tags: z.array(z.string()).optional(),
  isUnresolved: z.boolean().optional(),
  isPublic: z.boolean().optional()
});

export interface IncidentFilter extends z.infer<typeof IncidentFilterSchema> {}

/**
 * Incident statistics
 */
export const IncidentStatsSchema = z.object({
  total: z.number().nonnegative(),
  open: z.number().nonnegative(),
  investigating: z.number().nonnegative(),
  identified: z.number().nonnegative(),
  monitoring: z.number().nonnegative(),
  resolved: z.number().nonnegative(),
  bySeverity: z.record(z.nativeEnum(IncidentSeverity), z.number()),
  byType: z.record(z.nativeEnum(IncidentType), z.number()),
  last24Hours: z.number().nonnegative(),
  last7Days: z.number().nonnegative(),
  averageMTTR: z.number().nonnegative(), // Mean Time To Recovery in minutes
  averageMTBF: z.number().nonnegative() // Mean Time Between Failures in minutes
});

export interface IncidentStats extends z.infer<typeof IncidentStatsSchema> {}

/**
 * Incident notification preferences
 */
export const IncidentNotificationSchema = z.object({
  email: z.boolean().default(true),
  sms: z.boolean().default(false),
  slack: z.boolean().default(true),
  teams: z.boolean().default(false),
  webhook: z.string().url().optional(),
  severityThreshold: z.nativeEnum(IncidentSeverity).default(IncidentSeverity.WARNING)
});

export interface IncidentNotification extends z.infer<typeof IncidentNotificationSchema> {}