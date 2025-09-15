using CentralCommand.Core.Domain.Enums;
using CentralCommand.Core.Domain.ValueObjects;

namespace CentralCommand.Core.DTOs.Responses;

/// <summary>
/// Portal response DTO
/// </summary>
public class PortalResponse
{
    /// <summary>
    /// Gets or sets the portal ID
    /// </summary>
    public Guid Id { get; set; }

    /// <summary>
    /// Gets or sets the portal name
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the portal description
    /// </summary>
    public string? Description { get; set; }

    /// <summary>
    /// Gets or sets the portal URL
    /// </summary>
    public string Url { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the portal category
    /// </summary>
    public PortalCategory Category { get; set; }

    /// <summary>
    /// Gets or sets the portal status
    /// </summary>
    public PortalStatus Status { get; set; }

    /// <summary>
    /// Gets or sets the portal environment
    /// </summary>
    public PortalEnvironment Environment { get; set; }

    /// <summary>
    /// Gets or sets the portal priority
    /// </summary>
    public PortalPriority Priority { get; set; }

    /// <summary>
    /// Gets or sets the authentication type
    /// </summary>
    public AuthType AuthType { get; set; }

    /// <summary>
    /// Gets or sets the portal metrics
    /// </summary>
    public PortalMetrics Metrics { get; set; } = PortalMetrics.Default;

    /// <summary>
    /// Gets or sets when the portal was last checked
    /// </summary>
    public DateTime LastChecked { get; set; }

    /// <summary>
    /// Gets or sets when the last incident occurred
    /// </summary>
    public DateTime? LastIncident { get; set; }

    /// <summary>
    /// Gets or sets the portal configuration
    /// </summary>
    public PortalConfig Config { get; set; } = PortalConfig.Default;

    /// <summary>
    /// Gets or sets the portal icon
    /// </summary>
    public string? Icon { get; set; }

    /// <summary>
    /// Gets or sets the portal color
    /// </summary>
    public string? Color { get; set; }

    /// <summary>
    /// Gets or sets the portal tags
    /// </summary>
    public List<string> Tags { get; set; } = new();

    /// <summary>
    /// Gets or sets whether the portal is marked as favorite
    /// </summary>
    public bool IsFavorite { get; set; }

    /// <summary>
    /// Gets or sets whether the portal is public
    /// </summary>
    public bool IsPublic { get; set; }

    /// <summary>
    /// Gets or sets the owner user ID
    /// </summary>
    public Guid? Owner { get; set; }

    /// <summary>
    /// Gets or sets the team ID
    /// </summary>
    public Guid? Team { get; set; }

    /// <summary>
    /// Gets or sets the maintainers
    /// </summary>
    public List<Guid> Maintainers { get; set; } = new();

    /// <summary>
    /// Gets or sets the creation timestamp
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// Gets or sets the last update timestamp
    /// </summary>
    public DateTime UpdatedAt { get; set; }

    /// <summary>
    /// Gets or sets the user who created the portal
    /// </summary>
    public Guid CreatedBy { get; set; }

    /// <summary>
    /// Gets or sets the user who last updated the portal
    /// </summary>
    public Guid UpdatedBy { get; set; }

    /// <summary>
    /// Gets or sets the ETag for optimistic concurrency
    /// </summary>
    public string ETag { get; set; } = string.Empty;
}

/// <summary>
/// Portal summary response for list views
/// </summary>
public class PortalSummaryResponse
{
    /// <summary>
    /// Gets or sets the portal ID
    /// </summary>
    public Guid Id { get; set; }

    /// <summary>
    /// Gets or sets the portal name
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the portal URL
    /// </summary>
    public string Url { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the portal category
    /// </summary>
    public PortalCategory Category { get; set; }

    /// <summary>
    /// Gets or sets the portal status
    /// </summary>
    public PortalStatus Status { get; set; }

    /// <summary>
    /// Gets or sets the portal environment
    /// </summary>
    public PortalEnvironment Environment { get; set; }

    /// <summary>
    /// Gets or sets the portal priority
    /// </summary>
    public PortalPriority Priority { get; set; }

    /// <summary>
    /// Gets or sets the uptime percentage
    /// </summary>
    public double Uptime { get; set; }

    /// <summary>
    /// Gets or sets the response time
    /// </summary>
    public double ResponseTime { get; set; }

    /// <summary>
    /// Gets or sets when the portal was last checked
    /// </summary>
    public DateTime LastChecked { get; set; }

    /// <summary>
    /// Gets or sets the portal icon
    /// </summary>
    public string? Icon { get; set; }

    /// <summary>
    /// Gets or sets the portal color
    /// </summary>
    public string? Color { get; set; }

    /// <summary>
    /// Gets or sets whether the portal is marked as favorite
    /// </summary>
    public bool IsFavorite { get; set; }
}

/// <summary>
/// Portal metrics history response (alias for compatibility)
/// </summary>
public class MetricsHistoryResponse : PortalMetricsHistoryResponse
{
}

/// <summary>
/// Portal metrics history response
/// </summary>
public class PortalMetricsHistoryResponse
{
    /// <summary>
    /// Gets or sets the portal ID
    /// </summary>
    public Guid PortalId { get; set; }

    /// <summary>
    /// Gets or sets the portal name
    /// </summary>
    public string PortalName { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the metrics history
    /// </summary>
    public List<MetricsDataPoint> History { get; set; } = new();
}

/// <summary>
/// Metrics data point for time-series data
/// </summary>
public class MetricsDataPoint
{
    /// <summary>
    /// Gets or sets the timestamp
    /// </summary>
    public DateTime Timestamp { get; set; }

    /// <summary>
    /// Gets or sets the metrics
    /// </summary>
    public PortalMetrics Metrics { get; set; } = PortalMetrics.Default;
}

/// <summary>
/// Health check response (alias for compatibility)
/// </summary>
public class HealthCheckResponse : PortalHealthCheckResponse
{
}

/// <summary>
/// Portal health check response
/// </summary>
public class PortalHealthCheckResponse
{
    /// <summary>
    /// Gets or sets the portal ID
    /// </summary>
    public Guid PortalId { get; set; }

    /// <summary>
    /// Gets or sets the portal name
    /// </summary>
    public string PortalName { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the health check endpoint
    /// </summary>
    public string Endpoint { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets whether the health check is enabled
    /// </summary>
    public bool IsEnabled { get; set; }

    /// <summary>
    /// Gets or sets the last check timestamp
    /// </summary>
    public DateTime? LastChecked { get; set; }

    /// <summary>
    /// Gets or sets the last check status
    /// </summary>
    public PortalStatus? LastStatus { get; set; }

    /// <summary>
    /// Gets or sets the last response time
    /// </summary>
    public double? LastResponseTime { get; set; }

    /// <summary>
    /// Gets or sets the last error message
    /// </summary>
    public string? LastError { get; set; }

    /// <summary>
    /// Gets or sets consecutive failure count
    /// </summary>
    public int ConsecutiveFailures { get; set; }
}

/// <summary>
/// Batch operation response (alias for compatibility)
/// </summary>
public class BatchOperationResponse : BatchOperationResult
{
}

/// <summary>
/// Batch operation result
/// </summary>
public class BatchOperationResult
{
    /// <summary>
    /// Gets or sets the number of successful operations
    /// </summary>
    public int SuccessCount { get; set; }

    /// <summary>
    /// Gets or sets the number of failed operations
    /// </summary>
    public int FailureCount { get; set; }

    /// <summary>
    /// Gets or sets the results for each portal
    /// </summary>
    public List<BatchOperationItemResult> Results { get; set; } = new();
}

/// <summary>
/// Individual batch operation result
/// </summary>
public class BatchOperationItemResult
{
    /// <summary>
    /// Gets or sets the portal ID
    /// </summary>
    public Guid PortalId { get; set; }

    /// <summary>
    /// Gets or sets whether the operation succeeded
    /// </summary>
    public bool Success { get; set; }

    /// <summary>
    /// Gets or sets the error message if failed
    /// </summary>
    public string? Error { get; set; }
}