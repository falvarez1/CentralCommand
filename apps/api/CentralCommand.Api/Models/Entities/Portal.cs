using CentralCommand.Core.Domain.Enums;
using CentralCommand.Core.Domain.ValueObjects;

namespace CentralCommand.Api.Models.Entities;

/// <summary>
/// Portal entity for internal use
/// </summary>
public class Portal
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