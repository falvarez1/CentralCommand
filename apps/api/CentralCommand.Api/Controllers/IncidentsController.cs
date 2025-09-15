using Microsoft.AspNetCore.Mvc;
using CentralCommand.Api.Models;
using CentralCommand.Api.Services;

namespace CentralCommand.Api.Controllers;

/// <summary>
/// Controller for incident management endpoints
/// </summary>
[ApiController]
[Route("api/v1/[controller]")]
public class IncidentsController : ControllerBase
{
    private readonly MockDataService _mockDataService;
    private readonly StatisticsService _statisticsService;
    private readonly ILogger<IncidentsController> _logger;

    public IncidentsController(
        MockDataService mockDataService,
        StatisticsService statisticsService,
        ILogger<IncidentsController> logger)
    {
        _mockDataService = mockDataService;
        _statisticsService = statisticsService;
        _logger = logger;
    }

    /// <summary>
    /// Get all incidents with optional filtering
    /// </summary>
    [HttpGet]
    public ActionResult<ApiResponse<List<Incident>>> GetIncidents(
        [FromQuery] string? status = null,
        [FromQuery] string? severity = null,
        [FromQuery] string? type = null,
        [FromQuery] string? searchTerm = null,
        [FromQuery] bool? isUnresolved = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var incidents = _mockDataService.GetIncidents();

        // Apply filters
        if (!string.IsNullOrEmpty(status) && Enum.TryParse<IncidentStatus>(status, true, out var stat))
        {
            incidents = incidents.Where(i => i.Status == stat).ToList();
        }

        if (!string.IsNullOrEmpty(severity) && Enum.TryParse<IncidentSeverity>(severity, true, out var sev))
        {
            incidents = incidents.Where(i => i.Severity == sev).ToList();
        }

        if (!string.IsNullOrEmpty(type) && Enum.TryParse<IncidentType>(type, true, out var typ))
        {
            incidents = incidents.Where(i => i.Type == typ).ToList();
        }

        if (!string.IsNullOrEmpty(searchTerm))
        {
            var searchLower = searchTerm.ToLower();
            incidents = incidents.Where(i =>
                i.Title.ToLower().Contains(searchLower) ||
                i.Description.ToLower().Contains(searchLower) ||
                i.Tags.Any(t => t.ToLower().Contains(searchLower))
            ).ToList();
        }

        if (isUnresolved.HasValue && isUnresolved.Value)
        {
            incidents = incidents.Where(i => i.Status != IncidentStatus.Resolved && i.Status != IncidentStatus.Closed).ToList();
        }

        // Order by creation date (newest first)
        incidents = incidents.OrderByDescending(i => i.CreatedAt).ToList();

        // Apply pagination
        var totalItems = incidents.Count;
        var totalPages = (int)Math.Ceiling(totalItems / (double)pageSize);
        var paginatedIncidents = incidents
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToList();

        var response = new ApiResponse<List<Incident>>
        {
            Status = ApiStatus.Success,
            Data = paginatedIncidents,
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
    /// Get a specific incident by ID
    /// </summary>
    [HttpGet("{id}")]
    public ActionResult<ApiResponse<Incident>> GetIncident(Guid id)
    {
        var incident = _mockDataService.GetIncident(id);

        if (incident == null)
        {
            return NotFound(new ApiResponse<Incident>
            {
                Status = ApiStatus.Error,
                Error = new ApiError
                {
                    Code = ErrorCode.NotFound,
                    Message = $"Incident with ID {id} not found",
                    Timestamp = DateTime.UtcNow
                }
            });
        }

        return Ok(new ApiResponse<Incident>
        {
            Status = ApiStatus.Success,
            Data = incident,
            Metadata = new ApiMetadata
            {
                Timestamp = DateTime.UtcNow,
                RequestId = Guid.NewGuid().ToString()
            }
        });
    }

    /// <summary>
    /// Create a new incident
    /// </summary>
    [HttpPost]
    public ActionResult<ApiResponse<Incident>> CreateIncident([FromBody] CreateIncidentRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Title))
        {
            return BadRequest(new ApiResponse<Incident>
            {
                Status = ApiStatus.Error,
                Error = new ApiError
                {
                    Code = ErrorCode.ValidationError,
                    Message = "Title is required",
                    Timestamp = DateTime.UtcNow
                }
            });
        }

        var incident = _mockDataService.AddIncident(request);

        _logger.LogInformation($"Created new incident: {incident.Id} - {incident.Title}");

        return CreatedAtAction(
            nameof(GetIncident),
            new { id = incident.Id },
            new ApiResponse<Incident>
            {
                Status = ApiStatus.Success,
                Data = incident,
                Metadata = new ApiMetadata
                {
                    Timestamp = DateTime.UtcNow,
                    RequestId = Guid.NewGuid().ToString()
                }
            });
    }

    /// <summary>
    /// Update an existing incident
    /// </summary>
    [HttpPut("{id}")]
    public ActionResult<ApiResponse<Incident>> UpdateIncident(Guid id, [FromBody] UpdateIncidentRequest request)
    {
        var incident = _mockDataService.GetIncident(id);

        if (incident == null)
        {
            return NotFound(new ApiResponse<Incident>
            {
                Status = ApiStatus.Error,
                Error = new ApiError
                {
                    Code = ErrorCode.NotFound,
                    Message = $"Incident with ID {id} not found",
                    Timestamp = DateTime.UtcNow
                }
            });
        }

        // Update incident properties
        if (!string.IsNullOrEmpty(request.Title))
            incident.Title = request.Title;

        if (!string.IsNullOrEmpty(request.Description))
            incident.Description = request.Description;

        if (request.Status.HasValue)
        {
            incident.Status = request.Status.Value;
            incident.Timeline.Add(new TimelineEntry
            {
                Id = Guid.NewGuid(),
                Timestamp = DateTime.UtcNow,
                Action = $"Status changed to {request.Status.Value}",
                Description = "Status update via API",
                PerformedBy = Guid.NewGuid()
            });

            if (request.Status.Value == IncidentStatus.Resolved)
            {
                incident.ResolvedAt = DateTime.UtcNow;
            }
        }

        if (request.Severity.HasValue)
            incident.Severity = request.Severity.Value;

        if (request.Assignee.HasValue)
            incident.Assignee = request.Assignee.Value;

        if (!string.IsNullOrEmpty(request.Resolution))
            incident.Resolution = request.Resolution;

        if (!string.IsNullOrEmpty(request.RootCause))
            incident.RootCause = request.RootCause;

        incident.UpdatedAt = DateTime.UtcNow;
        incident.UpdatedBy = Guid.NewGuid();
        incident.ETag = GenerateETag();

        _logger.LogInformation($"Updated incident: {incident.Id}");

        return Ok(new ApiResponse<Incident>
        {
            Status = ApiStatus.Success,
            Data = incident,
            Metadata = new ApiMetadata
            {
                Timestamp = DateTime.UtcNow,
                RequestId = Guid.NewGuid().ToString()
            }
        });
    }

    /// <summary>
    /// Get incident statistics
    /// </summary>
    [HttpGet("stats")]
    public ActionResult<ApiResponse<IncidentStats>> GetIncidentStats()
    {
        var stats = _statisticsService.GetIncidentStats();

        return Ok(new ApiResponse<IncidentStats>
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
    /// Get comments for an incident
    /// </summary>
    [HttpGet("{id}/comments")]
    public ActionResult<ApiResponse<List<Comment>>> GetIncidentComments(Guid id)
    {
        var incident = _mockDataService.GetIncident(id);

        if (incident == null)
        {
            return NotFound(new ApiResponse<List<Comment>>
            {
                Status = ApiStatus.Error,
                Error = new ApiError
                {
                    Code = ErrorCode.NotFound,
                    Message = $"Incident with ID {id} not found",
                    Timestamp = DateTime.UtcNow
                }
            });
        }

        var comments = _mockDataService.GetIncidentComments(id);

        _logger.LogInformation($"Retrieved {comments.Count} comments for incident {id}");

        return Ok(new ApiResponse<List<Comment>>
        {
            Status = ApiStatus.Success,
            Data = comments,
            Metadata = new ApiMetadata
            {
                Timestamp = DateTime.UtcNow,
                RequestId = Guid.NewGuid().ToString()
            }
        });
    }

    /// <summary>
    /// Add a comment to an incident
    /// </summary>
    [HttpPost("{id}/comments")]
    public ActionResult<ApiResponse<Comment>> AddIncidentComment(Guid id, [FromBody] CreateCommentRequest request)
    {
        var incident = _mockDataService.GetIncident(id);

        if (incident == null)
        {
            return NotFound(new ApiResponse<Comment>
            {
                Status = ApiStatus.Error,
                Error = new ApiError
                {
                    Code = ErrorCode.NotFound,
                    Message = $"Incident with ID {id} not found",
                    Timestamp = DateTime.UtcNow
                }
            });
        }

        if (string.IsNullOrWhiteSpace(request.Content))
        {
            return BadRequest(new ApiResponse<Comment>
            {
                Status = ApiStatus.Error,
                Error = new ApiError
                {
                    Code = ErrorCode.ValidationError,
                    Message = "Comment content is required",
                    Timestamp = DateTime.UtcNow
                }
            });
        }

        var comment = _mockDataService.AddIncidentComment(id, request);

        // Update incident's updated timestamp
        incident.UpdatedAt = DateTime.UtcNow;
        incident.Timeline.Add(new TimelineEntry
        {
            Id = Guid.NewGuid(),
            Timestamp = DateTime.UtcNow,
            Action = "Comment added",
            Description = request.IsInternal ? "Internal comment added" : "Comment added",
            PerformedBy = comment.AuthorId
        });

        _logger.LogInformation($"Added comment to incident {id}");

        return CreatedAtAction(
            nameof(GetIncidentComments),
            new { id = id },
            new ApiResponse<Comment>
            {
                Status = ApiStatus.Success,
                Data = comment,
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
/// Update incident request
/// </summary>
public record UpdateIncidentRequest
{
    public string? Title { get; init; }
    public string? Description { get; init; }
    public IncidentStatus? Status { get; init; }
    public IncidentSeverity? Severity { get; init; }
    public Guid? Assignee { get; init; }
    public string? Resolution { get; init; }
    public string? RootCause { get; init; }
}