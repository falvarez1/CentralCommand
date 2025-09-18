using CentralCommand.Api.Application.Commands.Dev;
using CentralCommand.Api.Application.Queries.Dev;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace CentralCommand.Api.Controllers;

/// <summary>
/// Development-only controller for database operations
/// </summary>
[ApiController]
[Route("api/v1/[controller]")]
[Produces("application/json")]
public class DevController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ILogger<DevController> _logger;
    private readonly IWebHostEnvironment _environment;

    public DevController(
        IMediator mediator,
        ILogger<DevController> logger,
        IWebHostEnvironment environment)
    {
        _mediator = mediator;
        _logger = logger;
        _environment = environment;
    }

    /// <summary>
    /// Seeds the database with sample data
    /// </summary>
    [HttpPost("seed")]
    [ProducesResponseType(typeof(SeedDatabaseResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> SeedData([FromBody] SeedDatabaseCommand? command = null)
    {
        if (!_environment.IsDevelopment())
        {
            return Forbid("This endpoint is only available in development environment");
        }

        try
        {
            var result = await _mediator.Send(command ?? new SeedDatabaseCommand());
            return Ok(result);
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
    [ProducesResponseType(typeof(ClearDatabaseResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> ClearData()
    {
        if (!_environment.IsDevelopment())
        {
            return Forbid("This endpoint is only available in development environment");
        }

        try
        {
            var result = await _mediator.Send(new ClearDatabaseCommand());
            return Ok(result);
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
    [ProducesResponseType(typeof(ResetDatabaseResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> ResetData()
    {
        if (!_environment.IsDevelopment())
        {
            return Forbid("This endpoint is only available in development environment");
        }

        try
        {
            var result = await _mediator.Send(new ResetDatabaseCommand());
            return Ok(result);
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
    [ProducesResponseType(typeof(DatabaseStatsResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetStats()
    {
        if (!_environment.IsDevelopment())
        {
            return Forbid("This endpoint is only available in development environment");
        }

        var result = await _mediator.Send(new GetDatabaseStatsQuery());
        return Ok(result);
    }

    /// <summary>
    /// Tests database connectivity
    /// </summary>
    [HttpGet("health")]
    [ProducesResponseType(typeof(DatabaseHealthResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(DatabaseHealthResponse), StatusCodes.Status503ServiceUnavailable)]
    public async Task<IActionResult> CheckHealth()
    {
        try
        {
            var result = await _mediator.Send(new CheckDatabaseHealthQuery());

            if (result.Status == "healthy")
            {
                return Ok(result);
            }

            return StatusCode(503, result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Health check failed");
            return StatusCode(503, new DatabaseHealthResponse
            {
                Status = "unhealthy",
                Error = ex.Message,
                Environment = _environment.EnvironmentName
            });
        }
    }
}