namespace CentralCommand.Core.Domain.ValueObjects;

/// <summary>
/// Health check configuration value object
/// </summary>
public sealed record HealthCheckConfig
{
    /// <summary>
    /// Gets the health check endpoint
    /// </summary>
    public string Endpoint { get; init; } = string.Empty;

    /// <summary>
    /// Gets the interval in seconds between health checks
    /// </summary>
    public int IntervalSeconds { get; init; } = 30;

    /// <summary>
    /// Gets the timeout in seconds for health checks
    /// </summary>
    public int TimeoutSeconds { get; init; } = 10;

    /// <summary>
    /// Gets custom headers for health check requests
    /// </summary>
    public Dictionary<string, string>? Headers { get; init; }

    /// <summary>
    /// Gets whether health check is enabled
    /// </summary>
    public bool IsEnabled { get; init; } = true;

    /// <summary>
    /// Gets the HTTP method to use for health checks
    /// </summary>
    public string Method { get; init; } = "GET";

    /// <summary>
    /// Gets the expected status code for a healthy response
    /// </summary>
    public int ExpectedStatusCode { get; init; } = 200;
}