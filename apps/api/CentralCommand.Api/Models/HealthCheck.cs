namespace CentralCommand.Api.Models;

/// <summary>
/// Health check status
/// </summary>
public enum HealthStatus
{
    Healthy,
    Degraded,
    Unhealthy,
    Unknown
}

/// <summary>
/// Health check type
/// </summary>
public enum HealthCheckType
{
    Http,
    Tcp,
    Ping,
    Custom
}

/// <summary>
/// Health check configuration
/// </summary>
public class HealthCheckConfig
{
    public Guid Id { get; set; }
    public Guid PortalId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public HealthCheckType Type { get; set; }
    public string Endpoint { get; set; } = string.Empty;
    public int IntervalSeconds { get; set; } = 30;
    public int TimeoutSeconds { get; set; } = 10;
    public int RetryCount { get; set; } = 3;
    public Dictionary<string, string> Headers { get; set; } = new();
    public string? ExpectedResponse { get; set; }
    public int? ExpectedStatusCode { get; set; }
    public bool Enabled { get; set; } = true;
    public List<string> Tags { get; set; } = new();
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

/// <summary>
/// Health check result
/// </summary>
public class HealthCheckResult
{
    public Guid Id { get; set; }
    public Guid HealthCheckId { get; set; }
    public HealthStatus Status { get; set; }
    public int ResponseTimeMs { get; set; }
    public string? StatusMessage { get; set; }
    public Dictionary<string, object> Details { get; set; } = new();
    public DateTime CheckedAt { get; set; }
}

/// <summary>
/// Portal health summary
/// </summary>
public class PortalHealth
{
    public Guid PortalId { get; set; }
    public HealthStatus OverallStatus { get; set; }
    public List<HealthCheckConfig> Checks { get; set; } = new();
    public List<HealthCheckResult> RecentResults { get; set; } = new();
    public DateTime LastChecked { get; set; }
    public int HealthScore { get; set; } // 0-100
    public Dictionary<string, int> StatusCounts { get; set; } = new();
}