using CentralCommand.Core.Domain.Enums;
using CentralCommand.Core.DTOs.Responses;

namespace CentralCommand.Core.Interfaces.Services;

/// <summary>
/// Service interface for statistics operations
/// </summary>
public interface IStatisticsService
{
    /// <summary>
    /// Gets system-wide statistics
    /// </summary>
    Task<SystemStatsResponse> GetSystemStatisticsAsync(TimeRange timeRange = TimeRange.TwentyFourHours, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets portal statistics
    /// </summary>
    Task<PortalStatsResponse> GetPortalStatisticsAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets incident statistics
    /// </summary>
    Task<IncidentStatsResponse> GetIncidentStatisticsAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets sparkline data for a metric
    /// </summary>
    Task<SparklineDataResponse> GetSparklineDataAsync(string metricName, TimeRange timeRange = TimeRange.TwentyFourHours, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets multiple sparkline data sets
    /// </summary>
    Task<IEnumerable<SparklineDataResponse>> GetSparklinesAsync(IEnumerable<string> metricNames, TimeRange timeRange = TimeRange.TwentyFourHours, CancellationToken cancellationToken = default);

    /// <summary>
    /// Calculates health score for the system
    /// </summary>
    Task<double> CalculateHealthScoreAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets performance metrics
    /// </summary>
    Task<Dictionary<string, double>> GetPerformanceMetricsAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets resource utilization metrics
    /// </summary>
    Task<Dictionary<string, double>> GetResourceUtilizationAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets trending metrics (metrics that are changing significantly)
    /// </summary>
    Task<IEnumerable<SparklineDataResponse>> GetTrendingMetricsAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Generates a dashboard snapshot
    /// </summary>
    Task<DashboardSnapshot> GetDashboardSnapshotAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Exports statistics to CSV
    /// </summary>
    Task<byte[]> ExportStatisticsAsync(TimeRange timeRange = TimeRange.SevenDays, CancellationToken cancellationToken = default);
}

/// <summary>
/// Dashboard snapshot containing all key metrics
/// </summary>
public class DashboardSnapshot
{
    /// <summary>
    /// Gets or sets the system statistics
    /// </summary>
    public SystemStatsResponse SystemStats { get; set; } = new();

    /// <summary>
    /// Gets or sets the portal statistics
    /// </summary>
    public PortalStatsResponse PortalStats { get; set; } = new();

    /// <summary>
    /// Gets or sets the incident statistics
    /// </summary>
    public IncidentStatsResponse IncidentStats { get; set; } = new();

    /// <summary>
    /// Gets or sets key sparklines
    /// </summary>
    public List<SparklineDataResponse> Sparklines { get; set; } = new();

    /// <summary>
    /// Gets or sets the snapshot timestamp
    /// </summary>
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Gets or sets the health score
    /// </summary>
    public double HealthScore { get; set; }
}