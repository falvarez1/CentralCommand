namespace CentralCommand.Core.Domain.Enums;

/// <summary>
/// Health check types
/// </summary>
public enum HealthCheckType
{
    /// <summary>
    /// HTTP/HTTPS endpoint check
    /// </summary>
    Http = 1,

    /// <summary>
    /// TCP port connectivity check
    /// </summary>
    Tcp = 2,

    /// <summary>
    /// Database connectivity check
    /// </summary>
    Database = 3,

    /// <summary>
    /// Custom health check implementation
    /// </summary>
    Custom = 4,

    /// <summary>
    /// Ping/ICMP check
    /// </summary>
    Ping = 5,

    /// <summary>
    /// DNS resolution check
    /// </summary>
    Dns = 6
}