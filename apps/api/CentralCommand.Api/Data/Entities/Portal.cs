using System.ComponentModel.DataAnnotations;

namespace CentralCommand.Api.Data.Entities;

/// <summary>
/// Represents a service portal or application being monitored
/// </summary>
public class Portal
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Description { get; set; }

    [Required]
    [MaxLength(500)]
    public string Url { get; set; } = string.Empty;

    [MaxLength(50)]
    public string Category { get; set; } = "General";

    public PortalStatus Status { get; set; } = PortalStatus.Unknown;

    public PortalEnvironment Environment { get; set; } = PortalEnvironment.Production;

    public bool IsFavorite { get; set; }

    public bool IsActive { get; set; } = true;

    // Metrics
    public int ResponseTime { get; set; } // in milliseconds

    public double Uptime { get; set; } // percentage 0-100

    public int ErrorRate { get; set; } // errors per hour

    public int ActiveUsers { get; set; }

    public double CpuUsage { get; set; } // percentage 0-100

    public double MemoryUsage { get; set; } // percentage 0-100

    public DateTime? LastCheckedAt { get; set; }

    public DateTime? LastIncidentAt { get; set; }

    // Health Check Configuration
    public string? HealthCheckEndpoint { get; set; }

    public int HealthCheckInterval { get; set; } = 60; // seconds

    public int HealthCheckTimeout { get; set; } = 30; // seconds

    public string? HealthCheckMethod { get; set; } = "GET";

    public string? HealthCheckHeaders { get; set; } // JSON string

    public string? ExpectedStatusCode { get; set; } = "200";

    // Metadata
    public Guid? OwnerId { get; set; }

    public ApplicationUser? Owner { get; set; }

    public Guid? TeamId { get; set; }

    public string? Tags { get; set; } // Comma-separated tags

    public Dictionary<string, object> Metadata { get; set; } = new();

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public Guid? CreatedById { get; set; }

    public ApplicationUser? CreatedBy { get; set; }

    public Guid? UpdatedById { get; set; }

    public ApplicationUser? UpdatedBy { get; set; }

    // Navigation properties
    public virtual ICollection<Incident> Incidents { get; set; } = new List<Incident>();

    public virtual ICollection<PortalMetricHistory> MetricHistory { get; set; } = new List<PortalMetricHistory>();
}

/// <summary>
/// Portal status enumeration
/// </summary>
public enum PortalStatus
{
    Online,
    Offline,
    Degraded,
    Maintenance,
    Unknown
}

/// <summary>
/// Portal environment enumeration
/// </summary>
public enum PortalEnvironment
{
    Development,
    Staging,
    UAT,
    Production
}

/// <summary>
/// Historical metrics for a portal
/// </summary>
public class PortalMetricHistory
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    public Guid PortalId { get; set; }

    public Portal Portal { get; set; } = null!;

    public DateTime Timestamp { get; set; } = DateTime.UtcNow;

    public int ResponseTime { get; set; }

    public double Uptime { get; set; }

    public int ErrorRate { get; set; }

    public int ActiveUsers { get; set; }

    public double CpuUsage { get; set; }

    public double MemoryUsage { get; set; }

    public PortalStatus Status { get; set; }
}