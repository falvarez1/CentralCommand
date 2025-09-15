using CentralCommand.Api.Infrastructure.Services;
using CentralCommand.Core.Domain.ValueObjects;

namespace CentralCommand.Api.Infrastructure.BackgroundServices;

/// <summary>
/// Background service for collecting and updating portal metrics
/// </summary>
public class MetricsBackgroundService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<MetricsBackgroundService> _logger;
    private readonly IMetricsCollector _metricsCollector;
    private readonly TimeSpan _interval = TimeSpan.FromSeconds(30);

    public MetricsBackgroundService(
        IServiceProvider serviceProvider,
        ILogger<MetricsBackgroundService> logger,
        IMetricsCollector metricsCollector)
    {
        _serviceProvider = serviceProvider ?? throw new ArgumentNullException(nameof(serviceProvider));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        _metricsCollector = metricsCollector ?? throw new ArgumentNullException(nameof(metricsCollector));
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Metrics Background Service started");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await UpdateMetricsAsync(stoppingToken);
                await Task.Delay(_interval, stoppingToken);
            }
            catch (TaskCanceledException)
            {
                // Expected when cancellation is requested
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in Metrics Background Service");
                await Task.Delay(TimeSpan.FromSeconds(10), stoppingToken);
            }
        }

        _logger.LogInformation("Metrics Background Service stopped");
    }

    private async Task UpdateMetricsAsync(CancellationToken cancellationToken)
    {
        using var scope = _serviceProvider.CreateScope();
        var portalService = scope.ServiceProvider.GetService<IPortalService>();

        if (portalService == null)
        {
            _logger.LogWarning("Portal service not available");
            return;
        }

        try
        {
            _logger.LogDebug("Starting metrics update cycle");

            // Simulate metrics collection
            var random = new Random();

            // Record system metrics
            _metricsCollector.RecordGauge("system.cpu.usage", random.Next(20, 80));
            _metricsCollector.RecordGauge("system.memory.usage", random.Next(30, 70));
            _metricsCollector.RecordGauge("system.disk.usage", random.Next(40, 60));
            _metricsCollector.RecordGauge("system.network.latency", random.Next(10, 100));

            // Record application metrics
            _metricsCollector.IncrementCounter("app.requests.total");
            _metricsCollector.RecordDuration("app.request.duration", TimeSpan.FromMilliseconds(random.Next(50, 500)));

            if (random.Next(100) < 5) // 5% error rate simulation
            {
                _metricsCollector.IncrementCounter("app.errors.total");
            }

            _logger.LogDebug("Metrics update cycle completed");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating metrics");
            _metricsCollector.IncrementCounter("metrics.update.errors");
        }
    }
}