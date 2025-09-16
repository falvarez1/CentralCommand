using CentralCommand.Core.Domain.Enums;
using System.ComponentModel.DataAnnotations;

namespace CentralCommand.Core.DTOs.Requests;

/// <summary>
/// Request to create a new incident
/// </summary>
public class CreateIncidentRequest
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
    [Required]
    public IncidentType Type { get; set; }

    /// <summary>
    /// Gets or sets the incident severity
    /// </summary>
    [Required]
    public IncidentSeverity Severity { get; set; }

    /// <summary>
    /// Gets or sets the incident status
    /// </summary>
    public IncidentStatus Status { get; set; } = IncidentStatus.Open;

    /// <summary>
    /// Gets or sets the incident priority
    /// </summary>
    public IncidentPriority? Priority { get; set; }

    /// <summary>
    /// Gets or sets the user assigned to the incident
    /// </summary>
    public string? AssignedTo { get; set; }

    /// <summary>
    /// Gets or sets the affected portal IDs
    /// </summary>
    public List<string>? AffectedPortals { get; set; }

    /// <summary>
    /// Gets or sets the affected portal IDs as GUIDs
    /// </summary>
    public List<Guid>? AffectedPortalIds { get; set; }

    /// <summary>
    /// Gets or sets the affected services
    /// </summary>
    public List<string>? AffectedServices { get; set; }

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
    /// Gets or sets the incident tags
    /// </summary>
    public List<string>? Tags { get; set; }

    /// <summary>
    /// Gets or sets whether the incident is public
    /// </summary>
    public bool IsPublic { get; set; }
}

/// <summary>
/// Request to update an existing incident
/// </summary>
public class UpdateIncidentRequest
{
    /// <summary>
    /// Gets or sets the incident title
    /// </summary>
    [StringLength(500)]
    public string? Title { get; set; }

    /// <summary>
    /// Gets or sets the incident description
    /// </summary>
    [StringLength(5000)]
    public string? Description { get; set; }

    /// <summary>
    /// Gets or sets the incident type
    /// </summary>
    public IncidentType? Type { get; set; }

    /// <summary>
    /// Gets or sets the incident severity
    /// </summary>
    public IncidentSeverity? Severity { get; set; }

    /// <summary>
    /// Gets or sets the incident status
    /// </summary>
    public IncidentStatus? Status { get; set; }

    /// <summary>
    /// Gets or sets the incident priority
    /// </summary>
    public IncidentPriority? Priority { get; set; }

    /// <summary>
    /// Gets or sets the user assigned to the incident
    /// </summary>
    [StringLength(200)]
    public string? AssignedTo { get; set; }

    /// <summary>
    /// Gets or sets the affected portal IDs
    /// </summary>
    public List<string>? AffectedPortals { get; set; }

    /// <summary>
    /// Gets or sets the affected portal IDs as GUIDs
    /// </summary>
    public List<Guid>? AffectedPortalIds { get; set; }

    /// <summary>
    /// Gets or sets the affected services
    /// </summary>
    public List<string>? AffectedServices { get; set; }

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
    /// Gets or sets the incident tags
    /// </summary>
    public List<string>? Tags { get; set; }

    /// <summary>
    /// Gets or sets related incident IDs
    /// </summary>
    public List<string>? RelatedIncidents { get; set; }

    /// <summary>
    /// Gets or sets whether the incident is public
    /// </summary>
    public bool? IsPublic { get; set; }

    /// <summary>
    /// Gets or sets the user who updated the incident
    /// </summary>
    [StringLength(200)]
    public string? UpdatedBy { get; set; }

    /// <summary>
    /// Gets or sets the ETag for optimistic concurrency
    /// </summary>
    public string? ETag { get; set; }
}

/// <summary>
/// Request to add a comment to an incident
/// </summary>
public class AddIncidentCommentRequest
{
    /// <summary>
    /// Gets or sets the comment text
    /// </summary>
    [Required]
    [StringLength(5000)]
    public string Text { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets whether this comment is internal only
    /// </summary>
    public bool IsInternal { get; set; }

    /// <summary>
    /// Gets or sets any attachments
    /// </summary>
    public List<string>? Attachments { get; set; }
}

/// <summary>
/// Request to query incidents
/// </summary>
public class IncidentQueryRequest
{
    /// <summary>
    /// Gets or sets the search term
    /// </summary>
    public string? Search { get; set; }

    /// <summary>
    /// Gets or sets the type filter
    /// </summary>
    public IncidentType? Type { get; set; }

    /// <summary>
    /// Gets or sets the severity filter
    /// </summary>
    public IncidentSeverity? Severity { get; set; }

    /// <summary>
    /// Gets or sets the status filter
    /// </summary>
    public IncidentStatus? Status { get; set; }

    /// <summary>
    /// Gets or sets the assignee filter
    /// </summary>
    public Guid? Assignee { get; set; }

    /// <summary>
    /// Gets or sets the team filter
    /// </summary>
    public Guid? Team { get; set; }

    /// <summary>
    /// Gets or sets the reporter filter
    /// </summary>
    public Guid? ReportedBy { get; set; }

    /// <summary>
    /// Gets or sets the affected portal filter
    /// </summary>
    public string? AffectedPortal { get; set; }

    /// <summary>
    /// Gets or sets the affected service filter
    /// </summary>
    public string? AffectedService { get; set; }

    /// <summary>
    /// Gets or sets whether to include only public incidents
    /// </summary>
    public bool? IsPublic { get; set; }

    /// <summary>
    /// Gets or sets tag filters
    /// </summary>
    public List<string>? Tags { get; set; }

    /// <summary>
    /// Gets or sets the date range start
    /// </summary>
    public DateTime? DateFrom { get; set; }

    /// <summary>
    /// Gets or sets the date range end
    /// </summary>
    public DateTime? DateTo { get; set; }

    /// <summary>
    /// Gets or sets the sort field
    /// </summary>
    public string SortBy { get; set; } = "CreatedAt";

    /// <summary>
    /// Gets or sets whether to sort in descending order
    /// </summary>
    public bool SortDescending { get; set; } = true;

    /// <summary>
    /// Gets or sets the page number (1-based)
    /// </summary>
    [Range(1, int.MaxValue)]
    public int PageNumber { get; set; } = 1;

    /// <summary>
    /// Gets or sets the page size
    /// </summary>
    [Range(1, 100)]
    public int PageSize { get; set; } = 20;
}

/// <summary>
/// Request to acknowledge an incident
/// </summary>
public class AcknowledgeIncidentRequest
{
    /// <summary>
    /// Gets or sets the acknowledgement notes
    /// </summary>
    public string? Notes { get; set; }

    /// <summary>
    /// Gets or sets the ETag for optimistic concurrency
    /// </summary>
    public string? ETag { get; set; }
}

/// <summary>
/// Request to resolve an incident
/// </summary>
public class ResolveIncidentRequest
{
    /// <summary>
    /// Gets or sets the resolution description
    /// </summary>
    [Required]
    [StringLength(5000)]
    public string Resolution { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the root cause analysis
    /// </summary>
    [StringLength(5000)]
    public string? RootCause { get; set; }

    /// <summary>
    /// Gets or sets the postmortem URL
    /// </summary>
    [StringLength(500)]
    [Url]
    public string? PostmortemUrl { get; set; }

    /// <summary>
    /// Gets or sets who resolved the incident
    /// </summary>
    public string? ResolvedBy { get; set; }

    /// <summary>
    /// Gets or sets the ETag for optimistic concurrency
    /// </summary>
    public string? ETag { get; set; }
}

/// <summary>
/// Request to escalate an incident
/// </summary>
public class EscalateIncidentRequest
{
    /// <summary>
    /// Gets or sets the new severity level
    /// </summary>
    [Required]
    public IncidentSeverity NewSeverity { get; set; }

    /// <summary>
    /// Gets or sets the reason for escalation
    /// </summary>
    [Required]
    [StringLength(1000)]
    public string Reason { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the teams to notify
    /// </summary>
    public List<string>? TeamsToNotify { get; set; }

    /// <summary>
    /// Gets or sets who escalated the incident
    /// </summary>
    public string? EscalatedBy { get; set; }

    /// <summary>
    /// Gets or sets the ETag for optimistic concurrency
    /// </summary>
    public string? ETag { get; set; }
}

/// <summary>
/// Request to update an incident status
/// </summary>
public class UpdateIncidentStatusRequest
{
    /// <summary>
    /// Gets or sets the new status
    /// </summary>
    [Required]
    public IncidentStatus Status { get; set; }

    /// <summary>
    /// Gets or sets the reason for status change
    /// </summary>
    [StringLength(1000)]
    public string? Reason { get; set; }

    /// <summary>
    /// Gets or sets the resolution description
    /// </summary>
    [StringLength(5000)]
    public string? Resolution { get; set; }

    /// <summary>
    /// Gets or sets the user who updated the status
    /// </summary>
    [StringLength(200)]
    public string? UpdatedBy { get; set; }

    /// <summary>
    /// Gets or sets the ETag for optimistic concurrency
    /// </summary>
    public string? ETag { get; set; }
}

/// <summary>
/// Request to assign an incident to a user
/// </summary>
public class AssignIncidentRequest
{
    /// <summary>
    /// Gets or sets the assignee user ID
    /// </summary>
    [Required]
    public Guid Assignee { get; set; }

    /// <summary>
    /// Gets or sets the team ID
    /// </summary>
    public Guid? Team { get; set; }

    /// <summary>
    /// Gets or sets assignment notes
    /// </summary>
    [StringLength(1000)]
    public string? Notes { get; set; }

    /// <summary>
    /// Gets or sets the person being assigned to (string representation)
    /// </summary>
    public string? AssignedTo { get; set; }

    /// <summary>
    /// Gets or sets who is doing the assignment
    /// </summary>
    public string? AssignedBy { get; set; }

    /// <summary>
    /// Gets or sets the ETag for optimistic concurrency
    /// </summary>
    public string? ETag { get; set; }
}

/// <summary>
/// Request to add a comment
/// </summary>
public class AddCommentRequest
{
    /// <summary>
    /// Gets or sets the comment text
    /// </summary>
    [Required]
    [StringLength(5000)]
    public string Text { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the comment content (alias for Text)
    /// </summary>
    public string Content
    {
        get => Text;
        set => Text = value;
    }

    /// <summary>
    /// Gets or sets the comment author
    /// </summary>
    public string? Author { get; set; }

    /// <summary>
    /// Gets or sets whether this comment is internal only
    /// </summary>
    public bool IsInternal { get; set; }

    /// <summary>
    /// Gets or sets any attachments
    /// </summary>
    public List<string>? Attachments { get; set; }
}