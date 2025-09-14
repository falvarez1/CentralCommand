# Central Command Mock API

A complete mock API implementation for the Central Command portal management system. This API provides realistic sample data and real-time updates via SignalR.

## Features

- **RESTful API Endpoints** for portals, incidents, and statistics
- **SignalR Hub** for real-time metric updates
- **Realistic Mock Data** with 30+ portals across different categories
- **In-Memory Storage** for simplicity (no database required)
- **CORS Configuration** for React app integration
- **Swagger UI** for API documentation and testing

## Prerequisites

- .NET 8.0 SDK or later
- Visual Studio 2022, VS Code, or any text editor

## Getting Started

### Run the API

```bash
cd CentralCommand.MockApi
dotnet restore
dotnet run
```

The API will start on `http://localhost:5000`

### Access Points

- **Swagger UI**: http://localhost:5000
- **Health Check**: http://localhost:5000/health
- **SignalR Hub**: http://localhost:5000/hubs/metrics

## API Endpoints

### Portals

- `GET /api/v1/portals` - Get all portals with filtering and pagination
- `GET /api/v1/portals/{id}` - Get a specific portal
- `POST /api/v1/portals/{id}/metrics` - Update portal metrics
- `GET /api/v1/portals/stats` - Get portal statistics

### Incidents

- `GET /api/v1/incidents` - Get all incidents with filtering
- `GET /api/v1/incidents/{id}` - Get a specific incident
- `POST /api/v1/incidents` - Create a new incident
- `PUT /api/v1/incidents/{id}` - Update an incident
- `GET /api/v1/incidents/stats` - Get incident statistics

### Statistics

- `GET /api/v1/statistics` - Get system-wide statistics
- `GET /api/v1/statistics/sparklines` - Get sparkline data for metrics
- `GET /api/v1/statistics/health` - Get health check status
- `GET /api/v1/statistics/performance` - Get performance metrics

## SignalR Real-Time Updates

The API includes a SignalR hub that sends real-time updates every 30 seconds:

### Connection

```javascript
const connection = new signalR.HubConnectionBuilder()
    .withUrl("http://localhost:5000/hubs/metrics")
    .build();
```

### Available Methods

- `SubscribeToPortal(portalId)` - Subscribe to specific portal updates
- `SubscribeToIncidents()` - Subscribe to incident updates
- `SubscribeToStatistics()` - Subscribe to statistics updates

### Events

- `PortalMetricsUpdate` - Fired when portal metrics are updated
- `IncidentUpdate` - Fired when incident status changes
- `StatisticsUpdate` - Fired when system statistics are updated

## Sample Data

The API generates realistic mock data including:

- **30+ Portals** across categories:
  - Engineering (GitHub, Jenkins, GitLab, etc.)
  - Operations (Kubernetes, Terraform, AWS, etc.)
  - Monitoring (Grafana, Prometheus, Datadog, etc.)
  - Support (Jira, ServiceNow, PagerDuty, etc.)
  - Analytics (Tableau, Power BI, etc.)
  - Databases (PostgreSQL, MongoDB, etc.)
  - Security (Vault, Okta, etc.)

- **15 Sample Incidents** with various:
  - Severity levels (Critical, Warning, Info)
  - Types (Outage, Performance, Security, etc.)
  - Statuses (Open, Investigating, Resolved, etc.)

## Query Parameters

### Portal Filtering

- `category` - Filter by category (engineering, operations, etc.)
- `status` - Filter by status (operational, degraded, etc.)
- `environment` - Filter by environment (production, staging, etc.)
- `priority` - Filter by priority (critical, high, medium, low)
- `searchTerm` - Search in name, description, and tags
- `isFavorite` - Filter favorites only
- `page` - Page number (default: 1)
- `pageSize` - Items per page (default: 20)

### Incident Filtering

- `status` - Filter by status
- `severity` - Filter by severity
- `type` - Filter by type
- `searchTerm` - Search in title and description
- `isUnresolved` - Show only unresolved incidents
- `page` - Page number
- `pageSize` - Items per page

## Response Format

All API responses follow a consistent format:

```json
{
  "status": "success",
  "data": { ... },
  "metadata": {
    "timestamp": "2024-01-01T00:00:00Z",
    "requestId": "uuid",
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "totalPages": 5,
      "totalItems": 100,
      "hasNext": true,
      "hasPrevious": false
    }
  }
}
```

## Development

The mock API uses:
- **ASP.NET Core 8.0** - Web framework
- **SignalR** - Real-time communication
- **Bogus** - Fake data generation
- **Swagger/OpenAPI** - API documentation

## Testing with the React App

1. Start the mock API on port 5000
2. Start the React app on port 5173
3. The React app will automatically connect to the API
4. Real-time updates will be received via SignalR

## Troubleshooting

### CORS Issues
- Ensure the API is running on `http://localhost:5000`
- Check that the React app is on `http://localhost:5173`
- Verify CORS policy in Program.cs includes your client URL

### SignalR Connection
- Check browser console for connection errors
- Ensure WebSocket support in your environment
- Verify the hub URL is correct: `/hubs/metrics`

### Port Conflicts
- If port 5000 is in use, update `appsettings.json`
- Update the React app's API configuration accordingly