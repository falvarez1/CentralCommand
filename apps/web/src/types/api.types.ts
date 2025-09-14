import { z } from 'zod';

/**
 * HTTP methods
 */
export enum HttpMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  PATCH = 'PATCH',
  DELETE = 'DELETE',
  HEAD = 'HEAD',
  OPTIONS = 'OPTIONS'
}

/**
 * API response status
 */
export enum ApiStatus {
  SUCCESS = 'success',
  ERROR = 'error',
  PENDING = 'pending',
  CANCELLED = 'cancelled'
}

/**
 * Error severity levels
 */
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

/**
 * Error codes for standardized error handling
 */
export enum ErrorCode {
  // Authentication errors (1xxx)
  UNAUTHORIZED = 1001,
  FORBIDDEN = 1002,
  TOKEN_EXPIRED = 1003,
  INVALID_CREDENTIALS = 1004,
  MFA_REQUIRED = 1005,

  // Validation errors (2xxx)
  VALIDATION_ERROR = 2001,
  INVALID_INPUT = 2002,
  MISSING_REQUIRED_FIELD = 2003,
  INVALID_FORMAT = 2004,
  VALUE_OUT_OF_RANGE = 2005,

  // Resource errors (3xxx)
  NOT_FOUND = 3001,
  ALREADY_EXISTS = 3002,
  CONFLICT = 3003,
  GONE = 3004,
  LOCKED = 3005,

  // Rate limiting (4xxx)
  RATE_LIMITED = 4001,
  QUOTA_EXCEEDED = 4002,

  // Server errors (5xxx)
  INTERNAL_ERROR = 5001,
  SERVICE_UNAVAILABLE = 5002,
  TIMEOUT = 5003,
  DEPENDENCY_FAILURE = 5004,
  DATABASE_ERROR = 5005,

  // Business logic errors (6xxx)
  BUSINESS_RULE_VIOLATION = 6001,
  INSUFFICIENT_PERMISSIONS = 6002,
  OPERATION_NOT_ALLOWED = 6003,
  PRECONDITION_FAILED = 6004
}

/**
 * Base API response schema
 */
export const ApiResponseSchema = <T extends z.ZodType>(dataSchema: T) =>
  z.object({
    status: z.nativeEnum(ApiStatus),
    data: dataSchema.optional(),
    error: z.object({
      code: z.nativeEnum(ErrorCode),
      message: z.string(),
      details: z.record(z.any()).optional(),
      severity: z.nativeEnum(ErrorSeverity).optional(),
      timestamp: z.date(),
      traceId: z.string().uuid().optional()
    }).optional(),
    metadata: z.object({
      timestamp: z.date(),
      requestId: z.string().uuid(),
      version: z.string().optional(),
      deprecation: z.object({
        isDeprecated: z.boolean(),
        message: z.string().optional(),
        sunsetDate: z.date().optional()
      }).optional()
    }).optional()
  });

/**
 * Generic API response type
 */
export type ApiResponse<T> = {
  status: ApiStatus;
  data?: T;
  error?: ApiError;
  metadata?: ApiMetadata;
};

/**
 * API error structure
 */
export const ApiErrorSchema = z.object({
  code: z.nativeEnum(ErrorCode),
  message: z.string(),
  details: z.record(z.any()).optional(),
  severity: z.nativeEnum(ErrorSeverity).default(ErrorSeverity.MEDIUM),
  timestamp: z.date(),
  traceId: z.string().uuid().optional(),
  stack: z.string().optional(), // Only in development
  retryable: z.boolean().default(false),
  retryAfter: z.number().optional() // Seconds to wait before retry
});

/**
 * TypeScript interface for ApiError
 * @interface ApiError
 * @description Standardized error response structure
 */
export interface ApiError extends z.infer<typeof ApiErrorSchema> {}

/**
 * API metadata
 */
export const ApiMetadataSchema = z.object({
  timestamp: z.date(),
  requestId: z.string().uuid(),
  version: z.string().optional(),
  deprecation: z.object({
    isDeprecated: z.boolean(),
    message: z.string().optional(),
    sunsetDate: z.date().optional()
  }).optional(),
  rateLimit: z.object({
    limit: z.number().positive(),
    remaining: z.number().nonnegative(),
    reset: z.date()
  }).optional(),
  cache: z.object({
    hit: z.boolean(),
    ttl: z.number().optional(),
    key: z.string().optional()
  }).optional()
});

export interface ApiMetadata extends z.infer<typeof ApiMetadataSchema> {}

/**
 * Pagination request parameters
 */
export const PaginationRequestSchema = z.object({
  page: z.number().positive().default(1),
  pageSize: z.number().positive().max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
  cursor: z.string().optional() // For cursor-based pagination
});

export interface PaginationRequest extends z.infer<typeof PaginationRequestSchema> {}

/**
 * Pagination response metadata
 */
export const PaginationResponseSchema = z.object({
  page: z.number().positive(),
  pageSize: z.number().positive(),
  totalPages: z.number().nonnegative(),
  totalItems: z.number().nonnegative(),
  hasNext: z.boolean(),
  hasPrevious: z.boolean(),
  nextCursor: z.string().optional(),
  previousCursor: z.string().optional()
});

export interface PaginationResponse extends z.infer<typeof PaginationResponseSchema> {}

/**
 * Paginated API response
 */
export const PaginatedResponseSchema = <T extends z.ZodType>(itemSchema: T) =>
  z.object({
    items: z.array(itemSchema),
    pagination: PaginationResponseSchema,
    metadata: ApiMetadataSchema.optional()
  });

export type PaginatedResponse<T> = {
  items: T[];
  pagination: PaginationResponse;
  metadata?: ApiMetadata;
};

/**
 * Batch operation request
 */
export const BatchRequestSchema = <T extends z.ZodType>(operationSchema: T) =>
  z.object({
    operations: z.array(z.object({
      id: z.string(),
      method: z.nativeEnum(HttpMethod),
      path: z.string(),
      body: operationSchema.optional(),
      headers: z.record(z.string()).optional()
    })).min(1).max(100),
    parallel: z.boolean().default(false),
    stopOnError: z.boolean().default(false)
  });

/**
 * Batch operation response
 */
export const BatchResponseSchema = <T extends z.ZodType>(resultSchema: T) =>
  z.object({
    results: z.array(z.object({
      id: z.string(),
      status: z.number(),
      data: resultSchema.optional(),
      error: ApiErrorSchema.optional()
    })),
    succeeded: z.number().nonnegative(),
    failed: z.number().nonnegative(),
    duration: z.number().nonnegative() // in milliseconds
  });

/**
 * File upload request
 */
export const FileUploadRequestSchema = z.object({
  file: z.instanceof(File),
  fileName: z.string().optional(),
  mimeType: z.string().optional(),
  maxSize: z.number().positive().optional(), // in bytes
  allowedTypes: z.array(z.string()).optional(),
  metadata: z.record(z.any()).optional()
});

export interface FileUploadRequest extends Omit<z.infer<typeof FileUploadRequestSchema>, 'file'> {
  file: File;
}

/**
 * File upload response
 */
export const FileUploadResponseSchema = z.object({
  fileId: z.string().uuid(),
  fileName: z.string(),
  fileSize: z.number().nonnegative(),
  mimeType: z.string(),
  url: z.string().url(),
  thumbnailUrl: z.string().url().optional(),
  uploadedAt: z.date(),
  expiresAt: z.date().optional()
});

export interface FileUploadResponse extends z.infer<typeof FileUploadResponseSchema> {}

/**
 * WebSocket message types
 */
export enum WebSocketMessageType {
  CONNECT = 'connect',
  DISCONNECT = 'disconnect',
  SUBSCRIBE = 'subscribe',
  UNSUBSCRIBE = 'unsubscribe',
  MESSAGE = 'message',
  ERROR = 'error',
  PING = 'ping',
  PONG = 'pong'
}

/**
 * WebSocket message schema
 */
export const WebSocketMessageSchema = z.object({
  type: z.nativeEnum(WebSocketMessageType),
  channel: z.string().optional(),
  payload: z.any(),
  timestamp: z.date(),
  messageId: z.string().uuid()
});

export interface WebSocketMessage extends z.infer<typeof WebSocketMessageSchema> {}

/**
 * API request configuration
 */
export const ApiRequestConfigSchema = z.object({
  method: z.nativeEnum(HttpMethod),
  url: z.string(),
  headers: z.record(z.string()).optional(),
  params: z.record(z.any()).optional(),
  data: z.any().optional(),
  timeout: z.number().positive().optional(), // in milliseconds
  retries: z.number().nonnegative().default(0),
  retryDelay: z.number().nonnegative().default(1000), // in milliseconds
  cache: z.object({
    enabled: z.boolean().default(false),
    ttl: z.number().positive().optional(), // in seconds
    key: z.string().optional()
  }).optional(),
  authentication: z.object({
    type: z.enum(['bearer', 'basic', 'apikey', 'oauth2']),
    token: z.string().optional(),
    username: z.string().optional(),
    password: z.string().optional(),
    apiKey: z.string().optional()
  }).optional()
});

export interface ApiRequestConfig extends z.infer<typeof ApiRequestConfigSchema> {}

/**
 * API health check response
 */
export const ApiHealthCheckSchema = z.object({
  status: z.enum(['healthy', 'degraded', 'unhealthy']),
  version: z.string(),
  uptime: z.number().nonnegative(), // in seconds
  timestamp: z.date(),
  services: z.array(z.object({
    name: z.string(),
    status: z.enum(['up', 'down', 'degraded']),
    responseTime: z.number().nonnegative().optional(),
    lastCheck: z.date().optional(),
    message: z.string().optional()
  })),
  metrics: z.object({
    requestsPerSecond: z.number().nonnegative(),
    averageResponseTime: z.number().nonnegative(),
    errorRate: z.number().min(0).max(100),
    activeConnections: z.number().nonnegative()
  }).optional()
});

export interface ApiHealthCheck extends z.infer<typeof ApiHealthCheckSchema> {}

/**
 * Type-safe API client interface
 */
export interface ApiClient {
  get<T>(path: string, config?: Partial<ApiRequestConfig>): Promise<ApiResponse<T>>;
  post<T>(path: string, data?: any, config?: Partial<ApiRequestConfig>): Promise<ApiResponse<T>>;
  put<T>(path: string, data?: any, config?: Partial<ApiRequestConfig>): Promise<ApiResponse<T>>;
  patch<T>(path: string, data?: any, config?: Partial<ApiRequestConfig>): Promise<ApiResponse<T>>;
  delete<T>(path: string, config?: Partial<ApiRequestConfig>): Promise<ApiResponse<T>>;
}