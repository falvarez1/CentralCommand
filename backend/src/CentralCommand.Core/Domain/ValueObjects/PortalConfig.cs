namespace CentralCommand.Core.Domain.ValueObjects;

/// <summary>
/// Portal configuration value object
/// </summary>
public sealed record PortalConfig
{
    /// <summary>
    /// Gets or sets the health check endpoint URL
    /// </summary>
    public string? HealthCheckEndpoint { get; init; }

    /// <summary>
    /// Gets or sets the health check interval in seconds
    /// </summary>
    public int HealthCheckInterval { get; init; } = 30;

    /// <summary>
    /// Gets or sets the timeout in milliseconds
    /// </summary>
    public int Timeout { get; init; } = 5000;

    /// <summary>
    /// Gets or sets the number of retry attempts
    /// </summary>
    public int RetryAttempts { get; init; } = 3;

    /// <summary>
    /// Gets or sets the retry delay in milliseconds
    /// </summary>
    public int RetryDelay { get; init; } = 1000;

    /// <summary>
    /// Gets or sets custom headers for requests
    /// </summary>
    public Dictionary<string, string> CustomHeaders { get; init; } = new();

    /// <summary>
    /// Gets or sets whether monitoring is enabled
    /// </summary>
    public bool EnableMonitoring { get; init; } = true;

    /// <summary>
    /// Gets or sets whether alerts are enabled
    /// </summary>
    public bool EnableAlerts { get; init; } = true;

    /// <summary>
    /// Gets or sets whether auto-recovery is enabled
    /// </summary>
    public bool EnableAutoRecovery { get; init; } = false;

    /// <summary>
    /// Gets or sets the check interval in seconds (alias for HealthCheckInterval)
    /// </summary>
    public int CheckInterval
    {
        get => HealthCheckInterval;
        init => HealthCheckInterval = value;
    }

    /// <summary>
    /// Gets or sets the alert threshold
    /// </summary>
    public double AlertThreshold { get; init; } = 90;

    /// <summary>
    /// Gets or sets whether monitoring is enabled (alias for EnableMonitoring)
    /// </summary>
    public bool IsMonitoringEnabled
    {
        get => EnableMonitoring;
        init => EnableMonitoring = value;
    }

    /// <summary>
    /// Gets or sets the retry count (alias for RetryAttempts)
    /// </summary>
    public int RetryCount
    {
        get => RetryAttempts;
        init => RetryAttempts = value;
    }

    /// <summary>
    /// Gets or sets the list of notification emails
    /// </summary>
    public List<string> NotificationEmails { get; init; } = new();

    /// <summary>
    /// Creates a default configuration
    /// </summary>
    public static PortalConfig Default => new();

    /// <summary>
    /// Validates the configuration
    /// </summary>
    public bool IsValid()
    {
        return HealthCheckInterval > 0 &&
               Timeout > 0 &&
               RetryAttempts >= 0 &&
               RetryDelay >= 0;
    }
}