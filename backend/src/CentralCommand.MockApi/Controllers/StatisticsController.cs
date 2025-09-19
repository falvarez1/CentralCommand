using Microsoft.AspNetCore.Mvc;
using CentralCommand.MockApi.Models;
using CentralCommand.MockApi.Services;

namespace CentralCommand.MockApi.Controllers;

/// <summary>
/// Controller for system statistics endpoints
/// </summary>
[ApiController]
[Route("api/v1/[controller]")]
public class StatisticsController : ControllerBase
{
    private readonly StatisticsService _statisticsService;
    private readonly ILogger<StatisticsController> _logger;

    public StatisticsController(StatisticsService statisticsService, ILogger<StatisticsController> logger)
    {
        _statisticsService = statisticsService;
        _logger = logger;
    }

    /// <summary>
    /// Get system-wide statistics
    /// </summary>
    [HttpGet]
    public ActionResult<ApiResponse<SystemStats>> GetStatistics()
    {
        var stats = _statisticsService.GetSystemStats();

        return Ok(new ApiResponse<SystemStats>
        {
            Status = ApiStatus.Success,
            Data = stats,
            Metadata = new ApiMetadata
            {
                Timestamp = DateTime.UtcNow,
                RequestId = Guid.NewGuid().ToString(),
                Version = "1.0.0"
            }
        });
    }

    /// <summary>
    /// Get sparkline data for metrics visualization
    /// </summary>
    [HttpGet("sparklines")]
    public ActionResult<ApiResponse<Dictionary<string, List<MetricDataPoint>>>> GetSparklines(
        [FromQuery] string? metrics = null,
        [FromQuery] int hours = 24)
    {
        var allSparklines = _statisticsService.GetSparklines();

        // Filter by requested metrics if specified
        if (!string.IsNullOrEmpty(metrics))
        {
            var requestedMetrics = metrics.Split(',').Select(m => m.Trim().ToLower()).ToHashSet();
            allSparklines = allSparklines
                .Where(kvp => requestedMetrics.Contains(kvp.Key.ToLower()))
                .ToDictionary(kvp => kvp.Key, kvp => kvp.Value);
        }

        // Limit data points based on hours parameter
        if (hours < 24)
        {
            var cutoffTime = DateTime.UtcNow.AddHours(-hours);
            foreach (var key in allSparklines.Keys.ToList())
            {
                allSparklines[key] = allSparklines[key]
                    .Where(dp => dp.Timestamp >= cutoffTime)
                    .ToList();
            }
        }

        return Ok(new ApiResponse<Dictionary<string, List<MetricDataPoint>>>
        {
            Status = ApiStatus.Success,
            Data = allSparklines,
            Metadata = new ApiMetadata
            {
                Timestamp = DateTime.UtcNow,
                RequestId = Guid.NewGuid().ToString()
            }
        });
    }

    /// <summary>
    /// Get health check status
    /// </summary>
    [HttpGet("health")]
    public ActionResult<ApiResponse<HealthCheckResponse>> GetHealthStatus()
    {
        var stats = _statisticsService.GetSystemStats();

        var health = new HealthCheckResponse
        {
            Status = stats.HealthScore > 80 ? "healthy" : stats.HealthScore > 60 ? "degraded" : "unhealthy",
            Version = "1.0.0",
            Uptime = (int)(DateTime.UtcNow - System.Diagnostics.Process.GetCurrentProcess().StartTime).TotalSeconds,
            Timestamp = DateTime.UtcNow,
            Services = new List<ServiceHealth>
            {
                new() { Name = "Database", Status = "up", ResponseTime = 12 },
                new() { Name = "Cache", Status = "up", ResponseTime = 2 },
                new() { Name = "Queue", Status = "up", ResponseTime = 5 },
                new() { Name = "Storage", Status = "up", ResponseTime = 18 }
            },
            Metrics = new HealthMetrics
            {
                RequestsPerSecond = stats.TotalRequests / 86400.0, // Assuming 24h period
                AverageResponseTime = stats.AverageResponseTime,
                ErrorRate = stats.ErrorRate,
                ActiveConnections = stats.ConcurrentSessions
            }
        };

        return Ok(new ApiResponse<HealthCheckResponse>
        {
            Status = ApiStatus.Success,
            Data = health,
            Metadata = new ApiMetadata
            {
                Timestamp = DateTime.UtcNow,
                RequestId = Guid.NewGuid().ToString()
            }
        });
    }

    /// <summary>
    /// Get performance metrics
    /// </summary>
    [HttpGet("performance")]
    public ActionResult<ApiResponse<PerformanceMetrics>> GetPerformanceMetrics()
    {
        var stats = _statisticsService.GetSystemStats();

        var performance = new PerformanceMetrics
        {
            Cpu = new MetricSummary
            {
                Current = stats.AverageCpu,
                Average = stats.AverageCpu,
                Peak = Math.Min(100, stats.AverageCpu * 1.3),
                Trend = stats.AverageCpu > 70 ? "up" : "stable"
            },
            Memory = new MetricSummary
            {
                Current = stats.AverageMemory,
                Average = stats.AverageMemory,
                Peak = Math.Min(100, stats.AverageMemory * 1.2),
                Trend = stats.AverageMemory > 80 ? "up" : "stable"
            },
            Disk = new MetricSummary
            {
                Current = stats.DiskUsage,
                Average = stats.DiskUsage,
                Peak = Math.Min(100, stats.DiskUsage * 1.1),
                Trend = stats.DiskUsage > 60 ? "up" : "stable"
            },
            Network = new MetricSummary
            {
                Current = stats.NetworkLatency,
                Average = stats.NetworkLatency,
                Peak = stats.NetworkLatency * 1.5,
                Trend = stats.NetworkLatency > 100 ? "up" : "stable"
            },
            Timestamp = DateTime.UtcNow
        };

        return Ok(new ApiResponse<PerformanceMetrics>
        {
            Status = ApiStatus.Success,
            Data = performance,
            Metadata = new ApiMetadata
            {
                Timestamp = DateTime.UtcNow,
                RequestId = Guid.NewGuid().ToString()
            }
        });
    }
}

/// <summary>
/// Health check response model
/// </summary>
public record HealthCheckResponse
{
    public string Status { get; init; } = string.Empty;
    public string Version { get; init; } = string.Empty;
    public int Uptime { get; init; }
    public DateTime Timestamp { get; init; }
    public List<ServiceHealth> Services { get; init; } = new();
    public HealthMetrics? Metrics { get; init; }
}

/// <summary>
/// Service health status
/// </summary>
public record ServiceHealth
{
    public string Name { get; init; } = string.Empty;
    public string Status { get; init; } = string.Empty;
    public double? ResponseTime { get; init; }
    public DateTime? LastCheck { get; init; }
    public string? Message { get; init; }
}

/// <summary>
/// Health metrics
/// </summary>
public record HealthMetrics
{
    public double RequestsPerSecond { get; init; }
    public double AverageResponseTime { get; init; }
    public double ErrorRate { get; init; }
    public int ActiveConnections { get; init; }
}

/// <summary>
/// Performance metrics response
/// </summary>
public record PerformanceMetrics
{
    public MetricSummary Cpu { get; init; } = new();
    public MetricSummary Memory { get; init; } = new();
    public MetricSummary Disk { get; init; } = new();
    public MetricSummary Network { get; init; } = new();
    public DateTime Timestamp { get; init; }
}

/// <summary>
/// Metric summary
/// </summary>
public record MetricSummary
{
    public double Current { get; init; }
    public double Average { get; init; }
    public double Peak { get; init; }
    public string Trend { get; init; } = "stable";
}