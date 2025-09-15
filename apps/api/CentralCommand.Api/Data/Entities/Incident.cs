using System.ComponentModel.DataAnnotations;

namespace CentralCommand.Api.Data.Entities;

/// <summary>
/// Represents a system incident or issue
/// </summary>
public class Incident
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    [MaxLength(2000)]
    public string? Description { get; set; }

    public IncidentStatus Status { get; set; } = IncidentStatus.Open;

    public IncidentSeverity Severity { get; set; } = IncidentSeverity.Medium;

    public IncidentPriority Priority { get; set; } = IncidentPriority.Medium;

    [MaxLength(100)]
    public string Category { get; set; } = "General";

    // Portal relationship
    public Guid? PortalId { get; set; }

    public Portal? Portal { get; set; }

    // Assignment
    public Guid? AssignedToId { get; set; }

    public ApplicationUser? AssignedTo { get; set; }

    public Guid? TeamId { get; set; }

    // Affected resources
    public int AffectedUsers { get; set; } = 0;

    [MaxLength(500)]
    public string? AffectedServices { get; set; } // Comma-separated list

    // Timeline
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? StartedAt { get; set; }

    public DateTime? DetectedAt { get; set; }

    public DateTime? AcknowledgedAt { get; set; }

    public DateTime? ResolvedAt { get; set; }

    public DateTime? ClosedAt { get; set; }

    // Resolution
    [MaxLength(2000)]
    public string? Resolution { get; set; }

    [MaxLength(2000)]
    public string? RootCause { get; set; }

    public int? ResolutionTimeMinutes { get; set; }

    // Impact
    public double? EstimatedRevenueLoss { get; set; }

    public int? EstimatedDowntimeMinutes { get; set; }

    public bool IsPublic { get; set; } = false;

    // Metadata
    public Guid CreatedById { get; set; }

    public ApplicationUser CreatedBy { get; set; } = null!;

    public Guid? UpdatedById { get; set; }

    public ApplicationUser? UpdatedBy { get; set; }

    public Dictionary<string, object> Metadata { get; set; } = new();

    [MaxLength(500)]
    public string? Tags { get; set; } // Comma-separated tags

    // Escalation
    public bool IsEscalated { get; set; } = false;

    public DateTime? EscalatedAt { get; set; }

    public Guid? EscalatedToId { get; set; }

    // External tracking
    [MaxLength(100)]
    public string? ExternalTicketId { get; set; }

    [MaxLength(500)]
    public string? ExternalTicketUrl { get; set; }

    // Navigation properties
    public virtual ICollection<IncidentComment> Comments { get; set; } = new List<IncidentComment>();

    public virtual ICollection<IncidentStatusHistory> StatusHistory { get; set; } = new List<IncidentStatusHistory>();
}

/// <summary>
/// Incident status enumeration
/// </summary>
public enum IncidentStatus
{
    Open,
    InProgress,
    Investigating,
    Identified,
    Monitoring,
    Resolved,
    Closed,
    Cancelled
}

/// <summary>
/// Incident severity enumeration
/// </summary>
public enum IncidentSeverity
{
    Low,
    Medium,
    High,
    Critical
}

/// <summary>
/// Incident priority enumeration
/// </summary>
public enum IncidentPriority
{
    Low,
    Medium,
    High,
    Urgent
}

/// <summary>
/// Comment on an incident
/// </summary>
public class IncidentComment
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    public Guid IncidentId { get; set; }

    public Incident Incident { get; set; } = null!;

    [Required]
    [MaxLength(2000)]
    public string Comment { get; set; } = string.Empty;

    public bool IsInternal { get; set; } = false;

    public bool IsSystemGenerated { get; set; } = false;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Guid CreatedById { get; set; }

    public ApplicationUser CreatedBy { get; set; } = null!;

    public DateTime? EditedAt { get; set; }

    public Guid? EditedById { get; set; }

    public ApplicationUser? EditedBy { get; set; }
}

/// <summary>
/// History of status changes for an incident
/// </summary>
public class IncidentStatusHistory
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    public Guid IncidentId { get; set; }

    public Incident Incident { get; set; } = null!;

    public IncidentStatus OldStatus { get; set; }

    public IncidentStatus NewStatus { get; set; }

    [MaxLength(500)]
    public string? Reason { get; set; }

    public DateTime ChangedAt { get; set; } = DateTime.UtcNow;

    public Guid ChangedById { get; set; }

    public ApplicationUser ChangedBy { get; set; } = null!;
}