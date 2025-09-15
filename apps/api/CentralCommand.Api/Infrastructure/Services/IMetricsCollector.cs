namespace CentralCommand.Api.Infrastructure.Services;

/// <summary>
/// Interface for collecting and tracking application metrics
/// </summary>
public interface IMetricsCollector
{
    /// <summary>
    /// Records a metric value
    /// </summary>
    void RecordMetric(string name, double value, Dictionary<string, string>? tags = null);

    /// <summary>
    /// Increments a counter metric
    /// </summary>
    void IncrementCounter(string name, Dictionary<string, string>? tags = null);

    /// <summary>
    /// Records the duration of an operation
    /// </summary>
    void RecordDuration(string name, TimeSpan duration, Dictionary<string, string>? tags = null);

    /// <summary>
    /// Records a gauge metric
    /// </summary>
    void RecordGauge(string name, double value, Dictionary<string, string>? tags = null);

    /// <summary>
    /// Records an event
    /// </summary>
    void RecordEvent(string name, string description, Dictionary<string, string>? tags = null);
}