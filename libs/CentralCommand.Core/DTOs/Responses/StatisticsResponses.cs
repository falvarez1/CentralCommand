using CentralCommand.Core.Domain.Enums;

namespace CentralCommand.Core.DTOs.Responses;

/// <summary>
/// Main statistics response
/// </summary>
public class StatisticsResponse
{
    /// <summary>
    /// Gets or sets the system statistics
    /// </summary>
    public SystemStatsResponse Stats { get; set; } = new();

    /// <summary>
    /// Gets or sets the portal statistics
    /// </summary>
    public PortalStatsResponse PortalStats { get; set; } = new();

    /// <summary>
    /// Gets or sets the incident statistics
    /// </summary>
    public IncidentStatsResponse IncidentStats { get; set; } = new();

    /// <summary>
    /// Gets or sets the sparkline data
    /// </summary>
    public Dictionary<string, List<SparklineData>> Sparklines { get; set; } = new();

    /// <summary>
    /// Gets or sets the total number of portals
    /// </summary>
    public int TotalPortals { get; set; }

    /// <summary>
    /// Gets or sets the number of healthy portals
    /// </summary>
    public int HealthyPortals { get; set; }

    /// <summary>
    /// Gets or sets the number of active incidents
    /// </summary>
    public int ActiveIncidents { get; set; }

    /// <summary>
    /// Gets or sets the incident type breakdown
    /// </summary>
    public Dictionary<string, int> IncidentTypeBreakdown { get; set; } = new();

    /// <summary>
    /// Gets or sets the average response time in milliseconds
    /// </summary>
    public double AverageResponseTime { get; set; }

    /// <summary>
    /// Gets or sets the average uptime percentage
    /// </summary>
    public double AverageUptime { get; set; }

    /// <summary>
    /// Gets or sets the average error rate percentage
    /// </summary>
    public double AverageErrorRate { get; set; }

    /// <summary>
    /// Gets or sets the number of down portals
    /// </summary>
    public int DownPortals { get; set; }

    /// <summary>
    /// Gets or sets the number of degraded portals
    /// </summary>
    public int DegradedPortals { get; set; }

    /// <summary>
    /// Gets or sets the number of critical incidents
    /// </summary>
    public int CriticalIncidents { get; set; }

    /// <summary>
    /// Gets or sets the total number of requests
    /// </summary>
    public long TotalRequests { get; set; }

    /// <summary>
    /// Gets or sets the timestamp of the statistics
    /// </summary>
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}

/// <summary>
/// Sparkline data for metric visualization
/// </summary>
public class SparklineData
{
    /// <summary>
    /// Gets or sets the timestamp
    /// </summary>
    public DateTime Timestamp { get; set; }

    /// <summary>
    /// Gets or sets the value
    /// </summary>
    public double Value { get; set; }

    /// <summary>
    /// Gets or sets an optional label
    /// </summary>
    public string? Label { get; set; }
}

/// <summary>
/// System statistics response
/// </summary>
public class SystemStatsResponse
{
    // Portal statistics
    /// <summary>
    /// Gets or sets the total number of portals
    /// </summary>
    public int TotalPortals { get; set; }

    /// <summary>
    /// Gets or sets the number of operational portals
    /// </summary>
    public int OperationalPortals { get; set; }

    /// <summary>
    /// Gets or sets the number of active portals
    /// </summary>
    public int ActivePortals { get; set; }

    /// <summary>
    /// Gets or sets the number of inactive portals
    /// </summary>
    public int InactivePortals { get; set; }

    // Health statistics
    /// <summary>
    /// Gets or sets the overall health score (0-100)
    /// </summary>
    public double HealthScore { get; set; }

    /// <summary>
    /// Gets or sets the system uptime percentage
    /// </summary>
    public double SystemUptime { get; set; }

    /// <summary>
    /// Gets or sets the average response time in milliseconds
    /// </summary>
    public double AverageResponseTime { get; set; }

    // Performance statistics
    /// <summary>
    /// Gets or sets the total number of requests
    /// </summary>
    public int TotalRequests { get; set; }

    /// <summary>
    /// Gets or sets the total number of errors
    /// </summary>
    public int TotalErrors { get; set; }

    /// <summary>
    /// Gets or sets the error rate percentage
    /// </summary>
    public double ErrorRate { get; set; }

    /// <summary>
    /// Gets or sets the throughput (requests per second)
    /// </summary>
    public double Throughput { get; set; }

    // Resource statistics
    /// <summary>
    /// Gets or sets the average CPU usage percentage
    /// </summary>
    public double AverageCpu { get; set; }

    /// <summary>
    /// Gets or sets the average memory usage percentage
    /// </summary>
    public double AverageMemory { get; set; }

    /// <summary>
    /// Gets or sets the disk usage percentage
    /// </summary>
    public double DiskUsage { get; set; }

    /// <summary>
    /// Gets or sets the network latency in milliseconds
    /// </summary>
    public double NetworkLatency { get; set; }

    // Incident statistics
    /// <summary>
    /// Gets or sets the number of active incidents
    /// </summary>
    public int ActiveIncidents { get; set; }

    /// <summary>
    /// Gets or sets the number of incidents resolved today
    /// </summary>
    public int ResolvedToday { get; set; }

    /// <summary>
    /// Gets or sets the mean time to recovery in minutes
    /// </summary>
    public double Mttr { get; set; }

    /// <summary>
    /// Gets or sets the mean time between failures in minutes
    /// </summary>
    public double Mtbf { get; set; }

    // User statistics
    /// <summary>
    /// Gets or sets the number of active users
    /// </summary>
    public int ActiveUsers { get; set; }

    /// <summary>
    /// Gets or sets the total number of users
    /// </summary>
    public int TotalUsers { get; set; }

    /// <summary>
    /// Gets or sets the number of concurrent sessions
    /// </summary>
    public int ConcurrentSessions { get; set; }

    // Time-based statistics
    /// <summary>
    /// Gets or sets when the statistics were last updated
    /// </summary>
    public DateTime LastUpdated { get; set; }

    /// <summary>
    /// Gets or sets the time range for the statistics
    /// </summary>
    public TimeRange TimeRange { get; set; }

    /// <summary>
    /// Gets or sets the data quality percentage
    /// </summary>
    public double DataQuality { get; set; }
}

/// <summary>
/// Portal statistics response
/// </summary>
public class PortalStatsResponse
{
    /// <summary>
    /// Gets or sets the total number of portals
    /// </summary>
    public int Total { get; set; }

    /// <summary>
    /// Gets or sets the number of active portals
    /// </summary>
    public int Active { get; set; }

    /// <summary>
    /// Gets or sets the number of degraded portals
    /// </summary>
    public int Degraded { get; set; }

    /// <summary>
    /// Gets or sets the number of down portals
    /// </summary>
    public int Down { get; set; }

    /// <summary>
    /// Gets or sets the number of portals under maintenance
    /// </summary>
    public int Maintenance { get; set; }

    /// <summary>
    /// Gets or sets the number of portals with unknown status
    /// </summary>
    public int Unknown { get; set; }

    /// <summary>
    /// Gets or sets portal counts by category
    /// </summary>
    public Dictionary<PortalCategory, int> ByCategory { get; set; } = new();

    /// <summary>
    /// Gets or sets portal counts by environment
    /// </summary>
    public Dictionary<PortalEnvironment, int> ByEnvironment { get; set; } = new();

    /// <summary>
    /// Gets or sets portal counts by priority
    /// </summary>
    public Dictionary<PortalPriority, int> ByPriority { get; set; } = new();

    /// <summary>
    /// Gets or sets the average uptime percentage
    /// </summary>
    public double AverageUptime { get; set; }

    /// <summary>
    /// Gets or sets the average response time in milliseconds
    /// </summary>
    public double AverageResponseTime { get; set; }
}

/// <summary>
/// Incident statistics response
/// </summary>
public class IncidentStatsResponse
{
    /// <summary>
    /// Gets or sets the total number of incidents
    /// </summary>
    public int Total { get; set; }

    /// <summary>
    /// Gets or sets the number of open incidents
    /// </summary>
    public int Open { get; set; }

    /// <summary>
    /// Gets or sets the number of in-progress incidents
    /// </summary>
    public int InProgress { get; set; }

    /// <summary>
    /// Gets or sets the number of resolved incidents
    /// </summary>
    public int Resolved { get; set; }

    /// <summary>
    /// Gets or sets the number of closed incidents
    /// </summary>
    public int Closed { get; set; }

    /// <summary>
    /// Gets or sets incident counts by severity
    /// </summary>
    public Dictionary<IncidentSeverity, int> BySeverity { get; set; } = new();

    /// <summary>
    /// Gets or sets incident counts by type
    /// </summary>
    public Dictionary<IncidentType, int> ByType { get; set; } = new();

    /// <summary>
    /// Gets or sets the number of incidents in the last 24 hours
    /// </summary>
    public int Last24Hours { get; set; }

    /// <summary>
    /// Gets or sets the number of incidents in the last 7 days
    /// </summary>
    public int Last7Days { get; set; }

    /// <summary>
    /// Gets or sets the average mean time to recovery in minutes
    /// </summary>
    public double AverageMTTR { get; set; }

    /// <summary>
    /// Gets or sets the average mean time between failures in minutes
    /// </summary>
    public double AverageMTBF { get; set; }
}

/// <summary>
/// Sparkline data response for metrics visualization
/// </summary>
public class SparklineDataResponse
{
    /// <summary>
    /// Gets or sets the metric name
    /// </summary>
    public string MetricName { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the data points
    /// </summary>
    public List<MetricDataPoint> DataPoints { get; set; } = new();

    /// <summary>
    /// Gets or sets the current value
    /// </summary>
    public double CurrentValue { get; set; }

    /// <summary>
    /// Gets or sets the previous value
    /// </summary>
    public double PreviousValue { get; set; }

    /// <summary>
    /// Gets or sets the change percentage
    /// </summary>
    public double ChangePercentage { get; set; }

    /// <summary>
    /// Gets or sets the trend (up, down, stable)
    /// </summary>
    public string Trend { get; set; } = "stable";
}

/// <summary>
/// Metric data point for time-series data
/// </summary>
public class MetricDataPoint
{
    /// <summary>
    /// Gets or sets the timestamp
    /// </summary>
    public DateTime Timestamp { get; set; }

    /// <summary>
    /// Gets or sets the value
    /// </summary>
    public double Value { get; set; }

    /// <summary>
    /// Gets or sets an optional label
    /// </summary>
    public string? Label { get; set; }
}