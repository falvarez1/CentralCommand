using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using CentralCommand.MockApi.Models;
using CentralCommand.MockApi.Services;
using CentralCommand.MockApi.Hubs;

namespace CentralCommand.MockApi.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
public class IncidentsController : ControllerBase
{
    private readonly MockDataService _mockDataService;
    private readonly IHubContext<MetricsHub> _hubContext;
    private readonly ILogger<IncidentsController> _logger;

    public IncidentsController(
        MockDataService mockDataService,
        IHubContext<MetricsHub> hubContext,
        ILogger<IncidentsController> logger)
    {
        _mockDataService = mockDataService;
        _hubContext = hubContext;
        _logger = logger;
    }

    [HttpGet]
    public ActionResult<IEnumerable<Incident>> GetIncidents(
        [FromQuery] string? status = null,
        [FromQuery] string? severity = null,
        [FromQuery] string? assignedTo = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var incidents = _mockDataService.GetIncidents();

        // Apply filters
        if (!string.IsNullOrEmpty(status))
            incidents = incidents.Where(i => i.Status == status).ToList();

        if (!string.IsNullOrEmpty(severity))
            incidents = incidents.Where(i => i.Severity == severity).ToList();

        if (!string.IsNullOrEmpty(assignedTo))
            incidents = incidents.Where(i => i.AssignedTo.Contains(assignedTo, StringComparison.OrdinalIgnoreCase)).ToList();

        // Sort by creation date (newest first)
        incidents = incidents.OrderByDescending(i => i.CreatedAt).ToList();

        // Apply pagination
        var totalCount = incidents.Count;
        var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);
        var pagedIncidents = incidents
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToList();

        Response.Headers.Append("X-Total-Count", totalCount.ToString());
        Response.Headers.Append("X-Page", page.ToString());
        Response.Headers.Append("X-Page-Size", pageSize.ToString());
        Response.Headers.Append("X-Total-Pages", totalPages.ToString());

        return Ok(pagedIncidents);
    }

    [HttpGet("{id}")]
    public ActionResult<Incident> GetIncident(string id)
    {
        var incident = _mockDataService.GetIncident(id);
        if (incident == null)
            return NotFound(new { message = $"Incident with id '{id}' not found" });

        return Ok(incident);
    }

    [HttpPost]
    public async Task<ActionResult<Incident>> CreateIncident([FromBody] Incident incident)
    {
        if (string.IsNullOrWhiteSpace(incident.Title))
            return BadRequest(new { message = "Incident title is required" });

        if (string.IsNullOrWhiteSpace(incident.Description))
            return BadRequest(new { message = "Incident description is required" });

        var createdIncident = _mockDataService.CreateIncident(incident);
        _logger.LogInformation($"Created new incident: {createdIncident.Title} (ID: {createdIncident.Id})");

        // Broadcast the new incident via SignalR
        await _hubContext.Clients.All.SendAsync("IncidentCreated", createdIncident);

        return CreatedAtAction(nameof(GetIncident), new { id = createdIncident.Id }, createdIncident);
    }

    [HttpPatch("{id}/status")]
    public async Task<ActionResult<Incident>> UpdateIncidentStatus(string id, [FromBody] StatusUpdateRequest request)
    {
        var incident = _mockDataService.GetIncident(id);
        if (incident == null)
            return NotFound(new { message = $"Incident with id '{id}' not found" });

        incident.Status = request.Status;
        incident.UpdatedAt = DateTime.UtcNow;

        if (request.Status == "resolved" || request.Status == "closed")
        {
            incident.ResolvedAt = DateTime.UtcNow;
        }

        _logger.LogInformation($"Updated incident status: {incident.Title} -> {request.Status}");

        // Broadcast the status change via SignalR
        await _hubContext.Clients.All.SendAsync("IncidentStatusChanged", incident);

        return Ok(incident);
    }

    [HttpPatch("{id}/assign")]
    public async Task<ActionResult<Incident>> AssignIncident(string id, [FromBody] AssignmentRequest request)
    {
        var incident = _mockDataService.GetIncident(id);
        if (incident == null)
            return NotFound(new { message = $"Incident with id '{id}' not found" });

        incident.AssignedTo = request.AssignedTo;
        incident.UpdatedAt = DateTime.UtcNow;

        _logger.LogInformation($"Assigned incident: {incident.Title} -> {request.AssignedTo}");

        // Broadcast the assignment change via SignalR
        await _hubContext.Clients.All.SendAsync("IncidentAssigned", incident);

        return Ok(incident);
    }

    [HttpPost("{id}/comments")]
    public async Task<ActionResult<IncidentComment>> AddComment(string id, [FromBody] CommentRequest request)
    {
        var incident = _mockDataService.GetIncident(id);
        if (incident == null)
            return NotFound(new { message = $"Incident with id '{id}' not found" });

        var comment = new IncidentComment
        {
            Id = Guid.NewGuid().ToString(),
            Author = request.Author,
            Content = request.Content,
            CreatedAt = DateTime.UtcNow
        };

        incident.Comments.Add(comment);
        incident.UpdatedAt = DateTime.UtcNow;

        _logger.LogInformation($"Added comment to incident: {incident.Title}");

        // Broadcast the new comment via SignalR
        await _hubContext.Clients.All.SendAsync("IncidentCommentAdded", id, comment);

        return Ok(comment);
    }

    [HttpGet("{id}/comments")]
    public ActionResult<IEnumerable<IncidentComment>> GetComments(string id)
    {
        var incident = _mockDataService.GetIncident(id);
        if (incident == null)
            return NotFound(new { message = $"Incident with id '{id}' not found" });

        return Ok(incident.Comments.OrderByDescending(c => c.CreatedAt));
    }

    [HttpGet("summary")]
    public ActionResult<object> GetIncidentSummary()
    {
        var incidents = _mockDataService.GetIncidents();

        return Ok(new
        {
            total = incidents.Count,
            byStatus = new
            {
                open = incidents.Count(i => i.Status == "open"),
                investigating = incidents.Count(i => i.Status == "investigating"),
                resolved = incidents.Count(i => i.Status == "resolved"),
                closed = incidents.Count(i => i.Status == "closed")
            },
            bySeverity = new
            {
                critical = incidents.Count(i => i.Severity == "critical"),
                high = incidents.Count(i => i.Severity == "high"),
                medium = incidents.Count(i => i.Severity == "medium"),
                low = incidents.Count(i => i.Severity == "low")
            },
            recentIncidents = incidents
                .OrderByDescending(i => i.CreatedAt)
                .Take(5)
                .Select(i => new
                {
                    i.Id,
                    i.Title,
                    i.Severity,
                    i.Status,
                    i.CreatedAt
                }),
            averageResolutionTime = CalculateAverageResolutionTime(incidents),
            mostAffectedServices = incidents
                .GroupBy(i => i.AffectedService)
                .OrderByDescending(g => g.Count())
                .Take(5)
                .Select(g => new
                {
                    service = g.Key,
                    count = g.Count()
                })
        });
    }

    private TimeSpan CalculateAverageResolutionTime(List<Incident> incidents)
    {
        var resolvedIncidents = incidents.Where(i => i.ResolvedAt.HasValue).ToList();
        if (!resolvedIncidents.Any())
            return TimeSpan.Zero;

        var totalTime = resolvedIncidents
            .Select(i => i.ResolvedAt!.Value - i.CreatedAt)
            .Aggregate(TimeSpan.Zero, (sum, time) => sum + time);

        return TimeSpan.FromMilliseconds(totalTime.TotalMilliseconds / resolvedIncidents.Count);
    }
}

public class StatusUpdateRequest
{
    public string Status { get; set; } = string.Empty;
}

public class AssignmentRequest
{
    public string AssignedTo { get; set; } = string.Empty;
}

public class CommentRequest
{
    public string Author { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
}