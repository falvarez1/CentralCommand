using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using CentralCommand.Api.Models.DTOs;
using CentralCommand.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;

namespace CentralCommand.Api.Hubs;

[Authorize]
public class MetricsHub : Hub<IMetricsHubClient>
{
    private readonly IPortalService _portalService;
    private readonly IConnectionManager _connectionManager;
    private readonly ILogger<MetricsHub> _logger;

    public MetricsHub(
        IPortalService portalService,
        IConnectionManager connectionManager,
        ILogger<MetricsHub> logger)
    {
        _portalService = portalService;
        _connectionManager = connectionManager;
        _logger = logger;
    }

    public override async Task OnConnectedAsync()
    {
        var userId = Context.UserIdentifier;
        var connectionId = Context.ConnectionId;

        if (userId != null)
        {
            await _connectionManager.AddConnectionAsync(userId, connectionId);
            _logger.LogInformation("User {UserId} connected with connection {ConnectionId}", userId, connectionId);

            // Send initial state to the connected client
            try
            {
                var portals = await _portalService.GetUserPortalsAsync(userId);
                await Clients.Caller.InitialDataLoaded(new InitialDataPayload
                {
                    Portals = portals,
                    Timestamp = DateTime.UtcNow
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending initial data to user {UserId}", userId);
            }
        }

        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var userId = Context.UserIdentifier;
        var connectionId = Context.ConnectionId;

        if (userId != null)
        {
            await _connectionManager.RemoveConnectionAsync(userId, connectionId);
            _logger.LogInformation("User {UserId} disconnected from connection {ConnectionId}", userId, connectionId);
        }

        if (exception != null)
        {
            _logger.LogError(exception, "User {UserId} disconnected with error", userId);
        }

        await base.OnDisconnectedAsync(exception);
    }

    public async Task SubscribeToPortal(Guid portalId)
    {
        var groupName = GetPortalGroupName(portalId);
        await Groups.AddToGroupAsync(Context.ConnectionId, groupName);

        _logger.LogDebug("Connection {ConnectionId} subscribed to portal {PortalId}",
            Context.ConnectionId, portalId);

        // Send current metrics for the subscribed portal
        try
        {
            var metrics = await _portalService.GetPortalMetricsAsync(portalId);
            await Clients.Caller.PortalMetricsUpdated(new PortalMetricsUpdate
            {
                PortalId = portalId,
                Metrics = metrics,
                Timestamp = DateTime.UtcNow
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending metrics for portal {PortalId}", portalId);
        }
    }

    public async Task UnsubscribeFromPortal(Guid portalId)
    {
        var groupName = GetPortalGroupName(portalId);
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, groupName);

        _logger.LogDebug("Connection {ConnectionId} unsubscribed from portal {PortalId}",
            Context.ConnectionId, portalId);
    }

    public async Task SubscribeToIncidents(IncidentSeverity? severity = null)
    {
        var groupName = severity.HasValue
            ? $"incidents-{severity.Value.ToString().ToLower()}"
            : "incidents-all";

        await Groups.AddToGroupAsync(Context.ConnectionId, groupName);

        _logger.LogDebug("Connection {ConnectionId} subscribed to incidents group {GroupName}",
            Context.ConnectionId, groupName);
    }

    public async Task UnsubscribeFromIncidents()
    {
        var groups = new[] { "incidents-all", "incidents-critical", "incidents-high", "incidents-medium", "incidents-low" };

        foreach (var group in groups)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, group);
        }

        _logger.LogDebug("Connection {ConnectionId} unsubscribed from all incident groups", Context.ConnectionId);
    }

    public async Task SubscribeToSystemAlerts()
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, "system-alerts");
        _logger.LogDebug("Connection {ConnectionId} subscribed to system alerts", Context.ConnectionId);
    }

    public async Task RequestMetricsRefresh(Guid portalId)
    {
        _logger.LogInformation("Metrics refresh requested for portal {PortalId} by connection {ConnectionId}",
            portalId, Context.ConnectionId);

        try
        {
            // Trigger immediate metrics collection for the portal
            await _portalService.RefreshPortalMetricsAsync(portalId);

            // Notify the caller that refresh was initiated
            await Clients.Caller.MetricsRefreshInitiated(portalId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error refreshing metrics for portal {PortalId}", portalId);
            await Clients.Caller.ErrorOccurred(new ErrorMessage
            {
                Code = "METRICS_REFRESH_FAILED",
                Message = $"Failed to refresh metrics for portal {portalId}",
                Timestamp = DateTime.UtcNow
            });
        }
    }

    private static string GetPortalGroupName(Guid portalId) => $"portal-{portalId}";
}

// Client interface for strongly-typed hub
public interface IMetricsHubClient
{
    Task InitialDataLoaded(InitialDataPayload payload);
    Task PortalMetricsUpdated(PortalMetricsUpdate update);
    Task PortalStatusChanged(PortalStatusChange change);
    Task IncidentCreated(IncidentNotification notification);
    Task IncidentUpdated(IncidentNotification notification);
    Task SystemAlert(SystemAlertNotification alert);
    Task MetricsRefreshInitiated(Guid portalId);
    Task ErrorOccurred(ErrorMessage error);
}

// SignalR message payloads
public record InitialDataPayload
{
    public List<PortalDto> Portals { get; init; } = new();
    public DateTime Timestamp { get; init; }
}

public record PortalMetricsUpdate
{
    public Guid PortalId { get; init; }
    public PortalMetricsDto? Metrics { get; init; }
    public DateTime Timestamp { get; init; }
}

public record BulkPortalMetricsUpdate
{
    public List<PortalMetricsUpdate> Updates { get; init; } = new();
    public DateTime Timestamp { get; init; }
}

public record PortalStatusChange
{
    public Guid PortalId { get; init; }
    public string PortalName { get; init; } = string.Empty;
    public PortalStatus OldStatus { get; init; }
    public PortalStatus NewStatus { get; init; }
    public string? Reason { get; init; }
    public DateTime Timestamp { get; init; }
}

public record IncidentNotification
{
    public Guid IncidentId { get; init; }
    public string Title { get; init; } = string.Empty;
    public IncidentSeverity Severity { get; init; }
    public IncidentStatus Status { get; init; }
    public Guid? PortalId { get; init; }
    public string? PortalName { get; init; }
    public string? AssignedTo { get; init; }
    public DateTime Timestamp { get; init; }
}

public record SystemAlertNotification
{
    public Guid AlertId { get; init; }
    public AlertType Type { get; init; }
    public AlertSeverity Severity { get; init; }
    public string Title { get; init; } = string.Empty;
    public string Message { get; init; } = string.Empty;
    public Dictionary<string, object>? Metadata { get; init; }
    public DateTime Timestamp { get; init; }
}

public record ErrorMessage
{
    public string Code { get; init; } = string.Empty;
    public string Message { get; init; } = string.Empty;
    public DateTime Timestamp { get; init; }
}