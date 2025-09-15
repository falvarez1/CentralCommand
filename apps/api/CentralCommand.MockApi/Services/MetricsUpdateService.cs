using Microsoft.AspNetCore.SignalR;
using CentralCommand.MockApi.Hubs;
using CentralCommand.MockApi.Models;

namespace CentralCommand.MockApi.Services;

public class MetricsUpdateService : BackgroundService
{
    private readonly IHubContext<MetricsHub> _hubContext;
    private readonly MockDataService _mockDataService;
    private readonly ILogger<MetricsUpdateService> _logger;
    private readonly TimeSpan _updateInterval = TimeSpan.FromSeconds(30);

    public MetricsUpdateService(
        IHubContext<MetricsHub> hubContext,
        MockDataService mockDataService,
        ILogger<MetricsUpdateService> logger)
    {
        _hubContext = hubContext;
        _mockDataService = mockDataService;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await UpdateMetrics();
                await Task.Delay(_updateInterval, stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating metrics");
            }
        }
    }

    private async Task UpdateMetrics()
    {
        _logger.LogInformation("Updating portal metrics...");

        // Update metrics for all portals
        var portals = _mockDataService.GetPortals();
        foreach (var portal in portals)
        {
            _mockDataService.UpdatePortalMetrics(portal.Id);
            await _hubContext.Clients.All.SendAsync("PortalMetricsUpdated", portal.Id, portal.Metrics);
        }

        // Send updated statistics
        var statistics = _mockDataService.GetStatistics();
        await _hubContext.Clients.All.SendAsync("StatisticsUpdated", statistics);

        _logger.LogInformation($"Updated metrics for {portals.Count} portals");
    }
}