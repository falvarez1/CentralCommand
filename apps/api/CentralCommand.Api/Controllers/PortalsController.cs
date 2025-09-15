using Microsoft.AspNetCore.Mvc;
using CentralCommand.Api.Models;
using CentralCommand.Api.Services;

namespace CentralCommand.Api.Controllers;

/// <summary>
/// Controller for portal management endpoints
/// </summary>
[ApiController]
[Route("api/v1/[controller]")]
public class PortalsController : ControllerBase
{
    private readonly MockDataService _mockDataService;
    private readonly ILogger<PortalsController> _logger;

    public PortalsController(MockDataService mockDataService, ILogger<PortalsController> logger)
    {
        _mockDataService = mockDataService;
        _logger = logger;
    }

    /// <summary>
    /// Get all portals with optional filtering
    /// </summary>
    [HttpGet]
    public ActionResult<ApiResponse<List<Portal>>> GetPortals(
        [FromQuery] string? category = null,
        [FromQuery] string? status = null,
        [FromQuery] string? environment = null,
        [FromQuery] string? priority = null,
        [FromQuery] string? searchTerm = null,
        [FromQuery] bool? isFavorite = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var portals = _mockDataService.GetPortals();

        // Apply filters
        if (!string.IsNullOrEmpty(category) && Enum.TryParse<PortalCategory>(category, true, out var cat))
        {
            portals = portals.Where(p => p.Category == cat).ToList();
        }

        if (!string.IsNullOrEmpty(status) && Enum.TryParse<PortalStatus>(status, true, out var stat))
        {
            portals = portals.Where(p => p.Status == stat).ToList();
        }

        if (!string.IsNullOrEmpty(environment) && Enum.TryParse<PortalEnvironment>(environment, true, out var env))
        {
            portals = portals.Where(p => p.Environment == env).ToList();
        }

        if (!string.IsNullOrEmpty(priority) && Enum.TryParse<PortalPriority>(priority, true, out var prio))
        {
            portals = portals.Where(p => p.Priority == prio).ToList();
        }

        if (!string.IsNullOrEmpty(searchTerm))
        {
            var searchLower = searchTerm.ToLower();
            portals = portals.Where(p =>
                p.Name.ToLower().Contains(searchLower) ||
                (p.Description?.ToLower().Contains(searchLower) ?? false) ||
                p.Tags.Any(t => t.ToLower().Contains(searchLower))
            ).ToList();
        }

        if (isFavorite.HasValue)
        {
            portals = portals.Where(p => p.IsFavorite == isFavorite.Value).ToList();
        }

        // Apply pagination
        var totalItems = portals.Count;
        var totalPages = (int)Math.Ceiling(totalItems / (double)pageSize);
        var paginatedPortals = portals
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToList();

        var response = new ApiResponse<List<Portal>>
        {
            Status = ApiStatus.Success,
            Data = paginatedPortals,
            Metadata = new ApiMetadata
            {
                Timestamp = DateTime.UtcNow,
                RequestId = Guid.NewGuid().ToString(),
                Pagination = new PaginationResponse
                {
                    Page = page,
                    PageSize = pageSize,
                    TotalPages = totalPages,
                    TotalItems = totalItems,
                    HasNext = page < totalPages,
                    HasPrevious = page > 1
                }
            }
        };

        return Ok(response);
    }

    /// <summary>
    /// Get a specific portal by ID
    /// </summary>
    [HttpGet("{id}")]
    public ActionResult<ApiResponse<Portal>> GetPortal(Guid id)
    {
        var portal = _mockDataService.GetPortal(id);

        if (portal == null)
        {
            return NotFound(new ApiResponse<Portal>
            {
                Status = ApiStatus.Error,
                Error = new ApiError
                {
                    Code = ErrorCode.NotFound,
                    Message = $"Portal with ID {id} not found",
                    Timestamp = DateTime.UtcNow
                }
            });
        }

        return Ok(new ApiResponse<Portal>
        {
            Status = ApiStatus.Success,
            Data = portal,
            Metadata = new ApiMetadata
            {
                Timestamp = DateTime.UtcNow,
                RequestId = Guid.NewGuid().ToString()
            }
        });
    }

    /// <summary>
    /// Update portal metrics
    /// </summary>
    [HttpPost("{id}/metrics")]
    public ActionResult<ApiResponse<PortalMetrics>> UpdatePortalMetrics(Guid id, [FromBody] PortalMetrics? metrics = null)
    {
        var portal = _mockDataService.GetPortal(id);

        if (portal == null)
        {
            return NotFound(new ApiResponse<PortalMetrics>
            {
                Status = ApiStatus.Error,
                Error = new ApiError
                {
                    Code = ErrorCode.NotFound,
                    Message = $"Portal with ID {id} not found",
                    Timestamp = DateTime.UtcNow
                }
            });
        }

        // Update with provided metrics or generate new ones
        if (metrics != null)
        {
            portal.Metrics = metrics;
        }
        else
        {
            _mockDataService.UpdatePortalMetrics(id);
        }

        portal.LastChecked = DateTime.UtcNow;
        portal.UpdatedAt = DateTime.UtcNow;
        portal.ETag = GenerateETag();

        _logger.LogInformation($"Updated metrics for portal {id}");

        return Ok(new ApiResponse<PortalMetrics>
        {
            Status = ApiStatus.Success,
            Data = portal.Metrics,
            Metadata = new ApiMetadata
            {
                Timestamp = DateTime.UtcNow,
                RequestId = Guid.NewGuid().ToString()
            }
        });
    }

    /// <summary>
    /// Get portal statistics
    /// </summary>
    [HttpGet("stats")]
    public ActionResult<ApiResponse<PortalStats>> GetPortalStats()
    {
        var statisticsService = HttpContext.RequestServices.GetRequiredService<StatisticsService>();
        var stats = statisticsService.GetPortalStats();

        return Ok(new ApiResponse<PortalStats>
        {
            Status = ApiStatus.Success,
            Data = stats,
            Metadata = new ApiMetadata
            {
                Timestamp = DateTime.UtcNow,
                RequestId = Guid.NewGuid().ToString()
            }
        });
    }

    /// <summary>
    /// Get portal metrics history
    /// </summary>
    [HttpGet("{id}/metrics/history")]
    public ActionResult<ApiResponse<MetricsHistory>> GetPortalMetricsHistory(
        Guid id,
        [FromQuery] MetricsTimeRange timeRange = MetricsTimeRange.Last24Hours)
    {
        var metricsHistory = _mockDataService.GetPortalMetricsHistory(id, timeRange);

        if (metricsHistory == null)
        {
            return NotFound(new ApiResponse<MetricsHistory>
            {
                Status = ApiStatus.Error,
                Error = new ApiError
                {
                    Code = ErrorCode.NotFound,
                    Message = $"Portal with ID {id} not found or no metrics history available",
                    Timestamp = DateTime.UtcNow
                }
            });
        }

        _logger.LogInformation($"Retrieved metrics history for portal {id} with time range {timeRange}");

        return Ok(new ApiResponse<MetricsHistory>
        {
            Status = ApiStatus.Success,
            Data = metricsHistory,
            Metadata = new ApiMetadata
            {
                Timestamp = DateTime.UtcNow,
                RequestId = Guid.NewGuid().ToString()
            }
        });
    }

    /// <summary>
    /// Get portal health check configuration
    /// </summary>
    [HttpGet("{id}/health")]
    public ActionResult<ApiResponse<PortalHealth>> GetPortalHealth(Guid id)
    {
        var portalHealth = _mockDataService.GetPortalHealth(id);

        if (portalHealth == null)
        {
            return NotFound(new ApiResponse<PortalHealth>
            {
                Status = ApiStatus.Error,
                Error = new ApiError
                {
                    Code = ErrorCode.NotFound,
                    Message = $"Portal with ID {id} not found or health data not available",
                    Timestamp = DateTime.UtcNow
                }
            });
        }

        _logger.LogInformation($"Retrieved health check configuration for portal {id}");

        return Ok(new ApiResponse<PortalHealth>
        {
            Status = ApiStatus.Success,
            Data = portalHealth,
            Metadata = new ApiMetadata
            {
                Timestamp = DateTime.UtcNow,
                RequestId = Guid.NewGuid().ToString()
            }
        });
    }

    /// <summary>
    /// Perform batch operations on multiple portals
    /// </summary>
    [HttpPost("batch")]
    public ActionResult<ApiResponse<BatchOperationResponse>> PerformBatchOperation([FromBody] BatchOperationRequest request)
    {
        if (request.PortalIds == null || !request.PortalIds.Any())
        {
            return BadRequest(new ApiResponse<BatchOperationResponse>
            {
                Status = ApiStatus.Error,
                Error = new ApiError
                {
                    Code = ErrorCode.ValidationError,
                    Message = "Portal IDs are required for batch operations",
                    Timestamp = DateTime.UtcNow
                }
            });
        }

        var response = _mockDataService.PerformBatchOperation(request);

        _logger.LogInformation($"Performed batch operation {request.Operation} on {request.PortalIds.Count} portals. Success: {response.SuccessCount}, Failed: {response.FailureCount}");

        return Ok(new ApiResponse<BatchOperationResponse>
        {
            Status = ApiStatus.Success,
            Data = response,
            Metadata = new ApiMetadata
            {
                Timestamp = DateTime.UtcNow,
                RequestId = Guid.NewGuid().ToString()
            }
        });
    }

    private static string GenerateETag()
    {
        return $"\"{Guid.NewGuid():N}\"";
    }
}

/// <summary>
/// API response wrapper
/// </summary>
public class ApiResponse<T>
{
    public ApiStatus Status { get; set; }
    public T? Data { get; set; }
    public ApiError? Error { get; set; }
    public ApiMetadata? Metadata { get; set; }
}

/// <summary>
/// API status enum
/// </summary>
public enum ApiStatus
{
    Success,
    Error,
    Pending,
    Cancelled
}

/// <summary>
/// API error codes
/// </summary>
public enum ErrorCode
{
    NotFound = 3001,
    ValidationError = 2001,
    InternalError = 5001,
    Unauthorized = 1001
}

/// <summary>
/// API error structure
/// </summary>
public class ApiError
{
    public ErrorCode Code { get; set; }
    public string Message { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; }
    public string? TraceId { get; set; }
}

/// <summary>
/// API metadata
/// </summary>
public class ApiMetadata
{
    public DateTime Timestamp { get; set; }
    public string RequestId { get; set; } = string.Empty;
    public string? Version { get; set; }
    public PaginationResponse? Pagination { get; set; }
}

/// <summary>
/// Pagination response
/// </summary>
public class PaginationResponse
{
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalPages { get; set; }
    public int TotalItems { get; set; }
    public bool HasNext { get; set; }
    public bool HasPrevious { get; set; }
}