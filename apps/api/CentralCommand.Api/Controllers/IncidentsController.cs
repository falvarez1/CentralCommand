using CentralCommand.Api.Application.Commands.Incidents;
using CentralCommand.Api.Application.Queries.Incidents;
using CentralCommand.Core.DTOs.Common;
using CentralCommand.Core.DTOs.Requests;
using CentralCommand.Core.DTOs.Responses;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace CentralCommand.Api.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
[Produces("application/json")]
public class IncidentsController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ILogger<IncidentsController> _logger;

    public IncidentsController(IMediator mediator, ILogger<IncidentsController> logger)
    {
        _mediator = mediator;
        _logger = logger;
    }

    /// <summary>
    /// Get a paginated list of incidents
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(PagedResult<IncidentResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetIncidents(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? searchTerm = null,
        [FromQuery] string? status = null,
        [FromQuery] string? priority = null,
        [FromQuery] string? type = null,
        [FromQuery] Guid? portalId = null,
        [FromQuery] string? assignedTo = null,
        [FromQuery] DateTime? startDate = null,
        [FromQuery] DateTime? endDate = null,
        [FromQuery] string? sortBy = null,
        [FromQuery] bool sortDescending = true,
        CancellationToken cancellationToken = default)
    {
        var query = new GetIncidentsQuery
        {
            PageNumber = pageNumber,
            PageSize = pageSize,
            SearchTerm = searchTerm,
            Status = status != null ? Enum.Parse<Core.Domain.Enums.IncidentStatus>(status) : null,
            Priority = priority != null ? Enum.Parse<Core.Domain.Enums.IncidentPriority>(priority) : null,
            Type = type != null ? Enum.Parse<Core.Domain.Enums.IncidentType>(type) : null,
            PortalId = portalId,
            AssignedTo = assignedTo,
            StartDate = startDate,
            EndDate = endDate,
            SortBy = sortBy,
            SortDescending = sortDescending
        };

        var result = await _mediator.Send(query, cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Get an incident by ID
    /// </summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse<IncidentResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetIncidentById(Guid id, CancellationToken cancellationToken = default)
    {
        var query = new GetIncidentByIdQuery(id);
        var result = await _mediator.Send(query, cancellationToken);

        if (result == null)
        {
            return NotFound(new ApiResponse<object>
            {
                Success = false,
                Message = $"Incident with ID {id} not found"
            });
        }

        return Ok(new ApiResponse<IncidentResponse>
        {
            Success = true,
            Data = result
        });
    }

    /// <summary>
    /// Create a new incident
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<IncidentResponse>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateIncident(
        [FromBody] CreateIncidentRequest request,
        CancellationToken cancellationToken = default)
    {
        var command = new CreateIncidentCommand
        {
            Title = request.Title,
            Description = request.Description,
            Priority = request.Priority,
            Type = request.Type,
            ReportedBy = request.ReportedBy,
            AssignedTo = request.AssignedTo,
            AffectedPortalIds = request.AffectedPortalIds,
            Tags = request.Tags
        };

        var result = await _mediator.Send(command, cancellationToken);

        return CreatedAtAction(
            nameof(GetIncidentById),
            new { id = result.Id },
            new ApiResponse<IncidentResponse>
            {
                Success = true,
                Data = result,
                Message = "Incident created successfully"
            });
    }

    /// <summary>
    /// Update an existing incident
    /// </summary>
    [HttpPut("{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse<IncidentResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UpdateIncident(
        Guid id,
        [FromBody] UpdateIncidentRequest request,
        CancellationToken cancellationToken = default)
    {
        var command = new UpdateIncidentCommand
        {
            Id = id,
            Title = request.Title,
            Description = request.Description,
            Status = request.Status,
            Priority = request.Priority,
            Type = request.Type,
            AssignedTo = request.AssignedTo,
            Resolution = request.Resolution,
            AffectedPortalIds = request.AffectedPortalIds,
            Tags = request.Tags,
            UpdatedBy = request.UpdatedBy ?? "System"
        };

        var result = await _mediator.Send(command, cancellationToken);

        return Ok(new ApiResponse<IncidentResponse>
        {
            Success = true,
            Data = result,
            Message = "Incident updated successfully"
        });
    }

    /// <summary>
    /// Update incident status
    /// </summary>
    [HttpPatch("{id:guid}/status")]
    [ProducesResponseType(typeof(ApiResponse<IncidentResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateIncidentStatus(
        Guid id,
        [FromBody] UpdateIncidentStatusRequest request,
        CancellationToken cancellationToken = default)
    {
        var command = new UpdateIncidentCommand
        {
            Id = id,
            Status = request.Status,
            Resolution = request.Resolution,
            UpdatedBy = request.UpdatedBy ?? "System"
        };

        var result = await _mediator.Send(command, cancellationToken);

        return Ok(new ApiResponse<IncidentResponse>
        {
            Success = true,
            Data = result,
            Message = $"Incident status updated to {request.Status}"
        });
    }

    /// <summary>
    /// Assign incident to a user
    /// </summary>
    [HttpPatch("{id:guid}/assign")]
    [ProducesResponseType(typeof(ApiResponse<IncidentResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> AssignIncident(
        Guid id,
        [FromBody] AssignIncidentRequest request,
        CancellationToken cancellationToken = default)
    {
        var command = new UpdateIncidentCommand
        {
            Id = id,
            AssignedTo = request.AssignedTo,
            UpdatedBy = request.AssignedBy ?? "System"
        };

        var result = await _mediator.Send(command, cancellationToken);

        return Ok(new ApiResponse<IncidentResponse>
        {
            Success = true,
            Data = result,
            Message = $"Incident assigned to {request.AssignedTo}"
        });
    }

    /// <summary>
    /// Get incident comments
    /// </summary>
    [HttpGet("{id:guid}/comments")]
    [ProducesResponseType(typeof(ApiResponse<List<CommentResponse>>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetIncidentComments(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var incident = await _mediator.Send(new GetIncidentByIdQuery(id), cancellationToken);
        if (incident == null)
        {
            return NotFound(new ApiResponse<object>
            {
                Success = false,
                Message = $"Incident with ID {id} not found"
            });
        }

        return Ok(new ApiResponse<List<CommentResponse>>
        {
            Success = true,
            Data = incident.Comments
        });
    }

    /// <summary>
    /// Add a comment to an incident
    /// </summary>
    [HttpPost("{id:guid}/comments")]
    [ProducesResponseType(typeof(ApiResponse<CommentResponse>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> AddIncidentComment(
        Guid id,
        [FromBody] AddCommentRequest request,
        CancellationToken cancellationToken = default)
    {
        var command = new AddIncidentCommentCommand
        {
            IncidentId = id,
            Content = request.Content,
            Author = request.Author,
            IsInternal = request.IsInternal,
            Attachments = request.Attachments
        };

        var result = await _mediator.Send(command, cancellationToken);

        return CreatedAtAction(
            nameof(GetIncidentComments),
            new { id },
            new ApiResponse<CommentResponse>
            {
                Success = true,
                Data = result,
                Message = "Comment added successfully"
            });
    }

    /// <summary>
    /// Get incident timeline
    /// </summary>
    [HttpGet("{id:guid}/timeline")]
    [ProducesResponseType(typeof(ApiResponse<List<TimelineEntryResponse>>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetIncidentTimeline(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var incident = await _mediator.Send(new GetIncidentByIdQuery(id), cancellationToken);
        if (incident == null)
        {
            return NotFound(new ApiResponse<object>
            {
                Success = false,
                Message = $"Incident with ID {id} not found"
            });
        }

        return Ok(new ApiResponse<List<TimelineEntryResponse>>
        {
            Success = true,
            Data = incident.Timeline
        });
    }

    /// <summary>
    /// Resolve an incident
    /// </summary>
    [HttpPost("{id:guid}/resolve")]
    [ProducesResponseType(typeof(ApiResponse<IncidentResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ResolveIncident(
        Guid id,
        [FromBody] ResolveIncidentRequest request,
        CancellationToken cancellationToken = default)
    {
        var command = new UpdateIncidentCommand
        {
            Id = id,
            Status = Core.Domain.Enums.IncidentStatus.Resolved,
            Resolution = request.Resolution,
            UpdatedBy = request.ResolvedBy ?? "System"
        };

        var result = await _mediator.Send(command, cancellationToken);

        return Ok(new ApiResponse<IncidentResponse>
        {
            Success = true,
            Data = result,
            Message = "Incident resolved successfully"
        });
    }

    /// <summary>
    /// Escalate an incident
    /// </summary>
    [HttpPost("{id:guid}/escalate")]
    [ProducesResponseType(typeof(ApiResponse<IncidentResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> EscalateIncident(
        Guid id,
        [FromBody] EscalateIncidentRequest request,
        CancellationToken cancellationToken = default)
    {
        var incident = await _mediator.Send(new GetIncidentByIdQuery(id), cancellationToken);
        if (incident == null)
        {
            return NotFound(new ApiResponse<object>
            {
                Success = false,
                Message = $"Incident with ID {id} not found"
            });
        }

        // Escalate priority
        var newPriority = incident.Priority switch
        {
            "Low" => Core.Domain.Enums.IncidentPriority.Medium,
            "Medium" => Core.Domain.Enums.IncidentPriority.High,
            "High" => Core.Domain.Enums.IncidentPriority.Critical,
            _ => Core.Domain.Enums.IncidentPriority.Critical
        };

        var command = new UpdateIncidentCommand
        {
            Id = id,
            Priority = newPriority,
            UpdatedBy = request.EscalatedBy ?? "System"
        };

        // Add escalation comment
        await _mediator.Send(new AddIncidentCommentCommand
        {
            IncidentId = id,
            Content = $"Incident escalated: {request.Reason}",
            Author = request.EscalatedBy ?? "System",
            IsInternal = false
        }, cancellationToken);

        var result = await _mediator.Send(command, cancellationToken);

        return Ok(new ApiResponse<IncidentResponse>
        {
            Success = true,
            Data = result,
            Message = $"Incident escalated to {newPriority} priority"
        });
    }
}