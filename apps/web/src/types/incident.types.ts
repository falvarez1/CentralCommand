import { z } from 'zod';

/**
 * Incident severity levels - matches backend IncidentSeverity
 */
export enum IncidentSeverity {
  Critical = 'Critical',
  High = 'High',
  Medium = 'Medium',
  Low = 'Low'
}

/**
 * Incident types - matches backend IncidentType
 */
export enum IncidentType {
  Outage = 'Outage',
  Performance = 'Performance',
  Maintenance = 'Maintenance',
  Security = 'Security',
  Database = 'Database',
  Service = 'Service',
  Infrastructure = 'Infrastructure',
  Network = 'Network',
  Configuration = 'Configuration'
}

/**
 * Incident resolution status - matches backend IncidentStatus
 */
export enum IncidentStatus {
  Open = 'Open',
  InProgress = 'InProgress',
  Resolved = 'Resolved',
  Closed = 'Closed',
  Acknowledged = 'Acknowledged'
}

/**
 * Incident priority levels - matches backend IncidentPriority
 */
export enum IncidentPriority {
  Critical = 'Critical',
  High = 'High',
  Medium = 'Medium',
  Low = 'Low'
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
  impactedUsers: z.number().nonnegative().optional().nullable(),
  assignee: z.string().uuid().optional().nullable(),
  team: z.string().uuid().optional().nullable(),
  reportedBy: z.string().uuid().optional().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  resolvedAt: z.date().optional().nullable(),
  acknowledgedAt: z.date().optional().nullable(),
  closedAt: z.date().optional().nullable(),
  rootCause: z.string().max(1000).optional().nullable(),
  resolution: z.string().max(1000).optional().nullable(),
  postmortemUrl: z.string().url().optional().nullable(),
  tags: z.array(z.string()).default([]),
  timeline: z.array(z.object({
    id: z.string().uuid(),
    timestamp: z.date(),
    eventType: z.string(),
    description: z.string(),
    userId: z.string().uuid().optional().nullable(),
    metadata: z.record(z.any()).optional()
  })).default([]),
  metrics: z.object({
    mttr: z.number().optional().nullable(),
    mtbf: z.number().optional().nullable(),
    impactDuration: z.number().optional().nullable(),
    severityChanges: z.number().default(0)
  }).optional().nullable(),
  notifications: z.object({
    emailSent: z.boolean(),
    slackSent: z.boolean(),
    smsSent: z.boolean(),
    teamsNotified: z.array(z.string()).default([])
  }).optional().nullable(),
  relatedIncidents: z.array(z.string()).default([]),
  isPublic: z.boolean().default(false),
  createdBy: z.string().uuid(),
  updatedBy: z.string().uuid(),
  eTag: z.string().optional(),
  commentCount: z.number().nonnegative().default(0),
  priority: z.nativeEnum(IncidentPriority).optional().nullable(),
  comments: z.array(z.object({
    id: z.string().uuid(),
    incidentId: z.string().uuid(),
    text: z.string(),
    isSystemGenerated: z.boolean(),
    isInternal: z.boolean(),
    attachments: z.array(z.string()).default([]),
    createdAt: z.date(),
    createdBy: z.string().uuid(),
    authorId: z.string().uuid(),
    authorName: z.string()
  })).optional()
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
 * Incident timeline entry - matches backend TimelineEntry
 */
export const IncidentTimelineEntrySchema = z.object({
  id: z.string().uuid(),
  incidentId: z.string().uuid(),
  timestamp: z.date(),
  eventType: z.string(),
  description: z.string(),
  userId: z.string().uuid().optional().nullable(),
  metadata: z.record(z.any()).optional()
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
 * Comment schema - matches backend CommentResponse
 */
export const CommentSchema = z.object({
  id: z.string().uuid(),
  incidentId: z.string().uuid(),
  text: z.string(),
  isSystemGenerated: z.boolean(),
  isInternal: z.boolean(),
  attachments: z.array(z.string()).default([]),
  createdAt: z.date(),
  createdBy: z.string().uuid(),
  authorId: z.string().uuid(),
  authorName: z.string()
});

export interface Comment extends z.infer<typeof CommentSchema> {}

/**
 * Incident summary for list views - matches backend IncidentSummaryResponse
 */
export const IncidentSummarySchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  type: z.nativeEnum(IncidentType),
  severity: z.nativeEnum(IncidentSeverity),
  status: z.nativeEnum(IncidentStatus),
  affectedPortalCount: z.number().nonnegative(),
  impactedUsers: z.number().nonnegative().optional().nullable(),
  assignee: z.string().uuid().optional().nullable(),
  createdAt: z.date(),
  acknowledgedAt: z.date().optional().nullable(),
  resolvedAt: z.date().optional().nullable(),
  mttr: z.number().optional().nullable()
});

export interface IncidentSummary extends z.infer<typeof IncidentSummarySchema> {}

/**
 * Incident notification preferences
 */
export const IncidentNotificationSchema = z.object({
  email: z.boolean().default(true),
  sms: z.boolean().default(false),
  slack: z.boolean().default(true),
  teams: z.boolean().default(false),
  webhook: z.string().url().optional(),
  severityThreshold: z.nativeEnum(IncidentSeverity).default(IncidentSeverity.Medium)
});

export interface IncidentNotification extends z.infer<typeof IncidentNotificationSchema> {}