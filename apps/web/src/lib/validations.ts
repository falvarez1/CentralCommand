import { z } from 'zod'

// Portal validation schemas
export const portalSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, 'Name is required').max(100),
  url: z.string().url('Invalid URL'),
  category: z.string().min(1, 'Category is required'),
  status: z.enum(['operational', 'degraded', 'maintenance', 'outage']),
  responseTime: z.number().min(0),
  uptime: z.number().min(0).max(100),
  cpu: z.number().min(0).max(100),
  memory: z.number().min(0).max(100),
  requests: z.number().min(0),
  errors: z.number().min(0),
  favorite: z.boolean().optional(),
  description: z.string().optional(),
  lastChecked: z.date(),
})

export const createPortalSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  url: z.string().url('Invalid URL'),
  category: z.string().min(1, 'Category is required'),
  description: z.string().optional(),
})

// Incident validation schemas
export const incidentSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().min(1, 'Description is required'),
  severity: z.enum(['critical', 'major', 'minor', 'info']),
  status: z.enum(['active', 'investigating', 'resolved']),
  affectedServices: z.array(z.string()),
  createdAt: z.date(),
  updatedAt: z.date(),
  resolvedAt: z.date().optional(),
})

export const createIncidentSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().min(1, 'Description is required'),
  severity: z.enum(['critical', 'major', 'minor', 'info']),
  affectedServices: z.array(z.string()).min(1, 'At least one affected service is required'),
})

// User validation schemas
export const userSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Invalid email address'),
  role: z.enum(['admin', 'user', 'viewer']),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export const registerSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

// Settings validation schemas
export const settingsSchema = z.object({
  theme: z.enum(['light', 'dark']),
  viewMode: z.enum(['grid', 'list']),
  notifications: z.object({
    email: z.boolean(),
    push: z.boolean(),
    sound: z.boolean(),
  }),
  autoRefreshInterval: z.number().min(10).max(3600), // seconds
})

// Type exports
export type Portal = z.infer<typeof portalSchema>
export type CreatePortal = z.infer<typeof createPortalSchema>
export type Incident = z.infer<typeof incidentSchema>
export type CreateIncident = z.infer<typeof createIncidentSchema>
export type User = z.infer<typeof userSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type Settings = z.infer<typeof settingsSchema>