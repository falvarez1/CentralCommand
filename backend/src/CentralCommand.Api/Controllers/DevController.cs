using CentralCommand.Api.Infrastructure.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CentralCommand.Api.Controllers;

/// <summary>
/// Development-only controller for database operations
/// </summary>
[ApiController]
[Route("api/v1/[controller]")]
[Produces("application/json")]
public class DevController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly DataSeedingService _seedingService;
    private readonly ILogger<DevController> _logger;
    private readonly IWebHostEnvironment _environment;

    public DevController(
        ApplicationDbContext context,
        ILogger<DevController> logger,
        IWebHostEnvironment environment)
    {
        _context = context;
        _logger = logger;
        _environment = environment;
        _seedingService = new DataSeedingService(context, logger as ILogger<DataSeedingService> ??
            new LoggerFactory().CreateLogger<DataSeedingService>());
    }

    /// <summary>
    /// Seeds the database with sample data
    /// </summary>
    [HttpPost("seed")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> SeedData()
    {
        if (!_environment.IsDevelopment())
        {
            return Forbid("This endpoint is only available in development environment");
        }

        try
        {
            await _seedingService.SeedAsync();

            var stats = new
            {
                portals = await _context.Portals.CountAsync(),
                incidents = await _context.Incidents.CountAsync(),
                healthChecks = await _context.HealthChecks.CountAsync(),
                metricsHistory = await _context.MetricsHistory.CountAsync(),
                message = "Database seeded successfully"
            };

            return Ok(stats);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error seeding database");
            return StatusCode(500, new { error = "Failed to seed database", details = ex.Message });
        }
    }

    /// <summary>
    /// Clears all data from the database
    /// </summary>
    [HttpDelete("clear")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> ClearData()
    {
        if (!_environment.IsDevelopment())
        {
            return Forbid("This endpoint is only available in development environment");
        }

        try
        {
            _logger.LogWarning("Clearing all data from database");

            // Clear data in correct order to respect foreign keys
            _context.Comments.RemoveRange(_context.Comments);
            _context.MetricsHistory.RemoveRange(_context.MetricsHistory);
            _context.HealthChecks.RemoveRange(_context.HealthChecks);
            _context.Incidents.RemoveRange(_context.Incidents);
            _context.Portals.RemoveRange(_context.Portals);

            await _context.SaveChangesAsync();

            _logger.LogInformation("Database cleared successfully");
            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error clearing database");
            return StatusCode(500, new { error = "Failed to clear database", details = ex.Message });
        }
    }

    /// <summary>
    /// Resets the database (clear and seed)
    /// </summary>
    [HttpPost("reset")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> ResetData()
    {
        if (!_environment.IsDevelopment())
        {
            return Forbid("This endpoint is only available in development environment");
        }

        try
        {
            _logger.LogWarning("Resetting database");

            // Clear existing data
            _context.Comments.RemoveRange(_context.Comments);
            _context.MetricsHistory.RemoveRange(_context.MetricsHistory);
            _context.HealthChecks.RemoveRange(_context.HealthChecks);
            _context.Incidents.RemoveRange(_context.Incidents);
            _context.Portals.RemoveRange(_context.Portals);
            await _context.SaveChangesAsync();

            // Seed new data
            await _seedingService.SeedAsync();

            var stats = new
            {
                portals = await _context.Portals.CountAsync(),
                incidents = await _context.Incidents.CountAsync(),
                healthChecks = await _context.HealthChecks.CountAsync(),
                metricsHistory = await _context.MetricsHistory.CountAsync(),
                message = "Database reset successfully"
            };

            return Ok(stats);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error resetting database");
            return StatusCode(500, new { error = "Failed to reset database", details = ex.Message });
        }
    }

    /// <summary>
    /// Gets database statistics
    /// </summary>
    [HttpGet("stats")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetStats()
    {
        if (!_environment.IsDevelopment())
        {
            return Forbid("This endpoint is only available in development environment");
        }

        var stats = new
        {
            database = new
            {
                provider = _context.Database.ProviderName,
                canConnect = await _context.Database.CanConnectAsync(),
                isInMemory = _context.Database.IsInMemory()
            },
            counts = new
            {
                portals = await _context.Portals.CountAsync(),
                incidents = await _context.Incidents.CountAsync(),
                healthChecks = await _context.HealthChecks.CountAsync(),
                metricsHistory = await _context.MetricsHistory.CountAsync(),
                comments = await _context.Comments.CountAsync()
            },
            recent = new
            {
                lastPortalCreated = await _context.Portals.OrderByDescending(p => p.CreatedAt).Select(p => p.CreatedAt).FirstOrDefaultAsync(),
                lastIncidentCreated = await _context.Incidents.OrderByDescending(i => i.CreatedAt).Select(i => i.CreatedAt).FirstOrDefaultAsync(),
                lastHealthCheck = await _context.HealthChecks.OrderByDescending(h => h.CheckedAt).Select(h => h.CheckedAt).FirstOrDefaultAsync()
            }
        };

        return Ok(stats);
    }

    /// <summary>
    /// Tests database connectivity
    /// </summary>
    [HttpGet("health")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status503ServiceUnavailable)]
    public async Task<IActionResult> CheckHealth()
    {
        try
        {
            var canConnect = await _context.Database.CanConnectAsync();

            if (canConnect)
            {
                return Ok(new
                {
                    status = "healthy",
                    database = _context.Database.ProviderName,
                    isInMemory = _context.Database.IsInMemory(),
                    environment = _environment.EnvironmentName
                });
            }

            return StatusCode(503, new { status = "unhealthy", error = "Cannot connect to database" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Health check failed");
            return StatusCode(503, new { status = "unhealthy", error = ex.Message });
        }
    }
}