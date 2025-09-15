# Central Command Mock API

A simple mock API for Central Command frontend development. This API provides realistic fake data using Bogus and includes real-time updates via SignalR.

## Features

- **No Authentication Required** - Simple development API
- **In-Memory Data Storage** - No database setup needed
- **Realistic Mock Data** - Generated using Bogus library
- **Real-time Updates** - SignalR hub for live metrics
- **Swagger UI** - Interactive API documentation
- **CORS Enabled** - Works with local frontend development

## Running the API

```bash
# Restore packages
dotnet restore

# Run the API (will open Swagger UI)
dotnet run

# Or run without launching browser
dotnet run --launch-profile http
```

The API will be available at:
- **API Base URL**: http://localhost:5000
- **Swagger UI**: http://localhost:5000/swagger
- **SignalR Hub**: http://localhost:5000/hubs/metrics

## API Endpoints

### Portals
- `GET /api/v1/portals` - List all portals (with pagination & filtering)
- `GET /api/v1/portals/{id}` - Get specific portal
- `POST /api/v1/portals` - Create new portal
- `PUT /api/v1/portals/{id}` - Update portal
- `DELETE /api/v1/portals/{id}` - Delete portal
- `POST /api/v1/portals/{id}/metrics` - Update portal metrics
- `GET /api/v1/portals/{id}/metrics/history` - Get metrics history
- `GET /api/v1/portals/{id}/health` - Get health check
- `POST /api/v1/portals/batch` - Batch operations

### Incidents
- `GET /api/v1/incidents` - List all incidents (with filtering)
- `GET /api/v1/incidents/{id}` - Get specific incident
- `POST /api/v1/incidents` - Create new incident
- `PATCH /api/v1/incidents/{id}/status` - Update incident status
- `PATCH /api/v1/incidents/{id}/assign` - Assign incident
- `GET /api/v1/incidents/{id}/comments` - Get incident comments
- `POST /api/v1/incidents/{id}/comments` - Add comment
- `GET /api/v1/incidents/summary` - Get incidents summary

### Statistics
- `GET /api/v1/statistics` - System statistics
- `GET /api/v1/statistics/sparklines` - Time-series data
- `GET /api/v1/statistics/trends` - Historical trends
- `GET /api/v1/statistics/alerts` - System alerts
- `GET /api/v1/statistics/performance` - Performance metrics

### Health & Info
- `GET /health` - Health check endpoint
- `GET /info` - API information

## SignalR Events

Connect to `/hubs/metrics` to receive real-time updates:

- `PortalMetricsUpdated` - Portal metrics changes (every 30 seconds)
- `IncidentStatusChanged` - Incident status updates
- `StatisticsUpdated` - System statistics refresh
- `IncidentCreated` - New incident created
- `IncidentAssigned` - Incident assignment changed
- `IncidentCommentAdded` - New comment on incident

## Mock Data

The API initializes with:
- **36 Portals** - Various statuses and environments
- **15 Incidents** - Different severities and statuses
- **Real-time Metrics** - Updated every 30 seconds
- **Historical Data** - Generated time-series data

## Query Parameters

### Portal Filtering
- `status` - Filter by status (operational, degraded, down, maintenance)
- `environment` - Filter by environment (production, staging, development, qa)
- `category` - Filter by category (sales, hr, finance, operations, it, marketing)
- `favorite` - Filter by favorite status (true/false)
- `page` - Page number (default: 1)
- `pageSize` - Items per page (default: 20)

### Incident Filtering
- `status` - Filter by status (open, investigating, resolved, closed)
- `severity` - Filter by severity (critical, high, medium, low)
- `assignedTo` - Filter by assigned person
- `page` - Page number (default: 1)
- `pageSize` - Items per page (default: 20)

## Response Headers

Paginated endpoints include:
- `X-Total-Count` - Total number of items
- `X-Page` - Current page number
- `X-Page-Size` - Items per page
- `X-Total-Pages` - Total number of pages

## Development Notes

This is a mock API for development purposes only. Features:
- Data resets on restart
- No persistence between sessions
- Simplified error handling
- No authentication/authorization
- Permissive CORS policy

For production API with full features (authentication, database, etc.), use `CentralCommand.Api` on port 5001.