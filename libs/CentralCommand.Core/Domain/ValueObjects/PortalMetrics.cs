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
        Latency = 0
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