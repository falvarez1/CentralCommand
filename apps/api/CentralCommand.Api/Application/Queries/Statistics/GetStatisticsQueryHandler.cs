using CentralCommand.Core.Domain.Enums;
using CentralCommand.Core.DTOs.Responses;
using MediatR;
using Microsoft.Extensions.Logging;

namespace CentralCommand.Api.Application.Queries.Statistics;

public class GetStatisticsQueryHandler : IRequestHandler<GetStatisticsQuery, StatisticsResponse>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<GetStatisticsQueryHandler> _logger;

    public GetStatisticsQueryHandler(
        IUnitOfWork unitOfWork,
        ILogger<GetStatisticsQueryHandler> logger)
    {
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    public async Task<StatisticsResponse> Handle(GetStatisticsQuery request, CancellationToken cancellationToken)
    {
        _logger.LogDebug("Getting system statistics");

        var portals = await _unitOfWork.Portals.GetAllAsync(cancellationToken);
        var incidents = await _unitOfWork.Incidents.GetAllAsync(cancellationToken);

        var portalsList = portals.ToList();
        var incidentsList = incidents.ToList();

        // Calculate portal statistics
        var totalPortals = portalsList.Count;
        var healthyPortals = portalsList.Count(p => p.Status == PortalStatus.Healthy);
        var warningPortals = portalsList.Count(p => p.Status == PortalStatus.Warning);
        var degradedPortals = portalsList.Count(p => p.Status == PortalStatus.Degraded);
        var downPortals = portalsList.Count(p => p.Status == PortalStatus.Down);

        // Calculate incident statistics
        var activeIncidents = incidentsList.Count(i =>
            i.Status != IncidentStatus.Resolved && i.Status != IncidentStatus.Closed);
        var criticalIncidents = incidentsList.Count(i =>
            i.Priority == IncidentPriority.Critical &&
            i.Status != IncidentStatus.Resolved &&
            i.Status != IncidentStatus.Closed);

        // Calculate performance metrics
        var averageResponseTime = portalsList.Any()
            ? portalsList.Average(p => p.Metrics.ResponseTime)
            : 0;
        var averageUptime = portalsList.Any()
            ? portalsList.Average(p => p.Metrics.Uptime)
            : 100;
        var averageErrorRate = portalsList.Any()
            ? portalsList.Average(p => p.Metrics.ErrorRate)
            : 0;

        // Get recent incidents
        var recentIncidents = incidentsList
            .OrderByDescending(i => i.CreatedAt)
            .Take(5)
            .Select(i => new RecentIncidentInfo
            {
                Id = i.Id,
                Title = i.Title,
                Status = i.Status.ToString(),
                Priority = i.Priority.ToString(),
                CreatedAt = i.CreatedAt
            })
            .ToList();

        // Get portal status breakdown
        var portalStatusBreakdown = new Dictionary<string, int>
        {
            { "Healthy", healthyPortals },
            { "Warning", warningPortals },
            { "Degraded", degradedPortals },
            { "Down", downPortals },
            { "Unknown", portalsList.Count(p => p.Status == PortalStatus.Unknown) },
            { "Maintenance", portalsList.Count(p => p.Status == PortalStatus.Maintenance) }
        };

        // Get incident type breakdown
        var incidentTypeBreakdown = incidentsList
            .Where(i => i.Status != IncidentStatus.Resolved && i.Status != IncidentStatus.Closed)
            .GroupBy(i => i.Type.ToString())
            .ToDictionary(g => g.Key, g => g.Count());

        var response = new StatisticsResponse
        {
            TotalPortals = totalPortals,
            HealthyPortals = healthyPortals,
            WarningPortals = warningPortals,
            DegradedPortals = degradedPortals,
            DownPortals = downPortals,
            ActiveIncidents = activeIncidents,
            CriticalIncidents = criticalIncidents,
            AverageResponseTime = Math.Round(averageResponseTime, 2),
            AverageUptime = Math.Round(averageUptime, 2),
            AverageErrorRate = Math.Round(averageErrorRate, 2),
            TotalRequests = portalsList.Sum(p => (int)p.Metrics.RequestsPerMinute * 60 * 24), // Daily estimate
            LastUpdated = DateTime.UtcNow,
            RecentIncidents = recentIncidents,
            PortalStatusBreakdown = portalStatusBreakdown,
            IncidentTypeBreakdown = incidentTypeBreakdown
        };

        _logger.LogDebug("Statistics retrieved successfully");

        return response;
    }
}