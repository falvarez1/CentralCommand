using Microsoft.AspNetCore.Mvc;
using CentralCommand.MockApi.Models;
using CentralCommand.MockApi.Services;

namespace CentralCommand.MockApi.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
public class StatisticsController : ControllerBase
{
    private readonly MockDataService _mockDataService;
    private readonly ILogger<StatisticsController> _logger;

    public StatisticsController(
        MockDataService mockDataService,
        ILogger<StatisticsController> logger)
    {
        _mockDataService = mockDataService;
        _logger = logger;
    }

    [HttpGet]
    public ActionResult<Statistics> GetStatistics()
    {
        var stats = _mockDataService.GetStatistics();
        return Ok(stats);
    }

    [HttpGet("sparklines")]
    public ActionResult<object> GetSparklineData([FromQuery] int hours = 24)
    {
        var random = new Random();
        var dataPoints = new List<object>();

        for (int i = hours; i >= 0; i--)
        {
            dataPoints.Add(new
            {
                timestamp = DateTime.UtcNow.AddHours(-i),
                systemHealth = random.Next(85, 100),
                activeUsers = random.Next(100, 5000),
                responseTime = random.Next(100, 500),
                errorRate = random.Next(0, 5),
                throughput = random.Next(1000, 10000)
            });
        }

        return Ok(new
        {
            period = $"{hours} hours",
            dataPoints
        });
    }

    [HttpGet("trends")]
    public ActionResult<object> GetTrends([FromQuery] int days = 7)
    {
        var random = new Random();
        var dailyData = new List<object>();

        for (int i = days - 1; i >= 0; i--)
        {
            dailyData.Add(new
            {
                date = DateTime.UtcNow.AddDays(-i).Date,
                incidents = new
                {
                    created = random.Next(5, 20),
                    resolved = random.Next(3, 18),
                    critical = random.Next(0, 3)
                },
                portals = new
                {
                    operational = random.Next(30, 36),
                    degraded = random.Next(0, 3),
                    down = random.Next(0, 2)
                },
                metrics = new
                {
                    avgResponseTime = random.Next(150, 350),
                    avgUptime = random.Next(95, 100),
                    peakUsers = random.Next(1000, 5000)
                }
            });
        }

        return Ok(new
        {
            period = $"{days} days",
            trends = dailyData
        });
    }

    [HttpGet("alerts")]
    public ActionResult<object> GetAlerts()
    {
        var alerts = new List<object>();
        var random = new Random();
        var portals = _mockDataService.GetPortals();

        // Generate some alerts based on current data
        foreach (var portal in portals.Take(5))
        {
            if (portal.Metrics.ResponseTime > 1500)
            {
                alerts.Add(new
                {
                    id = Guid.NewGuid().ToString(),
                    type = "performance",
                    severity = "warning",
                    message = $"High response time detected for {portal.Name}",
                    details = $"Current response time: {portal.Metrics.ResponseTime:F0}ms",
                    timestamp = DateTime.UtcNow.AddMinutes(-random.Next(0, 60))
                });
            }

            if (portal.Metrics.ErrorRate > 3)
            {
                alerts.Add(new
                {
                    id = Guid.NewGuid().ToString(),
                    type = "error",
                    severity = "high",
                    message = $"Elevated error rate for {portal.Name}",
                    details = $"Error rate: {portal.Metrics.ErrorRate}%",
                    timestamp = DateTime.UtcNow.AddMinutes(-random.Next(0, 60))
                });
            }

            if (portal.Status == "down")
            {
                alerts.Add(new
                {
                    id = Guid.NewGuid().ToString(),
                    type = "availability",
                    severity = "critical",
                    message = $"{portal.Name} is currently down",
                    details = "Service is not responding to health checks",
                    timestamp = DateTime.UtcNow.AddMinutes(-random.Next(0, 30))
                });
            }
        }

        return Ok(new
        {
            total = alerts.Count,
            critical = alerts.Count(a => ((dynamic)a).severity == "critical"),
            high = alerts.Count(a => ((dynamic)a).severity == "high"),
            warning = alerts.Count(a => ((dynamic)a).severity == "warning"),
            alerts = alerts.OrderByDescending(a => ((dynamic)a).timestamp)
        });
    }

    [HttpGet("performance")]
    public ActionResult<object> GetPerformanceMetrics()
    {
        var portals = _mockDataService.GetPortals();

        return Ok(new
        {
            timestamp = DateTime.UtcNow,
            aggregates = new
            {
                averageResponseTime = portals.Average(p => p.Metrics.ResponseTime),
                minResponseTime = portals.Min(p => p.Metrics.ResponseTime),
                maxResponseTime = portals.Max(p => p.Metrics.ResponseTime),
                p95ResponseTime = CalculatePercentile(portals.Select(p => p.Metrics.ResponseTime).ToList(), 95),
                p99ResponseTime = CalculatePercentile(portals.Select(p => p.Metrics.ResponseTime).ToList(), 99),
                averageErrorRate = portals.Average(p => p.Metrics.ErrorRate),
                totalActiveUsers = portals.Sum(p => p.Metrics.ActiveUsers),
                averageCpuUsage = portals.Average(p => p.Metrics.CpuUsage),
                averageMemoryUsage = portals.Average(p => p.Metrics.MemoryUsage)
            },
            topPerformers = portals
                .OrderBy(p => p.Metrics.ResponseTime)
                .Take(5)
                .Select(p => new
                {
                    p.Id,
                    p.Name,
                    responseTime = p.Metrics.ResponseTime,
                    uptime = p.Metrics.Uptime
                }),
            bottomPerformers = portals
                .OrderByDescending(p => p.Metrics.ResponseTime)
                .Take(5)
                .Select(p => new
                {
                    p.Id,
                    p.Name,
                    responseTime = p.Metrics.ResponseTime,
                    uptime = p.Metrics.Uptime
                })
        });
    }

    private double CalculatePercentile(List<double> values, int percentile)
    {
        values.Sort();
        int index = (int)Math.Ceiling(percentile / 100.0 * values.Count) - 1;
        return values[Math.Max(0, Math.Min(index, values.Count - 1))];
    }
}