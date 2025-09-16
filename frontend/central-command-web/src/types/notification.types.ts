import { z } from 'zod';

/**
 * Notification types
 */
export enum NotificationType {
  SUCCESS = 'success',
  WARNING = 'warning',
  ERROR = 'error',
  INFO = 'info'
}

/**
 * Notification priority levels
 */
export enum NotificationPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

/**
 * Notification delivery channels
 */
export enum NotificationChannel {
  IN_APP = 'inApp',
  EMAIL = 'email',
  SMS = 'sms',
  SLACK = 'slack',
  TEAMS = 'teams',
  WEBHOOK = 'webhook',
  PUSH = 'push'
}

/**
 * Notification action types
 */
export enum NotificationActionType {
  LINK = 'link',
  BUTTON = 'button',
  DISMISS = 'dismiss',
  CALLBACK = 'callback'
}

/**
 * Zod schema for notification action
 */
export const NotificationActionSchema = z.object({
  type: z.nativeEnum(NotificationActionType),
  label: z.string().min(1).max(50),
  url: z.string().url().optional(),
  callback: z.string().optional(), // Function name to call
  style: z.enum(['primary', 'secondary', 'danger']).optional(),
  icon: z.string().optional()
});

export interface AppNotificationAction extends z.infer<typeof NotificationActionSchema> {}

/**
 * Zod schema for Notification
 */
export const NotificationSchema = z.object({
  id: z.string().uuid(),
  type: z.nativeEnum(NotificationType),
  title: z.string().min(1).max(100),
  message: z.string().min(1).max(500),
  priority: z.nativeEnum(NotificationPriority).default(NotificationPriority.MEDIUM),
  timestamp: z.date(),
  read: z.boolean().default(false),
  dismissed: z.boolean().default(false),

  // Source information
  source: z.string().optional(),
  sourceId: z.string().optional(),
  category: z.string().optional(),

  // Delivery settings
  channels: z.array(z.nativeEnum(NotificationChannel)).default([NotificationChannel.IN_APP]),
  persistent: z.boolean().default(false),
  autoClose: z.boolean().default(true),
  autoCloseDelay: z.number().positive().default(5000), // in milliseconds

  // Actions
  actions: z.array(NotificationActionSchema).default([]),

  // Additional metadata
  metadata: z.record(z.any()).optional(),
  tags: z.array(z.string()).default([]),

  // User targeting
  userId: z.string().uuid().optional(),
  groupId: z.string().uuid().optional(),
  broadcast: z.boolean().default(false)
});

/**
 * TypeScript interface for Notification
 * @interface Notification
 * @description Represents a system notification with delivery options
 */
export interface AppNotification extends z.infer<typeof NotificationSchema> {}

/**
 * Notification creation input
 */
export const CreateNotificationSchema = NotificationSchema.omit({
  id: true,
  timestamp: true,
  read: true,
  dismissed: true
});

export type CreateNotificationInput = z.infer<typeof CreateNotificationSchema>;

/**
 * Toast notification (simplified for UI display)
 */
export const ToastNotificationSchema = z.object({
  id: z.string(),
  type: z.nativeEnum(NotificationType),
  title: z.string().min(1).max(100),
  message: z.string().min(1).max(200).optional(),
  duration: z.number().positive().default(5000),
  position: z.enum(['top-left', 'top-center', 'top-right', 'bottom-left', 'bottom-center', 'bottom-right']).default('top-right'),
  showProgress: z.boolean().default(false),
  closable: z.boolean().default(true),
  action: NotificationActionSchema.optional()
});

export interface ToastNotification extends z.infer<typeof ToastNotificationSchema> {}

/**
 * Notification preferences for a user
 */
export const NotificationPreferencesSchema = z.object({
  userId: z.string().uuid(),

  // Channel preferences
  channels: z.object({
    inApp: z.boolean().default(true),
    email: z.boolean().default(true),
    sms: z.boolean().default(false),
    slack: z.boolean().default(false),
    teams: z.boolean().default(false),
    push: z.boolean().default(true)
  }),

  // Type preferences
  types: z.object({
    success: z.boolean().default(true),
    warning: z.boolean().default(true),
    error: z.boolean().default(true),
    info: z.boolean().default(true)
  }),

  // Category preferences
  categories: z.record(z.boolean()).default({}),

  // Timing preferences
  quietHours: z.object({
    enabled: z.boolean().default(false),
    start: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/), // HH:MM format
    end: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
    timezone: z.string().default('UTC')
  }).optional(),

  // Priority thresholds
  minimumPriority: z.nativeEnum(NotificationPriority).default(NotificationPriority.LOW),

  // Batching preferences
  batching: z.object({
    enabled: z.boolean().default(false),
    interval: z.number().positive().default(3600000), // in milliseconds (1 hour)
    maxBatchSize: z.number().positive().default(10)
  }).optional(),

  // Contact information
  email: z.string().email().optional(),
  phone: z.string().optional(),
  slackUserId: z.string().optional(),
  teamsUserId: z.string().optional()
});

export interface AppNotificationPreferences extends z.infer<typeof NotificationPreferencesSchema> {}

/**
 * Notification filter options
 */
export const NotificationFilterSchema = z.object({
  type: z.nativeEnum(NotificationType).optional(),
  priority: z.nativeEnum(NotificationPriority).optional(),
  read: z.boolean().optional(),
  dismissed: z.boolean().optional(),
  category: z.string().optional(),
  source: z.string().optional(),
  dateFrom: z.date().optional(),
  dateTo: z.date().optional(),
  userId: z.string().uuid().optional(),
  searchTerm: z.string().optional()
});

export interface AppNotificationFilter extends z.infer<typeof NotificationFilterSchema> {}

/**
 * Notification statistics
 */
export const NotificationStatsSchema = z.object({
  total: z.number().nonnegative(),
  unread: z.number().nonnegative(),
  byType: z.object({
    success: z.number().nonnegative(),
    warning: z.number().nonnegative(),
    error: z.number().nonnegative(),
    info: z.number().nonnegative()
  }),
  byPriority: z.object({
    low: z.number().nonnegative(),
    medium: z.number().nonnegative(),
    high: z.number().nonnegative(),
    urgent: z.number().nonnegative()
  }),
  byChannel: z.record(z.nativeEnum(NotificationChannel), z.number().nonnegative()),
  deliveryRate: z.number().min(0).max(100),
  readRate: z.number().min(0).max(100),
  actionRate: z.number().min(0).max(100)
});

export interface AppNotificationStats extends z.infer<typeof NotificationStatsSchema> {}

/**
 * Notification template for reusable notifications
 */
export const NotificationTemplateSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  type: z.nativeEnum(NotificationType),
  titleTemplate: z.string().min(1).max(200),
  messageTemplate: z.string().min(1).max(1000),
  priority: z.nativeEnum(NotificationPriority),
  channels: z.array(z.nativeEnum(NotificationChannel)),
  actions: z.array(NotificationActionSchema).default([]),
  variables: z.array(z.object({
    name: z.string(),
    type: z.enum(['string', 'number', 'boolean', 'date']),
    required: z.boolean().default(true),
    defaultValue: z.any().optional()
  })).default([]),
  active: z.boolean().default(true)
});

export interface AppNotificationTemplate extends z.infer<typeof NotificationTemplateSchema> {}