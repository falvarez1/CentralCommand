using System.ComponentModel.DataAnnotations;

namespace CentralCommand.Api.Data.Entities;

/// <summary>
/// System-wide statistics and metrics
/// </summary>
public class SystemStatistics
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    public DateTime Timestamp { get; set; } = DateTime.UtcNow;

    // Portal Statistics
    public int TotalPortals { get; set; }

    public int OnlinePortals { get; set; }

    public int OfflinePortals { get; set; }

    public int DegradedPortals { get; set; }

    public int MaintenancePortals { get; set; }

    // Incident Statistics
    public int TotalIncidents { get; set; }

    public int OpenIncidents { get; set; }

    public int InProgressIncidents { get; set; }

    public int ResolvedIncidents { get; set; }

    public int CriticalIncidents { get; set; }

    public int HighIncidents { get; set; }

    public int MediumIncidents { get; set; }

    public int LowIncidents { get; set; }

    // Performance Metrics
    public double AverageResponseTime { get; set; } // milliseconds

    public double AverageUptime { get; set; } // percentage

    public double AverageErrorRate { get; set; } // errors per hour

    public int TotalActiveUsers { get; set; }

    public double AverageCpuUsage { get; set; } // percentage

    public double AverageMemoryUsage { get; set; } // percentage

    // Trends (compared to previous period)
    public double UptimeTrend { get; set; } // percentage change

    public double ResponseTimeTrend { get; set; } // percentage change

    public double ErrorRateTrend { get; set; } // percentage change

    public double IncidentTrend { get; set; } // percentage change

    // Time-based metrics
    public double MeanTimeToRecovery { get; set; } // minutes

    public double MeanTimeBetweenFailures { get; set; } // hours

    public double MeanTimeToAcknowledge { get; set; } // minutes

    public double MeanTimeToResolve { get; set; } // minutes

    // User Activity
    public int ActiveUsersLast24Hours { get; set; }

    public int ActiveUsersLast7Days { get; set; }

    public int ActiveUsersLast30Days { get; set; }

    public int TotalUsers { get; set; }

    // Business Impact
    public double EstimatedRevenueLossToday { get; set; }

    public double EstimatedRevenueLossThisWeek { get; set; }

    public double EstimatedRevenueLossThisMonth { get; set; }

    public int TotalDowntimeMinutesToday { get; set; }

    public int TotalDowntimeMinutesThisWeek { get; set; }

    public int TotalDowntimeMinutesThisMonth { get; set; }

    // SLA Metrics
    public double SlaComplianceRate { get; set; } // percentage

    public int SlaBreachesToday { get; set; }

    public int SlaBreachesThisWeek { get; set; }

    public int SlaBreachesThisMonth { get; set; }

    // Alert Statistics
    public int AlertsTriggeredToday { get; set; }

    public int AlertsTriggeredThisWeek { get; set; }

    public int AlertsTriggeredThisMonth { get; set; }

    public int AlertsAcknowledgedToday { get; set; }

    public int AlertsIgnoredToday { get; set; }

    // Metadata
    public string? CalculationNotes { get; set; }

    public Dictionary<string, object> AdditionalMetrics { get; set; } = new();
}

/// <summary>
/// Time-series data point for sparkline charts
/// </summary>
public class SparklineDataPoint
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    [MaxLength(100)]
    public string MetricName { get; set; } = string.Empty;

    [MaxLength(100)]
    public string? Category { get; set; }

    public DateTime Timestamp { get; set; } = DateTime.UtcNow;

    public double Value { get; set; }

    [MaxLength(50)]
    public string? Unit { get; set; }

    public Guid? PortalId { get; set; }

    public Portal? Portal { get; set; }

    public TimeGranularity Granularity { get; set; } = TimeGranularity.Minute;
}

/// <summary>
/// Time granularity for metrics
/// </summary>
public enum TimeGranularity
{
    Second,
    Minute,
    FiveMinutes,
    FifteenMinutes,
    Hour,
    Day,
    Week,
    Month
}

/// <summary>
/// Aggregated statistics by category
/// </summary>
public class CategoryStatistics
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    [MaxLength(100)]
    public string Category { get; set; } = string.Empty;

    public DateTime Timestamp { get; set; } = DateTime.UtcNow;

    public int PortalCount { get; set; }

    public int OnlineCount { get; set; }

    public int OfflineCount { get; set; }

    public int IncidentCount { get; set; }

    public double AverageUptime { get; set; }

    public double AverageResponseTime { get; set; }

    public int TotalUsers { get; set; }

    public TimeGranularity Granularity { get; set; } = TimeGranularity.Hour;
}

/// <summary>
/// Team performance statistics
/// </summary>
public class TeamStatistics
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid TeamId { get; set; }

    [MaxLength(100)]
    public string TeamName { get; set; } = string.Empty;

    public DateTime Timestamp { get; set; } = DateTime.UtcNow;

    public int ManagedPortals { get; set; }

    public int AssignedIncidents { get; set; }

    public int ResolvedIncidents { get; set; }

    public double AverageResolutionTime { get; set; } // minutes

    public double AverageResponseTime { get; set; } // minutes

    public double SlaComplianceRate { get; set; } // percentage

    public int TeamMemberCount { get; set; }

    public double TeamProductivityScore { get; set; } // 0-100

    public TimeGranularity Granularity { get; set; } = TimeGranularity.Day;
}