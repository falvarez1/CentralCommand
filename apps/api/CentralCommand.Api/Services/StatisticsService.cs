using CentralCommand.Core.Domain.Enums;
using CentralCommand.Core.DTOs.Responses;
using CentralCommand.Core.Interfaces.Services;
using Microsoft.Extensions.Logging;

namespace CentralCommand.Api.Services;

public class StatisticsService : IStatisticsService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<StatisticsService> _logger;

    public StatisticsService(
        IUnitOfWork unitOfWork,
        ILogger<StatisticsService> logger)
    {
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    public async Task<Dictionary<string, object>> GetSystemStatisticsAsync(CancellationToken cancellationToken = default)
    {
        _logger.LogDebug("Calculating system statistics");

        var portals = await _unitOfWork.Portals.GetAllAsync(cancellationToken);
        var incidents = await _unitOfWork.Incidents.GetAllAsync(cancellationToken);

        var portalsList = portals.ToList();
        var incidentsList = incidents.ToList();

        var statistics = new Dictionary<string, object>
        {
            ["TotalPortals"] = portalsList.Count,
            ["HealthyPortals"] = portalsList.Count(p => p.Status == PortalStatus.Healthy),
            ["DegradedPortals"] = portalsList.Count(p => p.Status == PortalStatus.Degraded),
            ["DownPortals"] = portalsList.Count(p => p.Status == PortalStatus.Down),
            ["TotalIncidents"] = incidentsList.Count,
            ["ActiveIncidents"] = incidentsList.Count(i => i.Status != IncidentStatus.Resolved && i.Status != IncidentStatus.Closed),
            ["CriticalIncidents"] = incidentsList.Count(i => i.Priority == IncidentPriority.Critical && i.Status != IncidentStatus.Resolved),
            ["AverageResponseTime"] = portalsList.Any() ? Math.Round(portalsList.Average(p => p.Metrics.ResponseTime), 2) : 0,
            ["AverageUptime"] = portalsList.Any() ? Math.Round(portalsList.Average(p => p.Metrics.Uptime), 2) : 100,
            ["LastUpdated"] = DateTime.UtcNow
        };

        return statistics;
    }

    public async Task<Dictionary<PortalStatus, int>> GetPortalStatusDistributionAsync(CancellationToken cancellationToken = default)
    {
        var portals = await _unitOfWork.Portals.GetAllAsync(cancellationToken);

        return portals
            .GroupBy(p => p.Status)
            .ToDictionary(g => g.Key, g => g.Count());
    }

    public async Task<Dictionary<IncidentPriority, int>> GetIncidentPriorityDistributionAsync(CancellationToken cancellationToken = default)
    {
        return await _unitOfWork.Incidents.GetIncidentCountByPriorityAsync(cancellationToken);
    }

    public async Task<List<(DateTime Date, int Count)>> GetIncidentTrendAsync(int days = 7, CancellationToken cancellationToken = default)
    {
        var startDate = DateTime.UtcNow.Date.AddDays(-days);
        var endDate = DateTime.UtcNow.Date.AddDays(1);

        var incidents = await _unitOfWork.Incidents.GetIncidentsByDateRangeAsync(startDate, endDate, cancellationToken);

        return incidents
            .GroupBy(i => i.CreatedAt.Date)
            .Select(g => (Date: g.Key, Count: g.Count()))
            .OrderBy(x => x.Date)
            .ToList();
    }

    public async Task<double> GetAverageIncidentResolutionTimeAsync(CancellationToken cancellationToken = default)
    {
        var resolvedIncidents = (await _unitOfWork.Incidents.GetAllAsync(cancellationToken))
            .Where(i => i.Status == IncidentStatus.Resolved && i.ResolvedAt.HasValue)
            .ToList();

        if (!resolvedIncidents.Any())
        {
            return 0;
        }

        var resolutionTimes = resolvedIncidents
            .Select(i => (i.ResolvedAt!.Value - i.CreatedAt).TotalHours)
            .ToList();

        return Math.Round(resolutionTimes.Average(), 2);
    }

    public async Task<Dictionary<string, double>> GetPortalMetricsAveragesAsync(CancellationToken cancellationToken = default)
    {
        var portals = await _unitOfWork.Portals.GetAllAsync(cancellationToken);
        var portalsList = portals.ToList();

        if (!portalsList.Any())
        {
            return new Dictionary<string, double>
            {
                ["ResponseTime"] = 0,
                ["Uptime"] = 100,
                ["ErrorRate"] = 0,
                ["RequestsPerMinute"] = 0
            };
        }

        return new Dictionary<string, double>
        {
            ["ResponseTime"] = Math.Round(portalsList.Average(p => p.Metrics.ResponseTime), 2),
            ["Uptime"] = Math.Round(portalsList.Average(p => p.Metrics.Uptime), 2),
            ["ErrorRate"] = Math.Round(portalsList.Average(p => p.Metrics.ErrorRate), 2),
            ["RequestsPerMinute"] = Math.Round(portalsList.Average(p => p.Metrics.RequestsPerMinute), 2)
        };
    }

    public async Task<List<(string Category, int Count)>> GetPortalCategoryDistributionAsync(CancellationToken cancellationToken = default)
    {
        var portals = await _unitOfWork.Portals.GetAllAsync(cancellationToken);

        return portals
            .GroupBy(p => p.Category)
            .Select(g => (Category: g.Key, Count: g.Count()))
            .OrderByDescending(x => x.Count)
            .ToList();
    }

    public async Task<List<(PortalEnvironment Environment, int Count)>> GetPortalEnvironmentDistributionAsync(CancellationToken cancellationToken = default)
    {
        var portals = await _unitOfWork.Portals.GetAllAsync(cancellationToken);

        return portals
            .GroupBy(p => p.Environment)
            .Select(g => (Environment: g.Key, Count: g.Count()))
            .OrderBy(x => x.Environment)
            .ToList();
    }

    // Additional IStatisticsService interface methods
    public async Task<SystemStatsResponse> GetSystemStatisticsAsync(TimeRange timeRange, CancellationToken cancellationToken = default)
    {
        var statistics = await GetSystemStatisticsAsync(cancellationToken);

        return new SystemStatsResponse
        {
            TotalPortals = (int)statistics["TotalPortals"],
            HealthyPortals = (int)statistics["HealthyPortals"],
            DegradedPortals = (int)statistics["DegradedPortals"],
            DownPortals = (int)statistics["DownPortals"],
            TotalIncidents = (int)statistics["TotalIncidents"],
            ActiveIncidents = (int)statistics["ActiveIncidents"],
            CriticalIncidents = (int)statistics["CriticalIncidents"],
            AverageResponseTime = (double)statistics["AverageResponseTime"],
            AverageUptime = (double)statistics["AverageUptime"],
            TimeRange = timeRange,
            GeneratedAt = DateTime.UtcNow
        };
    }

    public async Task<PortalStatsResponse> GetPortalStatisticsAsync(CancellationToken cancellationToken = default)
    {
        var portals = await _unitOfWork.Portals.GetAllAsync(cancellationToken);
        var portalsList = portals.ToList();

        return new PortalStatsResponse
        {
            TotalCount = portalsList.Count,
            ByStatus = await GetPortalStatusDistributionAsync(cancellationToken),
            ByCategory = (await GetPortalCategoryDistributionAsync(cancellationToken))
                .ToDictionary(x => x.Category, x => x.Count),
            ByEnvironment = (await GetPortalEnvironmentDistributionAsync(cancellationToken))
                .ToDictionary(x => x.Environment, x => x.Count),
            AverageMetrics = await GetPortalMetricsAveragesAsync(cancellationToken)
        };
    }

    public async Task<IncidentStatsResponse> GetIncidentStatisticsAsync(CancellationToken cancellationToken = default)
    {
        var incidents = await _unitOfWork.Incidents.GetAllAsync(cancellationToken);
        var incidentsList = incidents.ToList();

        return new IncidentStatsResponse
        {
            TotalIncidents = incidentsList.Count,
            OpenIncidents = incidentsList.Count(i => i.Status == IncidentStatus.Open),
            AcknowledgedIncidents = incidentsList.Count(i => i.Status == IncidentStatus.Acknowledged),
            ResolvedIncidents = incidentsList.Count(i => i.Status == IncidentStatus.Resolved),
            ClosedIncidents = incidentsList.Count(i => i.Status == IncidentStatus.Closed),
            CriticalIncidents = incidentsList.Count(i => i.Severity == IncidentSeverity.Critical),
            HighIncidents = incidentsList.Count(i => i.Severity == IncidentSeverity.High),
            MediumIncidents = incidentsList.Count(i => i.Severity == IncidentSeverity.Medium),
            LowIncidents = incidentsList.Count(i => i.Severity == IncidentSeverity.Low)
        };
    }

    public async Task<SparklineDataResponse> GetSparklineDataAsync(string metricName, TimeRange timeRange, CancellationToken cancellationToken = default)
    {
        var data = new List<double>();
        var labels = new List<string>();
        var now = DateTime.UtcNow;

        // Generate sample data based on time range
        int points = timeRange switch
        {
            TimeRange.Hour => 12,
            TimeRange.Day => 24,
            TimeRange.Week => 7,
            TimeRange.Month => 30,
            _ => 24
        };

        for (int i = 0; i < points; i++)
        {
            data.Add(Random.Shared.Next(50, 100));
            labels.Add(now.AddHours(-i).ToString("HH:mm"));
        }

        return new SparklineDataResponse
        {
            MetricName = metricName,
            Data = data,
            Labels = labels,
            TimeRange = timeRange,
            GeneratedAt = DateTime.UtcNow
        };
    }

    public async Task<IEnumerable<SparklineDataResponse>> GetSparklinesAsync(IEnumerable<string> metricNames, TimeRange timeRange, CancellationToken cancellationToken = default)
    {
        var result = new List<SparklineDataResponse>();

        foreach (var metricName in metricNames)
        {
            result.Add(await GetSparklineDataAsync(metricName, timeRange, cancellationToken));
        }

        return result;
    }

    public async Task<double> CalculateHealthScoreAsync(CancellationToken cancellationToken = default)
    {
        var portals = await _unitOfWork.Portals.GetAllAsync(cancellationToken);
        var portalsList = portals.ToList();

        if (!portalsList.Any())
            return 100.0;

        var healthyCount = portalsList.Count(p => p.Status == PortalStatus.Healthy);
        var warningCount = portalsList.Count(p => p.Status == PortalStatus.Warning);
        var degradedCount = portalsList.Count(p => p.Status == PortalStatus.Degraded);
        var downCount = portalsList.Count(p => p.Status == PortalStatus.Down);

        // Calculate weighted health score
        var score = (healthyCount * 100.0 + warningCount * 75.0 + degradedCount * 25.0 + downCount * 0.0) / portalsList.Count;

        return Math.Round(score, 2);
    }

    public async Task<Dictionary<string, double>> GetPerformanceMetricsAsync(CancellationToken cancellationToken = default)
    {
        var portals = await _unitOfWork.Portals.GetAllAsync(cancellationToken);
        var portalsList = portals.ToList();

        return new Dictionary<string, double>
        {
            ["AverageResponseTime"] = portalsList.Any() ? portalsList.Average(p => p.Metrics.ResponseTime) : 0,
            ["P95ResponseTime"] = portalsList.Any() ? CalculatePercentile(portalsList.Select(p => p.Metrics.ResponseTime).ToList(), 0.95) : 0,
            ["P99ResponseTime"] = portalsList.Any() ? CalculatePercentile(portalsList.Select(p => p.Metrics.ResponseTime).ToList(), 0.99) : 0,
            ["AverageErrorRate"] = portalsList.Any() ? portalsList.Average(p => p.Metrics.ErrorRate) : 0,
            ["TotalRequestsPerMinute"] = portalsList.Sum(p => p.Metrics.RequestsPerMinute)
        };
    }

    public async Task<Dictionary<string, double>> GetResourceUtilizationAsync(CancellationToken cancellationToken = default)
    {
        // Simulated resource utilization data
        await Task.CompletedTask;
        return new Dictionary<string, double>
        {
            ["CpuUsage"] = Random.Shared.Next(20, 80),
            ["MemoryUsage"] = Random.Shared.Next(30, 70),
            ["DiskUsage"] = Random.Shared.Next(40, 90),
            ["NetworkBandwidth"] = Random.Shared.Next(100, 1000),
            ["ActiveConnections"] = Random.Shared.Next(50, 500)
        };
    }

    public async Task<IEnumerable<SparklineDataResponse>> GetTrendingMetricsAsync(CancellationToken cancellationToken = default)
    {
        var metrics = new List<string> { "ResponseTime", "ErrorRate", "Uptime", "Requests" };
        var sparklines = new List<SparklineDataResponse>();

        foreach (var metric in metrics)
        {
            sparklines.Add(await GetSparklineDataAsync(metric, TimeRange.Day, cancellationToken));
        }

        // Sort by trend strength (absolute change)
        return sparklines
            .OrderByDescending(s => Math.Abs(s.Values.Last() - s.Values.First()))
            .Take(3);
    }

    public async Task<DashboardSnapshot> GetDashboardSnapshotAsync(CancellationToken cancellationToken = default)
    {
        return new DashboardSnapshot
        {
            SystemStats = await GetSystemStatisticsAsync(TimeRange.Day, cancellationToken),
            PortalStats = await GetPortalStatisticsAsync(cancellationToken),
            IncidentStats = await GetIncidentStatisticsAsync(cancellationToken),
            HealthScore = await CalculateHealthScoreAsync(cancellationToken),
            Sparklines = (await GetTrendingMetricsAsync(cancellationToken)).ToList(),
            Timestamp = DateTime.UtcNow
        };
    }

    public async Task<byte[]> ExportStatisticsAsync(TimeRange timeRange, CancellationToken cancellationToken = default)
    {
        var snapshot = await GetDashboardSnapshotAsync(cancellationToken);

        // Generate CSV export
        var csv = "Metric,Value\n";
        csv += $"Total Portals,{snapshot.PortalStatistics.TotalCount}\n";
        csv += $"Healthy Portals,{snapshot.SystemStatistics.HealthyPortals}\n";
        csv += $"Degraded Portals,{snapshot.SystemStatistics.DegradedPortals}\n";
        csv += $"Down Portals,{snapshot.SystemStatistics.DownPortals}\n";
        csv += $"Active Incidents,{snapshot.SystemStatistics.ActiveIncidents}\n";
        csv += $"Critical Incidents,{snapshot.SystemStatistics.CriticalIncidents}\n";
        csv += $"Health Score,{snapshot.HealthScore}\n";
        csv += $"Average Response Time,{snapshot.PerformanceMetrics.AverageResponseTime}\n";
        csv += $"Generated At,{snapshot.GeneratedAt}\n";

        return System.Text.Encoding.UTF8.GetBytes(csv);
    }

    private double CalculatePercentile(List<double> values, double percentile)
    {
        if (!values.Any())
            return 0;

        var sortedValues = values.OrderBy(v => v).ToList();
        var index = (int)Math.Ceiling(percentile * sortedValues.Count) - 1;
        return sortedValues[Math.Max(0, Math.Min(index, sortedValues.Count - 1))];
    }
}