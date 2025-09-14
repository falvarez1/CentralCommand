using CentralCommand.MockApi.Models;

namespace CentralCommand.MockApi.Services;

/// <summary>
/// Service for generating system statistics and metrics
/// </summary>
public class StatisticsService
{
    private readonly MockDataService _mockDataService;
    private readonly Random _random = new();

    public StatisticsService(MockDataService mockDataService)
    {
        _mockDataService = mockDataService;
    }

    public SystemStats GetSystemStats()
    {
        var portals = _mockDataService.GetPortals();
        var incidents = _mockDataService.GetIncidents();

        var operationalCount = portals.Count(p => p.Status == PortalStatus.Active);
        var activeIncidents = incidents.Count(i => i.Status != IncidentStatus.Resolved && i.Status != IncidentStatus.Closed);
        var resolvedToday = incidents.Count(i => i.ResolvedAt?.Date == DateTime.Today);

        var totalRequests = portals.Sum(p => p.Metrics.Requests);
        var totalErrors = portals.Sum(p => p.Metrics.Errors);

        return new SystemStats
        {
            // Portal statistics
            TotalPortals = portals.Count,
            OperationalPortals = operationalCount,
            ActivePortals = portals.Count(p => p.Metrics.Requests > 100),
            InactivePortals = portals.Count(p => p.Metrics.Requests <= 100),

            // Health statistics
            HealthScore = CalculateHealthScore(portals, incidents),
            SystemUptime = portals.Average(p => p.Metrics.Uptime),
            AverageResponseTime = portals.Average(p => p.Metrics.ResponseTime),

            // Performance statistics
            TotalRequests = totalRequests,
            TotalErrors = totalErrors,
            ErrorRate = totalRequests > 0 ? (double)totalErrors / totalRequests * 100 : 0,
            Throughput = portals.Average(p => p.Metrics.Throughput),

            // Resource statistics
            AverageCpu = portals.Average(p => p.Metrics.Cpu),
            AverageMemory = portals.Average(p => p.Metrics.Memory),
            DiskUsage = 45 + _random.NextDouble() * 30,
            NetworkLatency = portals.Average(p => p.Metrics.Latency),

            // Incident statistics
            ActiveIncidents = activeIncidents,
            ResolvedToday = resolvedToday,
            Mttr = CalculateAverageMTTR(incidents),
            Mtbf = CalculateAverageMTBF(incidents),

            // User statistics
            ActiveUsers = _random.Next(50, 200),
            TotalUsers = _random.Next(500, 1000),
            ConcurrentSessions = _random.Next(20, 100),

            // Time-based statistics
            LastUpdated = DateTime.UtcNow,
            TimeRange = TimeRange.TwentyFourHours,
            DataQuality = 95 + _random.NextDouble() * 5
        };
    }

    public Dictionary<string, List<MetricDataPoint>> GetSparklines()
    {
        var sparklines = new Dictionary<string, List<MetricDataPoint>>();
        var now = DateTime.UtcNow;

        // Generate hourly data points for the last 24 hours
        var metrics = new[] { "responseTime", "uptime", "cpu", "memory", "requests", "errors", "throughput" };

        foreach (var metric in metrics)
        {
            var dataPoints = new List<MetricDataPoint>();
            var baseValue = GetBaseValueForMetric(metric);

            for (int i = 23; i >= 0; i--)
            {
                var variation = (metric == "uptime")
                    ? 95 + _random.NextDouble() * 5  // Uptime should be high
                    : baseValue + (_random.NextDouble() - 0.5) * baseValue * 0.4; // ±20% variation

                dataPoints.Add(new MetricDataPoint
                {
                    Timestamp = now.AddHours(-i),
                    Value = Math.Max(0, variation),
                    Label = $"{24 - i}h ago"
                });
            }

            sparklines[metric] = dataPoints;
        }

        return sparklines;
    }

    public PortalStats GetPortalStats()
    {
        var portals = _mockDataService.GetPortals();

        var byCategory = Enum.GetValues<PortalCategory>()
            .Where(c => c != PortalCategory.All)
            .ToDictionary(
                category => category,
                category => portals.Count(p => p.Category == category)
            );

        var byEnvironment = Enum.GetValues<PortalEnvironment>()
            .ToDictionary(
                env => env,
                env => portals.Count(p => p.Environment == env)
            );

        var byPriority = Enum.GetValues<PortalPriority>()
            .ToDictionary(
                priority => priority,
                priority => portals.Count(p => p.Priority == priority)
            );

        return new PortalStats
        {
            Total = portals.Count,
            Active = portals.Count(p => p.Status == PortalStatus.Active),
            Degraded = portals.Count(p => p.Status == PortalStatus.Degraded),
            Down = portals.Count(p => p.Status == PortalStatus.Down),
            Maintenance = portals.Count(p => p.Status == PortalStatus.Maintenance),
            Unknown = portals.Count(p => p.Status == PortalStatus.Unknown),
            ByCategory = byCategory,
            ByEnvironment = byEnvironment,
            ByPriority = byPriority,
            AverageUptime = portals.Average(p => p.Metrics.Uptime),
            AverageResponseTime = portals.Average(p => p.Metrics.ResponseTime)
        };
    }

    public IncidentStats GetIncidentStats()
    {
        var incidents = _mockDataService.GetIncidents();
        var now = DateTime.UtcNow;

        var bySeverity = Enum.GetValues<IncidentSeverity>()
            .ToDictionary(
                severity => severity,
                severity => incidents.Count(i => i.Severity == severity)
            );

        var byType = Enum.GetValues<IncidentType>()
            .ToDictionary(
                type => type,
                type => incidents.Count(i => i.Type == type)
            );

        return new IncidentStats
        {
            Total = incidents.Count,
            Open = incidents.Count(i => i.Status == IncidentStatus.Open),
            InProgress = incidents.Count(i => i.Status == IncidentStatus.InProgress),
            Resolved = incidents.Count(i => i.Status == IncidentStatus.Resolved),
            Closed = incidents.Count(i => i.Status == IncidentStatus.Closed),
            BySeverity = bySeverity,
            ByType = byType,
            Last24Hours = incidents.Count(i => i.CreatedAt >= now.AddHours(-24)),
            Last7Days = incidents.Count(i => i.CreatedAt >= now.AddDays(-7)),
            AverageMTTR = CalculateAverageMTTR(incidents),
            AverageMTBF = CalculateAverageMTBF(incidents)
        };
    }

    private double CalculateHealthScore(List<Portal> portals, List<Incident> incidents)
    {
        var operationalPercentage = (double)portals.Count(p => p.Status == PortalStatus.Active) / portals.Count;
        var avgUptime = portals.Average(p => p.Metrics.Uptime) / 100;
        var activeIncidentPenalty = Math.Max(0, 1 - (incidents.Count(i => i.Status != IncidentStatus.Resolved) * 0.05));

        return Math.Round((operationalPercentage * 0.4 + avgUptime * 0.4 + activeIncidentPenalty * 0.2) * 100, 2);
    }

    private double CalculateAverageMTTR(List<Incident> incidents)
    {
        var resolvedIncidents = incidents.Where(i => i.Metrics?.Mttr != null).ToList();
        return resolvedIncidents.Any() ? resolvedIncidents.Average(i => i.Metrics!.Mttr!.Value) : 0;
    }

    private double CalculateAverageMTBF(List<Incident> incidents)
    {
        if (incidents.Count < 2) return 10080; // Default to 1 week in minutes

        var sortedIncidents = incidents.OrderBy(i => i.CreatedAt).ToList();
        var intervals = new List<double>();

        for (int i = 1; i < sortedIncidents.Count; i++)
        {
            var interval = (sortedIncidents[i].CreatedAt - sortedIncidents[i - 1].CreatedAt).TotalMinutes;
            intervals.Add(interval);
        }

        return intervals.Any() ? intervals.Average() : 10080;
    }

    private double GetBaseValueForMetric(string metric)
    {
        return metric switch
        {
            "responseTime" => 200 + _random.Next(100),
            "uptime" => 99.5,
            "cpu" => 40 + _random.Next(20),
            "memory" => 50 + _random.Next(20),
            "requests" => 5000 + _random.Next(2000),
            "errors" => 10 + _random.Next(20),
            "throughput" => 500 + _random.Next(200),
            _ => 100
        };
    }
}