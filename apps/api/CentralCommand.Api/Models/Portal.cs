namespace CentralCommand.Api.Models;

/// <summary>
/// Portal status enumeration
/// </summary>
public enum PortalStatus
{
    Active,
    Degraded,
    Down,
    Maintenance,
    Unknown
}

/// <summary>
/// Portal environment types
/// </summary>
public enum PortalEnvironment
{
    Production,
    Staging,
    Development,
    Testing
}

/// <summary>
/// Portal priority levels
/// </summary>
public enum PortalPriority
{
    Critical,
    High,
    Medium,
    Low
}

/// <summary>
/// Authentication types
/// </summary>
public enum AuthType
{
    None,
    Basic,
    OAuth,
    SAML,
    ApiKey,
    JWT
}

/// <summary>
/// Portal categories
/// </summary>
public enum PortalCategory
{
    All,
    Engineering,
    Operations,
    Support,
    Monitoring,
    Analytics,
    Services,
    Infrastructure,
    Databases,
    Security,
    Development,
    Business,
    Communication
}

/// <summary>
/// Portal metrics data
/// </summary>
public record PortalMetrics
{
    public double ResponseTime { get; init; }
    public double Uptime { get; init; }
    public double Cpu { get; init; }
    public double Memory { get; init; }
    public int Requests { get; init; }
    public int Errors { get; init; }
    public double ErrorRate { get; init; }
    public double Throughput { get; init; }
    public double Latency { get; init; }
}

/// <summary>
/// Portal configuration
/// </summary>
public class PortalConfig
{
    public string? HealthCheckEndpoint { get; set; }
    public int HealthCheckInterval { get; set; } = 30;
    public int Timeout { get; set; } = 5000;
    public int RetryAttempts { get; set; } = 3;
    public int RetryDelay { get; set; } = 1000;
    public Dictionary<string, string>? CustomHeaders { get; set; }
    public bool EnableMonitoring { get; set; } = true;
    public bool EnableAlerts { get; set; } = true;
    public bool EnableAutoRecovery { get; set; } = false;
}

/// <summary>
/// Portal entity
/// </summary>
public class Portal
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Url { get; set; } = string.Empty;
    public PortalCategory Category { get; set; }
    public PortalStatus Status { get; set; }
    public PortalEnvironment Environment { get; set; } = PortalEnvironment.Production;
    public PortalPriority Priority { get; set; } = PortalPriority.Medium;

    // Authentication
    public AuthType AuthType { get; set; } = AuthType.None;
    public Dictionary<string, object>? AuthConfig { get; set; }

    // Metrics
    public PortalMetrics Metrics { get; set; } = new();
    public DateTime LastChecked { get; set; }
    public DateTime? LastIncident { get; set; }

    // Configuration
    public PortalConfig Config { get; set; } = new();

    // UI properties
    public string? Icon { get; set; }
    public string? Color { get; set; }
    public List<string> Tags { get; set; } = new();
    public bool IsFavorite { get; set; }
    public bool IsPublic { get; set; }

    // Ownership
    public Guid? Owner { get; set; }
    public Guid? Team { get; set; }
    public List<Guid> Maintainers { get; set; } = new();

    // Metadata
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public Guid CreatedBy { get; set; }
    public Guid UpdatedBy { get; set; }

    // Concurrency control
    public string ETag { get; set; } = string.Empty;
}