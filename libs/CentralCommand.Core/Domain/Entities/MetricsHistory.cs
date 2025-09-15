using CentralCommand.Core.Domain.Common;
using CentralCommand.Core.Domain.ValueObjects;
using System.ComponentModel.DataAnnotations;

namespace CentralCommand.Core.Domain.Entities;

/// <summary>
/// Metrics history entity for tracking portal metrics over time
/// </summary>
public class MetricsHistory : BaseEntity
{
    /// <summary>
    /// Gets or sets the portal ID
    /// </summary>
    [Required]
    public Guid PortalId { get; set; }

    /// <summary>
    /// Gets or sets the metrics snapshot
    /// </summary>
    [Required]
    public PortalMetrics Metrics { get; set; } = PortalMetrics.Default;

    /// <summary>
    /// Gets or sets the timestamp of the metrics
    /// </summary>
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Gets or sets any anomalies detected
    /// </summary>
    [StringLength(1000)]
    public string? Anomalies { get; set; }

    /// <summary>
    /// Navigation property for the portal
    /// </summary>
    public virtual Portal? Portal { get; set; }
}