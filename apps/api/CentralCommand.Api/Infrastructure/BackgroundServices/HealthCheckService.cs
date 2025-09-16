using CentralCommand.Core.Interfaces.Services;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace CentralCommand.Api.Infrastructure.BackgroundServices;

/// <summary>
/// Background service for performing health checks on portals
/// </summary>
public class HealthCheckService : BackgroundService
{
    private readonly ILogger<HealthCheckService> _logger;
    private readonly IServiceProvider _serviceProvider;
    private readonly TimeSpan _checkInterval = TimeSpan.FromMinutes(5);

    public HealthCheckService(
        ILogger<HealthCheckService> logger,
        IServiceProvider serviceProvider)
    {
        _logger = logger;
        _serviceProvider = serviceProvider;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Health Check Service started");

        // Initial delay to let the application fully start
        await Task.Delay(TimeSpan.FromSeconds(30), stoppingToken);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await PerformHealthChecksAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in health check cycle");
            }

            await Task.Delay(_checkInterval, stoppingToken);
        }

        _logger.LogInformation("Health Check Service stopped");
    }

    private async Task PerformHealthChecksAsync(CancellationToken cancellationToken)
    {
        using var scope = _serviceProvider.CreateScope();
        var portalService = scope.ServiceProvider.GetRequiredService<IPortalService>();
        var healthCheckService = scope.ServiceProvider.GetService<HealthCheckService>();

        _logger.LogDebug("Starting health check cycle");

        try
        {
            // Run portal health checks
            await portalService.RunHealthChecksAsync(cancellationToken);

            // Run system health checks using the built-in health check service
            var msHealthCheckService = scope.ServiceProvider.GetService<Microsoft.Extensions.Diagnostics.HealthChecks.HealthCheckService>();
            if (msHealthCheckService != null)
            {
                var systemHealthResult = await msHealthCheckService.CheckHealthAsync(cancellationToken);

                if (systemHealthResult.Status != HealthStatus.Healthy)
                {
                    _logger.LogWarning("System health check failed: {Status}", systemHealthResult.Status);

                    foreach (var entry in systemHealthResult.Entries)
                    {
                        if (entry.Value.Status != HealthStatus.Healthy)
                        {
                            _logger.LogWarning("Health check '{Key}' failed: {Status} - {Description}",
                                entry.Key, entry.Value.Status, entry.Value.Description);
                        }
                    }
                }
                else
                {
                    _logger.LogInformation("All system health checks passed");
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during health checks");
        }
    }

    public override async Task StopAsync(CancellationToken cancellationToken)
    {
        _logger.LogInformation("Health Check Service is stopping");
        await base.StopAsync(cancellationToken);
    }
}