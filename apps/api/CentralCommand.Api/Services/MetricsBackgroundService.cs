using CentralCommand.Api.Application.Commands.Portals;
using CentralCommand.Core.Interfaces.Repositories;
using CentralCommand.Core.Interfaces.Services;
using MediatR;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.DependencyInjection;

namespace CentralCommand.Api.Services;

public class MetricsBackgroundService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<MetricsBackgroundService> _logger;
    private readonly IMetricsCalculationService _metricsCalculation;
    private readonly TimeSpan _updateInterval = TimeSpan.FromSeconds(30);

    public MetricsBackgroundService(
        IServiceProvider serviceProvider,
        ILogger<MetricsBackgroundService> logger,
        IMetricsCalculationService metricsCalculation)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
        _metricsCalculation = metricsCalculation;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Metrics Background Service starting");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await UpdatePortalMetrics(stoppingToken);
                await Task.Delay(_updateInterval, stoppingToken);
            }
            catch (TaskCanceledException)
            {
                // Expected when cancellation is requested
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in metrics background service");
                await Task.Delay(TimeSpan.FromSeconds(5), stoppingToken); // Wait before retry
            }
        }

        _logger.LogInformation("Metrics Background Service stopping");
    }

    private async Task UpdatePortalMetrics(CancellationToken cancellationToken)
    {
        using var scope = _serviceProvider.CreateScope();
        var unitOfWork = scope.ServiceProvider.GetRequiredService<IUnitOfWork>();
        var mediator = scope.ServiceProvider.GetRequiredService<IMediator>();
        var notificationService = scope.ServiceProvider.GetRequiredService<INotificationService>();

        try
        {
            var portals = await unitOfWork.Portals.GetAllAsync(cancellationToken);
            var updateTasks = new List<Task>();

            foreach (var portal in portals)
            {
                // Generate new metrics (in production, this would be collected from actual monitoring)
                var newMetrics = _metricsCalculation.GenerateRandomMetrics(portal.Status);

                // Calculate new status based on metrics
                var newStatus = _metricsCalculation.CalculatePortalStatus(newMetrics);

                // Update portal metrics
                var updateTask = mediator.Send(new UpdatePortalMetricsCommand
                {
                    PortalId = portal.Id,
                    Metrics = newMetrics
                }, cancellationToken);

                updateTasks.Add(updateTask);

                // Send alerts if status degraded
                if (newStatus != portal.Status)
                {
                    if (newStatus == Core.Domain.Enums.PortalStatus.Down ||
                        newStatus == Core.Domain.Enums.PortalStatus.Degraded)
                    {
                        await notificationService.SendPortalAlertAsync(
                            portal,
                            "Status Change",
                            $"Portal status changed from {portal.Status} to {newStatus}",
                            cancellationToken);
                    }
                }
            }

            await Task.WhenAll(updateTasks);

            _logger.LogDebug("Updated metrics for {Count} portals", portals.Count());

            // Broadcast statistics update
            var statistics = await CalculateSystemStatistics(unitOfWork, cancellationToken);
            await notificationService.BroadcastStatisticsUpdateAsync(statistics, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to update portal metrics");
        }
    }

    private async Task<Dictionary<string, object>> CalculateSystemStatistics(
        IUnitOfWork unitOfWork,
        CancellationToken cancellationToken)
    {
        var portals = await unitOfWork.Portals.GetAllAsync(cancellationToken);
        var incidents = await unitOfWork.Incidents.GetActiveIncidentsAsync(cancellationToken);

        var portalsList = portals.ToList();

        return new Dictionary<string, object>
        {
            ["TotalPortals"] = portalsList.Count,
            ["HealthyPortals"] = portalsList.Count(p => p.Status == Core.Domain.Enums.PortalStatus.Healthy),
            ["DegradedPortals"] = portalsList.Count(p => p.Status == Core.Domain.Enums.PortalStatus.Degraded),
            ["DownPortals"] = portalsList.Count(p => p.Status == Core.Domain.Enums.PortalStatus.Down),
            ["ActiveIncidents"] = incidents.Count(),
            ["AverageResponseTime"] = portalsList.Any() ? Math.Round(portalsList.Average(p => p.Metrics.ResponseTime), 2) : 0,
            ["AverageUptime"] = portalsList.Any() ? Math.Round(portalsList.Average(p => p.Metrics.Uptime), 2) : 100
        };
    }
}