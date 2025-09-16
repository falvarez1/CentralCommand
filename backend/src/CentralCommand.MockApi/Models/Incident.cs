namespace CentralCommand.MockApi.Models;

/// <summary>
/// Incident severity levels
/// </summary>
public enum IncidentSeverity
{
    Critical,
    High,
    Medium,
    Low
}

/// <summary>
/// Incident types
/// </summary>
public enum IncidentType
{
    Outage,
    Performance,
    Maintenance,
    Security,
    Database,
    Service,
    Infrastructure,
    Network
}

/// <summary>
/// Incident resolution status
/// </summary>
public enum IncidentStatus
{
    Open,
    InProgress,
    Resolved,
    Closed
}

/// <summary>
/// Incident timeline entry
/// </summary>
public record TimelineEntry
{
    public Guid Id { get; init; }
    public DateTime Timestamp { get; init; }
    public string Action { get; init; } = string.Empty;
    public string Description { get; init; } = string.Empty;
    public Guid PerformedBy { get; init; }
}

/// <summary>
/// Incident metrics
/// </summary>
public record IncidentMetrics
{
    public double? Mttr { get; init; } // Mean Time To Recovery
    public double? Mtbf { get; init; } // Mean Time Between Failures
    public double? ImpactDuration { get; init; }
    public int SeverityChanges { get; init; }
}

/// <summary>
/// Incident notifications
/// </summary>
public record IncidentNotifications
{
    public bool EmailSent { get; init; }
    public bool SlackSent { get; init; }
    public bool SmsSent { get; init; }
    public List<string> TeamsNotified { get; init; } = new();
}

/// <summary>
/// Incident entity
/// </summary>
public class Incident
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public IncidentType Type { get; set; }
    public IncidentSeverity Severity { get; set; }
    public IncidentStatus Status { get; set; }
    public List<string> AffectedPortals { get; set; } = new();
    public List<string> AffectedServices { get; set; } = new();
    public int? ImpactedUsers { get; set; }
    public Guid? Assignee { get; set; }
    public Guid? Team { get; set; }
    public Guid? ReportedBy { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public DateTime? ResolvedAt { get; set; }
    public DateTime? AcknowledgedAt { get; set; }
    public string? RootCause { get; set; }
    public string? Resolution { get; set; }
    public string? PostmortemUrl { get; set; }
    public List<string> Tags { get; set; } = new();
    public List<TimelineEntry> Timeline { get; set; } = new();
    public IncidentMetrics? Metrics { get; set; }
    public IncidentNotifications? Notifications { get; set; }
    public List<string> RelatedIncidents { get; set; } = new();
    public bool IsPublic { get; set; }
    public Guid CreatedBy { get; set; }
    public Guid UpdatedBy { get; set; }

    // Concurrency control
    public string ETag { get; set; } = string.Empty;
}

/// <summary>
/// Create incident request
/// </summary>
public record CreateIncidentRequest
{
    public string Title { get; init; } = string.Empty;
    public string Description { get; init; } = string.Empty;
    public IncidentType Type { get; init; }
    public IncidentSeverity Severity { get; init; }
    public IncidentStatus Status { get; init; } = IncidentStatus.Open;
    public List<string>? AffectedPortals { get; init; }
    public List<string>? AffectedServices { get; init; }
    public int? ImpactedUsers { get; init; }
    public Guid? Assignee { get; init; }
    public Guid? Team { get; init; }
    public Guid? ReportedBy { get; init; }
    public List<string>? Tags { get; init; }
    public bool IsPublic { get; init; }
}