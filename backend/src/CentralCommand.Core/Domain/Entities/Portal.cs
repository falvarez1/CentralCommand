using CentralCommand.Core.Domain.Common;
using CentralCommand.Core.Domain.Enums;
using CentralCommand.Core.Domain.ValueObjects;
using System.ComponentModel.DataAnnotations;

namespace CentralCommand.Core.Domain.Entities;

/// <summary>
/// Portal aggregate root entity
/// </summary>
public class Portal : BaseEntity, IAggregateRoot
{
    /// <summary>
    /// Gets or sets the portal name
    /// </summary>
    [Required]
    [StringLength(200)]
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the portal description
    /// </summary>
    [StringLength(1000)]
    public string? Description { get; set; }

    /// <summary>
    /// Gets or sets the portal URL
    /// </summary>
    [Required]
    [StringLength(500)]
    [Url]
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
    public PortalEnvironment Environment { get; set; } = PortalEnvironment.Production;

    /// <summary>
    /// Gets or sets the portal priority
    /// </summary>
    public PortalPriority Priority { get; set; } = PortalPriority.Medium;

    /// <summary>
    /// Gets or sets the authentication type
    /// </summary>
    public AuthType AuthType { get; set; } = AuthType.None;

    /// <summary>
    /// Gets or sets the authentication configuration (JSON)
    /// </summary>
    public string? AuthConfig { get; set; }

    /// <summary>
    /// Gets or sets the portal metrics
    /// </summary>
    public PortalMetrics Metrics { get; set; } = PortalMetrics.Default;

    /// <summary>
    /// Gets or sets the metrics history (JSON array)
    /// </summary>
    public string? MetricsHistoryJson { get; set; }

    /// <summary>
    /// Gets or sets when the portal was last checked
    /// </summary>
    public DateTime LastChecked { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Gets or sets when the portal was last checked (alias for LastChecked)
    /// </summary>
    public DateTime LastCheckedAt
    {
        get => LastChecked;
        set => LastChecked = value;
    }

    /// <summary>
    /// Gets or sets when the portal was last modified
    /// </summary>
    public DateTime LastModifiedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Gets or sets when the last incident occurred
    /// </summary>
    public DateTime? LastIncident { get; set; }

    /// <summary>
    /// Gets or sets when the status last changed
    /// </summary>
    public DateTime? LastStatusChange { get; set; }

    /// <summary>
    /// Gets or sets the reason for the current status
    /// </summary>
    [StringLength(500)]
    public string? StatusReason { get; set; }

    /// <summary>
    /// Gets or sets the portal configuration
    /// </summary>
    public PortalConfig Config { get; set; } = PortalConfig.Default;

    /// <summary>
    /// Gets or sets the portal icon
    /// </summary>
    [StringLength(100)]
    public string? Icon { get; set; }

    /// <summary>
    /// Gets or sets the portal color
    /// </summary>
    [StringLength(50)]
    public string? Color { get; set; }

    /// <summary>
    /// Gets or sets the portal tags (JSON array)
    /// </summary>
    public string? Tags { get; set; }

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
    /// Gets or sets the maintainers (JSON array of GUIDs)
    /// </summary>
    public string? Maintainers { get; set; }

    /// <summary>
    /// Navigation property for metrics history
    /// </summary>
    public virtual ICollection<MetricsHistory> MetricsHistory { get; set; } = new List<MetricsHistory>();

    /// <summary>
    /// Navigation property for health checks
    /// </summary>
    public virtual ICollection<HealthCheck> HealthChecks { get; set; } = new List<HealthCheck>();

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
    /// Gets the list of maintainers
    /// </summary>
    public List<Guid> GetMaintainers()
    {
        if (string.IsNullOrWhiteSpace(Maintainers))
            return new List<Guid>();

        try
        {
            return System.Text.Json.JsonSerializer.Deserialize<List<Guid>>(Maintainers) ?? new List<Guid>();
        }
        catch
        {
            return new List<Guid>();
        }
    }

    /// <summary>
    /// Sets the list of maintainers
    /// </summary>
    public void SetMaintainers(List<Guid> maintainers)
    {
        Maintainers = maintainers?.Any() == true
            ? System.Text.Json.JsonSerializer.Serialize(maintainers)
            : null;
    }

    /// <summary>
    /// Updates the portal metrics
    /// </summary>
    public void UpdateMetrics(PortalMetrics metrics)
    {
        Metrics = metrics;
        LastChecked = DateTime.UtcNow;
        LastModifiedAt = DateTime.UtcNow;
        UpdatedAt = DateTime.UtcNow;
        ETag = Guid.NewGuid().ToString();
    }

    /// <summary>
    /// Updates the portal status
    /// </summary>
    public void UpdateStatus(PortalStatus status)
    {
        Status = status;
        LastModifiedAt = DateTime.UtcNow;
        UpdatedAt = DateTime.UtcNow;
        ETag = Guid.NewGuid().ToString();

        if (status == PortalStatus.Down)
        {
            LastIncident = DateTime.UtcNow;
        }
    }
}