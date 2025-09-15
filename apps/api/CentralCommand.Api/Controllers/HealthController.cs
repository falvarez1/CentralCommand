using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CentralCommand.Api.Infrastructure.Data;
using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace CentralCommand.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class HealthController : ControllerBase
{
    private readonly ApplicationDbContext _dbContext;
    private readonly HealthCheckService _healthCheckService;
    private readonly ILogger<HealthController> _logger;

    public HealthController(
        ApplicationDbContext dbContext,
        HealthCheckService healthCheckService,
        ILogger<HealthController> logger)
    {
        _dbContext = dbContext;
        _healthCheckService = healthCheckService;
        _logger = logger;
    }

    /// <summary>
    /// Get basic health status
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status503ServiceUnavailable)]
    public async Task<IActionResult> GetHealth(CancellationToken cancellationToken = default)
    {
        var report = await _healthCheckService.CheckHealthAsync(cancellationToken);

        var response = new
        {
            Status = report.Status.ToString(),
            Duration = report.TotalDuration.TotalMilliseconds,
            Timestamp = DateTime.UtcNow,
            Checks = report.Entries.Select(e => new
            {
                Name = e.Key,
                Status = e.Value.Status.ToString(),
                Duration = e.Value.Duration.TotalMilliseconds,
                Description = e.Value.Description,
                Tags = e.Value.Tags
            })
        };

        return report.Status == HealthStatus.Healthy
            ? Ok(response)
            : StatusCode(StatusCodes.Status503ServiceUnavailable, response);
    }

    /// <summary>
    /// Get detailed health information
    /// </summary>
    [HttpGet("detailed")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetDetailedHealth(CancellationToken cancellationToken = default)
    {
        var dbHealthy = await CheckDatabaseHealth(cancellationToken);
        var memoryInfo = GetMemoryInfo();
        var diskInfo = GetDiskInfo();

        var response = new
        {
            Status = dbHealthy ? "Healthy" : "Unhealthy",
            Timestamp = DateTime.UtcNow,
            Environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Production",
            Database = new
            {
                Connected = dbHealthy,
                Provider = _dbContext.Database.ProviderName,
                PendingMigrations = (await _dbContext.Database.GetPendingMigrationsAsync(cancellationToken)).Count()
            },
            Memory = memoryInfo,
            Disk = diskInfo,
            Application = new
            {
                Version = GetType().Assembly.GetName().Version?.ToString() ?? "1.0.0",
                StartTime = Process.GetCurrentProcess().StartTime,
                Uptime = DateTime.UtcNow - Process.GetCurrentProcess().StartTime,
                ThreadCount = Process.GetCurrentProcess().Threads.Count,
                HandleCount = Process.GetCurrentProcess().HandleCount
            }
        };

        return Ok(response);
    }

    /// <summary>
    /// Get liveness probe for Kubernetes
    /// </summary>
    [HttpGet("live")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public IActionResult GetLiveness()
    {
        return Ok(new { Status = "Alive", Timestamp = DateTime.UtcNow });
    }

    /// <summary>
    /// Get readiness probe for Kubernetes
    /// </summary>
    [HttpGet("ready")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status503ServiceUnavailable)]
    public async Task<IActionResult> GetReadiness(CancellationToken cancellationToken = default)
    {
        try
        {
            // Check if database is accessible
            var canConnect = await _dbContext.Database.CanConnectAsync(cancellationToken);

            if (!canConnect)
            {
                _logger.LogWarning("Readiness check failed: Cannot connect to database");
                return StatusCode(StatusCodes.Status503ServiceUnavailable, new { Status = "NotReady", Reason = "Database connection failed" });
            }

            return Ok(new { Status = "Ready", Timestamp = DateTime.UtcNow });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Readiness check failed");
            return StatusCode(StatusCodes.Status503ServiceUnavailable, new { Status = "NotReady", Reason = ex.Message });
        }
    }

    /// <summary>
    /// Get startup probe for Kubernetes
    /// </summary>
    [HttpGet("startup")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status503ServiceUnavailable)]
    public async Task<IActionResult> GetStartup(CancellationToken cancellationToken = default)
    {
        try
        {
            // Check if migrations are applied
            var pendingMigrations = await _dbContext.Database.GetPendingMigrationsAsync(cancellationToken);
            if (pendingMigrations.Any())
            {
                return StatusCode(StatusCodes.Status503ServiceUnavailable, new
                {
                    Status = "Starting",
                    Reason = "Database migrations pending",
                    PendingMigrations = pendingMigrations.Count()
                });
            }

            return Ok(new { Status = "Started", Timestamp = DateTime.UtcNow });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Startup check failed");
            return StatusCode(StatusCodes.Status503ServiceUnavailable, new { Status = "Starting", Reason = ex.Message });
        }
    }

    private async Task<bool> CheckDatabaseHealth(CancellationToken cancellationToken)
    {
        try
        {
            return await _dbContext.Database.CanConnectAsync(cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Database health check failed");
            return false;
        }
    }

    private object GetMemoryInfo()
    {
        var process = Process.GetCurrentProcess();
        var gcInfo = GC.GetMemoryInfo();

        return new
        {
            WorkingSet = process.WorkingSet64 / (1024 * 1024), // MB
            PrivateMemory = process.PrivateMemorySize64 / (1024 * 1024), // MB
            VirtualMemory = process.VirtualMemorySize64 / (1024 * 1024), // MB
            GC = new
            {
                HeapSize = gcInfo.HeapSizeBytes / (1024 * 1024), // MB
                Fragmented = gcInfo.FragmentedBytes / (1024 * 1024), // MB
                HighMemoryThreshold = gcInfo.HighMemoryLoadThresholdBytes / (1024 * 1024), // MB
                TotalAvailable = gcInfo.TotalAvailableMemoryBytes / (1024 * 1024), // MB
                Gen0Collections = GC.CollectionCount(0),
                Gen1Collections = GC.CollectionCount(1),
                Gen2Collections = GC.CollectionCount(2)
            }
        };
    }

    private object GetDiskInfo()
    {
        try
        {
            var drives = DriveInfo.GetDrives()
                .Where(d => d.IsReady)
                .Select(d => new
                {
                    Name = d.Name,
                    Type = d.DriveType.ToString(),
                    Format = d.DriveFormat,
                    TotalSize = d.TotalSize / (1024 * 1024 * 1024), // GB
                    AvailableSpace = d.AvailableFreeSpace / (1024 * 1024 * 1024), // GB
                    UsedSpace = (d.TotalSize - d.AvailableFreeSpace) / (1024 * 1024 * 1024), // GB
                    UsagePercent = Math.Round(((double)(d.TotalSize - d.AvailableFreeSpace) / d.TotalSize) * 100, 2)
                });

            return drives;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get disk information");
            return new { Error = "Unable to retrieve disk information" };
        }
    }
}