using CentralCommand.Core.DTOs.Common;
using CentralCommand.Core.DTOs.Responses;
using CentralCommand.Core.Extensions;
using MediatR;
using Microsoft.Extensions.Logging;

namespace CentralCommand.Api.Application.Queries.Incidents;

public class GetIncidentsQueryHandler : IRequestHandler<GetIncidentsQuery, PagedResult<IncidentResponse>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<GetIncidentsQueryHandler> _logger;

    public GetIncidentsQueryHandler(
        IUnitOfWork unitOfWork,
        ILogger<GetIncidentsQueryHandler> logger)
    {
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    public async Task<PagedResult<IncidentResponse>> Handle(GetIncidentsQuery request, CancellationToken cancellationToken)
    {
        _logger.LogDebug("Getting incidents with filters: Status={Status}, Priority={Priority}, Type={Type}",
            request.Status, request.Priority, request.Type);

        var allIncidents = await _unitOfWork.Incidents.GetAllAsync(cancellationToken);

        // Apply filters
        var filteredIncidents = allIncidents.AsQueryable();

        if (!string.IsNullOrWhiteSpace(request.SearchTerm))
        {
            var searchLower = request.SearchTerm.ToLower();
            filteredIncidents = filteredIncidents.Where(i =>
                i.Title.ToLower().Contains(searchLower) ||
                i.Description.ToLower().Contains(searchLower) ||
                i.Tags.Any(t => t.ToLower().Contains(searchLower)));
        }

        if (request.Status.HasValue)
        {
            filteredIncidents = filteredIncidents.Where(i => i.Status == request.Status.Value);
        }

        if (request.Priority.HasValue)
        {
            filteredIncidents = filteredIncidents.Where(i => i.Priority == request.Priority.Value);
        }

        if (request.Type.HasValue)
        {
            filteredIncidents = filteredIncidents.Where(i => i.Type == request.Type.Value);
        }

        if (request.PortalId.HasValue)
        {
            filteredIncidents = filteredIncidents.Where(i => i.AffectedPortalIds.Contains(request.PortalId.Value));
        }

        if (!string.IsNullOrWhiteSpace(request.AssignedTo))
        {
            filteredIncidents = filteredIncidents.Where(i => i.AssignedTo == request.AssignedTo);
        }

        if (request.StartDate.HasValue)
        {
            filteredIncidents = filteredIncidents.Where(i => i.CreatedAt >= request.StartDate.Value);
        }

        if (request.EndDate.HasValue)
        {
            filteredIncidents = filteredIncidents.Where(i => i.CreatedAt <= request.EndDate.Value);
        }

        // Apply sorting
        filteredIncidents = request.SortBy?.ToLower() switch
        {
            "title" => request.SortDescending
                ? filteredIncidents.OrderByDescending(i => i.Title)
                : filteredIncidents.OrderBy(i => i.Title),
            "status" => request.SortDescending
                ? filteredIncidents.OrderByDescending(i => i.Status)
                : filteredIncidents.OrderBy(i => i.Status),
            "priority" => request.SortDescending
                ? filteredIncidents.OrderByDescending(i => i.Priority)
                : filteredIncidents.OrderBy(i => i.Priority),
            "type" => request.SortDescending
                ? filteredIncidents.OrderByDescending(i => i.Type)
                : filteredIncidents.OrderBy(i => i.Type),
            "updatedat" => request.SortDescending
                ? filteredIncidents.OrderByDescending(i => i.UpdatedAt ?? i.CreatedAt)
                : filteredIncidents.OrderBy(i => i.UpdatedAt ?? i.CreatedAt),
            _ => request.SortDescending
                ? filteredIncidents.OrderByDescending(i => i.CreatedAt)
                : filteredIncidents.OrderBy(i => i.CreatedAt)
        };

        var totalItems = filteredIncidents.Count();

        // Apply pagination
        var pagedIncidents = filteredIncidents
            .Skip((request.PageNumber - 1) * request.PageSize)
            .Take(request.PageSize)
            .ToList();

        var incidentResponses = pagedIncidents.Select(i => i.ToResponse()).ToList();

        return new PagedResult<IncidentResponse>
        {
            Items = incidentResponses,
            PageNumber = request.PageNumber,
            PageSize = request.PageSize,
            TotalItems = totalItems,
            TotalPages = (int)Math.Ceiling(totalItems / (double)request.PageSize)
        };
    }
}