using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using CentralCommand.Api.Models.DTOs;
using CentralCommand.Api.Services;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;

namespace CentralCommand.Api.Extensions;

public static class PortalEndpoints
{
    public static RouteGroupBuilder MapPortalEndpoints(this RouteGroupBuilder group)
    {
        // GET /api/v1/portals
        group.MapGet("/", GetPortals)
            .WithName("GetPortals")
            .WithSummary("Get all portals with pagination and filtering")
            .Produces<PagedResponse<PortalDto>>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status400BadRequest);

        // GET /api/v1/portals/{id}
        group.MapGet("/{id:guid}", GetPortalById)
            .WithName("GetPortalById")
            .WithSummary("Get a specific portal by ID")
            .Produces<PortalDto>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status404NotFound);

        // POST /api/v1/portals
        group.MapPost("/", CreatePortal)
            .WithName("CreatePortal")
            .WithSummary("Create a new portal")
            .RequireAuthorization("PortalWrite")
            .Produces<PortalDto>(StatusCodes.Status201Created)
            .ProducesValidationProblem()
            .ProducesProblem(StatusCodes.Status409Conflict);

        // PUT /api/v1/portals/{id}
        group.MapPut("/{id:guid}", UpdatePortal)
            .WithName("UpdatePortal")
            .WithSummary("Update an existing portal")
            .RequireAuthorization("PortalWrite")
            .Produces<PortalDto>(StatusCodes.Status200OK)
            .ProducesValidationProblem()
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status409Conflict);

        // DELETE /api/v1/portals/{id}
        group.MapDelete("/{id:guid}", DeletePortal)
            .WithName("DeletePortal")
            .WithSummary("Delete a portal")
            .RequireAuthorization("PortalWrite")
            .Produces(StatusCodes.Status204NoContent)
            .ProducesProblem(StatusCodes.Status404NotFound);

        // GET /api/v1/portals/{id}/metrics
        group.MapGet("/{id:guid}/metrics", GetPortalMetrics)
            .WithName("GetPortalMetrics")
            .WithSummary("Get current metrics for a portal")
            .Produces<PortalMetricsDto>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status404NotFound);

        // GET /api/v1/portals/{id}/metrics/history
        group.MapGet("/{id:guid}/metrics/history", GetPortalMetricsHistory)
            .WithName("GetPortalMetricsHistory")
            .WithSummary("Get historical metrics for a portal")
            .Produces<PortalMetricsHistoryDto>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status404NotFound);

        // POST /api/v1/portals/{id}/refresh-metrics
        group.MapPost("/{id:guid}/refresh-metrics", RefreshPortalMetrics)
            .WithName("RefreshPortalMetrics")
            .WithSummary("Trigger immediate metric refresh for a portal")
            .RequireAuthorization("PortalWrite")
            .Produces(StatusCodes.Status202Accepted)
            .ProducesProblem(StatusCodes.Status404NotFound);

        // GET /api/v1/portals/search
        group.MapGet("/search", SearchPortals)
            .WithName("SearchPortals")
            .WithSummary("Search portals by name or URL")
            .Produces<List<PortalDto>>(StatusCodes.Status200OK);

        // POST /api/v1/portals/bulk-metrics
        group.MapPost("/bulk-metrics", GetBulkMetrics)
            .WithName("GetBulkMetrics")
            .WithSummary("Get metrics for multiple portals")
            .Produces<Dictionary<Guid, PortalMetricsDto>>(StatusCodes.Status200OK);

        return group;
    }

    private static async Task<Results<Ok<PagedResponse<PortalDto>>, BadRequest<ProblemDetailsResponse>>> GetPortals(
        [AsParameters] PortalQuery query,
        IPortalService portalService,
        CancellationToken cancellationToken)
    {
        if (query.PageSize > 100)
        {
            return TypedResults.BadRequest(new ProblemDetailsResponse
            {
                Type = "https://centralcommand.com/errors/validation",
                Title = "Invalid page size",
                Status = StatusCodes.Status400BadRequest,
                Detail = "Page size cannot exceed 100 items"
            });
        }

        var result = await portalService.GetPortalsAsync(query, cancellationToken);
        return TypedResults.Ok(result);
    }

    private static async Task<Results<Ok<PortalDto>, NotFound>> GetPortalById(
        Guid id,
        IPortalService portalService,
        CancellationToken cancellationToken)
    {
        var portal = await portalService.GetPortalByIdAsync(id, cancellationToken);

        return portal != null
            ? TypedResults.Ok(portal)
            : TypedResults.NotFound();
    }

    private static async Task<Results<Created<PortalDto>, ValidationProblem, Conflict<ProblemDetailsResponse>>> CreatePortal(
        [FromBody] CreatePortalRequest request,
        IPortalService portalService,
        HttpContext httpContext,
        CancellationToken cancellationToken)
    {
        try
        {
            var portal = await portalService.CreatePortalAsync(request, cancellationToken);

            var location = $"{httpContext.Request.Scheme}://{httpContext.Request.Host}/api/v1/portals/{portal.Id}";
            return TypedResults.Created(location, portal);
        }
        catch (BusinessRuleException ex)
        {
            return TypedResults.Conflict(new ProblemDetailsResponse
            {
                Type = "https://centralcommand.com/errors/business-rule",
                Title = "Business rule violation",
                Status = StatusCodes.Status409Conflict,
                Detail = ex.Message
            });
        }
    }

    private static async Task<Results<Ok<PortalDto>, NotFound, Conflict<ProblemDetailsResponse>, ValidationProblem>> UpdatePortal(
        Guid id,
        [FromBody] UpdatePortalRequest request,
        IPortalService portalService,
        CancellationToken cancellationToken)
    {
        try
        {
            var portal = await portalService.UpdatePortalAsync(id, request, cancellationToken);
            return TypedResults.Ok(portal);
        }
        catch (NotFoundException)
        {
            return TypedResults.NotFound();
        }
        catch (ConcurrencyException ex)
        {
            return TypedResults.Conflict(new ProblemDetailsResponse
            {
                Type = "https://centralcommand.com/errors/concurrency",
                Title = "Concurrency conflict",
                Status = StatusCodes.Status409Conflict,
                Detail = ex.Message
            });
        }
        catch (BusinessRuleException ex)
        {
            return TypedResults.Conflict(new ProblemDetailsResponse
            {
                Type = "https://centralcommand.com/errors/business-rule",
                Title = "Business rule violation",
                Status = StatusCodes.Status409Conflict,
                Detail = ex.Message
            });
        }
    }

    private static async Task<Results<NoContent, NotFound>> DeletePortal(
        Guid id,
        IPortalService portalService,
        CancellationToken cancellationToken)
    {
        try
        {
            await portalService.DeletePortalAsync(id, cancellationToken);
            return TypedResults.NoContent();
        }
        catch (NotFoundException)
        {
            return TypedResults.NotFound();
        }
    }

    private static async Task<Results<Ok<PortalMetricsDto>, NotFound>> GetPortalMetrics(
        Guid id,
        [FromQuery] bool includeHistory,
        IPortalService portalService,
        CancellationToken cancellationToken)
    {
        var metrics = await portalService.GetPortalMetricsAsync(id, cancellationToken);

        return metrics != null
            ? TypedResults.Ok(metrics)
            : TypedResults.NotFound();
    }

    private static async Task<Results<Ok<PortalMetricsHistoryDto>, BadRequest<ProblemDetailsResponse>, NotFound>> GetPortalMetricsHistory(
        Guid id,
        [FromQuery] DateTime from,
        [FromQuery] DateTime to,
        [FromQuery] MetricInterval interval,
        [FromQuery] List<string>? metrics,
        IPortalService portalService,
        CancellationToken cancellationToken)
    {
        if (from >= to)
        {
            return TypedResults.BadRequest(new ProblemDetailsResponse
            {
                Type = "https://centralcommand.com/errors/validation",
                Title = "Invalid date range",
                Status = StatusCodes.Status400BadRequest,
                Detail = "From date must be before To date"
            });
        }

        if ((to - from).TotalDays > 90)
        {
            return TypedResults.BadRequest(new ProblemDetailsResponse
            {
                Type = "https://centralcommand.com/errors/validation",
                Title = "Date range too large",
                Status = StatusCodes.Status400BadRequest,
                Detail = "Date range cannot exceed 90 days"
            });
        }

        try
        {
            var history = await portalService.GetPortalMetricsHistoryAsync(
                id, from, to, interval, metrics, cancellationToken);

            return TypedResults.Ok(history);
        }
        catch (NotFoundException)
        {
            return TypedResults.NotFound();
        }
    }

    private static async Task<Results<Accepted, NotFound>> RefreshPortalMetrics(
        Guid id,
        IPortalService portalService,
        CancellationToken cancellationToken)
    {
        try
        {
            // Fire and forget - metrics will be updated asynchronously
            _ = Task.Run(async () =>
            {
                await portalService.RefreshPortalMetricsAsync(id, CancellationToken.None);
            }, CancellationToken.None);

            return TypedResults.Accepted($"/api/v1/portals/{id}/metrics");
        }
        catch (NotFoundException)
        {
            return TypedResults.NotFound();
        }
    }

    private static async Task<Ok<List<PortalDto>>> SearchPortals(
        [FromQuery] string q,
        [FromQuery] int limit,
        IPortalService portalService,
        CancellationToken cancellationToken)
    {
        var limitValue = limit > 0 && limit <= 50 ? limit : 10;
        var results = await portalService.SearchPortalsAsync(q ?? string.Empty, limitValue, cancellationToken);
        return TypedResults.Ok(results);
    }

    private static async Task<Ok<Dictionary<Guid, PortalMetricsDto>>> GetBulkMetrics(
        [FromBody] List<Guid> portalIds,
        IPortalService portalService,
        CancellationToken cancellationToken)
    {
        var metrics = await portalService.GetBulkPortalMetricsAsync(portalIds, cancellationToken);
        return TypedResults.Ok(metrics);
    }
}

// Custom exception types
public class NotFoundException : Exception
{
    public NotFoundException(string message) : base(message) { }
}

public class BusinessRuleException : Exception
{
    public BusinessRuleException(string message) : base(message) { }
}

public class ConcurrencyException : Exception
{
    public ConcurrencyException(string message) : base(message) { }
}