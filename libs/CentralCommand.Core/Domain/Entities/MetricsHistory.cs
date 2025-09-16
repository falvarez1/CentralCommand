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

    // Convenience properties for direct access to metrics
    /// <summary>
    /// Gets or sets the response time
    /// </summary>
    public double ResponseTime
    {
        get => Metrics?.ResponseTime ?? 0;
        set
        {
            if (Metrics == null) Metrics = PortalMetrics.Default;
            Metrics = Metrics with { ResponseTime = value };
        }
    }

    /// <summary>
    /// Gets or sets the uptime percentage
    /// </summary>
    public double Uptime
    {
        get => Metrics?.Uptime ?? 0;
        set
        {
            if (Metrics == null) Metrics = PortalMetrics.Default;
            Metrics = Metrics with { Uptime = value };
        }
    }

    /// <summary>
    /// Gets or sets the error rate
    /// </summary>
    public double ErrorRate
    {
        get => Metrics?.ErrorRate ?? 0;
        set
        {
            if (Metrics == null) Metrics = PortalMetrics.Default;
            Metrics = Metrics with { ErrorRate = value };
        }
    }

    /// <summary>
    /// Gets or sets the requests per minute
    /// </summary>
    public int RequestsPerMinute
    {
        get => Metrics?.RequestsPerMinute ?? 0;
        set
        {
            if (Metrics == null) Metrics = PortalMetrics.Default;
            Metrics = Metrics with { RequestsPerMinute = value };
        }
    }
}