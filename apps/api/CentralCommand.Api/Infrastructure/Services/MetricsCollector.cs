using System.Diagnostics;
using System.Diagnostics.Metrics;

namespace CentralCommand.Api.Infrastructure.Services;

/// <summary>
/// Implementation of metrics collector using System.Diagnostics.Metrics
/// </summary>
public class MetricsCollector : IMetricsCollector
{
    private readonly ILogger<MetricsCollector> _logger;
    private readonly Meter _meter;
    private readonly Dictionary<string, Counter<long>> _counters = new();
    private readonly Dictionary<string, Histogram<double>> _histograms = new();

    public MetricsCollector(ILogger<MetricsCollector> logger)
    {
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        _meter = new Meter("CentralCommand.Api", "1.0.0");
    }

    public void RecordMetric(string name, double value, Dictionary<string, string>? tags = null)
    {
        try
        {
            if (!_histograms.TryGetValue(name, out var histogram))
            {
                histogram = _meter.CreateHistogram<double>(name);
                _histograms[name] = histogram;
            }

            histogram.Record(value, CreateTagList(tags));
            _logger.LogDebug("Recorded metric {Name}: {Value}", name, value);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error recording metric {Name}", name);
        }
    }

    public void IncrementCounter(string name, Dictionary<string, string>? tags = null)
    {
        try
        {
            if (!_counters.TryGetValue(name, out var counter))
            {
                counter = _meter.CreateCounter<long>(name);
                _counters[name] = counter;
            }

            counter.Add(1, CreateTagList(tags));
            _logger.LogDebug("Incremented counter {Name}", name);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error incrementing counter {Name}", name);
        }
    }

    public void RecordDuration(string name, TimeSpan duration, Dictionary<string, string>? tags = null)
    {
        RecordMetric($"{name}.duration", duration.TotalMilliseconds, tags);
    }

    public void RecordGauge(string name, double value, Dictionary<string, string>? tags = null)
    {
        try
        {
            var gauge = _meter.CreateObservableGauge(name, () => value);
            _logger.LogDebug("Recorded gauge {Name}: {Value}", name, value);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error recording gauge {Name}", name);
        }
    }

    public void RecordEvent(string name, string description, Dictionary<string, string>? tags = null)
    {
        try
        {
            var eventTags = tags ?? new Dictionary<string, string>();
            eventTags["description"] = description;
            IncrementCounter($"events.{name}", eventTags);
            _logger.LogInformation("Event recorded: {Name} - {Description}", name, description);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error recording event {Name}", name);
        }
    }

    private static TagList CreateTagList(Dictionary<string, string>? tags)
    {
        var tagList = new TagList();
        if (tags != null)
        {
            foreach (var tag in tags)
            {
                tagList.Add(tag.Key, tag.Value);
            }
        }
        return tagList;
    }

    public async Task<Core.Domain.ValueObjects.PortalMetrics> CollectMetricsAsync(Guid portalId, CancellationToken cancellationToken = default)
    {
        // Generate random metrics for demonstration purposes
        var random = new Random();

        await Task.Delay(random.Next(10, 50), cancellationToken); // Simulate async work

        return new Core.Domain.ValueObjects.PortalMetrics
        {
            ResponseTime = random.Next(50, 500),
            Uptime = random.Next(95, 100),
            Cpu = random.Next(10, 80),
            Memory = random.Next(20, 90),
            Requests = random.Next(100, 10000),
            Errors = random.Next(0, 50),
            ErrorRate = random.NextDouble() * 5,
            Throughput = random.Next(10, 1000),
            Latency = random.Next(10, 100),
            RequestsPerMinute = random.Next(60, 600),
            AverageLoadTime = random.Next(100, 1000),
            PeakResponseTime = random.Next(500, 2000),
            LastUpdated = DateTime.UtcNow,
            Timestamp = DateTime.UtcNow
        };
    }
}