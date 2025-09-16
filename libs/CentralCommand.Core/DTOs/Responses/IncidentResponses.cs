using CentralCommand.Core.Domain.Enums;
using CentralCommand.Core.Domain.ValueObjects;

namespace CentralCommand.Core.DTOs.Responses;

/// <summary>
/// Incident response DTO
/// </summary>
public class IncidentResponse
{
    /// <summary>
    /// Gets or sets the incident ID
    /// </summary>
    public Guid Id { get; set; }

    /// <summary>
    /// Gets or sets the incident title
    /// </summary>
    public string Title { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the incident description
    /// </summary>
    public string Description { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the incident type
    /// </summary>
    public IncidentType Type { get; set; }

    /// <summary>
    /// Gets or sets the incident severity
    /// </summary>
    public IncidentSeverity Severity { get; set; }

    /// <summary>
    /// Gets or sets the incident status
    /// </summary>
    public IncidentStatus Status { get; set; }

    /// <summary>
    /// Gets or sets the affected portals
    /// </summary>
    public List<string> AffectedPortals { get; set; } = new();

    /// <summary>
    /// Gets or sets the affected services
    /// </summary>
    public List<string> AffectedServices { get; set; } = new();

    /// <summary>
    /// Gets or sets the number of impacted users
    /// </summary>
    public int? ImpactedUsers { get; set; }

    /// <summary>
    /// Gets or sets the assignee user ID
    /// </summary>
    public Guid? Assignee { get; set; }

    /// <summary>
    /// Gets or sets the team ID
    /// </summary>
    public Guid? Team { get; set; }

    /// <summary>
    /// Gets or sets the reporter user ID
    /// </summary>
    public Guid? ReportedBy { get; set; }

    /// <summary>
    /// Gets or sets the creation timestamp
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// Gets or sets the last update timestamp
    /// </summary>
    public DateTime UpdatedAt { get; set; }

    /// <summary>
    /// Gets or sets when the incident was resolved
    /// </summary>
    public DateTime? ResolvedAt { get; set; }

    /// <summary>
    /// Gets or sets when the incident was acknowledged
    /// </summary>
    public DateTime? AcknowledgedAt { get; set; }

    /// <summary>
    /// Gets or sets when the incident was closed
    /// </summary>
    public DateTime? ClosedAt { get; set; }

    /// <summary>
    /// Gets or sets the root cause analysis
    /// </summary>
    public string? RootCause { get; set; }

    /// <summary>
    /// Gets or sets the resolution description
    /// </summary>
    public string? Resolution { get; set; }

    /// <summary>
    /// Gets or sets the postmortem URL
    /// </summary>
    public string? PostmortemUrl { get; set; }

    /// <summary>
    /// Gets or sets the incident tags
    /// </summary>
    public List<string> Tags { get; set; } = new();

    /// <summary>
    /// Gets or sets the timeline entries
    /// </summary>
    public List<TimelineEntry> Timeline { get; set; } = new();

    /// <summary>
    /// Gets or sets the incident metrics
    /// </summary>
    public IncidentMetrics? Metrics { get; set; }

    /// <summary>
    /// Gets or sets the notification settings
    /// </summary>
    public IncidentNotifications? Notifications { get; set; }

    /// <summary>
    /// Gets or sets related incident IDs
    /// </summary>
    public List<string> RelatedIncidents { get; set; } = new();

    /// <summary>
    /// Gets or sets whether the incident is public
    /// </summary>
    public bool IsPublic { get; set; }

    /// <summary>
    /// Gets or sets the user who created the incident
    /// </summary>
    public Guid CreatedBy { get; set; }

    /// <summary>
    /// Gets or sets the user who last updated the incident
    /// </summary>
    public Guid UpdatedBy { get; set; }

    /// <summary>
    /// Gets or sets the ETag for optimistic concurrency
    /// </summary>
    public string ETag { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the number of comments
    /// </summary>
    public int CommentCount { get; set; }

    /// <summary>
    /// Gets or sets the incident priority
    /// </summary>
    public IncidentPriority? Priority { get; set; }

    /// <summary>
    /// Gets or sets the timeline entry count
    /// </summary>
    public int TimelineEntryCount => Timeline?.Count ?? 0;

    /// <summary>
    /// Gets or sets the comments list
    /// </summary>
    public List<CommentResponse> Comments { get; set; } = new();
}

/// <summary>
/// Incident summary response for list views
/// </summary>
public class IncidentSummaryResponse
{
    /// <summary>
    /// Gets or sets the incident ID
    /// </summary>
    public Guid Id { get; set; }

    /// <summary>
    /// Gets or sets the incident title
    /// </summary>
    public string Title { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the incident type
    /// </summary>
    public IncidentType Type { get; set; }

    /// <summary>
    /// Gets or sets the incident severity
    /// </summary>
    public IncidentSeverity Severity { get; set; }

    /// <summary>
    /// Gets or sets the incident status
    /// </summary>
    public IncidentStatus Status { get; set; }

    /// <summary>
    /// Gets or sets the affected portal count
    /// </summary>
    public int AffectedPortalCount { get; set; }

    /// <summary>
    /// Gets or sets the number of impacted users
    /// </summary>
    public int? ImpactedUsers { get; set; }

    /// <summary>
    /// Gets or sets the assignee user ID
    /// </summary>
    public Guid? Assignee { get; set; }

    /// <summary>
    /// Gets or sets the creation timestamp
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// Gets or sets when the incident was acknowledged
    /// </summary>
    public DateTime? AcknowledgedAt { get; set; }

    /// <summary>
    /// Gets or sets when the incident was resolved
    /// </summary>
    public DateTime? ResolvedAt { get; set; }

    /// <summary>
    /// Gets or sets the mean time to recovery
    /// </summary>
    public double? MTTR { get; set; }
}

/// <summary>
/// Incident metrics response
/// </summary>
public class IncidentMetrics
{
    /// <summary>
    /// Gets or sets the mean time to recovery
    /// </summary>
    public double? Mttr { get; set; }

    /// <summary>
    /// Gets or sets the mean time between failures
    /// </summary>
    public double? Mtbf { get; set; }

    /// <summary>
    /// Gets or sets the impact duration
    /// </summary>
    public double? ImpactDuration { get; set; }

    /// <summary>
    /// Gets or sets the number of severity changes
    /// </summary>
    public int SeverityChanges { get; set; }
}

/// <summary>
/// Incident notifications response
/// </summary>
public class IncidentNotifications
{
    /// <summary>
    /// Gets or sets whether email was sent
    /// </summary>
    public bool EmailSent { get; set; }

    /// <summary>
    /// Gets or sets whether Slack notification was sent
    /// </summary>
    public bool SlackSent { get; set; }

    /// <summary>
    /// Gets or sets whether SMS was sent
    /// </summary>
    public bool SmsSent { get; set; }

    /// <summary>
    /// Gets or sets the teams that were notified
    /// </summary>
    public List<string> TeamsNotified { get; set; } = new();
}

/// <summary>
/// Comment response DTO
/// </summary>
public class CommentResponse
{
    /// <summary>
    /// Gets or sets the comment ID
    /// </summary>
    public Guid Id { get; set; }

    /// <summary>
    /// Gets or sets the incident ID
    /// </summary>
    public Guid IncidentId { get; set; }

    /// <summary>
    /// Gets or sets the comment text
    /// </summary>
    public string Text { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets whether this is a system-generated comment
    /// </summary>
    public bool IsSystemGenerated { get; set; }

    /// <summary>
    /// Gets or sets whether this comment is internal only
    /// </summary>
    public bool IsInternal { get; set; }

    /// <summary>
    /// Gets or sets any attachments
    /// </summary>
    public List<string> Attachments { get; set; } = new();

    /// <summary>
    /// Gets or sets the creation timestamp
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// Gets or sets the user who created the comment
    /// </summary>
    public Guid CreatedBy { get; set; }

    /// <summary>
    /// Gets or sets the author ID (alias for CreatedBy)
    /// </summary>
    public Guid AuthorId
    {
        get => CreatedBy;
        set => CreatedBy = value;
    }

    /// <summary>
    /// Gets or sets the author name
    /// </summary>
    public string AuthorName { get; set; } = string.Empty;
}

/// <summary>
/// Timeline entry response DTO
/// </summary>
public class TimelineEntryResponse
{
    /// <summary>
    /// Gets or sets the entry ID
    /// </summary>
    public Guid Id { get; set; }

    /// <summary>
    /// Gets or sets the incident ID
    /// </summary>
    public Guid IncidentId { get; set; }

    /// <summary>
    /// Gets or sets the timestamp
    /// </summary>
    public DateTime Timestamp { get; set; }

    /// <summary>
    /// Gets or sets the event type
    /// </summary>
    public string EventType { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the event description
    /// </summary>
    public string Description { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the user who triggered the event
    /// </summary>
    public Guid? UserId { get; set; }

    /// <summary>
    /// Gets or sets any metadata associated with the event
    /// </summary>
    public Dictionary<string, object> Metadata { get; set; } = new();
}