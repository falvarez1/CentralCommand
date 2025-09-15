using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using CentralCommand.MockApi.Models;
using CentralCommand.MockApi.Services;
using CentralCommand.MockApi.Hubs;

namespace CentralCommand.MockApi.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
public class PortalsController : ControllerBase
{
    private readonly MockDataService _mockDataService;
    private readonly IHubContext<MetricsHub> _hubContext;
    private readonly ILogger<PortalsController> _logger;

    public PortalsController(
        MockDataService mockDataService,
        IHubContext<MetricsHub> hubContext,
        ILogger<PortalsController> logger)
    {
        _mockDataService = mockDataService;
        _hubContext = hubContext;
        _logger = logger;
    }

    [HttpGet]
    public ActionResult<IEnumerable<Portal>> GetPortals(
        [FromQuery] string? status = null,
        [FromQuery] string? environment = null,
        [FromQuery] string? category = null,
        [FromQuery] bool? favorite = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var portals = _mockDataService.GetPortals();

        // Apply filters
        if (!string.IsNullOrEmpty(status))
            portals = portals.Where(p => p.Status == status).ToList();

        if (!string.IsNullOrEmpty(environment))
            portals = portals.Where(p => p.Environment == environment).ToList();

        if (!string.IsNullOrEmpty(category))
            portals = portals.Where(p => p.Category == category).ToList();

        if (favorite.HasValue)
            portals = portals.Where(p => p.IsFavorite == favorite.Value).ToList();

        // Apply pagination
        var totalCount = portals.Count;
        var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);
        var pagedPortals = portals
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToList();

        Response.Headers.Append("X-Total-Count", totalCount.ToString());
        Response.Headers.Append("X-Page", page.ToString());
        Response.Headers.Append("X-Page-Size", pageSize.ToString());
        Response.Headers.Append("X-Total-Pages", totalPages.ToString());

        return Ok(pagedPortals);
    }

    [HttpGet("{id}")]
    public ActionResult<Portal> GetPortal(string id)
    {
        var portal = _mockDataService.GetPortal(id);
        if (portal == null)
            return NotFound(new { message = $"Portal with id '{id}' not found" });

        return Ok(portal);
    }

    [HttpPost]
    public ActionResult<Portal> CreatePortal([FromBody] Portal portal)
    {
        if (string.IsNullOrWhiteSpace(portal.Name))
            return BadRequest(new { message = "Portal name is required" });

        if (string.IsNullOrWhiteSpace(portal.Url))
            return BadRequest(new { message = "Portal URL is required" });

        var createdPortal = _mockDataService.CreatePortal(portal);
        _logger.LogInformation($"Created new portal: {createdPortal.Name} (ID: {createdPortal.Id})");

        return CreatedAtAction(nameof(GetPortal), new { id = createdPortal.Id }, createdPortal);
    }

    [HttpPut("{id}")]
    public ActionResult<Portal> UpdatePortal(string id, [FromBody] Portal portal)
    {
        var updatedPortal = _mockDataService.UpdatePortal(id, portal);
        if (updatedPortal == null)
            return NotFound(new { message = $"Portal with id '{id}' not found" });

        _logger.LogInformation($"Updated portal: {updatedPortal.Name} (ID: {id})");
        return Ok(updatedPortal);
    }

    [HttpDelete("{id}")]
    public IActionResult DeletePortal(string id)
    {
        var deleted = _mockDataService.DeletePortal(id);
        if (!deleted)
            return NotFound(new { message = $"Portal with id '{id}' not found" });

        _logger.LogInformation($"Deleted portal with ID: {id}");
        return NoContent();
    }

    [HttpPost("{id}/metrics")]
    public async Task<IActionResult> UpdatePortalMetrics(string id, [FromBody] PortalMetrics metrics)
    {
        var portal = _mockDataService.GetPortal(id);
        if (portal == null)
            return NotFound(new { message = $"Portal with id '{id}' not found" });

        portal.Metrics = metrics;
        portal.Metrics.LastChecked = DateTime.UtcNow;
        portal.UpdatedAt = DateTime.UtcNow;

        // Broadcast the update via SignalR
        await _hubContext.Clients.All.SendAsync("PortalMetricsUpdated", id, metrics);

        _logger.LogInformation($"Updated metrics for portal: {portal.Name} (ID: {id})");
        return Ok(portal);
    }

    [HttpGet("{id}/metrics/history")]
    public ActionResult<object> GetPortalMetricsHistory(string id, [FromQuery] int hours = 24)
    {
        var portal = _mockDataService.GetPortal(id);
        if (portal == null)
            return NotFound(new { message = $"Portal with id '{id}' not found" });

        // Generate mock historical data
        var history = new List<object>();
        var random = new Random();

        for (int i = hours; i >= 0; i--)
        {
            history.Add(new
            {
                timestamp = DateTime.UtcNow.AddHours(-i),
                responseTime = random.Next(100, 500),
                uptime = random.Next(95, 100),
                errorRate = random.Next(0, 5),
                activeUsers = random.Next(50, 500),
                cpuUsage = random.Next(20, 80),
                memoryUsage = random.Next(30, 70)
            });
        }

        return Ok(new
        {
            portalId = id,
            portalName = portal.Name,
            period = $"{hours} hours",
            dataPoints = history
        });
    }

    [HttpGet("{id}/health")]
    public ActionResult<object> GetPortalHealth(string id)
    {
        var portal = _mockDataService.GetPortal(id);
        if (portal == null)
            return NotFound(new { message = $"Portal with id '{id}' not found" });

        var healthScore = CalculateHealthScore(portal);

        return Ok(new
        {
            portalId = id,
            portalName = portal.Name,
            status = portal.Status,
            healthScore,
            metrics = portal.Metrics,
            checks = new
            {
                responseTime = portal.Metrics.ResponseTime < 1000 ? "pass" : "fail",
                uptime = portal.Metrics.Uptime > 99 ? "pass" : "warn",
                errorRate = portal.Metrics.ErrorRate < 1 ? "pass" : "fail",
                cpuUsage = portal.Metrics.CpuUsage < 80 ? "pass" : "warn",
                memoryUsage = portal.Metrics.MemoryUsage < 80 ? "pass" : "warn"
            },
            lastChecked = portal.Metrics.LastChecked
        });
    }

    [HttpPost("batch")]
    public ActionResult<object> BatchOperation([FromBody] BatchRequest request)
    {
        var results = new List<object>();

        foreach (var operation in request.Operations)
        {
            switch (operation.Action.ToLower())
            {
                case "update-status":
                    foreach (var id in operation.PortalIds)
                    {
                        var portal = _mockDataService.GetPortal(id);
                        if (portal != null && operation.Value != null)
                        {
                            portal.Status = operation.Value;
                            portal.UpdatedAt = DateTime.UtcNow;
                            results.Add(new { id, success = true, action = "update-status" });
                        }
                        else
                        {
                            results.Add(new { id, success = false, action = "update-status", error = "Portal not found" });
                        }
                    }
                    break;

                case "toggle-favorite":
                    foreach (var id in operation.PortalIds)
                    {
                        var portal = _mockDataService.GetPortal(id);
                        if (portal != null)
                        {
                            portal.IsFavorite = !portal.IsFavorite;
                            portal.UpdatedAt = DateTime.UtcNow;
                            results.Add(new { id, success = true, action = "toggle-favorite", isFavorite = portal.IsFavorite });
                        }
                        else
                        {
                            results.Add(new { id, success = false, action = "toggle-favorite", error = "Portal not found" });
                        }
                    }
                    break;

                default:
                    results.Add(new { action = operation.Action, success = false, error = "Unknown action" });
                    break;
            }
        }

        return Ok(new
        {
            totalOperations = request.Operations.Count,
            successful = results.Count(r => ((dynamic)r).success == true),
            failed = results.Count(r => ((dynamic)r).success == false),
            results
        });
    }

    private double CalculateHealthScore(Portal portal)
    {
        double score = 100.0;

        // Deduct points based on metrics
        if (portal.Metrics.ResponseTime > 1000) score -= 10;
        if (portal.Metrics.ResponseTime > 2000) score -= 10;
        if (portal.Metrics.Uptime < 99.9) score -= 15;
        if (portal.Metrics.Uptime < 99) score -= 10;
        if (portal.Metrics.ErrorRate > 1) score -= 10;
        if (portal.Metrics.ErrorRate > 3) score -= 10;
        if (portal.Metrics.CpuUsage > 80) score -= 5;
        if (portal.Metrics.MemoryUsage > 80) score -= 5;

        // Status impacts
        if (portal.Status == "degraded") score -= 20;
        if (portal.Status == "down") score -= 50;
        if (portal.Status == "maintenance") score -= 10;

        return Math.Max(0, score);
    }
}

public class BatchRequest
{
    public List<BatchOperation> Operations { get; set; } = new();
}

public class BatchOperation
{
    public string Action { get; set; } = string.Empty;
    public List<string> PortalIds { get; set; } = new();
    public string? Value { get; set; }
}