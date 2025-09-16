using CentralCommand.Api.Infrastructure.Services;
using CentralCommand.Core.Interfaces.Services;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace CentralCommand.Api.Infrastructure.BackgroundServices;

/// <summary>
/// Background service for collecting metrics from portals
/// </summary>
public class MetricsCollectionService : BackgroundService
{
    private readonly ILogger<MetricsCollectionService> _logger;
    private readonly IServiceProvider _serviceProvider;
    private readonly TimeSpan _collectionInterval = TimeSpan.FromSeconds(30);

    public MetricsCollectionService(
        ILogger<MetricsCollectionService> logger,
        IServiceProvider serviceProvider)
    {
        _logger = logger;
        _serviceProvider = serviceProvider;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Metrics Collection Service started");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await CollectMetricsAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in metrics collection cycle");
            }

            await Task.Delay(_collectionInterval, stoppingToken);
        }

        _logger.LogInformation("Metrics Collection Service stopped");
    }

    private async Task CollectMetricsAsync(CancellationToken cancellationToken)
    {
        using var scope = _serviceProvider.CreateScope();
        var portalService = scope.ServiceProvider.GetRequiredService<IPortalService>();
        var metricsCollector = scope.ServiceProvider.GetRequiredService<IMetricsCollector>();
        var eventBus = scope.ServiceProvider.GetRequiredService<IEventBus>();

        _logger.LogDebug("Starting metrics collection cycle");

        try
        {
            // Get all portals that need metrics collection
            var portals = await portalService.GetPortalsNeedingAttentionAsync(cancellationToken);

            var tasks = portals.Select(async portal =>
            {
                try
                {
                    var metrics = await metricsCollector.CollectMetricsAsync(portal.Id, cancellationToken);

                    if (metrics != null)
                    {
                        // Publish metrics update event
                        await eventBus.PublishAsync(new MetricsUpdatedEvent
                        {
                            PortalId = portal.Id,
                            Metrics = metrics,
                            Timestamp = DateTime.UtcNow
                        }, cancellationToken);

                        _logger.LogDebug("Collected metrics for portal {PortalId}: {PortalName}", portal.Id, portal.Name);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to collect metrics for portal {PortalId}: {PortalName}",
                        portal.Id, portal.Name);
                }
            });

            await Task.WhenAll(tasks);

            _logger.LogInformation("Completed metrics collection cycle for {Count} portals", portals.Count());
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during metrics collection");
        }
    }

    public override async Task StopAsync(CancellationToken cancellationToken)
    {
        _logger.LogInformation("Metrics Collection Service is stopping");
        await base.StopAsync(cancellationToken);
    }
}

/// <summary>
/// Event published when metrics are updated
/// </summary>
public class MetricsUpdatedEvent
{
    public Guid PortalId { get; set; }
    public object Metrics { get; set; } = null!;
    public DateTime Timestamp { get; set; }
}