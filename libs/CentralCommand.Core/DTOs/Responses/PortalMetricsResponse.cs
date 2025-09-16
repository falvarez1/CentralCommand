namespace CentralCommand.Core.DTOs.Responses;

/// <summary>
/// Portal metrics response DTO
/// </summary>
public class PortalMetricsResponse
{
    /// <summary>
    /// Gets or sets the response time in milliseconds
    /// </summary>
    public double ResponseTime { get; set; }

    /// <summary>
    /// Gets or sets the uptime percentage
    /// </summary>
    public double Uptime { get; set; }

    /// <summary>
    /// Gets or sets the CPU usage percentage
    /// </summary>
    public double CpuUsage { get; set; }

    /// <summary>
    /// Gets or sets the memory usage percentage
    /// </summary>
    public double MemoryUsage { get; set; }

    /// <summary>
    /// Gets or sets the number of requests
    /// </summary>
    public int Requests { get; set; }

    /// <summary>
    /// Gets or sets the number of errors
    /// </summary>
    public int Errors { get; set; }

    /// <summary>
    /// Gets or sets the error rate percentage
    /// </summary>
    public double ErrorRate { get; set; }

    /// <summary>
    /// Gets or sets the throughput (requests per second)
    /// </summary>
    public double Throughput { get; set; }

    /// <summary>
    /// Gets or sets the latency in milliseconds
    /// </summary>
    public double Latency { get; set; }

    /// <summary>
    /// Gets or sets the requests per minute
    /// </summary>
    public int RequestsPerMinute { get; set; }

    /// <summary>
    /// Gets or sets the average load time in milliseconds
    /// </summary>
    public double AverageLoadTime { get; set; }

    /// <summary>
    /// Gets or sets the peak response time in milliseconds
    /// </summary>
    public double PeakResponseTime { get; set; }

    /// <summary>
    /// Gets or sets when the metrics were last updated
    /// </summary>
    public DateTime LastUpdated { get; set; }

    /// <summary>
    /// Gets or sets the timestamp when the metrics were recorded
    /// </summary>
    public DateTime Timestamp { get; set; }
}

/// <summary>
/// Portal configuration response DTO
/// </summary>
public class PortalConfigResponse
{
    /// <summary>
    /// Gets or sets the health check endpoint URL
    /// </summary>
    public string? HealthCheckEndpoint { get; set; }

    /// <summary>
    /// Gets or sets the health check interval in seconds
    /// </summary>
    public int HealthCheckInterval { get; set; } = 30;

    /// <summary>
    /// Gets or sets the check interval in seconds (alias)
    /// </summary>
    public int CheckInterval { get; set; } = 30;

    /// <summary>
    /// Gets or sets the timeout in milliseconds
    /// </summary>
    public int Timeout { get; set; } = 5000;

    /// <summary>
    /// Gets or sets the number of retry attempts
    /// </summary>
    public int RetryAttempts { get; set; } = 3;

    /// <summary>
    /// Gets or sets the retry count (alias)
    /// </summary>
    public int RetryCount { get; set; } = 3;

    /// <summary>
    /// Gets or sets the retry delay in milliseconds
    /// </summary>
    public int RetryDelay { get; set; } = 1000;

    /// <summary>
    /// Gets or sets custom headers for requests
    /// </summary>
    public Dictionary<string, string> CustomHeaders { get; set; } = new();

    /// <summary>
    /// Gets or sets whether monitoring is enabled
    /// </summary>
    public bool EnableMonitoring { get; set; } = true;

    /// <summary>
    /// Gets or sets whether monitoring is enabled (alias)
    /// </summary>
    public bool IsMonitoringEnabled { get; set; } = true;

    /// <summary>
    /// Gets or sets whether alerts are enabled
    /// </summary>
    public bool EnableAlerts { get; set; } = true;

    /// <summary>
    /// Gets or sets whether auto-recovery is enabled
    /// </summary>
    public bool EnableAutoRecovery { get; set; } = false;

    /// <summary>
    /// Gets or sets the alert threshold
    /// </summary>
    public double AlertThreshold { get; set; } = 90;

    /// <summary>
    /// Gets or sets the list of notification emails
    /// </summary>
    public List<string> NotificationEmails { get; set; } = new();
}