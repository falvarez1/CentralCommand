using Microsoft.AspNetCore.SignalR;

namespace CentralCommand.Api.Hubs;

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