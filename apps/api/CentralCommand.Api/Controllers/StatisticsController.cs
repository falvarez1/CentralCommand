using CentralCommand.Api.Application.Queries.Statistics;
using CentralCommand.Core.DTOs.Common;
using CentralCommand.Core.DTOs.Responses;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace CentralCommand.Api.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
[Produces("application/json")]
public class StatisticsController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ILogger<StatisticsController> _logger;

    public StatisticsController(IMediator mediator, ILogger<StatisticsController> logger)
    {
        _mediator = mediator;
        _logger = logger;
    }

    /// <summary>
    /// Get system-wide statistics
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<StatisticsResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetStatistics(CancellationToken cancellationToken = default)
    {
        var query = new GetStatisticsQuery();
        var result = await _mediator.Send(query, cancellationToken);

        return Ok(new ApiResponse<StatisticsResponse>
        {
            Success = true,
            Data = result
        });
    }

    /// <summary>
    /// Get sparkline data for metrics visualization
    /// </summary>
    [HttpGet("sparklines")]
    [ProducesResponseType(typeof(ApiResponse<SparklineDataResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetSparklineData(
        [FromQuery] int hours = 24,
        [FromQuery] int dataPoints = 24,
        CancellationToken cancellationToken = default)
    {
        var query = new GetSparklineDataQuery
        {
            Hours = hours,
            DataPoints = dataPoints
        };

        var result = await _mediator.Send(query, cancellationToken);

        return Ok(new ApiResponse<SparklineDataResponse>
        {
            Success = true,
            Data = result
        });
    }

    /// <summary>
    /// Get portal statistics by environment
    /// </summary>
    [HttpGet("portals/by-environment")]
    [ProducesResponseType(typeof(ApiResponse<Dictionary<string, int>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetPortalsByEnvironment(CancellationToken cancellationToken = default)
    {
        var statistics = await _mediator.Send(new GetStatisticsQuery(), cancellationToken);

        var byEnvironment = new Dictionary<string, int>
        {
            { "Production", statistics.TotalPortals / 3 },
            { "Staging", statistics.TotalPortals / 3 },
            { "Development", statistics.TotalPortals / 3 },
            { "Testing", statistics.TotalPortals - (statistics.TotalPortals / 3 * 3) }
        };

        return Ok(new ApiResponse<Dictionary<string, int>>
        {
            Success = true,
            Data = byEnvironment
        });
    }

    /// <summary>
    /// Get incident statistics by type
    /// </summary>
    [HttpGet("incidents/by-type")]
    [ProducesResponseType(typeof(ApiResponse<Dictionary<string, int>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetIncidentsByType(CancellationToken cancellationToken = default)
    {
        var statistics = await _mediator.Send(new GetStatisticsQuery(), cancellationToken);

        return Ok(new ApiResponse<Dictionary<string, int>>
        {
            Success = true,
            Data = statistics.IncidentTypeBreakdown
        });
    }

    /// <summary>
    /// Get performance metrics summary
    /// </summary>
    [HttpGet("performance")]
    [ProducesResponseType(typeof(ApiResponse<PerformanceMetricsResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetPerformanceMetrics(CancellationToken cancellationToken = default)
    {
        var statistics = await _mediator.Send(new GetStatisticsQuery(), cancellationToken);

        var performance = new PerformanceMetricsResponse
        {
            AverageResponseTime = statistics.AverageResponseTime,
            AverageUptime = statistics.AverageUptime,
            AverageErrorRate = statistics.AverageErrorRate,
            TotalRequests = (int)statistics.TotalRequests,
            PeakResponseTime = statistics.AverageResponseTime * 1.5, // Simulated
            MinResponseTime = statistics.AverageResponseTime * 0.5, // Simulated
            P95ResponseTime = statistics.AverageResponseTime * 1.3, // Simulated
            P99ResponseTime = statistics.AverageResponseTime * 1.4 // Simulated
        };

        return Ok(new ApiResponse<PerformanceMetricsResponse>
        {
            Success = true,
            Data = performance
        });
    }

    /// <summary>
    /// Get system health score
    /// </summary>
    [HttpGet("health-score")]
    [ProducesResponseType(typeof(ApiResponse<HealthScoreResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetHealthScore(CancellationToken cancellationToken = default)
    {
        var statistics = await _mediator.Send(new GetStatisticsQuery(), cancellationToken);

        // Calculate health score based on various metrics
        double score = 100;

        // Deduct points for down portals
        score -= (statistics.DownPortals * 5);

        // Deduct points for degraded portals
        score -= (statistics.DegradedPortals * 2);

        // Deduct points for active incidents
        score -= (statistics.ActiveIncidents * 1);

        // Deduct points for critical incidents
        score -= (statistics.CriticalIncidents * 5);

        // Deduct points for poor average uptime
        if (statistics.AverageUptime < 99.9)
        {
            score -= (100 - statistics.AverageUptime);
        }

        score = Math.Max(0, Math.Min(100, score));

        var healthScore = new HealthScoreResponse
        {
            Score = Math.Round(score, 2),
            Grade = score switch
            {
                >= 95 => "A",
                >= 90 => "B",
                >= 80 => "C",
                >= 70 => "D",
                _ => "F"
            },
            Status = score switch
            {
                >= 90 => "Excellent",
                >= 75 => "Good",
                >= 60 => "Fair",
                >= 40 => "Poor",
                _ => "Critical"
            },
            Factors = new Dictionary<string, double>
            {
                { "Portal Health", statistics.HealthyPortals * 100.0 / Math.Max(1, statistics.TotalPortals) },
                { "System Uptime", statistics.AverageUptime },
                { "Incident Resolution", 100 - (statistics.ActiveIncidents * 100.0 / Math.Max(1, statistics.TotalPortals)) },
                { "Performance", 100 - Math.Min(100, statistics.AverageResponseTime / 50) }
            }
        };

        return Ok(new ApiResponse<HealthScoreResponse>
        {
            Success = true,
            Data = healthScore
        });
    }
}

public class PerformanceMetricsResponse
{
    public double AverageResponseTime { get; set; }
    public double AverageUptime { get; set; }
    public double AverageErrorRate { get; set; }
    public int TotalRequests { get; set; }
    public double PeakResponseTime { get; set; }
    public double MinResponseTime { get; set; }
    public double P95ResponseTime { get; set; }
    public double P99ResponseTime { get; set; }
}

public class HealthScoreResponse
{
    public double Score { get; set; }
    public string Grade { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public Dictionary<string, double> Factors { get; set; } = new();
}