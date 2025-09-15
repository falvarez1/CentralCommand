using CentralCommand.Core.Domain.Entities;
using CentralCommand.Core.Domain.Enums;
using CentralCommand.Core.Domain.ValueObjects;
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
        trends["RequestsPerMinuteTrend"] = CalculateTrend(sortedHistory.Select(h => h.RequestsPerMinute).ToList());

        return trends;
    }

    public PortalMetrics GenerateRandomMetrics(PortalStatus? targetStatus = null)
    {
        var metrics = new PortalMetrics
        {
            LastUpdated = DateTime.UtcNow
        };

        switch (targetStatus)
        {
            case PortalStatus.Healthy:
                metrics.ResponseTime = _random.Next(100, 1000);
                metrics.Uptime = 95 + _random.NextDouble() * 5; // 95-100%
                metrics.ErrorRate = _random.NextDouble() * 2; // 0-2%
                metrics.RequestsPerMinute = _random.Next(100, 1000);
                break;

            case PortalStatus.Warning:
                metrics.ResponseTime = _random.Next(1500, 3000);
                metrics.Uptime = 90 + _random.NextDouble() * 5; // 90-95%
                metrics.ErrorRate = 3 + _random.NextDouble() * 5; // 3-8%
                metrics.RequestsPerMinute = _random.Next(50, 500);
                break;

            case PortalStatus.Degraded:
                metrics.ResponseTime = _random.Next(3000, 7000);
                metrics.Uptime = 70 + _random.NextDouble() * 20; // 70-90%
                metrics.ErrorRate = 10 + _random.NextDouble() * 15; // 10-25%
                metrics.RequestsPerMinute = _random.Next(10, 100);
                break;

            case PortalStatus.Down:
                metrics.ResponseTime = _random.Next(7000, 15000);
                metrics.Uptime = _random.NextDouble() * 50; // 0-50%
                metrics.ErrorRate = 50 + _random.NextDouble() * 50; // 50-100%
                metrics.RequestsPerMinute = 0;
                break;

            default:
                // Random distribution
                metrics.ResponseTime = _random.Next(100, 5000);
                metrics.Uptime = 50 + _random.NextDouble() * 50; // 50-100%
                metrics.ErrorRate = _random.NextDouble() * 20; // 0-20%
                metrics.RequestsPerMinute = _random.Next(0, 1000);
                break;
        }

        metrics.AverageLoadTime = metrics.ResponseTime * 1.2;
        metrics.PeakResponseTime = metrics.ResponseTime * 1.5;

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