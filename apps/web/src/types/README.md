# TypeScript Type Definitions

This directory contains comprehensive TypeScript type definitions and Zod validation schemas for the Central Command application.

## Structure

### Core Type Files

#### `portal.types.ts`
- **Portal**: Main portal entity with monitoring metrics
- **PortalStatus**: Operational states (operational, degraded, maintenance, outage)
- **PortalEnvironment**: Deployment environments
- **PortalPriority**: Priority levels for portals
- **AuthType**: Authentication methods
- **PortalFilter**: Filtering options for portal queries
- **PortalStats**: Aggregated portal statistics

#### `incident.types.ts`
- **Incident**: System incident tracking
- **IncidentSeverity**: Severity levels (critical, warning, info, success)
- **IncidentType**: Types of incidents (outage, performance, maintenance, security)
- **IncidentStatus**: Resolution status tracking
- **IncidentTimelineEntry**: Audit trail for incident updates
- **IncidentStats**: Aggregated incident metrics

#### `stats.types.ts`
- **SystemStats**: Dashboard-level system statistics
- **MetricData**: Time-series metric data points
- **TimeRange**: Predefined time ranges (1H, 24H, 7D, 30D)
- **MetricType**: Types of metrics (response time, uptime, CPU, memory, etc.)
- **DashboardWidget**: Widget configuration for dashboards
- **HealthCheckResult**: Health check response structure

#### `command.types.ts`
- **Command**: Command palette command definitions
- **CommandAction**: Different action types for commands
- **KeyboardShortcut**: Keyboard shortcut mappings
- **CommandCategory**: Command grouping categories
- **CommandResult**: Command execution results
- **DEFAULT_SHORTCUTS**: Predefined keyboard shortcuts

#### `notification.types.ts`
- **Notification**: Full notification entity
- **ToastNotification**: Simplified UI toast notifications
- **NotificationType**: Notification severity levels
- **NotificationChannel**: Delivery channels (email, SMS, Slack, etc.)
- **NotificationPreferences**: User notification settings
- **NotificationTemplate**: Reusable notification templates

#### `user.types.ts`
- **User**: User account entity
- **UserRole**: Role-based access control roles
- **Team**: Team/group organization
- **TeamActivity**: Activity tracking for teams
- **UserSession**: Session management
- **Permission**: Granular permission definitions
- **UserAuditLog**: Audit trail for user actions

#### `api.types.ts`
- **ApiResponse**: Standardized API response wrapper
- **ApiError**: Error response structure with error codes
- **PaginatedResponse**: Pagination wrapper for lists
- **BatchRequest/Response**: Batch operation structures
- **WebSocketMessage**: Real-time messaging format
- **ApiHealthCheck**: Health check response format

## Usage Examples

### Basic Type Usage
```typescript
import { Portal, PortalStatus, PortalSchema } from '@/types';

// TypeScript type checking
const portal: Portal = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  name: 'Analytics Dashboard',
  url: 'https://analytics.internal',
  status: PortalStatus.OPERATIONAL,
  // ... other fields
};

// Runtime validation with Zod
const validatedPortal = PortalSchema.parse(portalData);
```

### Creating New Entities
```typescript
import { CreatePortalInput, CreatePortalSchema } from '@/types';

const newPortal: CreatePortalInput = {
  name: 'New Portal',
  url: 'https://new.portal.internal',
  category: 'analytics',
  // id, timestamps, and metrics are auto-generated
};

// Validate before sending to API
const validated = CreatePortalSchema.parse(newPortal);
```

### API Response Handling
```typescript
import { ApiResponse, Portal, ApiError, ErrorCode } from '@/types';

async function fetchPortals(): Promise<ApiResponse<Portal[]>> {
  try {
    const response = await api.get<Portal[]>('/portals');
    return response;
  } catch (error) {
    return {
      status: ApiStatus.ERROR,
      error: {
        code: ErrorCode.INTERNAL_ERROR,
        message: 'Failed to fetch portals',
        timestamp: new Date()
      }
    };
  }
}
```

### Filtering and Pagination
```typescript
import { PortalFilter, PaginationRequest, PaginatedResponse, Portal } from '@/types';

const filter: PortalFilter = {
  category: 'analytics',
  status: PortalStatus.OPERATIONAL,
  environment: PortalEnvironment.PRODUCTION
};

const pagination: PaginationRequest = {
  page: 1,
  pageSize: 20,
  sortBy: 'name',
  sortOrder: 'asc'
};

const response: PaginatedResponse<Portal> = await api.getPortals(filter, pagination);
```

### Command Palette Integration
```typescript
import { Command, CommandActionType, DEFAULT_SHORTCUTS } from '@/types';

const command: Command = {
  id: 'open-portal',
  name: 'Open Portal',
  category: CommandCategory.PORTAL,
  action: {
    type: CommandActionType.NAVIGATE,
    url: '/portals/123',
    target: '_blank'
  },
  shortcut: DEFAULT_SHORTCUTS.NEW_PORTAL
};
```

## Validation with Zod

All types have corresponding Zod schemas for runtime validation:

```typescript
import { z } from 'zod';
import { PortalSchema, IncidentSchema, UserSchema } from '@/types';

// Parse and validate data
try {
  const portal = PortalSchema.parse(unknownData);
  console.log('Valid portal:', portal);
} catch (error) {
  if (error instanceof z.ZodError) {
    console.error('Validation errors:', error.errors);
  }
}

// Safe parsing without throwing
const result = PortalSchema.safeParse(unknownData);
if (result.success) {
  console.log('Valid portal:', result.data);
} else {
  console.error('Validation errors:', result.error.errors);
}
```

## Type Guards

Use Zod schemas as type guards:

```typescript
function isPortal(data: unknown): data is Portal {
  return PortalSchema.safeParse(data).success;
}

function isIncident(data: unknown): data is Incident {
  return IncidentSchema.safeParse(data).success;
}
```

## Extending Types

Create custom types by extending existing ones:

```typescript
import { Portal, PortalSchema } from '@/types';

// Extend the TypeScript interface
interface ExtendedPortal extends Portal {
  customField: string;
  metrics: {
    custom: number;
  };
}

// Extend the Zod schema
const ExtendedPortalSchema = PortalSchema.extend({
  customField: z.string(),
  metrics: z.object({
    custom: z.number()
  })
});
```

## Best Practices

1. **Always use enums for fixed values** - Ensures type safety and prevents typos
2. **Validate external data** - Use Zod schemas to validate API responses and user input
3. **Prefer interfaces over types** - For better error messages and declaration merging
4. **Use discriminated unions** - For complex action types (see CommandAction)
5. **Export both types and schemas** - Provide flexibility for different use cases
6. **Document with JSDoc** - Add descriptions to complex types and interfaces
7. **Keep schemas in sync** - Ensure TypeScript types match Zod schemas

## Migration Guide

If migrating from JavaScript:

1. Start with core entities (Portal, User, Incident)
2. Add validation gradually using `.safeParse()`
3. Replace `any` types with proper interfaces
4. Enable strict mode incrementally
5. Use type guards for runtime checks

## Testing

Example test setup:

```typescript
import { describe, it, expect } from 'vitest';
import { PortalSchema, PortalStatus } from '@/types';

describe('Portal Types', () => {
  it('should validate valid portal data', () => {
    const validPortal = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'Test Portal',
      url: 'https://test.portal.com',
      status: PortalStatus.OPERATIONAL,
      // ... other required fields
    };

    expect(() => PortalSchema.parse(validPortal)).not.toThrow();
  });

  it('should reject invalid portal data', () => {
    const invalidPortal = {
      name: 'Test', // missing required fields
    };

    expect(() => PortalSchema.parse(invalidPortal)).toThrow();
  });
});
```