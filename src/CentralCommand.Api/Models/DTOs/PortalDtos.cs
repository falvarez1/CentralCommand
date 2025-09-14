using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace CentralCommand.Api.Models.DTOs;

// Response DTOs
public record PortalDto
{
    public Guid Id { get; init; }
    public string Name { get; init; } = string.Empty;
    public string Url { get; init; } = string.Empty;
    public string Description { get; init; } = string.Empty;
    public PortalStatus Status { get; init; }
    public string Environment { get; init; } = string.Empty;
    public List<string> Tags { get; init; } = new();
    public PortalMetricsDto? CurrentMetrics { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime? LastModifiedAt { get; init; }
    public string ETag { get; init; } = string.Empty; // For optimistic concurrency
}

public record PortalMetricsDto
{
    public double ResponseTime { get; init; }
    public double Uptime { get; init; }
    public double CpuUsage { get; init; }
    public double MemoryUsage { get; init; }
    public int RequestsPerMinute { get; init; }
    public double ErrorRate { get; init; }
    public List<double> ResponseTimeSparkline { get; init; } = new();
    public DateTime Timestamp { get; init; }
}

public record PortalMetricsHistoryDto
{
    public Guid PortalId { get; init; }
    public TimeRangeDto TimeRange { get; init; } = new();
    public List<MetricsDataPointDto> DataPoints { get; init; } = new();
}

public record TimeRangeDto
{
    public DateTime From { get; init; }
    public DateTime To { get; init; }
}

public record MetricsDataPointDto
{
    public DateTime Timestamp { get; init; }
    public double ResponseTime { get; init; }
    public double Uptime { get; init; }
    public double CpuUsage { get; init; }
    public double MemoryUsage { get; init; }
    public int RequestsPerMinute { get; init; }
    public double ErrorRate { get; init; }
}

// Request DTOs
public record CreatePortalRequest
{
    [Required]
    [MaxLength(100)]
    public string Name { get; init; } = string.Empty;

    [Required]
    [Url]
    public string Url { get; init; } = string.Empty;

    [MaxLength(500)]
    public string Description { get; init; } = string.Empty;

    [Required]
    public string Environment { get; init; } = string.Empty;

    public List<string> Tags { get; init; } = new();

    public HealthCheckConfiguration? HealthCheck { get; init; }
}

public record UpdatePortalRequest
{
    [Required]
    [MaxLength(100)]
    public string Name { get; init; } = string.Empty;

    [Required]
    [Url]
    public string Url { get; init; } = string.Empty;

    [MaxLength(500)]
    public string Description { get; init; } = string.Empty;

    public string Environment { get; init; } = string.Empty;

    public List<string> Tags { get; init; } = new();

    [Required]
    public string ETag { get; init; } = string.Empty; // For optimistic concurrency
}

public record HealthCheckConfiguration
{
    public string Endpoint { get; init; } = "/health";
    public int IntervalSeconds { get; init; } = 30;
    public int TimeoutSeconds { get; init; } = 10;
    public Dictionary<string, string> Headers { get; init; } = new();
}

// Query Parameters
public record PortalQuery
{
    public int PageNumber { get; init; } = 1;
    public int PageSize { get; init; } = 20;
    public string? Search { get; init; }
    public PortalStatus? Status { get; init; }
    public List<string> Tags { get; init; } = new();
    public string SortBy { get; init; } = "name";
    public SortOrder SortOrder { get; init; } = SortOrder.Asc;
    public bool IncludeMetrics { get; init; } = false;

    public string GetCacheKey()
    {
        var key = $"{PageNumber}_{PageSize}_{Search}_{Status}_{SortBy}_{SortOrder}_{IncludeMetrics}";
        if (Tags.Any())
        {
            key += "_" + string.Join(",", Tags);
        }
        return key;
    }
}

// Enums
public enum PortalStatus
{
    Active,
    Degraded,
    Down,
    Maintenance,
    Unknown
}

public enum SortOrder
{
    Asc,
    Desc
}

public enum MetricInterval
{
    Minute,
    Hour,
    Day
}