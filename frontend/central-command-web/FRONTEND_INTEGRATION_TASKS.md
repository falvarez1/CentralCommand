# Frontend Integration Tasks

**Generated**: September 16, 2025
**Status**: In Progress

## Immediate Tasks Required

### 1. Fix Component Enum Usage
All React components need to be updated to use the new PascalCase enum values.

#### Files to Update:
- Components using `PortalStatus`:
  - Change `PortalStatus.OPERATIONAL` → `PortalStatus.Operational`
  - Change `PortalStatus.DEGRADED` → `PortalStatus.Degraded`
  - Change `PortalStatus.MAINTENANCE` → `PortalStatus.Maintenance`
  - Change `PortalStatus.OUTAGE` → `PortalStatus.Outage`

- Components using `IncidentSeverity`:
  - Remove `WARNING`, `INFO`, `SUCCESS` values
  - Use only: `Critical`, `High`, `Medium`, `Low`

- Components using `IncidentStatus`:
  - Change `OPEN` → `Open`
  - Change `INVESTIGATING` → `InProgress`
  - Change `IDENTIFIED` → Remove (no longer exists)
  - Change `MONITORING` → Remove (no longer exists)
  - Change `RESOLVED` → `Resolved`
  - Change `CLOSED` → `Closed`
  - Add new status: `Acknowledged`

### 2. Update Store Actions
Update Zustand stores to handle new response structures:

```typescript
// usePortalStore.ts
// Update to handle PagedResult structure
interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}
```

### 3. Fix API Response Handling
Remove any response unwrapping since we're using direct DTOs:

```typescript
// OLD
const response = await api.get('/api/v1/portals');
const portals = transformApiPortal(response.data.data);

// NEW
const response = await api.get<PagedResult<PortalResponse>>('/api/v1/portals');
const portals = response.data.items; // Direct usage, no transformation
```

### 4. Update Form Validation
Update Zod schemas in forms to use new enum values:

```typescript
const portalSchema = z.object({
  status: z.enum(['Operational', 'Degraded', 'Maintenance', 'Outage']),
  priority: z.enum(['Critical', 'High', 'Medium', 'Low']),
  // ... other fields
});
```

### 5. SignalR Event Handlers
Update SignalR hub connection to handle new event types:

```typescript
connection.on('PortalMetricsUpdated', (data: PortalMetricsResponse) => {
  // Handle metrics update
});

connection.on('IncidentStatusChanged', (data: IncidentResponse) => {
  // Handle status change
});

connection.on('BatchOperationCompleted', (data: BatchOperationResult) => {
  // Handle batch operation result
});
```

## Component Checklist

### Portal Components
- [ ] PortalCard.tsx - Update status enum usage
- [ ] PortalGrid.tsx - Handle new PagedResult structure
- [ ] PortalList.tsx - Update status displays
- [ ] AddPortalModal.tsx - Fix form enum values
- [ ] PortalDetails.tsx - Handle new properties
- [ ] PortalMetrics.tsx - Use new metrics structure

### Incident Components
- [ ] IncidentList.tsx - Update severity/status enums
- [ ] IncidentCard.tsx - Handle new status values
- [ ] CreateIncidentModal.tsx - Fix severity options
- [ ] IncidentTimeline.tsx - Handle timeline as array
- [ ] IncidentComments.tsx - New comment structure

### Dashboard Components
- [ ] DashboardStats.tsx - Use StatisticsResponse
- [ ] SparklineChart.tsx - Handle SparklineDataResponse
- [ ] MetricsHistory.tsx - Use new history format
- [ ] HealthIndicator.tsx - Update status checks

### Common Components
- [ ] StatusBadge.tsx - Map new enum values to colors
- [ ] SeverityIcon.tsx - Handle new severity levels
- [ ] FilterDropdown.tsx - Update filter options
- [ ] SearchBar.tsx - Handle new search params

## Testing Checklist

### Unit Tests
- [ ] Update all test fixtures with new enum values
- [ ] Fix mock data to match new DTOs
- [ ] Update snapshot tests

### Integration Tests
- [ ] API service tests with new endpoints
- [ ] Store tests with new data structures
- [ ] Form validation tests

### E2E Tests (Playwright)
- [ ] Portal CRUD operations
- [ ] Incident management flow
- [ ] Real-time updates via SignalR
- [ ] Batch operations
- [ ] Metrics visualization

## Migration Script

Run this script to find all files that need updating:

```bash
# Find all TypeScript/React files using old enum values
grep -r "PortalStatus\.[A-Z_]*" --include="*.ts" --include="*.tsx" apps/web/src
grep -r "IncidentSeverity\.[A-Z_]*" --include="*.ts" --include="*.tsx" apps/web/src
grep -r "IncidentStatus\.[A-Z_]*" --include="*.ts" --include="*.tsx" apps/web/src

# Find transformation functions to remove
grep -r "transformApi" --include="*.ts" --include="*.tsx" apps/web/src
grep -r "mapApi" --include="*.ts" --include="*.tsx" apps/web/src

# Find old response handling
grep -r "response\.data\.data" --include="*.ts" --include="*.tsx" apps/web/src
```

## Rollback Plan

If issues arise during integration:

1. **Backend Rollback**:
   - Revert Program.cs service registrations
   - Switch back to SQL Server from InMemory
   - Restore old DTO structures

2. **Frontend Rollback**:
   - Revert type definition files
   - Restore transformation functions
   - Switch back to lowercase enums

3. **Git Commands**:
   ```bash
   # Create backup branch
   git checkout -b integration-backup

   # If rollback needed
   git checkout main
   git reset --hard <last-stable-commit>
   ```

## Success Metrics

Integration is complete when:
- ✅ Backend starts without errors
- ✅ All API endpoints respond with correct data
- ✅ Frontend displays data without console errors
- ✅ SignalR real-time updates work
- ✅ All Playwright tests pass
- ✅ TypeScript compilation has 0 errors
- ✅ No breaking changes for existing users