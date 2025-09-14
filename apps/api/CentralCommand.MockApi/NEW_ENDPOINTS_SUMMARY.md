# New API Endpoints Added to CentralCommand.MockApi

## Overview
The following new endpoints have been successfully added to the CentralCommand.MockApi project, along with their supporting models and services.

## New Endpoints

### 1. Portal Metrics History
**Endpoint:** `GET /api/v1/portals/{id}/metrics/history`

**Description:** Returns historical metrics data for a specific portal.

**Query Parameters:**
- `timeRange` (optional): `LastHour`, `Last24Hours`, `Last7Days`, `Last30Days` (default: `Last24Hours`)

**Response:** Returns `MetricsHistory` object containing:
- Time-series data points with metrics like response time, CPU, memory, uptime, etc.
- Summary statistics including averages, min/max values, and anomaly detection
- Time range and interval information

### 2. Incident Comments - Get
**Endpoint:** `GET /api/v1/incidents/{id}/comments`

**Description:** Retrieves all comments for a specific incident.

**Response:** Returns a list of `Comment` objects containing:
- Comment content and metadata
- Author information
- Timestamps
- Internal/external flag
- Attachments and mentioned users

### 3. Incident Comments - Add
**Endpoint:** `POST /api/v1/incidents/{id}/comments`

**Description:** Adds a new comment to an incident.

**Request Body:**
```json
{
  "content": "string",
  "isInternal": boolean,
  "attachments": ["string"],
  "mentionedUsers": ["guid"]
}
```

**Response:** Returns the created `Comment` object with generated ID and metadata.

### 4. Portal Health Check
**Endpoint:** `GET /api/v1/portals/{id}/health`

**Description:** Retrieves health check configuration and recent results for a portal.

**Response:** Returns `PortalHealth` object containing:
- Overall health status and health score (0-100)
- List of configured health checks
- Recent health check results with response times
- Status counts (healthy, degraded, unhealthy, unknown)

### 5. Portal Batch Operations
**Endpoint:** `POST /api/v1/portals/batch`

**Description:** Performs batch operations on multiple portals simultaneously.

**Request Body:**
```json
{
  "portalIds": ["guid"],
  "operation": "UpdateStatus|UpdatePriority|UpdateEnvironment|AddTags|RemoveTags|ToggleFavorite|EnableMonitoring|DisableMonitoring|Delete",
  "parameters": {
    "key": "value"
  }
}
```

**Supported Operations:**
- `UpdateStatus`: Change portal status
- `UpdatePriority`: Update portal priority
- `UpdateEnvironment`: Change environment setting
- `AddTags`: Add tags to portals
- `RemoveTags`: Remove tags from portals
- `ToggleFavorite`: Toggle favorite status
- `EnableMonitoring`: Enable monitoring for portals
- `DisableMonitoring`: Disable monitoring for portals
- `Delete`: Remove portals

**Response:** Returns `BatchOperationResponse` with:
- Operation ID and type
- Success/failure counts
- Individual results for each portal
- Execution time and duration

## New Models Added

### Comment Models
- `Comment`: Full comment entity with author, content, and metadata
- `CreateCommentRequest`: Request model for creating comments

### Health Check Models
- `HealthCheckConfig`: Configuration for health checks
- `HealthCheckResult`: Individual health check result
- `PortalHealth`: Overall portal health summary
- `HealthStatus`: Enum for health states
- `HealthCheckType`: Enum for check types

### Batch Operation Models
- `BatchOperationRequest`: Request for batch operations
- `BatchOperationResponse`: Response with results
- `BatchOperationItemResult`: Individual operation result
- `BatchOperationType`: Enum for operation types

### Metrics History Models
- `MetricsHistory`: Complete metrics history response
- `MetricsDataPoint`: Individual time-series data point
- `MetricsSummary`: Statistical summary of metrics
- `MetricsTimeRange`: Enum for time range options
- `MetricsAggregation`: Enum for aggregation types

## Service Updates

### MockDataService
The `MockDataService` has been enhanced with:
- Comment generation and management methods
- Health check data generation
- Metrics history generation with realistic time-series data
- Batch operation processing logic
- Support for all new data models

## Testing
All endpoints have been tested and verified to:
- Return appropriate HTTP status codes
- Handle error cases with proper error responses
- Generate realistic mock data
- Log operations appropriately
- Follow RESTful conventions

## Usage Examples

### Get Portal Metrics History
```bash
GET http://localhost:5000/api/v1/portals/{portalId}/metrics/history?timeRange=Last24Hours
```

### Add Comment to Incident
```bash
POST http://localhost:5000/api/v1/incidents/{incidentId}/comments
Content-Type: application/json

{
  "content": "Investigation complete, root cause identified.",
  "isInternal": false
}
```

### Batch Update Portal Status
```bash
POST http://localhost:5000/api/v1/portals/batch
Content-Type: application/json

{
  "portalIds": ["guid1", "guid2", "guid3"],
  "operation": "UpdateStatus",
  "parameters": {
    "status": "Maintenance"
  }
}
```

## Architecture Notes

- All new endpoints follow the existing API response structure with `ApiResponse<T>` wrapper
- Error handling uses consistent error codes and messages
- Pagination support where applicable
- ETags maintained for concurrency control
- Logging integrated for all operations
- Mock data is generated with realistic patterns and relationships