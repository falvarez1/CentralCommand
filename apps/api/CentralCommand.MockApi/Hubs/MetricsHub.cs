using Microsoft.AspNetCore.SignalR;
using CentralCommand.MockApi.Models;

namespace CentralCommand.MockApi.Hubs;

public class MetricsHub : Hub
{
    public async Task SendPortalMetricsUpdate(string portalId, PortalMetrics metrics)
    {
        await Clients.All.SendAsync("PortalMetricsUpdated", portalId, metrics);
    }

    public async Task SendIncidentUpdate(Incident incident)
    {
        await Clients.All.SendAsync("IncidentStatusChanged", incident);
    }

    public async Task SendStatisticsUpdate(Statistics statistics)
    {
        await Clients.All.SendAsync("StatisticsUpdated", statistics);
    }

    public override async Task OnConnectedAsync()
    {
        await Clients.Caller.SendAsync("Connected", $"Connection established: {Context.ConnectionId}");
        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        await base.OnDisconnectedAsync(exception);
    }
}