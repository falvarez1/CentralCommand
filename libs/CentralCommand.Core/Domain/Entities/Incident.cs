using CentralCommand.Core.Domain.Common;
using CentralCommand.Core.Domain.Enums;
using CentralCommand.Core.Domain.ValueObjects;
using System.ComponentModel.DataAnnotations;

namespace CentralCommand.Core.Domain.Entities;

/// <summary>
/// Incident aggregate root entity
/// </summary>
public class Incident : BaseEntity, IAggregateRoot
{
    /// <summary>
    /// Gets or sets the incident title
    /// </summary>
    [Required]
    [StringLength(500)]
    public string Title { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the incident description
    /// </summary>
    [Required]
    [StringLength(5000)]
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
    /// Gets or sets the incident priority
    /// </summary>
    public IncidentPriority Priority { get; set; } = IncidentPriority.Medium;

    /// <summary>
    /// Gets or sets the affected portals (JSON array)
    /// </summary>
    public string? AffectedPortals { get; set; }

    /// <summary>
    /// Gets or sets the affected portal IDs (JSON array of GUIDs)
    /// </summary>
    public string? AffectedPortalIds { get; set; }

    /// <summary>
    /// Gets or sets the affected services (JSON array)
    /// </summary>
    public string? AffectedServices { get; set; }

    /// <summary>
    /// Gets or sets the number of impacted users
    /// </summary>
    public int? ImpactedUsers { get; set; }

    /// <summary>
    /// Gets or sets the assignee user ID
    /// </summary>
    public Guid? Assignee { get; set; }

    /// <summary>
    /// Gets or sets the assignee name
    /// </summary>
    public string? AssigneeName { get; set; }

    /// <summary>
    /// Gets or sets the assignee email
    /// </summary>
    public string? AssigneeEmail { get; set; }

    /// <summary>
    /// Gets or sets who the incident is assigned to (for display)
    /// </summary>
    public string? AssignedTo { get; set; }

    /// <summary>
    /// Gets or sets the team ID
    /// </summary>
    public Guid? Team { get; set; }

    /// <summary>
    /// Gets or sets the reporter user ID
    /// </summary>
    public Guid? ReportedBy { get; set; }

    /// <summary>
    /// Gets or sets the reporter name
    /// </summary>
    public string? ReporterName { get; set; }

    /// <summary>
    /// Gets or sets the reporter email
    /// </summary>
    public string? ReporterEmail { get; set; }

    /// <summary>
    /// Gets or sets when the incident was resolved
    /// </summary>
    public DateTime? ResolvedAt { get; set; }

    /// <summary>
    /// Gets or sets when the incident was acknowledged
    /// </summary>
    public DateTime? AcknowledgedAt { get; set; }

    /// <summary>
    /// Gets or sets the root cause analysis
    /// </summary>
    [StringLength(5000)]
    public string? RootCause { get; set; }

    /// <summary>
    /// Gets or sets the resolution description
    /// </summary>
    [StringLength(5000)]
    public string? Resolution { get; set; }

    /// <summary>
    /// Gets or sets the postmortem URL
    /// </summary>
    [StringLength(500)]
    [Url]
    public string? PostmortemUrl { get; set; }

    /// <summary>
    /// Gets or sets the incident tags (JSON array)
    /// </summary>
    public string? Tags { get; set; }

    /// <summary>
    /// Gets or sets the timeline entries (JSON)
    /// </summary>
    public string? Timeline { get; set; }

    /// <summary>
    /// Gets or sets the incident metrics (JSON)
    /// </summary>
    public string? Metrics { get; set; }

    /// <summary>
    /// Gets or sets the notification settings (JSON)
    /// </summary>
    public string? Notifications { get; set; }

    /// <summary>
    /// Gets or sets related incident IDs (JSON array)
    /// </summary>
    public string? RelatedIncidents { get; set; }

    /// <summary>
    /// Gets or sets whether the incident is public
    /// </summary>
    public bool IsPublic { get; set; }

    /// <summary>
    /// Gets or sets the estimated resolution time
    /// </summary>
    public DateTime? EstimatedResolutionTime { get; set; }

    /// <summary>
    /// Gets or sets the detection source
    /// </summary>
    public string? DetectionSource { get; set; }

    /// <summary>
    /// Gets or sets the external ticket reference
    /// </summary>
    public string? ExternalTicketRef { get; set; }

    /// <summary>
    /// Gets or sets the incident URL
    /// </summary>
    [StringLength(500)]
    [Url]
    public string? IncidentUrl { get; set; }

    /// <summary>
    /// Gets the number of timeline entries
    /// </summary>
    public int TimelineEntryCount => GetTimeline().Count;

    /// <summary>
    /// Gets the number of comments
    /// </summary>
    public int CommentCount => Comments?.Count ?? 0;

    /// <summary>
    /// Navigation property for comments
    /// </summary>
    public virtual ICollection<Comment> Comments { get; set; } = new List<Comment>();

    /// <summary>
    /// Gets the list of affected portals
    /// </summary>
    public List<string> GetAffectedPortals()
    {
        if (string.IsNullOrWhiteSpace(AffectedPortals))
            return new List<string>();

        try
        {
            return System.Text.Json.JsonSerializer.Deserialize<List<string>>(AffectedPortals) ?? new List<string>();
        }
        catch
        {
            return new List<string>();
        }
    }

    /// <summary>
    /// Sets the list of affected portals
    /// </summary>
    public void SetAffectedPortals(List<string> portals)
    {
        AffectedPortals = portals?.Any() == true
            ? System.Text.Json.JsonSerializer.Serialize(portals)
            : null;
    }

    /// <summary>
    /// Gets the list of affected portal IDs
    /// </summary>
    public List<Guid> GetAffectedPortalIds()
    {
        if (string.IsNullOrWhiteSpace(AffectedPortalIds))
            return new List<Guid>();

        try
        {
            return System.Text.Json.JsonSerializer.Deserialize<List<Guid>>(AffectedPortalIds) ?? new List<Guid>();
        }
        catch
        {
            return new List<Guid>();
        }
    }

    /// <summary>
    /// Sets the list of affected portal IDs
    /// </summary>
    public void SetAffectedPortalIds(List<Guid> portalIds)
    {
        AffectedPortalIds = portalIds?.Any() == true
            ? System.Text.Json.JsonSerializer.Serialize(portalIds)
            : null;
    }

    /// <summary>
    /// Gets the list of affected services
    /// </summary>
    public List<string> GetAffectedServices()
    {
        if (string.IsNullOrWhiteSpace(AffectedServices))
            return new List<string>();

        try
        {
            return System.Text.Json.JsonSerializer.Deserialize<List<string>>(AffectedServices) ?? new List<string>();
        }
        catch
        {
            return new List<string>();
        }
    }

    /// <summary>
    /// Sets the list of affected services
    /// </summary>
    public void SetAffectedServices(List<string> services)
    {
        AffectedServices = services?.Any() == true
            ? System.Text.Json.JsonSerializer.Serialize(services)
            : null;
    }

    /// <summary>
    /// Gets the list of tags
    /// </summary>
    public List<string> GetTags()
    {
        if (string.IsNullOrWhiteSpace(Tags))
            return new List<string>();

        try
        {
            return System.Text.Json.JsonSerializer.Deserialize<List<string>>(Tags) ?? new List<string>();
        }
        catch
        {
            return new List<string>();
        }
    }

    /// <summary>
    /// Sets the list of tags
    /// </summary>
    public void SetTags(List<string> tags)
    {
        Tags = tags?.Any() == true
            ? System.Text.Json.JsonSerializer.Serialize(tags)
            : null;
    }

    /// <summary>
    /// Gets the timeline entries
    /// </summary>
    public List<TimelineEntry> GetTimeline()
    {
        if (string.IsNullOrWhiteSpace(Timeline))
            return new List<TimelineEntry>();

        try
        {
            return System.Text.Json.JsonSerializer.Deserialize<List<TimelineEntry>>(Timeline) ?? new List<TimelineEntry>();
        }
        catch
        {
            return new List<TimelineEntry>();
        }
    }

    /// <summary>
    /// Adds a timeline entry
    /// </summary>
    public void AddTimelineEntry(string action, string description, Guid performedBy)
    {
        var timeline = GetTimeline();
        timeline.Add(new TimelineEntry
        {
            Action = action,
            Description = description,
            PerformedBy = performedBy,
            Timestamp = DateTime.UtcNow
        });
        Timeline = System.Text.Json.JsonSerializer.Serialize(timeline);
        UpdatedAt = DateTime.UtcNow;
        ETag = Guid.NewGuid().ToString();
    }

    /// <summary>
    /// Acknowledges the incident
    /// </summary>
    public void Acknowledge(Guid userId)
    {
        AcknowledgedAt = DateTime.UtcNow;
        Status = IncidentStatus.InProgress;
        Assignee = userId;
        AddTimelineEntry("Acknowledged", "Incident acknowledged", userId);
    }

    /// <summary>
    /// Resolves the incident
    /// </summary>
    public void Resolve(string resolution, Guid userId)
    {
        ResolvedAt = DateTime.UtcNow;
        Status = IncidentStatus.Resolved;
        Resolution = resolution;
        AddTimelineEntry("Resolved", resolution, userId);
    }

    /// <summary>
    /// Closes the incident
    /// </summary>
    public void Close(Guid userId)
    {
        Status = IncidentStatus.Closed;
        AddTimelineEntry("Closed", "Incident closed", userId);
    }

    /// <summary>
    /// Calculates the mean time to recovery (MTTR) in minutes
    /// </summary>
    public double? CalculateMTTR()
    {
        if (ResolvedAt.HasValue)
        {
            return (ResolvedAt.Value - CreatedAt).TotalMinutes;
        }
        return null;
    }
}