using CentralCommand.Api.Infrastructure.Caching;
using CentralCommand.Core.DTOs.Requests;
using CentralCommand.Core.Interfaces.Services;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace CentralCommand.Api.Infrastructure.BackgroundServices;

/// <summary>
/// Background service for warming up cache with frequently accessed data
/// </summary>
public class CacheWarmupService : BackgroundService
{
    private readonly ILogger<CacheWarmupService> _logger;
    private readonly IServiceProvider _serviceProvider;
    private readonly TimeSpan _warmupInterval = TimeSpan.FromHours(1);

    public CacheWarmupService(
        ILogger<CacheWarmupService> logger,
        IServiceProvider serviceProvider)
    {
        _logger = logger;
        _serviceProvider = serviceProvider;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Cache Warmup Service started");

        // Initial warmup after startup
        await Task.Delay(TimeSpan.FromSeconds(10), stoppingToken);
        await WarmupCacheAsync(stoppingToken);

        while (!stoppingToken.IsCancellationRequested)
        {
            await Task.Delay(_warmupInterval, stoppingToken);

            try
            {
                await WarmupCacheAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during cache warmup");
            }
        }

        _logger.LogInformation("Cache Warmup Service stopped");
    }

    private async Task WarmupCacheAsync(CancellationToken cancellationToken)
    {
        using var scope = _serviceProvider.CreateScope();
        var cacheService = scope.ServiceProvider.GetRequiredService<ICacheService>();
        var portalService = scope.ServiceProvider.GetRequiredService<IPortalService>();
        var statisticsService = scope.ServiceProvider.GetRequiredService<IStatisticsService>();
        var incidentService = scope.ServiceProvider.GetRequiredService<IIncidentService>();

        _logger.LogInformation("Starting cache warmup");

        try
        {
            var tasks = new List<Task>();

            // Warmup portal data
            tasks.Add(WarmupPortalDataAsync(portalService, cacheService, cancellationToken));

            // Warmup statistics
            tasks.Add(WarmupStatisticsAsync(statisticsService, cacheService, cancellationToken));

            // Warmup incident data
            tasks.Add(WarmupIncidentDataAsync(incidentService, cacheService, cancellationToken));

            await Task.WhenAll(tasks);

            _logger.LogInformation("Cache warmup completed successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during cache warmup");
        }
    }

    private async Task WarmupPortalDataAsync(
        IPortalService portalService,
        ICacheService cacheService,
        CancellationToken cancellationToken)
    {
        try
        {
            // Cache first page of portals
            var query = new PortalQueryRequest
            {
                PageNumber = 1,
                PageSize = 20,
                SortBy = "name",
                SortDescending = false
            };

            var portals = await portalService.GetPortalsAsync(query, cancellationToken);
            await cacheService.SetAsync("portals:page:1", portals, TimeSpan.FromMinutes(30), cancellationToken);

            // Cache portal statistics
            var stats = await portalService.GetStatisticsAsync(cancellationToken);
            await cacheService.SetAsync("portals:statistics", stats, TimeSpan.FromMinutes(15), cancellationToken);

            // Cache frequently accessed portals
            var topPortals = portals.Items.Take(10);
            foreach (var portal in topPortals)
            {
                var details = await portalService.GetByIdAsync(portal.Id, cancellationToken);
                if (details != null)
                {
                    await cacheService.SetAsync($"portal:{portal.Id}", details, TimeSpan.FromMinutes(30), cancellationToken);
                }
            }

            _logger.LogDebug("Warmed up portal data cache");
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to warmup portal data cache");
        }
    }

    private async Task WarmupStatisticsAsync(
        IStatisticsService statisticsService,
        ICacheService cacheService,
        CancellationToken cancellationToken)
    {
        try
        {
            // Cache dashboard statistics
            var stats = await statisticsService.GetDashboardStatisticsAsync(cancellationToken);
            await cacheService.SetAsync("statistics:dashboard", stats, TimeSpan.FromMinutes(5), cancellationToken);

            // Cache sparkline data for different metrics and periods
            var metrics = new[] { "response_time", "uptime", "error_rate" };
            var timeRanges = new[] {
                CentralCommand.Core.Domain.Enums.TimeRange.TwentyFourHours,
                CentralCommand.Core.Domain.Enums.TimeRange.SevenDays,
                CentralCommand.Core.Domain.Enums.TimeRange.ThirtyDays
            };

            foreach (var metric in metrics)
            {
                foreach (var timeRange in timeRanges)
                {
                    var sparklineData = await statisticsService.GetSparklineDataAsync(metric, timeRange, cancellationToken);
                    await cacheService.SetAsync($"statistics:sparkline:{metric}:{timeRange}", sparklineData, TimeSpan.FromMinutes(15), cancellationToken);
                }
            }

            _logger.LogDebug("Warmed up statistics cache");
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to warmup statistics cache");
        }
    }

    private async Task WarmupIncidentDataAsync(
        IIncidentService incidentService,
        ICacheService cacheService,
        CancellationToken cancellationToken)
    {
        try
        {
            // Cache active incidents
            var activeIncidents = await incidentService.GetActiveIncidentsAsync(cancellationToken);
            await cacheService.SetAsync("incidents:active", activeIncidents, TimeSpan.FromMinutes(5), cancellationToken);

            // Cache incident statistics by priority
            var priorityCounts = await incidentService.GetIncidentCountByPriorityAsync(cancellationToken);
            await cacheService.SetAsync("incidents:count:priority", priorityCounts, TimeSpan.FromMinutes(10), cancellationToken);

            // Also cache individual priority counts for quick access
            foreach (var kvp in priorityCounts)
            {
                // Cache value needs to be a reference type, so wrap it
                await cacheService.SetAsync($"incidents:count:priority:{kvp.Key}", new { Count = kvp.Value }, TimeSpan.FromMinutes(10), cancellationToken);
            }

            _logger.LogDebug("Warmed up incident data cache");
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to warmup incident data cache");
        }
    }

    public override async Task StopAsync(CancellationToken cancellationToken)
    {
        _logger.LogInformation("Cache Warmup Service is stopping");
        await base.StopAsync(cancellationToken);
    }
}