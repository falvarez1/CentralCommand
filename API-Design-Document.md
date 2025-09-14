# Central Command API Design Document

## Table of Contents
1. [Overview](#overview)
2. [API Architecture](#api-architecture)
3. [API Endpoints](#api-endpoints)
4. [Data Transfer Objects](#data-transfer-objects)
5. [Error Handling](#error-handling)
6. [Authentication & Authorization](#authentication--authorization)
7. [Real-time Communication](#real-time-communication)
8. [Caching Strategy](#caching-strategy)
9. [API Versioning](#api-versioning)
10. [Performance Considerations](#performance-considerations)

## Overview

The Central Command API is a high-performance ASP.NET Core 8.0 RESTful API designed to manage enterprise portal services with real-time monitoring capabilities. The API supports both traditional REST endpoints and real-time WebSocket connections via SignalR for live metric updates.

### Key Design Principles
- **Clean Architecture**: Separation of concerns with clear boundaries
- **CQRS Pattern**: Separate read and write operations for optimal performance
- **Async-First**: All operations are asynchronous for scalability
- **Response Caching**: Strategic caching for frequently accessed data
- **Optimistic Concurrency**: Support for frontend optimistic updates
- **Event-Driven Updates**: Real-time metric streaming via SignalR

## API Architecture

### Technology Stack
- **Framework**: ASP.NET Core 8.0 with Minimal APIs
- **Data Access**: Entity Framework Core 8.0 with SQL Server
- **Caching**: Redis for distributed caching, IMemoryCache for local
- **Real-time**: SignalR for WebSocket communication
- **Authentication**: JWT Bearer tokens with refresh token rotation
- **Validation**: FluentValidation for complex validation rules
- **Monitoring**: Application Insights / OpenTelemetry
- **API Documentation**: OpenAPI/Swagger with versioning support

### Architectural Layers
```
┌─────────────────────────────────────────┐
│         Presentation Layer              │
│   (Controllers/Minimal APIs/SignalR)    │
├─────────────────────────────────────────┤
│         Application Layer               │
│    (Services/Handlers/Validators)       │
├─────────────────────────────────────────┤
│          Domain Layer                   │
│    (Entities/Value Objects/Events)      │
├─────────────────────────────────────────┤
│       Infrastructure Layer              │
│  (EF Core/Redis/External Services)      │
└─────────────────────────────────────────┘
```

## API Endpoints

### Base URL Structure
```
https://api.centralcommand.com/v{version}/
```

### Portal Management Endpoints

#### GET /api/v1/portals
Retrieve all portals with optional filtering and pagination.

**Query Parameters:**
- `pageNumber` (int): Page number (default: 1)
- `pageSize` (int): Items per page (default: 20, max: 100)
- `search` (string): Search term for portal name/url
- `status` (enum): Filter by status (Active, Degraded, Down, Maintenance)
- `tags` (string[]): Filter by tags
- `sortBy` (string): Sort field (name, status, responseTime, uptime)
- `sortOrder` (enum): Asc/Desc (default: Asc)
- `includeMetrics` (bool): Include current metrics (default: false)

**Response:** `200 OK`
```json
{
  "data": [Portal],
  "pagination": {
    "currentPage": 1,
    "pageSize": 20,
    "totalCount": 100,
    "totalPages": 5,
    "hasNext": true,
    "hasPrevious": false
  },
  "metadata": {
    "timestamp": "2025-01-13T10:30:00Z",
    "version": "1.0"
  }
}
```

#### GET /api/v1/portals/{id}
Retrieve a specific portal by ID.

**Response:** `200 OK` | `404 Not Found`

#### POST /api/v1/portals
Create a new portal.

**Request Body:** `CreatePortalRequest`
**Response:** `201 Created` with Location header

#### PUT /api/v1/portals/{id}
Update an existing portal.

**Request Body:** `UpdatePortalRequest`
**Response:** `200 OK` | `404 Not Found` | `409 Conflict` (concurrency)

#### PATCH /api/v1/portals/{id}
Partial update of a portal.

**Request Body:** JSON Patch document
**Response:** `200 OK` | `404 Not Found`

#### DELETE /api/v1/portals/{id}
Soft delete a portal.

**Response:** `204 No Content` | `404 Not Found`

#### POST /api/v1/portals/{id}/refresh-metrics
Trigger immediate metric refresh for a portal.

**Response:** `202 Accepted`

### Portal Metrics Endpoints

#### GET /api/v1/portals/{id}/metrics
Get current metrics for a portal.

**Query Parameters:**
- `includeHistory` (bool): Include historical data (default: false)

**Response:** `200 OK`
```json
{
  "portalId": "guid",
  "current": {
    "responseTime": 125,
    "uptime": 99.95,
    "cpuUsage": 45.2,
    "memoryUsage": 62.8,
    "requestsPerMinute": 1250,
    "errorRate": 0.02,
    "timestamp": "2025-01-13T10:30:00Z"
  },
  "sparkline": [125, 130, 128, 122, 125, 127]
}
```

#### GET /api/v1/portals/{id}/metrics/history
Get historical metrics with time-series data.

**Query Parameters:**
- `from` (DateTime): Start time (required)
- `to` (DateTime): End time (required)
- `interval` (enum): Minute, Hour, Day (default: Hour)
- `metrics` (string[]): Specific metrics to include

**Response:** `200 OK`
```json
{
  "portalId": "guid",
  "timeRange": {
    "from": "2025-01-13T00:00:00Z",
    "to": "2025-01-13T23:59:59Z"
  },
  "dataPoints": [
    {
      "timestamp": "2025-01-13T10:00:00Z",
      "responseTime": 125,
      "uptime": 99.95,
      "cpuUsage": 45.2,
      "memoryUsage": 62.8,
      "requestsPerMinute": 1250,
      "errorRate": 0.02
    }
  ]
}
```

### Incident Management Endpoints

#### GET /api/v1/incidents
Retrieve incidents with filtering.

**Query Parameters:**
- `pageNumber`, `pageSize`: Pagination
- `severity` (enum): Critical, High, Medium, Low
- `status` (enum): Open, InProgress, Resolved, Closed
- `portalId` (guid): Filter by portal
- `from`, `to` (DateTime): Date range
- `assignedTo` (string): Filter by assignee

**Response:** `200 OK` with paginated results

#### GET /api/v1/incidents/{id}
Get specific incident details.

**Response:** `200 OK` | `404 Not Found`

#### POST /api/v1/incidents
Create a new incident.

**Request Body:** `CreateIncidentRequest`
**Response:** `201 Created`

#### PUT /api/v1/incidents/{id}
Update incident.

**Request Body:** `UpdateIncidentRequest`
**Response:** `200 OK`

#### POST /api/v1/incidents/{id}/resolve
Resolve an incident.

**Request Body:** `ResolveIncidentRequest`
**Response:** `200 OK`

#### POST /api/v1/incidents/{id}/comments
Add comment to incident.

**Request Body:** `AddCommentRequest`
**Response:** `201 Created`

### Statistics Endpoints

#### GET /api/v1/statistics/dashboard
Get aggregated dashboard statistics.

**Response:** `200 OK`
```json
{
  "summary": {
    "totalPortals": 50,
    "activePortals": 48,
    "degradedPortals": 1,
    "downPortals": 1,
    "averageUptime": 99.92,
    "averageResponseTime": 145,
    "totalRequests24h": 1500000,
    "totalErrors24h": 250
  },
  "topPerformers": [Portal],
  "recentIncidents": [Incident],
  "alerts": [Alert]
}
```

#### GET /api/v1/statistics/trends
Get trend analysis data.

**Query Parameters:**
- `period` (enum): Day, Week, Month, Quarter
- `metrics` (string[]): Specific metrics to analyze

**Response:** `200 OK` with trend data

### Command Palette Endpoints

#### GET /api/v1/commands/search
Search across all entities.

**Query Parameters:**
- `q` (string): Search query (required)
- `types` (string[]): Entity types to search
- `limit` (int): Max results (default: 10)

**Response:** `200 OK`
```json
{
  "results": [
    {
      "type": "portal",
      "id": "guid",
      "title": "Payment Gateway",
      "subtitle": "payment.example.com",
      "icon": "server",
      "action": "/portals/guid"
    }
  ],
  "totalCount": 25,
  "executionTime": 15
}
```

#### POST /api/v1/commands/execute
Execute a quick action.

**Request Body:** `ExecuteCommandRequest`
**Response:** `200 OK` with action result

### User Preferences Endpoints

#### GET /api/v1/users/me/preferences
Get current user preferences.

**Response:** `200 OK`
```json
{
  "theme": "dark",
  "language": "en-US",
  "timezone": "UTC",
  "notifications": {
    "email": true,
    "push": true,
    "desktop": false
  },
  "dashboard": {
    "layout": "grid",
    "refreshInterval": 30,
    "defaultView": "overview"
  },
  "favorites": ["portal-id-1", "portal-id-2"]
}
```

#### PUT /api/v1/users/me/preferences
Update user preferences.

**Request Body:** `UpdatePreferencesRequest`
**Response:** `200 OK`

#### POST /api/v1/users/me/favorites/{portalId}
Add portal to favorites.

**Response:** `204 No Content`

#### DELETE /api/v1/users/me/favorites/{portalId}
Remove portal from favorites.

**Response:** `204 No Content`

## Data Transfer Objects

### Portal DTOs

```csharp
// Response DTOs
public record PortalDto
{
    public Guid Id { get; init; }
    public string Name { get; init; }
    public string Url { get; init; }
    public string Description { get; init; }
    public PortalStatus Status { get; init; }
    public string Environment { get; init; }
    public List<string> Tags { get; init; }
    public PortalMetricsDto CurrentMetrics { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime? LastModifiedAt { get; init; }
    public string ETag { get; init; } // For optimistic concurrency
}

public record PortalMetricsDto
{
    public double ResponseTime { get; init; }
    public double Uptime { get; init; }
    public double CpuUsage { get; init; }
    public double MemoryUsage { get; init; }
    public int RequestsPerMinute { get; init; }
    public double ErrorRate { get; init; }
    public List<double> ResponseTimeSparkline { get; init; }
    public DateTime Timestamp { get; init; }
}

// Request DTOs
public record CreatePortalRequest
{
    [Required]
    [MaxLength(100)]
    public string Name { get; init; }

    [Required]
    [Url]
    public string Url { get; init; }

    [MaxLength(500)]
    public string Description { get; init; }

    [Required]
    public string Environment { get; init; }

    public List<string> Tags { get; init; } = new();

    public HealthCheckConfiguration HealthCheck { get; init; }
}

public record UpdatePortalRequest
{
    [Required]
    [MaxLength(100)]
    public string Name { get; init; }

    [Required]
    [Url]
    public string Url { get; init; }

    [MaxLength(500)]
    public string Description { get; init; }

    public string Environment { get; init; }
    public List<string> Tags { get; init; }

    [Required]
    public string ETag { get; init; } // For optimistic concurrency
}

public record HealthCheckConfiguration
{
    public string Endpoint { get; init; } = "/health";
    public int IntervalSeconds { get; init; } = 30;
    public int TimeoutSeconds { get; init; } = 10;
    public Dictionary<string, string> Headers { get; init; } = new();
}
```

### Incident DTOs

```csharp
public record IncidentDto
{
    public Guid Id { get; init; }
    public string Title { get; init; }
    public string Description { get; init; }
    public IncidentSeverity Severity { get; init; }
    public IncidentStatus Status { get; init; }
    public Guid? PortalId { get; init; }
    public string PortalName { get; init; }
    public string AssignedTo { get; init; }
    public string ReportedBy { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime? ResolvedAt { get; init; }
    public TimeSpan? TimeToResolve { get; init; }
    public List<IncidentCommentDto> Comments { get; init; }
    public List<string> Tags { get; init; }
}

public record CreateIncidentRequest
{
    [Required]
    [MaxLength(200)]
    public string Title { get; init; }

    [Required]
    [MaxLength(2000)]
    public string Description { get; init; }

    [Required]
    public IncidentSeverity Severity { get; init; }

    public Guid? PortalId { get; init; }
    public string AssignedTo { get; init; }
    public List<string> Tags { get; init; } = new();
}

public record UpdateIncidentRequest
{
    [Required]
    public string Title { get; init; }

    [Required]
    public string Description { get; init; }

    public IncidentSeverity Severity { get; init; }
    public IncidentStatus Status { get; init; }
    public string AssignedTo { get; init; }

    [Required]
    public string ETag { get; init; }
}

public record ResolveIncidentRequest
{
    [Required]
    [MaxLength(1000)]
    public string Resolution { get; init; }

    public string RootCause { get; init; }
    public List<string> PreventiveMeasures { get; init; }
}
```

### Common DTOs

```csharp
public record PaginatedResponse<T>
{
    public List<T> Data { get; init; }
    public PaginationMetadata Pagination { get; init; }
    public ResponseMetadata Metadata { get; init; }
}

public record PaginationMetadata
{
    public int CurrentPage { get; init; }
    public int PageSize { get; init; }
    public int TotalCount { get; init; }
    public int TotalPages { get; init; }
    public bool HasNext { get; init; }
    public bool HasPrevious { get; init; }
}

public record ResponseMetadata
{
    public DateTime Timestamp { get; init; }
    public string Version { get; init; }
    public string TraceId { get; init; }
    public int? CacheDuration { get; init; }
}

public enum PortalStatus
{
    Active,
    Degraded,
    Down,
    Maintenance,
    Unknown
}

public enum IncidentSeverity
{
    Critical,
    High,
    Medium,
    Low
}

public enum IncidentStatus
{
    Open,
    InProgress,
    Resolved,
    Closed
}
```

## Error Handling

### Error Response Format

All errors follow RFC 7807 Problem Details specification:

```csharp
public record ProblemDetailsResponse
{
    public string Type { get; init; }
    public string Title { get; init; }
    public int Status { get; init; }
    public string Detail { get; init; }
    public string Instance { get; init; }
    public string TraceId { get; init; }
    public Dictionary<string, object> Extensions { get; init; }
}
```

### Error Codes and Responses

| Status Code | Error Type | Description |
|------------|------------|-------------|
| 400 | ValidationError | Invalid request data |
| 401 | Unauthorized | Missing or invalid authentication |
| 403 | Forbidden | Insufficient permissions |
| 404 | NotFound | Resource not found |
| 409 | Conflict | Concurrency conflict or duplicate |
| 429 | RateLimitExceeded | Too many requests |
| 500 | InternalServerError | Unexpected server error |
| 503 | ServiceUnavailable | Service temporarily unavailable |

### Validation Error Response

```json
{
  "type": "https://centralcommand.com/errors/validation",
  "title": "Validation Error",
  "status": 400,
  "detail": "One or more validation errors occurred",
  "instance": "/api/v1/portals",
  "traceId": "00-abc123-00",
  "errors": {
    "name": ["Name is required", "Name must be unique"],
    "url": ["Invalid URL format"]
  }
}
```

### Global Exception Handling

```csharp
public class GlobalExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<GlobalExceptionMiddleware> _logger;

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (ValidationException ex)
        {
            await HandleValidationException(context, ex);
        }
        catch (NotFoundException ex)
        {
            await HandleNotFoundException(context, ex);
        }
        catch (BusinessRuleException ex)
        {
            await HandleBusinessException(context, ex);
        }
        catch (DbUpdateConcurrencyException ex)
        {
            await HandleConcurrencyException(context, ex);
        }
        catch (Exception ex)
        {
            await HandleGenericException(context, ex);
        }
    }
}
```

## Authentication & Authorization

### JWT Bearer Token Strategy

```csharp
public record TokenResponse
{
    public string AccessToken { get; init; }
    public string RefreshToken { get; init; }
    public string TokenType { get; init; } = "Bearer";
    public int ExpiresIn { get; init; } = 3600; // seconds
    public string Scope { get; init; }
}

public record RefreshTokenRequest
{
    [Required]
    public string RefreshToken { get; init; }
}
```

### JWT Claims Structure

```json
{
  "sub": "user-id",
  "email": "user@example.com",
  "name": "John Doe",
  "roles": ["Admin", "PortalManager"],
  "permissions": ["portal:read", "portal:write", "incident:manage"],
  "tenant": "tenant-id",
  "jti": "unique-token-id",
  "iat": 1736766000,
  "exp": 1736769600
}
```

### Authorization Policies

```csharp
services.AddAuthorization(options =>
{
    options.AddPolicy("PortalRead", policy =>
        policy.RequireClaim("permissions", "portal:read"));

    options.AddPolicy("PortalWrite", policy =>
        policy.RequireClaim("permissions", "portal:write"));

    options.AddPolicy("IncidentManage", policy =>
        policy.RequireClaim("permissions", "incident:manage"));

    options.AddPolicy("AdminOnly", policy =>
        policy.RequireRole("Admin"));
});
```

### API Key Authentication (for Service-to-Service)

```csharp
public class ApiKeyAuthenticationHandler : AuthenticationHandler<ApiKeyAuthenticationOptions>
{
    protected override async Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        if (!Request.Headers.TryGetValue("X-API-Key", out var apiKey))
        {
            return AuthenticateResult.Fail("API Key missing");
        }

        // Validate API key and create claims principal
        var claims = new[]
        {
            new Claim(ClaimTypes.Name, "ServiceAccount"),
            new Claim("scope", "service")
        };

        var identity = new ClaimsIdentity(claims, Scheme.Name);
        var principal = new ClaimsPrincipal(identity);
        var ticket = new AuthenticationTicket(principal, Scheme.Name);

        return AuthenticateResult.Success(ticket);
    }
}
```

## Real-time Communication

### SignalR Hub Design

```csharp
public interface IMetricsHub
{
    Task PortalMetricsUpdated(PortalMetricsUpdate update);
    Task PortalStatusChanged(PortalStatusChange change);
    Task IncidentCreated(IncidentNotification notification);
    Task SystemAlert(SystemAlert alert);
}

public class MetricsHub : Hub<IMetricsHub>
{
    private readonly IPortalService _portalService;
    private readonly IConnectionManager _connectionManager;

    public override async Task OnConnectedAsync()
    {
        var userId = Context.UserIdentifier;
        await _connectionManager.AddConnection(userId, Context.ConnectionId);

        // Send initial state
        var portals = await _portalService.GetUserPortals(userId);
        await Clients.Caller.PortalMetricsUpdated(new PortalMetricsUpdate
        {
            Portals = portals
        });

        await base.OnConnectedAsync();
    }

    public async Task SubscribeToPortal(Guid portalId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"portal-{portalId}");
    }

    public async Task UnsubscribeFromPortal(Guid portalId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"portal-{portalId}");
    }

    public async Task SubscribeToIncidents(string severity = null)
    {
        var group = severity != null ? $"incidents-{severity}" : "incidents-all";
        await Groups.AddToGroupAsync(Context.ConnectionId, group);
    }
}
```

### SignalR Client Connection (TypeScript)

```typescript
// Frontend connection example
const connection = new HubConnectionBuilder()
    .withUrl("/hubs/metrics", {
        accessTokenFactory: () => getAccessToken()
    })
    .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
    .configureLogging(LogLevel.Information)
    .build();

connection.on("PortalMetricsUpdated", (update: PortalMetricsUpdate) => {
    // Update Zustand store
    usePortalStore.getState().updateMetrics(update);
});

connection.on("PortalStatusChanged", (change: PortalStatusChange) => {
    // Handle status change
    usePortalStore.getState().updateStatus(change);

    // Show notification if critical
    if (change.newStatus === "Down") {
        showNotification({
            type: "error",
            title: "Portal Down",
            message: `${change.portalName} is currently down`
        });
    }
});
```

### Background Service for Metrics Collection

```csharp
public class MetricsCollectionService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly IHubContext<MetricsHub, IMetricsHub> _hubContext;
    private readonly IDistributedCache _cache;
    private readonly ILogger<MetricsCollectionService> _logger;

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = _serviceProvider.CreateScope();
                var portalService = scope.ServiceProvider.GetRequiredService<IPortalService>();
                var portals = await portalService.GetActivePortalsAsync();

                var tasks = portals.Select(portal => CollectMetricsAsync(portal, stoppingToken));
                var results = await Task.WhenAll(tasks);

                // Batch update to SignalR clients
                var updates = results.Where(r => r != null).ToList();
                if (updates.Any())
                {
                    await _hubContext.Clients.All.PortalMetricsUpdated(new PortalMetricsUpdate
                    {
                        Timestamp = DateTime.UtcNow,
                        Metrics = updates
                    });
                }

                await Task.Delay(TimeSpan.FromSeconds(30), stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error collecting metrics");
                await Task.Delay(TimeSpan.FromSeconds(60), stoppingToken);
            }
        }
    }

    private async Task<PortalMetrics> CollectMetricsAsync(Portal portal, CancellationToken cancellationToken)
    {
        // Implement metric collection logic
        // Use HttpClient to check health endpoints
        // Calculate response times, error rates, etc.
    }
}
```

## Caching Strategy

### Multi-Layer Caching Architecture

```csharp
public interface ICacheService
{
    Task<T> GetOrCreateAsync<T>(
        string key,
        Func<Task<T>> factory,
        CacheOptions options = null);

    Task InvalidateAsync(string key);
    Task InvalidatePrefixAsync(string prefix);
}

public class CacheOptions
{
    public TimeSpan? AbsoluteExpiration { get; set; }
    public TimeSpan? SlidingExpiration { get; set; }
    public CachePriority Priority { get; set; } = CachePriority.Normal;
    public bool UseDistributed { get; set; } = true;
}

public class HybridCacheService : ICacheService
{
    private readonly IMemoryCache _memoryCache;
    private readonly IDistributedCache _distributedCache;
    private readonly ILogger<HybridCacheService> _logger;

    public async Task<T> GetOrCreateAsync<T>(
        string key,
        Func<Task<T>> factory,
        CacheOptions options = null)
    {
        options ??= new CacheOptions();

        // L1 Cache - Memory
        if (_memoryCache.TryGetValue(key, out T cachedValue))
        {
            _logger.LogDebug("Cache hit (L1): {Key}", key);
            return cachedValue;
        }

        // L2 Cache - Redis
        if (options.UseDistributed)
        {
            var distributedValue = await _distributedCache.GetAsync(key);
            if (distributedValue != null)
            {
                _logger.LogDebug("Cache hit (L2): {Key}", key);
                var deserializedValue = JsonSerializer.Deserialize<T>(distributedValue);

                // Populate L1
                _memoryCache.Set(key, deserializedValue, TimeSpan.FromMinutes(5));
                return deserializedValue;
            }
        }

        // Cache miss - execute factory
        _logger.LogDebug("Cache miss: {Key}", key);
        var value = await factory();

        // Set in both caches
        var memoryCacheOptions = new MemoryCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow = options.AbsoluteExpiration ?? TimeSpan.FromMinutes(15),
            SlidingExpiration = options.SlidingExpiration,
            Priority = options.Priority
        };

        _memoryCache.Set(key, value, memoryCacheOptions);

        if (options.UseDistributed)
        {
            var serializedValue = JsonSerializer.SerializeToUtf8Bytes(value);
            var distributedOptions = new DistributedCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = options.AbsoluteExpiration ?? TimeSpan.FromHours(1),
                SlidingExpiration = options.SlidingExpiration
            };

            await _distributedCache.SetAsync(key, serializedValue, distributedOptions);
        }

        return value;
    }
}
```

### Cache Invalidation Strategy

```csharp
public class CacheInvalidationService
{
    private readonly ICacheService _cacheService;
    private readonly IMessageBus _messageBus;

    public async Task InvalidatePortalCacheAsync(Guid portalId)
    {
        var keys = new[]
        {
            $"portal:{portalId}",
            $"portal:{portalId}:metrics",
            $"portal:{portalId}:incidents",
            "portals:list", // Invalidate list cache
            "statistics:dashboard" // Invalidate dashboard stats
        };

        foreach (var key in keys)
        {
            await _cacheService.InvalidateAsync(key);
        }

        // Publish invalidation event for other instances
        await _messageBus.PublishAsync(new CacheInvalidationEvent
        {
            Keys = keys,
            Timestamp = DateTime.UtcNow
        });
    }
}
```

### Response Caching Middleware

```csharp
// Configure response caching
services.AddResponseCaching();
services.AddHttpCacheHeaders(
    expirationOptions =>
    {
        expirationOptions.MaxAge = 60;
        expirationOptions.CacheLocation = CacheLocation.Private;
    },
    validationOptions =>
    {
        validationOptions.MustRevalidate = true;
    });

// Apply caching to endpoints
app.MapGet("/api/v1/portals", async (IPortalService service, [FromQuery] PortalQuery query) =>
{
    var result = await service.GetPortalsAsync(query);
    return Results.Ok(result);
})
.CacheOutput(p => p
    .Expire(TimeSpan.FromSeconds(30))
    .Tag("portals")
    .VaryByQuery("status", "search", "pageNumber", "pageSize"));
```

## API Versioning

### URL Path Versioning Strategy

```csharp
// Program.cs configuration
builder.Services.AddApiVersioning(options =>
{
    options.DefaultApiVersion = new ApiVersion(1, 0);
    options.AssumeDefaultVersionWhenUnspecified = true;
    options.ReportApiVersions = true;
    options.ApiVersionReader = ApiVersionReader.Combine(
        new UrlSegmentApiVersionReader(),
        new HeaderApiVersionReader("X-API-Version"),
        new MediaTypeApiVersionReader("version")
    );
});

builder.Services.AddVersionedApiExplorer(options =>
{
    options.GroupNameFormat = "'v'VVV";
    options.SubstituteApiVersionInUrl = true;
});
```

### Versioned Endpoints

```csharp
// V1 Endpoints
app.MapGroup("/api/v{version:apiVersion}/portals")
    .MapPortalsV1()
    .WithApiVersionSet(apiVersionSet)
    .HasApiVersion(1, 0);

// V2 Endpoints with breaking changes
app.MapGroup("/api/v{version:apiVersion}/portals")
    .MapPortalsV2()
    .WithApiVersionSet(apiVersionSet)
    .HasApiVersion(2, 0);

public static class PortalEndpointsV1
{
    public static RouteGroupBuilder MapPortalsV1(this RouteGroupBuilder group)
    {
        group.MapGet("/", GetPortalsV1);
        group.MapGet("/{id}", GetPortalByIdV1);
        // ... other V1 endpoints
        return group;
    }
}

public static class PortalEndpointsV2
{
    public static RouteGroupBuilder MapPortalsV2(this RouteGroupBuilder group)
    {
        group.MapGet("/", GetPortalsV2); // Returns enhanced DTO
        group.MapGet("/{id}", GetPortalByIdV2);
        group.MapPost("/{id}/bulk-metrics", BulkMetricsUpdate); // New in V2
        return group;
    }
}
```

### API Deprecation Strategy

```csharp
[ApiVersion("1.0", Deprecated = true)]
[ApiVersion("2.0")]
public class PortalController : ControllerBase
{
    [HttpGet]
    [MapToApiVersion("1.0")]
    [Obsolete("Use V2 endpoint for enhanced features")]
    public async Task<IActionResult> GetV1()
    {
        Response.Headers.Add("Sunset", "2025-12-31T23:59:59Z");
        Response.Headers.Add("Link", "</api/v2/portals>; rel=\"successor-version\"");
        // Return V1 response
    }

    [HttpGet]
    [MapToApiVersion("2.0")]
    public async Task<IActionResult> GetV2()
    {
        // Return V2 enhanced response
    }
}
```

## Performance Considerations

### Query Optimization

```csharp
public class OptimizedPortalRepository : IPortalRepository
{
    private readonly AppDbContext _context;

    public async Task<PagedResult<Portal>> GetPortalsAsync(PortalQuery query)
    {
        var queryable = _context.Portals
            .AsNoTracking()
            .Include(p => p.Tags)
            .AsSplitQuery(); // Split query for better performance

        // Apply filters
        if (!string.IsNullOrEmpty(query.Search))
        {
            queryable = queryable.Where(p =>
                EF.Functions.Like(p.Name, $"%{query.Search}%") ||
                EF.Functions.Like(p.Url, $"%{query.Search}%"));
        }

        if (query.Status.HasValue)
        {
            queryable = queryable.Where(p => p.Status == query.Status.Value);
        }

        // Efficient counting
        var totalCount = await queryable.CountAsync();

        // Apply sorting
        queryable = query.SortBy switch
        {
            "name" => queryable.OrderBy(p => p.Name),
            "status" => queryable.OrderBy(p => p.Status),
            "responseTime" => queryable.OrderBy(p => p.CurrentMetrics.ResponseTime),
            _ => queryable.OrderBy(p => p.CreatedAt)
        };

        // Apply pagination
        var items = await queryable
            .Skip((query.PageNumber - 1) * query.PageSize)
            .Take(query.PageSize)
            .Select(p => new PortalDto
            {
                // Project only required fields
                Id = p.Id,
                Name = p.Name,
                Url = p.Url,
                Status = p.Status,
                // Conditional includes
                CurrentMetrics = query.IncludeMetrics ? p.CurrentMetrics : null
            })
            .ToListAsync();

        return new PagedResult<Portal>(items, totalCount, query.PageNumber, query.PageSize);
    }
}
```

### Batch Processing

```csharp
public class BatchMetricsProcessor
{
    private readonly Channel<MetricsBatch> _channel;
    private readonly ILogger<BatchMetricsProcessor> _logger;

    public BatchMetricsProcessor()
    {
        var options = new UnboundedChannelOptions
        {
            SingleWriter = false,
            SingleReader = true
        };
        _channel = Channel.CreateUnbounded<MetricsBatch>(options);
    }

    public async Task EnqueueMetricsAsync(PortalMetrics metrics)
    {
        await _channel.Writer.WriteAsync(new MetricsBatch
        {
            PortalId = metrics.PortalId,
            Metrics = metrics,
            Timestamp = DateTime.UtcNow
        });
    }

    public async Task ProcessBatchAsync(CancellationToken cancellationToken)
    {
        var batch = new List<MetricsBatch>();

        await foreach (var item in _channel.Reader.ReadAllAsync(cancellationToken))
        {
            batch.Add(item);

            if (batch.Count >= 100 ||
                DateTime.UtcNow - batch[0].Timestamp > TimeSpan.FromSeconds(5))
            {
                await FlushBatchAsync(batch);
                batch.Clear();
            }
        }
    }

    private async Task FlushBatchAsync(List<MetricsBatch> batch)
    {
        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        using var transaction = connection.BeginTransaction();

        // Use TVP for bulk insert
        var dataTable = CreateMetricsDataTable(batch);

        using var command = new SqlCommand("sp_BulkInsertMetrics", connection, transaction)
        {
            CommandType = CommandType.StoredProcedure
        };

        command.Parameters.AddWithValue("@Metrics", dataTable);
        await command.ExecuteNonQueryAsync();

        transaction.Commit();

        _logger.LogInformation("Processed {Count} metrics in batch", batch.Count);
    }
}
```

### Rate Limiting

```csharp
// Configure rate limiting
builder.Services.AddRateLimiter(options =>
{
    options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(
        httpContext => RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: httpContext.User?.Identity?.Name ?? httpContext.Request.Headers.Host.ToString(),
            factory: partition => new FixedWindowRateLimiterOptions
            {
                AutoReplenishment = true,
                PermitLimit = 100,
                Window = TimeSpan.FromMinutes(1)
            }));

    options.AddPolicy("ApiKeyPolicy", httpContext =>
        RateLimitPartition.GetSlidingWindowLimiter(
            partitionKey: httpContext.Request.Headers["X-API-Key"].ToString(),
            factory: partition => new SlidingWindowRateLimiterOptions
            {
                PermitLimit = 1000,
                Window = TimeSpan.FromMinutes(1),
                SegmentsPerWindow = 4,
                AutoReplenishment = true
            }));

    options.OnRejected = async (context, token) =>
    {
        context.HttpContext.Response.StatusCode = 429;

        var problemDetails = new ProblemDetails
        {
            Status = 429,
            Title = "Rate limit exceeded",
            Detail = "Too many requests. Please retry after some time.",
            Instance = context.HttpContext.Request.Path
        };

        await context.HttpContext.Response.WriteAsJsonAsync(problemDetails, token);
    };
});

app.UseRateLimiter();
```

### Connection Pooling and Resource Management

```csharp
// Configure HttpClient with Polly
builder.Services.AddHttpClient<IMetricsCollector, MetricsCollector>()
    .ConfigurePrimaryHttpMessageHandler(() => new SocketsHttpHandler
    {
        PooledConnectionLifetime = TimeSpan.FromMinutes(5),
        PooledConnectionIdleTimeout = TimeSpan.FromMinutes(2),
        MaxConnectionsPerServer = 50
    })
    .AddPolicyHandler(GetRetryPolicy())
    .AddPolicyHandler(GetCircuitBreakerPolicy());

static IAsyncPolicy<HttpResponseMessage> GetRetryPolicy()
{
    return HttpPolicyExtensions
        .HandleTransientHttpError()
        .OrResult(msg => !msg.IsSuccessStatusCode)
        .WaitAndRetryAsync(
            3,
            retryAttempt => TimeSpan.FromSeconds(Math.Pow(2, retryAttempt)),
            onRetry: (outcome, timespan, retryCount, context) =>
            {
                var logger = context.Values["logger"] as ILogger;
                logger?.LogWarning("Retry {RetryCount} after {Delay}ms", retryCount, timespan.TotalMilliseconds);
            });
}

static IAsyncPolicy<HttpResponseMessage> GetCircuitBreakerPolicy()
{
    return HttpPolicyExtensions
        .HandleTransientHttpError()
        .CircuitBreakerAsync(
            5,
            TimeSpan.FromSeconds(30),
            onBreak: (result, timespan) =>
            {
                // Log circuit breaker opened
            },
            onReset: () =>
            {
                // Log circuit breaker closed
            });
}
```

## Sample Implementation Files

### Portal Service Implementation

```csharp
public interface IPortalService
{
    Task<PagedResult<PortalDto>> GetPortalsAsync(PortalQuery query, CancellationToken cancellationToken = default);
    Task<PortalDto> GetPortalByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<PortalDto> CreatePortalAsync(CreatePortalRequest request, CancellationToken cancellationToken = default);
    Task<PortalDto> UpdatePortalAsync(Guid id, UpdatePortalRequest request, CancellationToken cancellationToken = default);
    Task DeletePortalAsync(Guid id, CancellationToken cancellationToken = default);
    Task<PortalMetricsDto> GetPortalMetricsAsync(Guid id, CancellationToken cancellationToken = default);
}

public class PortalService : IPortalService
{
    private readonly IPortalRepository _repository;
    private readonly ICacheService _cache;
    private readonly IMapper _mapper;
    private readonly IEventBus _eventBus;
    private readonly ILogger<PortalService> _logger;

    public PortalService(
        IPortalRepository repository,
        ICacheService cache,
        IMapper mapper,
        IEventBus eventBus,
        ILogger<PortalService> logger)
    {
        _repository = repository;
        _cache = cache;
        _mapper = mapper;
        _eventBus = eventBus;
        _logger = logger;
    }

    public async Task<PagedResult<PortalDto>> GetPortalsAsync(
        PortalQuery query,
        CancellationToken cancellationToken = default)
    {
        var cacheKey = $"portals:list:{query.GetCacheKey()}";

        return await _cache.GetOrCreateAsync(
            cacheKey,
            async () =>
            {
                var portals = await _repository.GetPortalsAsync(query, cancellationToken);
                return _mapper.Map<PagedResult<PortalDto>>(portals);
            },
            new CacheOptions
            {
                AbsoluteExpiration = TimeSpan.FromMinutes(5),
                SlidingExpiration = TimeSpan.FromMinutes(2)
            });
    }

    public async Task<PortalDto> CreatePortalAsync(
        CreatePortalRequest request,
        CancellationToken cancellationToken = default)
    {
        // Validate business rules
        await ValidatePortalUrlUniqueness(request.Url, cancellationToken);

        // Create entity
        var portal = Portal.Create(
            request.Name,
            request.Url,
            request.Description,
            request.Environment,
            request.Tags);

        // Save to database
        await _repository.AddAsync(portal, cancellationToken);
        await _repository.SaveChangesAsync(cancellationToken);

        // Publish domain event
        await _eventBus.PublishAsync(new PortalCreatedEvent
        {
            PortalId = portal.Id,
            Name = portal.Name,
            Url = portal.Url,
            CreatedAt = portal.CreatedAt,
            CreatedBy = portal.CreatedBy
        }, cancellationToken);

        // Invalidate cache
        await _cache.InvalidatePrefixAsync("portals:list");

        // Map and return
        return _mapper.Map<PortalDto>(portal);
    }

    public async Task<PortalDto> UpdatePortalAsync(
        Guid id,
        UpdatePortalRequest request,
        CancellationToken cancellationToken = default)
    {
        var portal = await _repository.GetByIdAsync(id, cancellationToken);

        if (portal == null)
        {
            throw new NotFoundException($"Portal with ID {id} not found");
        }

        // Check ETag for optimistic concurrency
        if (portal.Version != request.ETag)
        {
            throw new ConcurrencyException("Portal has been modified by another user");
        }

        // Update entity
        portal.Update(
            request.Name,
            request.Url,
            request.Description,
            request.Environment,
            request.Tags);

        // Save changes
        await _repository.UpdateAsync(portal, cancellationToken);
        await _repository.SaveChangesAsync(cancellationToken);

        // Publish event
        await _eventBus.PublishAsync(new PortalUpdatedEvent
        {
            PortalId = portal.Id,
            Changes = GetChanges(portal),
            UpdatedAt = DateTime.UtcNow
        }, cancellationToken);

        // Invalidate cache
        await InvalidatePortalCache(id);

        return _mapper.Map<PortalDto>(portal);
    }

    private async Task ValidatePortalUrlUniqueness(string url, CancellationToken cancellationToken)
    {
        var existing = await _repository.GetByUrlAsync(url, cancellationToken);
        if (existing != null)
        {
            throw new BusinessRuleException($"A portal with URL '{url}' already exists");
        }
    }

    private async Task InvalidatePortalCache(Guid portalId)
    {
        var keys = new[]
        {
            $"portal:{portalId}",
            $"portal:{portalId}:metrics",
            "portals:list"
        };

        foreach (var key in keys)
        {
            await _cache.InvalidatePrefixAsync(key);
        }
    }
}
```

### Minimal API Configuration

```csharp
// Program.cs
var builder = WebApplication.CreateBuilder(args);

// Add services
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddCors();
builder.Services.AddHealthChecks();
builder.Services.AddSignalR();

// Configure authentication
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(builder.Configuration["Jwt:SecretKey"]))
        };

        // Support SignalR authentication
        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                var accessToken = context.Request.Query["access_token"];
                var path = context.HttpContext.Request.Path;

                if (!string.IsNullOrEmpty(accessToken) &&
                    path.StartsWithSegments("/hubs"))
                {
                    context.Token = accessToken;
                }

                return Task.CompletedTask;
            }
        };
    });

// Configure services
builder.Services.AddScoped<IPortalService, PortalService>();
builder.Services.AddScoped<IIncidentService, IncidentService>();
builder.Services.AddScoped<IMetricsService, MetricsService>();
builder.Services.AddSingleton<ICacheService, HybridCacheService>();

// Configure EF Core
builder.Services.AddDbContext<AppDbContext>(options =>
{
    options.UseSqlServer(
        builder.Configuration.GetConnectionString("DefaultConnection"),
        sqlOptions =>
        {
            sqlOptions.EnableRetryOnFailure(3);
            sqlOptions.CommandTimeout(30);
        });

    options.UseQueryTrackingBehavior(QueryTrackingBehavior.NoTracking);
});

// Configure Redis
builder.Services.AddStackExchangeRedisCache(options =>
{
    options.Configuration = builder.Configuration.GetConnectionString("Redis");
    options.InstanceName = "CentralCommand";
});

// Configure rate limiting
builder.Services.AddRateLimiter(options => { /* ... */ });

// Configure API versioning
builder.Services.AddApiVersioning(options => { /* ... */ });

var app = builder.Build();

// Configure middleware pipeline
app.UseHttpsRedirection();
app.UseCors();
app.UseAuthentication();
app.UseAuthorization();
app.UseRateLimiter();
app.UseResponseCaching();
app.UseResponseCompression();

// Map endpoints
var v1 = app.MapGroup("/api/v1")
    .RequireAuthorization()
    .WithOpenApi();

// Portal endpoints
v1.MapGroup("/portals")
    .MapPortalEndpoints()
    .WithTags("Portals");

// Incident endpoints
v1.MapGroup("/incidents")
    .MapIncidentEndpoints()
    .WithTags("Incidents");

// Statistics endpoints
v1.MapGroup("/statistics")
    .MapStatisticsEndpoints()
    .WithTags("Statistics")
    .CacheOutput(p => p.Expire(TimeSpan.FromSeconds(30)));

// Command palette endpoints
v1.MapGroup("/commands")
    .MapCommandEndpoints()
    .WithTags("Commands");

// User preference endpoints
v1.MapGroup("/users/me")
    .MapUserEndpoints()
    .WithTags("User");

// SignalR hubs
app.MapHub<MetricsHub>("/hubs/metrics");

// Health checks
app.MapHealthChecks("/health");

app.Run();
```

## Deployment Considerations

### Docker Configuration

```dockerfile
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 80
EXPOSE 443

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["CentralCommand.Api/CentralCommand.Api.csproj", "CentralCommand.Api/"]
RUN dotnet restore "CentralCommand.Api/CentralCommand.Api.csproj"
COPY . .
WORKDIR "/src/CentralCommand.Api"
RUN dotnet build "CentralCommand.Api.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "CentralCommand.Api.csproj" -c Release -o /app/publish

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "CentralCommand.Api.dll"]
```

### Environment Configuration

```json
// appsettings.Production.json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=sql-server;Database=CentralCommand;Trusted_Connection=False;MultipleActiveResultSets=true",
    "Redis": "redis-server:6379,abortConnect=false"
  },
  "Jwt": {
    "Issuer": "https://api.centralcommand.com",
    "Audience": "https://centralcommand.com",
    "SecretKey": "${JWT_SECRET_KEY}",
    "ExpirationMinutes": 60,
    "RefreshTokenExpirationDays": 7
  },
  "SignalR": {
    "EnableDetailedErrors": false,
    "KeepAliveInterval": 15,
    "ClientTimeoutInterval": 30,
    "MaximumReceiveMessageSize": 32768
  },
  "Caching": {
    "DefaultExpirationMinutes": 15,
    "SlidingExpirationMinutes": 5
  },
  "RateLimiting": {
    "PermitLimit": 100,
    "Window": 60
  },
  "Monitoring": {
    "ApplicationInsightsConnectionString": "${APP_INSIGHTS_CONNECTION_STRING}",
    "EnableSensitiveDataLogging": false
  }
}
```

This comprehensive API design provides a robust, scalable foundation for your Central Command portal management system, with careful consideration for performance, real-time updates, and integration with your React frontend using Zustand and TanStack Query.