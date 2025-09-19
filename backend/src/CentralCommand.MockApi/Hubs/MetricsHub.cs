using Microsoft.AspNetCore.SignalR;
using CentralCommand.MockApi.Models;
using CentralCommand.MockApi.Services;

namespace CentralCommand.MockApi.Hubs;

/// <summary>
/// SignalR hub for real-time metrics updates
/// </summary>
public class MetricsHub : Hub
{
    private readonly ILogger<MetricsHub> _logger;

    public MetricsHub(ILogger<MetricsHub> logger)
    {
        _logger = logger;
    }

    public override async Task OnConnectedAsync()
    {
        _logger.LogInformation($"Client connected: {Context.ConnectionId}");
        await Clients.Caller.SendAsync("Connected", Context.ConnectionId);
        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        _logger.LogInformation($"Client disconnected: {Context.ConnectionId}");
        await base.OnDisconnectedAsync(exception);
    }

    public async Task SubscribeToPortal(string portalId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"portal-{portalId}");
        _logger.LogInformation($"Client {Context.ConnectionId} subscribed to portal {portalId}");
    }

    public async Task UnsubscribeFromPortal(string portalId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"portal-{portalId}");
        _logger.LogInformation($"Client {Context.ConnectionId} unsubscribed from portal {portalId}");
    }

    public async Task SubscribeToIncidents()
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, "incidents");
        _logger.LogInformation($"Client {Context.ConnectionId} subscribed to incidents");
    }

    public async Task UnsubscribeFromIncidents()
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, "incidents");
        _logger.LogInformation($"Client {Context.ConnectionId} unsubscribed from incidents");
    }

    public async Task SubscribeToStatistics()
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, "statistics");
        _logger.LogInformation($"Client {Context.ConnectionId} subscribed to statistics");
    }

    public async Task UnsubscribeFromStatistics()
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, "statistics");
        _logger.LogInformation($"Client {Context.ConnectionId} unsubscribed from statistics");
    }

    public async Task SubscribeToSystemUpdates()
    {
        // Subscribe to all system-wide updates
        await Groups.AddToGroupAsync(Context.ConnectionId, "system");
        await Groups.AddToGroupAsync(Context.ConnectionId, "incidents");
        await Groups.AddToGroupAsync(Context.ConnectionId, "statistics");
        _logger.LogInformation($"Client {Context.ConnectionId} subscribed to system updates");
    }

    public async Task SubscribeToPortals(string[] portalIds)
    {
        foreach (var portalId in portalIds)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"portal-{portalId}");
        }
        _logger.LogInformation($"Client {Context.ConnectionId} subscribed to {portalIds.Length} portals");
    }
}

/// <summary>
/// Background service for sending periodic metric updates
/// </summary>
public class MetricsUpdateService : BackgroundService
{
    private readonly IHubContext<MetricsHub> _hubContext;
    private readonly MockDataService _mockDataService;
    private readonly StatisticsService _statisticsService;
    private readonly ILogger<MetricsUpdateService> _logger;
    private readonly Random _random = new();

    public MetricsUpdateService(
        IHubContext<MetricsHub> hubContext,
        MockDataService mockDataService,
        StatisticsService statisticsService,
        ILogger<MetricsUpdateService> logger)
    {
        _hubContext = hubContext;
        _mockDataService = mockDataService;
        _statisticsService = statisticsService;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                // Send portal metrics updates
                await SendPortalMetricsUpdate();

                // Send system statistics update
                await SendStatisticsUpdate();

                // Occasionally send incident updates
                if (_random.Next(100) > 80) // 20% chance
                {
                    await SendIncidentUpdate();
                }

                // Wait 30 seconds before next update
                await Task.Delay(TimeSpan.FromSeconds(30), stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in metrics update service");
                await Task.Delay(TimeSpan.FromSeconds(5), stoppingToken);
            }
        }
    }

    private async Task SendPortalMetricsUpdate()
    {
        var portals = _mockDataService.GetPortals();

        // Update metrics for a random subset of portals
        var portalsToUpdate = portals.OrderBy(_ => _random.Next()).Take(_random.Next(3, 8)).ToList();

        foreach (var portal in portalsToUpdate)
        {
            _mockDataService.UpdatePortalMetrics(portal.Id);

            var update = new
            {
                portalId = portal.Id,
                metrics = portal.Metrics,
                status = portal.Status.ToString().ToLower(),
                lastChecked = portal.LastChecked,
                timestamp = DateTime.UtcNow
            };

            // Send to portal-specific group
            await _hubContext.Clients.Group($"portal-{portal.Id}").SendAsync("PortalMetricsUpdate", update);

            // Also send as MetricUpdate for general listeners
            var metricUpdate = new
            {
                portalId = portal.Id.ToString(),
                metric = "all",
                value = portal.Metrics?.ResponseTime ?? 0,
                timestamp = DateTime.UtcNow.ToString("O")
            };
            await _hubContext.Clients.Group("system").SendAsync("MetricUpdate", metricUpdate);
        }

        _logger.LogDebug($"Sent metrics updates for {portalsToUpdate.Count} portals");
    }

    private async Task SendStatisticsUpdate()
    {
        var stats = _statisticsService.GetSystemStats();
        var sparklines = _statisticsService.GetSparklines();

        var update = new
        {
            statistics = stats,
            sparklines = sparklines,
            timestamp = DateTime.UtcNow
        };

        await _hubContext.Clients.Group("statistics").SendAsync("StatisticsUpdate", update);

        // Also send as SystemHealthUpdate for compatibility
        var healthUpdate = new
        {
            cpuUsage = stats.AverageCpu,
            memoryUsage = stats.AverageMemory,
            diskUsage = stats.DiskUsage,
            networkLatency = stats.NetworkLatency,
            timestamp = DateTime.UtcNow.ToString("O")
        };
        await _hubContext.Clients.Group("system").SendAsync("SystemHealthUpdate", healthUpdate);

        _logger.LogDebug("Sent statistics update");
    }

    private async Task SendIncidentUpdate()
    {
        var incidents = _mockDataService.GetIncidents();
        var activeIncidents = incidents.Where(i => i.Status != IncidentStatus.Resolved && i.Status != IncidentStatus.Closed).ToList();

        if (activeIncidents.Any())
        {
            var incident = activeIncidents[_random.Next(activeIncidents.Count)];

            // Simulate status change
            var newStatus = GetNextStatus(incident.Status);
            if (newStatus != incident.Status)
            {
                incident.Status = newStatus;
                incident.UpdatedAt = DateTime.UtcNow;
                incident.ETag = $"\"{Guid.NewGuid():N}\"";
                incident.Timeline.Add(new TimelineEntry
                {
                    Id = Guid.NewGuid(),
                    Timestamp = DateTime.UtcNow,
                    Action = $"Status changed to {newStatus}",
                    Description = "Automated update",
                    PerformedBy = Guid.NewGuid()
                });

                if (newStatus == IncidentStatus.Resolved)
                {
                    incident.ResolvedAt = DateTime.UtcNow;
                    incident.Resolution = "Issue has been resolved";
                }

                var update = new
                {
                    incident = incident,
                    action = "statusChanged",
                    timestamp = DateTime.UtcNow
                };

                await _hubContext.Clients.Group("incidents").SendAsync("IncidentUpdate", update);

                // Also send simplified IncidentUpdate for React app
                var simpleUpdate = new
                {
                    incidentId = incident.Id.ToString(),
                    status = incident.Status.ToString(),
                    severity = incident.Severity.ToString(),
                    updatedAt = incident.UpdatedAt.ToString("O")
                };
                await _hubContext.Clients.Group("system").SendAsync("IncidentUpdate", simpleUpdate);

                // Send NewIncident notification if it's a new incident
                if (incident.Status == IncidentStatus.Open && incident.CreatedAt > DateTime.UtcNow.AddMinutes(-1))
                {
                    await _hubContext.Clients.Group("system").SendAsync("NewIncident", incident);
                }

                _logger.LogDebug($"Sent incident update for {incident.Id}");
            }
        }
    }

    private IncidentStatus GetNextStatus(IncidentStatus current)
    {
        return current switch
        {
            IncidentStatus.Open => IncidentStatus.InProgress,
            IncidentStatus.InProgress => _random.Next(100) > 30 ? IncidentStatus.Resolved : IncidentStatus.InProgress,
            IncidentStatus.Resolved => _random.Next(100) > 50 ? IncidentStatus.Closed : IncidentStatus.Resolved,
            _ => current
        };
    }
}