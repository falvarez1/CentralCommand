using CentralCommand.Core.Domain.Entities;
using CentralCommand.Core.Domain.Enums;
using CentralCommand.Core.Domain.ValueObjects;
using CentralCommand.Core.Interfaces.Repositories;
using MediatR;
using Microsoft.AspNetCore.SignalR;
using CentralCommand.Api.Hubs;
using Microsoft.Extensions.Logging;

namespace CentralCommand.Api.Application.Commands.Portals;

public class UpdatePortalMetricsCommandHandler : IRequestHandler<UpdatePortalMetricsCommand, bool>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IHubContext<MetricsHub> _hubContext;
    private readonly ILogger<UpdatePortalMetricsCommandHandler> _logger;

    public UpdatePortalMetricsCommandHandler(
        IUnitOfWork unitOfWork,
        IHubContext<MetricsHub> hubContext,
        ILogger<UpdatePortalMetricsCommandHandler> logger)
    {
        _unitOfWork = unitOfWork;
        _hubContext = hubContext;
        _logger = logger;
    }

    public async Task<bool> Handle(UpdatePortalMetricsCommand request, CancellationToken cancellationToken)
    {
        _logger.LogDebug("Updating metrics for portal: {PortalId}", request.PortalId);

        var portal = await _unitOfWork.Portals.GetByIdAsync(request.PortalId, cancellationToken);
        if (portal == null)
        {
            _logger.LogWarning("Portal not found: {PortalId}", request.PortalId);
            return false;
        }

        // Update metrics
        portal.Metrics = request.Metrics;
        portal.Metrics.LastUpdated = DateTime.UtcNow;
        portal.LastCheckedAt = DateTime.UtcNow;

        // Update status based on metrics
        portal.Status = DetermineStatus(request.Metrics);

        // Add to metrics history
        var historyEntry = new MetricsHistory
        {
            Id = Guid.NewGuid(),
            Timestamp = DateTime.UtcNow,
            ResponseTime = request.Metrics.ResponseTime,
            Uptime = request.Metrics.Uptime,
            ErrorRate = request.Metrics.ErrorRate,
            RequestsPerMinute = request.Metrics.RequestsPerMinute
        };
        portal.MetricsHistory.Add(historyEntry);

        // Keep only last 100 history entries
        if (portal.MetricsHistory.Count > 100)
        {
            portal.MetricsHistory = portal.MetricsHistory
                .OrderByDescending(h => h.Timestamp)
                .Take(100)
                .ToList();
        }

        await _unitOfWork.Portals.UpdateAsync(portal, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        // Notify connected clients
        await _hubContext.Clients.All.SendAsync(
            "PortalMetricsUpdated",
            new { PortalId = portal.Id, Metrics = request.Metrics, Status = portal.Status },
            cancellationToken);

        _logger.LogDebug("Metrics updated successfully for portal: {PortalId}", request.PortalId);

        return true;
    }

    private PortalStatus DetermineStatus(PortalMetrics metrics)
    {
        if (metrics.Uptime < 50 || metrics.ErrorRate > 50)
            return PortalStatus.Down;

        if (metrics.Uptime < 90 || metrics.ErrorRate > 10 || metrics.ResponseTime > 5000)
            return PortalStatus.Degraded;

        if (metrics.ResponseTime > 2000 || metrics.ErrorRate > 5)
            return PortalStatus.Warning;

        return PortalStatus.Healthy;
    }
}