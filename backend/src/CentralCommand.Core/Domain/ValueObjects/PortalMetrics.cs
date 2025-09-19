namespace CentralCommand.Core.Domain.ValueObjects;

/// <summary>
/// Portal metrics value object
/// </summary>
public sealed record PortalMetrics
{
    /// <summary>
    /// Gets the response time in milliseconds
    /// </summary>
    public double ResponseTime { get; init; }

    /// <summary>
    /// Gets the uptime percentage
    /// </summary>
    public double Uptime { get; init; }

    /// <summary>
    /// Gets the CPU usage percentage
    /// </summary>
    public double Cpu { get; init; }

    /// <summary>
    /// Gets the memory usage percentage
    /// </summary>
    public double Memory { get; init; }

    /// <summary>
    /// Gets the number of requests
    /// </summary>
    public int Requests { get; init; }

    /// <summary>
    /// Gets the number of errors
    /// </summary>
    public int Errors { get; init; }

    /// <summary>
    /// Gets the error rate percentage
    /// </summary>
    public double ErrorRate { get; init; }

    /// <summary>
    /// Gets the throughput (requests per second)
    /// </summary>
    public double Throughput { get; init; }

    /// <summary>
    /// Gets the latency in milliseconds
    /// </summary>
    public double Latency { get; init; }

    /// <summary>
    /// Gets the CPU usage percentage (alias for Cpu property)
    /// </summary>
    public double CpuUsage => Cpu;

    /// <summary>
    /// Gets the memory usage percentage (alias for Memory property)
    /// </summary>
    public double MemoryUsage => Memory;

    /// <summary>
    /// Gets or sets the requests per minute
    /// </summary>
    public int RequestsPerMinute { get; init; }

    /// <summary>
    /// Gets the timestamp when the metrics were recorded
    /// </summary>
    public DateTime Timestamp { get; init; } = DateTime.UtcNow;

    /// <summary>
    /// Gets or sets the average load time in milliseconds
    /// </summary>
    public double AverageLoadTime { get; init; }

    /// <summary>
    /// Gets or sets the peak response time in milliseconds
    /// </summary>
    public double PeakResponseTime { get; init; }

    /// <summary>
    /// Gets or sets when the metrics were last updated
    /// </summary>
    public DateTime LastUpdated { get; init; } = DateTime.UtcNow;

    /// <summary>
    /// Creates a new instance of PortalMetrics with default values
    /// </summary>
    public static PortalMetrics Default => new()
    {
        ResponseTime = 0,
        Uptime = 100,
        Cpu = 0,
        Memory = 0,
        Requests = 0,
        Errors = 0,
        ErrorRate = 0,
        Throughput = 0,
        Latency = 0,
        Timestamp = DateTime.UtcNow
    };

    /// <summary>
    /// Validates the metrics
    /// </summary>
    public bool IsValid()
    {
        return ResponseTime >= 0 &&
               Uptime >= 0 && Uptime <= 100 &&
               Cpu >= 0 && Cpu <= 100 &&
               Memory >= 0 && Memory <= 100 &&
               Requests >= 0 &&
               Errors >= 0 &&
               ErrorRate >= 0 && ErrorRate <= 100 &&
               Throughput >= 0 &&
               Latency >= 0;
    }
}