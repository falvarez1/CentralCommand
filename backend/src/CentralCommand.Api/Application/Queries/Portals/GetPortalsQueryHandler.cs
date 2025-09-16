using CentralCommand.Core.Domain.Enums;
using CentralCommand.Core.DTOs.Common;
using CentralCommand.Core.DTOs.Responses;
using CentralCommand.Core.Extensions;
using MediatR;
using Microsoft.Extensions.Logging;

namespace CentralCommand.Api.Application.Queries.Portals;

public class GetPortalsQueryHandler : IRequestHandler<GetPortalsQuery, PagedResult<PortalResponse>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<GetPortalsQueryHandler> _logger;

    public GetPortalsQueryHandler(
        IUnitOfWork unitOfWork,
        ILogger<GetPortalsQueryHandler> logger)
    {
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    public async Task<PagedResult<PortalResponse>> Handle(GetPortalsQuery request, CancellationToken cancellationToken)
    {
        _logger.LogDebug("Getting portals with filters: Status={Status}, Environment={Environment}, Category={Category}",
            request.Status, request.Environment, request.Category);

        var allPortals = await _unitOfWork.Portals.GetAllAsync(cancellationToken);

        // Apply filters
        var filteredPortals = allPortals.AsQueryable();

        if (!string.IsNullOrWhiteSpace(request.SearchTerm))
        {
            var searchLower = request.SearchTerm.ToLower();
            filteredPortals = filteredPortals.Where(p =>
                p.Name.ToLower().Contains(searchLower) ||
                (p.Description != null && p.Description.ToLower().Contains(searchLower)) ||
                p.Category.ToString().ToLower().Contains(searchLower));
        }

        if (request.Status.HasValue)
        {
            filteredPortals = filteredPortals.Where(p => p.Status == request.Status.Value);
        }

        if (request.Environment.HasValue)
        {
            filteredPortals = filteredPortals.Where(p => p.Environment == request.Environment.Value);
        }

        if (!string.IsNullOrWhiteSpace(request.Category))
        {
            if (Enum.TryParse<PortalCategory>(request.Category, true, out var category))
            {
                filteredPortals = filteredPortals.Where(p => p.Category == category);
            }
        }

        // Apply sorting
        filteredPortals = request.SortBy?.ToLower() switch
        {
            "name" => request.SortDescending
                ? filteredPortals.OrderByDescending(p => p.Name)
                : filteredPortals.OrderBy(p => p.Name),
            "status" => request.SortDescending
                ? filteredPortals.OrderByDescending(p => p.Status)
                : filteredPortals.OrderBy(p => p.Status),
            "environment" => request.SortDescending
                ? filteredPortals.OrderByDescending(p => p.Environment)
                : filteredPortals.OrderBy(p => p.Environment),
            "priority" => request.SortDescending
                ? filteredPortals.OrderByDescending(p => p.Priority)
                : filteredPortals.OrderBy(p => p.Priority),
            "uptime" => request.SortDescending
                ? filteredPortals.OrderByDescending(p => p.Metrics.Uptime)
                : filteredPortals.OrderBy(p => p.Metrics.Uptime),
            "responsetime" => request.SortDescending
                ? filteredPortals.OrderByDescending(p => p.Metrics.ResponseTime)
                : filteredPortals.OrderBy(p => p.Metrics.ResponseTime),
            _ => request.SortDescending
                ? filteredPortals.OrderByDescending(p => p.CreatedAt)
                : filteredPortals.OrderBy(p => p.CreatedAt)
        };

        var totalItems = filteredPortals.Count();

        // Apply pagination
        var pagedPortals = filteredPortals
            .Skip((request.PageNumber - 1) * request.PageSize)
            .Take(request.PageSize)
            .ToList();

        var portalResponses = pagedPortals.Select(p => p.ToResponse()!).ToList();

        return new PagedResult<PortalResponse>
        {
            Items = portalResponses,
            PageNumber = request.PageNumber,
            PageSize = request.PageSize,
            TotalCount = totalItems
        };
    }
}