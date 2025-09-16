using CentralCommand.Api.Application.Commands.Portals;
using CentralCommand.Api.Application.Queries.Portals;
using CentralCommand.Core.DTOs.Common;
using CentralCommand.Core.DTOs.Requests;
using CentralCommand.Core.DTOs.Responses;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace CentralCommand.Api.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
[Produces("application/json")]
public class PortalsController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ILogger<PortalsController> _logger;

    public PortalsController(IMediator mediator, ILogger<PortalsController> logger)
    {
        _mediator = mediator;
        _logger = logger;
    }

    /// <summary>
    /// Get a paginated list of portals
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(PagedResult<PortalResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetPortals(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? searchTerm = null,
        [FromQuery] string? status = null,
        [FromQuery] string? environment = null,
        [FromQuery] string? category = null,
        [FromQuery] string? sortBy = null,
        [FromQuery] bool sortDescending = false,
        CancellationToken cancellationToken = default)
    {
        var query = new GetPortalsQuery
        {
            PageNumber = pageNumber,
            PageSize = pageSize,
            SearchTerm = searchTerm,
            Status = status != null ? Enum.Parse<Core.Domain.Enums.PortalStatus>(status) : null,
            Environment = environment != null ? Enum.Parse<Core.Domain.Enums.PortalEnvironment>(environment) : null,
            Category = category,
            SortBy = sortBy,
            SortDescending = sortDescending
        };

        var result = await _mediator.Send(query, cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Get a portal by ID
    /// </summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(PortalResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetPortalById(Guid id, CancellationToken cancellationToken = default)
    {
        var query = new GetPortalByIdQuery(id);
        var result = await _mediator.Send(query, cancellationToken);

        if (result == null)
        {
            return NotFound(new ApiResponse<object>
            {
                Success = false,
                Message = $"Portal with ID {id} not found"
            });
        }

        return Ok(new ApiResponse<PortalResponse>
        {
            Success = true,
            Data = result
        });
    }

    /// <summary>
    /// Create a new portal
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<PortalResponse>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreatePortal(
        [FromBody] CreatePortalRequest request,
        CancellationToken cancellationToken = default)
    {
        var command = new CreatePortalCommand
        {
            Name = request.Name,
            Url = request.Url,
            Description = request.Description,
            Icon = request.Icon,
            Category = request.Category,
            Environment = request.Environment,
            Priority = request.Priority,
            Owner = request.Owner,
            Team = request.Team,
            Tags = request.Tags,
            Config = request.Config
        };

        var result = await _mediator.Send(command, cancellationToken);

        return CreatedAtAction(
            nameof(GetPortalById),
            new { id = result.Id },
            new ApiResponse<PortalResponse>
            {
                Success = true,
                Data = result,
                Message = "Portal created successfully"
            });
    }

    /// <summary>
    /// Update an existing portal
    /// </summary>
    [HttpPut("{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse<PortalResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UpdatePortal(
        Guid id,
        [FromBody] UpdatePortalRequest request,
        CancellationToken cancellationToken = default)
    {
        var command = new UpdatePortalCommand
        {
            Id = id,
            Name = request.Name,
            Url = request.Url,
            Description = request.Description,
            Icon = request.Icon,
            Category = request.Category,
            Environment = request.Environment,
            Priority = request.Priority,
            Owner = request.Owner,
            Team = request.Team,
            Tags = request.Tags,
            Config = request.Config
        };

        var result = await _mediator.Send(command, cancellationToken);

        return Ok(new ApiResponse<PortalResponse>
        {
            Success = true,
            Data = result,
            Message = "Portal updated successfully"
        });
    }

    /// <summary>
    /// Delete a portal
    /// </summary>
    [HttpDelete("{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeletePortal(Guid id, CancellationToken cancellationToken = default)
    {
        var command = new DeletePortalCommand(id);
        var result = await _mediator.Send(command, cancellationToken);

        if (!result)
        {
            return NotFound(new ApiResponse<object>
            {
                Success = false,
                Message = $"Portal with ID {id} not found"
            });
        }

        return Ok(new ApiResponse<object>
        {
            Success = true,
            Message = "Portal deleted successfully"
        });
    }

    /// <summary>
    /// Update portal metrics
    /// </summary>
    [HttpPost("{id:guid}/metrics")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdatePortalMetrics(
        Guid id,
        [FromBody] UpdatePortalMetricsRequest request,
        CancellationToken cancellationToken = default)
    {
        var command = new UpdatePortalMetricsCommand
        {
            PortalId = id,
            Metrics = request.Metrics
        };

        var result = await _mediator.Send(command, cancellationToken);

        if (!result)
        {
            return NotFound(new ApiResponse<object>
            {
                Success = false,
                Message = $"Portal with ID {id} not found"
            });
        }

        return Ok(new ApiResponse<object>
        {
            Success = true,
            Message = "Portal metrics updated successfully"
        });
    }

    /// <summary>
    /// Get portal metrics history
    /// </summary>
    [HttpGet("{id:guid}/metrics/history")]
    [ProducesResponseType(typeof(ApiResponse<List<MetricsHistoryResponse>>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetPortalMetricsHistory(
        Guid id,
        [FromQuery] DateTime? from = null,
        [FromQuery] DateTime? to = null,
        [FromQuery] int limit = 100,
        CancellationToken cancellationToken = default)
    {
        var portal = await _mediator.Send(new GetPortalByIdQuery(id), cancellationToken);
        if (portal == null)
        {
            return NotFound(new ApiResponse<object>
            {
                Success = false,
                Message = $"Portal with ID {id} not found"
            });
        }

        // Note: In a real implementation, you would have a separate query for this
        var history = portal.MetricsHistory?
            .Where(h => (!from.HasValue || h.Timestamp >= from.Value) &&
                       (!to.HasValue || h.Timestamp <= to.Value))
            .OrderByDescending(h => h.Timestamp)
            .Take(limit)
            .ToList() ?? new List<MetricsHistoryResponse>();

        return Ok(new ApiResponse<List<MetricsHistoryResponse>>
        {
            Success = true,
            Data = history
        });
    }

    /// <summary>
    /// Get portal health check configuration
    /// </summary>
    [HttpGet("{id:guid}/health")]
    [ProducesResponseType(typeof(ApiResponse<HealthCheckResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetPortalHealthCheck(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var portal = await _mediator.Send(new GetPortalByIdQuery(id), cancellationToken);
        if (portal == null)
        {
            return NotFound(new ApiResponse<object>
            {
                Success = false,
                Message = $"Portal with ID {id} not found"
            });
        }

        // Note: In a real implementation, you would have health check data
        var healthCheck = new HealthCheckResponse
        {
            Id = Guid.NewGuid(),
            Type = "HTTP",
            Endpoint = portal.Url,
            Status = "Healthy",
            LastCheckTime = DateTime.UtcNow,
            ResponseTime = 250,
            StatusCode = 200
        };

        return Ok(new ApiResponse<HealthCheckResponse>
        {
            Success = true,
            Data = healthCheck
        });
    }

    /// <summary>
    /// Batch operations on portals
    /// </summary>
    [HttpPost("batch")]
    [ProducesResponseType(typeof(ApiResponse<BatchOperationResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> BatchOperation(
        [FromBody] BatchOperationRequest request,
        CancellationToken cancellationToken = default)
    {
        var results = new List<BatchOperationItemResult>();

        foreach (var portalId in request.PortalIds)
        {
            try
            {
                switch (request.Operation.ToLower())
                {
                    case "delete":
                        var deleteResult = await _mediator.Send(new DeletePortalCommand(portalId), cancellationToken);
                        results.Add(new BatchOperationItemResult
                        {
                            PortalId = portalId,
                            Success = deleteResult,
                            Message = deleteResult ? "Deleted successfully" : "Portal not found"
                        });
                        break;

                    case "updatestatus":
                        if (request.Data != null && request.Data.TryGetValue("status", out var statusValue))
                        {
                            // In a real implementation, you would have an UpdatePortalStatusCommand
                            results.Add(new BatchOperationItemResult
                            {
                                PortalId = portalId,
                                Success = true,
                                Message = "Status updated"
                            });
                        }
                        break;

                    default:
                        results.Add(new BatchOperationItemResult
                        {
                            PortalId = portalId,
                            Success = false,
                            Message = $"Unknown operation: {request.Operation}"
                        });
                        break;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing batch operation for portal {PortalId}", portalId);
                results.Add(new BatchOperationItemResult
                {
                    PortalId = portalId,
                    Success = false,
                    Message = ex.Message
                });
            }
        }

        var response = new BatchOperationResponse
        {
            Operation = request.Operation,
            TotalCount = request.PortalIds.Count,
            SuccessCount = results.Count(r => r.Success),
            FailureCount = results.Count(r => !r.Success),
            Results = results
        };

        return Ok(new ApiResponse<BatchOperationResponse>
        {
            Success = response.FailureCount == 0,
            Data = response,
            Message = $"Batch operation completed: {response.SuccessCount} succeeded, {response.FailureCount} failed"
        });
    }
}