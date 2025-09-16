# React Frontend Type System Update Summary

## Overview
Updated the React frontend type system in `apps/web` to fully align with the refactored .NET backend DTOs from the `CentralCommand.Core` library.

## Key Changes Made

### 1. Portal Types (`portal.types.ts`)
- **Updated Enum Default Values**: Changed from lowercase to PascalCase (e.g., `PortalEnvironment.PRODUCTION` → `PortalEnvironment.Production`)
- **Added Missing Properties**:
  - `lastStatusChange?: Date | null` - Tracks when portal status last changed
  - `statusReason?: string | null` - Reason for current status
  - `eTag?: string` - For optimistic concurrency control
  - `metricsHistory?: Array` - Historical metrics data points
- **Extended Portal Metrics**:
  - `requestsPerMinute?: number`
  - `averageLoadTime?: number`
  - `peakResponseTime?: number`
  - `timestamp?: Date`
  - `lastUpdated?: Date`
- **New Types Added**:
  - `PortalSummary` - Lightweight portal data for list views
  - `BatchOperationResult` - Result of batch operations
  - `PortalHealthCheck` - Health check status and metrics
- **Nullable Handling**: Added proper `.nullable()` to optional fields matching backend

### 2. Incident Types (`incident.types.ts`)
- **Added Missing Properties**:
  - `closedAt?: Date | null` - When incident was closed
  - `eTag?: string` - For optimistic concurrency
  - `commentCount: number` - Number of comments
  - `priority?: IncidentPriority | null` - Incident priority level
  - `comments?: Comment[]` - List of incident comments
- **New Enum Added**:
  - `IncidentPriority` enum (Critical, High, Medium, Low)
- **Updated Timeline Structure**:
  - Changed `action` → `eventType`
  - Changed `performedBy` → `userId?: string | null`
  - Added `metadata?: Record<string, any>` for additional data
- **New Types Added**:
  - `Comment` - Incident comment structure
  - `IncidentSummary` - Lightweight incident data for list views
- **Fixed Enum References**: Updated default severity threshold from `IncidentSeverity.WARNING` to `IncidentSeverity.Medium`

### 3. API Types (`api.types.ts`)
- **Updated Base Response Structure** to match backend `ApiResponse<T>`:
  ```typescript
  {
    success: boolean;
    data?: T | null;
    error?: string | null;
    message?: string | null;
    errors?: Record<string, string[]> | null;
    timestamp: Date;
    requestId?: string | null;
  }
  ```
- **Added PagedResult Type** matching backend:
  ```typescript
  {
    items: T[];
    totalCount: number;
    pageNumber: number;
    page: number; // Alias for pageNumber
    pageSize: number;
    totalPages: number;
    hasPreviousPage: boolean;
    hasNextPage: boolean;
  }
  ```
- **Updated Batch Response** to match `BatchOperationResult`:
  - Changed field names: `succeeded` → `successCount`, `failed` → `failureCount`
  - Added `totalCount` property
  - Updated result structure with `portalId`/`incidentId` and `success` boolean

### 4. Statistics Types (`stats.types.ts`)
- **Updated TimeRange Enum** to PascalCase:
  - `ONE_HOUR` → `OneHour`
  - `TWENTY_FOUR_HOURS` → `TwentyFourHours`
  - Added aliases for backward compatibility
- **Added MetricTrend Enum**: Up, Down, Stable
- **New Types Added**:
  - `StatisticsResponse` - Complete statistics response structure
  - `SparklineDataResponse` - Sparkline visualization data
- **Enhanced System Stats** with portal, incident, and resource breakdowns

## Backend Compatibility

All types now fully match the backend DTOs in:
- `libs/CentralCommand.Core/DTOs/Responses/`
- `libs/CentralCommand.Core/DTOs/Common/`
- `libs/CentralCommand.Core/Domain/ValueObjects/`
- `libs/CentralCommand.Core/Domain/Enums/`

## Breaking Changes

1. **Enum Values**: All enums now use PascalCase instead of UPPER_CASE
   - Migration: Update all enum references in components
   - Legacy aliases provided for gradual migration

2. **API Response Structure**: Changed from `status` field to `success` boolean
   - Migration: Update API client and error handling logic

3. **Pagination**: `PaginationResponse` renamed to `PagedResult`
   - Migration: Update paginated API calls and components

## Migration Guide

### For Enum Updates:
```typescript
// Old
portal.environment === PortalEnvironment.PRODUCTION
// New
portal.environment === PortalEnvironment.Production
```

### For API Responses:
```typescript
// Old
if (response.status === ApiStatus.SUCCESS) { }
// New
if (response.success) { }
```

### For Paginated Results:
```typescript
// Old
const { items, pagination } = response;
// New
const { items, totalCount, pageNumber, pageSize } = response;
```

## Testing Recommendations

1. **Type Checking**: Run `npm run type-check` to ensure no type errors
2. **Component Testing**: Test all components using updated types
3. **API Integration**: Verify API calls handle new response structures
4. **Enum References**: Search and replace old enum values

## Benefits

- **Type Safety**: Full TypeScript alignment with backend
- **Maintainability**: Single source of truth for data structures
- **Developer Experience**: Better IntelliSense and compile-time checking
- **Future-Proof**: Easier to keep in sync with backend changes