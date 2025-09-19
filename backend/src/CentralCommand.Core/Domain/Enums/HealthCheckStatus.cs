namespace CentralCommand.Core.Domain.Enums;

/// <summary>
/// Health check status values
/// </summary>
public enum HealthCheckStatus
{
    /// <summary>
    /// Status is unknown or not yet checked
    /// </summary>
    Unknown = 0,

    /// <summary>
    /// Health check is passing
    /// </summary>
    Healthy = 1,

    /// <summary>
    /// Health check is failing but within acceptable thresholds
    /// </summary>
    Degraded = 2,

    /// <summary>
    /// Health check is failing
    /// </summary>
    Unhealthy = 3,

    /// <summary>
    /// Health check is disabled
    /// </summary>
    Disabled = 4,

    /// <summary>
    /// Health check timed out
    /// </summary>
    Timeout = 5
}