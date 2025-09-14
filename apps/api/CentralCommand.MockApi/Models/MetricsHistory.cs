namespace CentralCommand.MockApi.Models;

/// <summary>
/// Time range for metrics history
/// </summary>
public enum MetricsTimeRange
{
    LastHour,
    Last24Hours,
    Last7Days,
    Last30Days,
    Custom
}

/// <summary>
/// Metrics aggregation type
/// </summary>
public enum MetricsAggregation
{
    Average,
    Sum,
    Min,
    Max,
    Count
}

/// <summary>
/// Historical metrics data point
/// </summary>
public class MetricsDataPoint
{
    public DateTime Timestamp { get; set; }
    public double ResponseTime { get; set; }
    public double Uptime { get; set; }
    public double Cpu { get; set; }
    public double Memory { get; set; }
    public int Requests { get; set; }
    public int Errors { get; set; }
    public double ErrorRate { get; set; }
    public double Throughput { get; set; }
    public double Latency { get; set; }
}

/// <summary>
/// Metrics history response
/// </summary>
public class MetricsHistory
{
    public Guid PortalId { get; set; }
    public string PortalName { get; set; } = string.Empty;
    public MetricsTimeRange TimeRange { get; set; }
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    public int DataPoints { get; set; }
    public int IntervalMinutes { get; set; }
    public List<MetricsDataPoint> Data { get; set; } = new();
    public MetricsSummary Summary { get; set; } = new();
}

/// <summary>
/// Metrics summary statistics
/// </summary>
public class MetricsSummary
{
    public double AverageResponseTime { get; set; }
    public double AverageUptime { get; set; }
    public double AverageCpu { get; set; }
    public double AverageMemory { get; set; }
    public int TotalRequests { get; set; }
    public int TotalErrors { get; set; }
    public double AverageErrorRate { get; set; }
    public double MaxResponseTime { get; set; }
    public double MinResponseTime { get; set; }
    public double MaxCpu { get; set; }
    public double MaxMemory { get; set; }
    public List<string> Anomalies { get; set; } = new();
}