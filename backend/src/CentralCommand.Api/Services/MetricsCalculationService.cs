using CentralCommand.Core.Domain.Entities;
using CentralCommand.Core.Domain.Enums;
using Microsoft.Extensions.Logging;

namespace CentralCommand.Api.Services;

public interface IMetricsCalculationService
{
    PortalStatus CalculatePortalStatus(PortalMetrics metrics);
    double CalculateHealthScore(PortalMetrics metrics);
    Dictionary<string, double> CalculateTrends(List<MetricsHistory> history);
    PortalMetrics GenerateRandomMetrics(PortalStatus? targetStatus = null);
}

public class MetricsCalculationService : IMetricsCalculationService
{
    private readonly ILogger<MetricsCalculationService> _logger;
    private readonly Random _random = new();

    public MetricsCalculationService(ILogger<MetricsCalculationService> logger)
    {
        _logger = logger;
    }

    public PortalStatus CalculatePortalStatus(PortalMetrics metrics)
    {
        // Critical thresholds
        if (metrics.Uptime < 50 || metrics.ErrorRate > 50)
        {
            return PortalStatus.Down;
        }

        // Degraded performance
        if (metrics.Uptime < 90 || metrics.ErrorRate > 10 || metrics.ResponseTime > 5000)
        {
            return PortalStatus.Degraded;
        }

        // Warning signs
        if (metrics.Uptime < 95 || metrics.ErrorRate > 5 || metrics.ResponseTime > 2000)
        {
            return PortalStatus.Warning;
        }

        // Healthy portal
        if (metrics.Uptime >= 95 && metrics.ErrorRate <= 5 && metrics.ResponseTime <= 2000)
        {
            return PortalStatus.Healthy;
        }

        return PortalStatus.Unknown;
    }

    public double CalculateHealthScore(PortalMetrics metrics)
    {
        // Health score calculation (0-100)
        double score = 100;

        // Uptime impact (40% weight)
        score -= (100 - metrics.Uptime) * 0.4;

        // Error rate impact (30% weight)
        score -= metrics.ErrorRate * 0.3;

        // Response time impact (30% weight)
        if (metrics.ResponseTime > 1000)
        {
            var responseTimePenalty = Math.Min(30, (metrics.ResponseTime - 1000) / 100);
            score -= responseTimePenalty;
        }

        return Math.Max(0, Math.Min(100, score));
    }

    public Dictionary<string, double> CalculateTrends(List<MetricsHistory> history)
    {
        var trends = new Dictionary<string, double>();

        if (history.Count < 2)
        {
            _logger.LogDebug("Insufficient history data for trend calculation");
            return trends;
        }

        // Sort by timestamp
        var sortedHistory = history.OrderBy(h => h.Timestamp).ToList();

        // Calculate trends for each metric
        trends["ResponseTimeTrend"] = CalculateTrend(sortedHistory.Select(h => h.ResponseTime).ToList());
        trends["UptimeTrend"] = CalculateTrend(sortedHistory.Select(h => h.Uptime).ToList());
        trends["ErrorRateTrend"] = CalculateTrend(sortedHistory.Select(h => h.ErrorRate).ToList());
        trends["RequestsPerMinuteTrend"] = CalculateTrend(sortedHistory.Select(h => (double)h.RequestsPerMinute).ToList());

        return trends;
    }

    public PortalMetrics GenerateRandomMetrics(PortalStatus? targetStatus = null)
    {
        int responseTime;
        double uptime;
        double errorRate;
        int requestsPerMinute;

        switch (targetStatus)
        {
            case PortalStatus.Healthy:
                responseTime = _random.Next(100, 1000);
                uptime = 95 + _random.NextDouble() * 5; // 95-100%
                errorRate = _random.NextDouble() * 2; // 0-2%
                requestsPerMinute = _random.Next(100, 1000);
                break;

            case PortalStatus.Warning:
                responseTime = _random.Next(1500, 3000);
                uptime = 90 + _random.NextDouble() * 5; // 90-95%
                errorRate = 3 + _random.NextDouble() * 5; // 3-8%
                requestsPerMinute = _random.Next(50, 500);
                break;

            case PortalStatus.Degraded:
                responseTime = _random.Next(3000, 7000);
                uptime = 70 + _random.NextDouble() * 20; // 70-90%
                errorRate = 10 + _random.NextDouble() * 15; // 10-25%
                requestsPerMinute = _random.Next(10, 100);
                break;

            case PortalStatus.Down:
                responseTime = _random.Next(7000, 15000);
                uptime = _random.NextDouble() * 50; // 0-50%
                errorRate = 50 + _random.NextDouble() * 50; // 50-100%
                requestsPerMinute = 0;
                break;

            default:
                // Random distribution
                responseTime = _random.Next(100, 5000);
                uptime = 50 + _random.NextDouble() * 50; // 50-100%
                errorRate = _random.NextDouble() * 20; // 0-20%
                requestsPerMinute = _random.Next(0, 1000);
                break;
        }

        var metrics = new PortalMetrics
        {
            ResponseTime = responseTime,
            Uptime = uptime,
            ErrorRate = errorRate,
            RequestsPerMinute = requestsPerMinute,
            AverageLoadTime = responseTime * 1.2,
            PeakResponseTime = responseTime * 1.5,
            LastUpdated = DateTime.UtcNow
        };

        return metrics;
    }

    private double CalculateTrend(List<double> values)
    {
        if (values.Count < 2)
            return 0;

        // Simple linear regression to calculate trend
        var n = values.Count;
        var sumX = 0.0;
        var sumY = 0.0;
        var sumXY = 0.0;
        var sumX2 = 0.0;

        for (int i = 0; i < n; i++)
        {
            sumX += i;
            sumY += values[i];
            sumXY += i * values[i];
            sumX2 += i * i;
        }

        var slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);

        // Normalize slope to percentage change
        var avgValue = sumY / n;
        if (avgValue == 0)
            return 0;

        return Math.Round((slope / avgValue) * 100, 2);
    }
}