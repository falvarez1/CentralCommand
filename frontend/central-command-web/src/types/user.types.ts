import { z } from 'zod';

/**
 * User roles in the system
 */
export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  MANAGER = 'manager',
  DEVELOPER = 'developer',
  ANALYST = 'analyst',
  VIEWER = 'viewer',
  GUEST = 'guest'
}

/**
 * User status
 */
export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  PENDING = 'pending',
  DELETED = 'deleted'
}

/**
 * Authentication provider types
 */
export enum AuthProvider {
  LOCAL = 'local',
  GOOGLE = 'google',
  MICROSOFT = 'microsoft',
  GITHUB = 'github',
  OKTA = 'okta',
  AUTH0 = 'auth0',
  SAML = 'saml',
  LDAP = 'ldap'
}

/**
 * Activity types for tracking
 */
export enum ActivityType {
  LOGIN = 'login',
  LOGOUT = 'logout',
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  VIEW = 'view',
  EXPORT = 'export',
  IMPORT = 'import',
  SHARE = 'share',
  COMMENT = 'comment',
  DEPLOYMENT = 'deployment',
  CONFIG_CHANGE = 'config_change',
  INCIDENT_CREATED = 'incident_created',
  INCIDENT_RESOLVED = 'incident_resolved',
  ALERT_CREATED = 'alert_created',
  ALERT_RESOLVED = 'alert_resolved',
  MAINTENANCE_SCHEDULED = 'maintenance_scheduled',
  HEALTH_CHECK = 'health_check'
}

/**
 * Zod schema for User
 */
export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  username: z.string().min(3).max(50),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  displayName: z.string().min(1).max(200).optional(),
  avatar: z.string().url().optional(),

  // Authentication
  role: z.nativeEnum(UserRole),
  status: z.nativeEnum(UserStatus),
  authProvider: z.nativeEnum(AuthProvider).default(AuthProvider.LOCAL),
  externalId: z.string().optional(), // ID from external auth provider

  // Organization
  department: z.string().max(100).optional(),
  jobTitle: z.string().max(100).optional(),
  teamId: z.string().uuid().optional(),
  managerId: z.string().uuid().optional(),

  // Contact
  phone: z.string().optional(),
  timezone: z.string().default('UTC'),
  language: z.string().default('en'),
  country: z.string().optional(),

  // Preferences
  preferences: z.object({
    theme: z.enum(['light', 'dark', 'auto']).default('auto'),
    emailNotifications: z.boolean().default(true),
    pushNotifications: z.boolean().default(true),
    twoFactorEnabled: z.boolean().default(false),
    defaultView: z.enum(['grid', 'list', 'dashboard']).default('dashboard'),
    compactMode: z.boolean().default(false),
    showTutorials: z.boolean().default(true)
  }).default({}),

  // Metadata
  createdAt: z.date(),
  updatedAt: z.date(),
  lastLoginAt: z.date().optional(),
  lastActivityAt: z.date().optional(),
  loginCount: z.number().nonnegative().default(0),

  // Permissions
  permissions: z.array(z.string()).default([]),
  restrictedPortals: z.array(z.string().uuid()).default([]), // Portal IDs user cannot access

  // API access
  apiKey: z.string().optional(),
  apiKeyCreatedAt: z.date().optional(),
  rateLimitTier: z.enum(['basic', 'standard', 'premium', 'unlimited']).default('standard')
});

/**
 * TypeScript interface for User
 * @interface User
 * @description Represents a user in the system with authentication and preferences
 */
export interface User extends z.infer<typeof UserSchema> {}

/**
 * User creation input
 */
export const CreateUserSchema = UserSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastLoginAt: true,
  lastActivityAt: true,
  loginCount: true,
  apiKey: true,
  apiKeyCreatedAt: true
});

export type CreateUserInput = z.infer<typeof CreateUserSchema>;

/**
 * User update input
 */
export const UpdateUserSchema = UserSchema.partial().omit({
  id: true,
  email: true, // Email changes require verification
  createdAt: true,
  updatedAt: true
});

export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;

/**
 * Team/Group schema
 */
export const TeamSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  leaderId: z.string().uuid(),
  memberIds: z.array(z.string().uuid()).default([]),
  parentTeamId: z.string().uuid().optional(), // For hierarchical teams

  // Team settings
  settings: z.object({
    isPrivate: z.boolean().default(false),
    allowGuestAccess: z.boolean().default(false),
    autoAddNewMembers: z.boolean().default(false),
    defaultRole: z.nativeEnum(UserRole).default(UserRole.VIEWER)
  }).default({}),

  // Team permissions
  permissions: z.array(z.string()).default([]),
  accessiblePortals: z.array(z.string().uuid()).default([]),

  // Metadata
  createdAt: z.date(),
  updatedAt: z.date(),
  active: z.boolean().default(true),
  tags: z.array(z.string()).default([])
});

export interface Team extends z.infer<typeof TeamSchema> {}

/**
 * Team activity tracking
 */
export const TeamActivitySchema = z.object({
  id: z.string().uuid(),
  teamId: z.string().uuid(),
  userId: z.string().uuid(),
  activityType: z.nativeEnum(ActivityType),
  description: z.string().max(500),
  entityType: z.string().optional(),
  entityId: z.string().optional(),
  timestamp: z.date(),
  metadata: z.record(z.any()).optional(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional()
});

/**
 * TypeScript interface for TeamActivity
 * @interface TeamActivity
 * @description Tracks team member activities for audit and analytics
 */
export interface TeamActivity extends z.infer<typeof TeamActivitySchema> {}

/**
 * User session information
 */
export const UserSessionSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  token: z.string(),
  refreshToken: z.string().optional(),

  // Session details
  ipAddress: z.string(),
  userAgent: z.string(),
  device: z.object({
    type: z.enum(['desktop', 'mobile', 'tablet']).optional(),
    os: z.string().optional(),
    browser: z.string().optional()
  }).optional(),

  // Timing
  createdAt: z.date(),
  lastActivityAt: z.date(),
  expiresAt: z.date(),

  // Security
  isActive: z.boolean().default(true),
  revokedAt: z.date().optional(),
  revokedReason: z.string().optional()
});

export interface UserSession extends z.infer<typeof UserSessionSchema> {}

/**
 * Permission definition
 */
export const PermissionSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  category: z.enum(['portal', 'incident', 'user', 'system', 'data']),
  resource: z.string(),
  actions: z.array(z.enum(['create', 'read', 'update', 'delete', 'execute'])),
  conditions: z.record(z.any()).optional()
});

export interface Permission extends z.infer<typeof PermissionSchema> {}

/**
 * Role-based access control (RBAC) mapping
 */
export const RolePermissionSchema = z.object({
  role: z.nativeEnum(UserRole),
  permissions: z.array(PermissionSchema),
  inheritFrom: z.nativeEnum(UserRole).optional()
});

export interface RolePermission extends z.infer<typeof RolePermissionSchema> {}

/**
 * User audit log entry
 */
export const UserAuditLogSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  action: z.string(),
  entityType: z.string(),
  entityId: z.string().optional(),
  changes: z.object({
    before: z.record(z.any()).optional(),
    after: z.record(z.any()).optional()
  }).optional(),
  timestamp: z.date(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
  success: z.boolean(),
  errorMessage: z.string().optional()
});

export interface UserAuditLog extends z.infer<typeof UserAuditLogSchema> {}

/**
 * User statistics
 */
export const UserStatsSchema = z.object({
  totalUsers: z.number().nonnegative(),
  activeUsers: z.number().nonnegative(),
  newUsersToday: z.number().nonnegative(),
  newUsersThisWeek: z.number().nonnegative(),
  newUsersThisMonth: z.number().nonnegative(),

  byRole: z.record(z.nativeEnum(UserRole), z.number().nonnegative()),
  byStatus: z.record(z.nativeEnum(UserStatus), z.number().nonnegative()),
  byAuthProvider: z.record(z.nativeEnum(AuthProvider), z.number().nonnegative()),

  activeSessions: z.number().nonnegative(),
  averageSessionDuration: z.number().nonnegative(), // in minutes
  loginRate: z.number().min(0).max(100),

  topActiveUsers: z.array(z.object({
    userId: z.string().uuid(),
    activityCount: z.number().nonnegative()
  })),

  lastUpdated: z.date()
});

export interface UserStats extends z.infer<typeof UserStatsSchema> {}