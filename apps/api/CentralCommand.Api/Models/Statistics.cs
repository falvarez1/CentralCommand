namespace CentralCommand.Api.Models;

/// <summary>
/// Time range options for metrics
/// </summary>
public enum TimeRange
{
    OneHour,
    TwentyFourHours,
    SevenDays,
    ThirtyDays
}

/// <summary>
/// Metric data point for time-series data
/// </summary>
public record MetricDataPoint
{
    public DateTime Timestamp { get; init; }
    public double Value { get; init; }
    public string? Label { get; init; }
}

/// <summary>
/// System statistics
/// </summary>
public record SystemStats
{
    // Portal statistics
    public int TotalPortals { get; init; }
    public int OperationalPortals { get; init; }
    public int ActivePortals { get; init; }
    public int InactivePortals { get; init; }

    // Health statistics
    public double HealthScore { get; init; }
    public double SystemUptime { get; init; }
    public double AverageResponseTime { get; init; }

    // Performance statistics
    public int TotalRequests { get; init; }
    public int TotalErrors { get; init; }
    public double ErrorRate { get; init; }
    public double Throughput { get; init; }

    // Resource statistics
    public double AverageCpu { get; init; }
    public double AverageMemory { get; init; }
    public double DiskUsage { get; init; }
    public double NetworkLatency { get; init; }

    // Incident statistics
    public int ActiveIncidents { get; init; }
    public int ResolvedToday { get; init; }
    public double Mttr { get; init; } // Mean Time To Recovery
    public double Mtbf { get; init; } // Mean Time Between Failures

    // User statistics
    public int ActiveUsers { get; init; }
    public int TotalUsers { get; init; }
    public int ConcurrentSessions { get; init; }

    // Time-based statistics
    public DateTime LastUpdated { get; init; }
    public TimeRange TimeRange { get; init; }
    public double DataQuality { get; init; } // Percentage of complete data
}

/// <summary>
/// Portal statistics
/// </summary>
public record PortalStats
{
    public int Total { get; init; }
    public int Active { get; init; }
    public int Degraded { get; init; }
    public int Down { get; init; }
    public int Maintenance { get; init; }
    public int Unknown { get; init; }
    public Dictionary<PortalCategory, int> ByCategory { get; init; } = new();
    public Dictionary<PortalEnvironment, int> ByEnvironment { get; init; } = new();
    public Dictionary<PortalPriority, int> ByPriority { get; init; } = new();
    public double AverageUptime { get; init; }
    public double AverageResponseTime { get; init; }
}

/// <summary>
/// Incident statistics
/// </summary>
public record IncidentStats
{
    public int Total { get; init; }
    public int Open { get; init; }
    public int InProgress { get; init; }
    public int Resolved { get; init; }
    public int Closed { get; init; }
    public Dictionary<IncidentSeverity, int> BySeverity { get; init; } = new();
    public Dictionary<IncidentType, int> ByType { get; init; } = new();
    public int Last24Hours { get; init; }
    public int Last7Days { get; init; }
    public double AverageMTTR { get; init; } // Mean Time To Recovery in minutes
    public double AverageMTBF { get; init; } // Mean Time Between Failures in minutes
}

/// <summary>
/// Sparkline data for metrics visualization
/// </summary>
public record SparklineData
{
    public string MetricName { get; init; } = string.Empty;
    public List<MetricDataPoint> DataPoints { get; init; } = new();
    public double CurrentValue { get; init; }
    public double PreviousValue { get; init; }
    public double ChangePercentage { get; init; }
    public string Trend { get; init; } = "stable"; // up, down, stable
}