using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace CentralCommand.Api.Models.DTOs;

// Pagination DTOs
public record PagedResponse<T>
{
    public List<T> Data { get; init; } = new();
    public PaginationMetadata Pagination { get; init; } = new();
    public ResponseMetadata Metadata { get; init; } = new();
}

public record PaginationMetadata
{
    public int CurrentPage { get; init; }
    public int PageSize { get; init; }
    public int TotalCount { get; init; }
    public int TotalPages { get; init; }
    public bool HasNext { get; init; }
    public bool HasPrevious { get; init; }
}

public record ResponseMetadata
{
    public DateTime Timestamp { get; init; } = DateTime.UtcNow;
    public string Version { get; init; } = "1.0";
    public string? TraceId { get; init; }
    public int? CacheDuration { get; init; }
}

// Statistics DTOs
public record DashboardStatisticsDto
{
    public StatisticsSummaryDto Summary { get; init; } = new();
    public List<PortalDto> TopPerformers { get; init; } = new();
    public List<IncidentDto> RecentIncidents { get; init; } = new();
    public List<AlertDto> Alerts { get; init; } = new();
}

public record StatisticsSummaryDto
{
    public int TotalPortals { get; init; }
    public int ActivePortals { get; init; }
    public int DegradedPortals { get; init; }
    public int DownPortals { get; init; }
    public double AverageUptime { get; init; }
    public double AverageResponseTime { get; init; }
    public long TotalRequests24h { get; init; }
    public long TotalErrors24h { get; init; }
}

public record AlertDto
{
    public Guid Id { get; init; }
    public AlertType Type { get; init; }
    public AlertSeverity Severity { get; init; }
    public string Title { get; init; } = string.Empty;
    public string Message { get; init; } = string.Empty;
    public Guid? PortalId { get; init; }
    public DateTime CreatedAt { get; init; }
    public bool IsAcknowledged { get; init; }
}

public record TrendsDto
{
    public string Period { get; init; } = string.Empty;
    public Dictionary<string, List<TrendDataPoint>> Metrics { get; init; } = new();
}

public record TrendDataPoint
{
    public DateTime Timestamp { get; init; }
    public double Value { get; init; }
    public double? Change { get; init; }
}

// Command Palette DTOs
public record CommandSearchResultDto
{
    public List<CommandResultItem> Results { get; init; } = new();
    public int TotalCount { get; init; }
    public int ExecutionTime { get; init; }
}

public record CommandResultItem
{
    public string Type { get; init; } = string.Empty;
    public string Id { get; init; } = string.Empty;
    public string Title { get; init; } = string.Empty;
    public string? Subtitle { get; init; }
    public string? Icon { get; init; }
    public string Action { get; init; } = string.Empty;
    public Dictionary<string, object>? Metadata { get; init; }
}

public record ExecuteCommandRequest
{
    [Required]
    public string Command { get; init; } = string.Empty;

    public Dictionary<string, object>? Parameters { get; init; }
}

public record CommandExecutionResult
{
    public bool Success { get; init; }
    public string? Message { get; init; }
    public object? Data { get; init; }
    public string? RedirectUrl { get; init; }
}

// User Preference DTOs
public record UserPreferencesDto
{
    public string Theme { get; init; } = "system";
    public string Language { get; init; } = "en-US";
    public string Timezone { get; init; } = "UTC";
    public NotificationPreferences Notifications { get; init; } = new();
    public DashboardPreferences Dashboard { get; init; } = new();
    public List<Guid> Favorites { get; init; } = new();
}

public record NotificationPreferences
{
    public bool Email { get; init; } = true;
    public bool Push { get; init; } = true;
    public bool Desktop { get; init; } = false;
    public List<string> SubscribedEvents { get; init; } = new();
}

public record DashboardPreferences
{
    public string Layout { get; init; } = "grid";
    public int RefreshInterval { get; init; } = 30;
    public string DefaultView { get; init; } = "overview";
    public List<string> VisibleWidgets { get; init; } = new();
    public Dictionary<string, object> WidgetSettings { get; init; } = new();
}

public record UpdatePreferencesRequest
{
    public string? Theme { get; init; }
    public string? Language { get; init; }
    public string? Timezone { get; init; }
    public NotificationPreferences? Notifications { get; init; }
    public DashboardPreferences? Dashboard { get; init; }
}

// Authentication DTOs
public record TokenResponse
{
    public string AccessToken { get; init; } = string.Empty;
    public string RefreshToken { get; init; } = string.Empty;
    public string TokenType { get; init; } = "Bearer";
    public int ExpiresIn { get; init; } = 3600;
    public string? Scope { get; init; }
}

public record RefreshTokenRequest
{
    [Required]
    public string RefreshToken { get; init; } = string.Empty;
}

public record LoginRequest
{
    [Required]
    [EmailAddress]
    public string Email { get; init; } = string.Empty;

    [Required]
    public string Password { get; init; } = string.Empty;
}

// Error Response DTOs
public record ProblemDetailsResponse
{
    public string Type { get; init; } = string.Empty;
    public string Title { get; init; } = string.Empty;
    public int Status { get; init; }
    public string? Detail { get; init; }
    public string? Instance { get; init; }
    public string? TraceId { get; init; }

    [JsonExtensionData]
    public Dictionary<string, object>? Extensions { get; init; }
}

public record ValidationProblemDetailsResponse : ProblemDetailsResponse
{
    public Dictionary<string, List<string>> Errors { get; init; } = new();
}

// Enums
public enum AlertType
{
    System,
    Portal,
    Incident,
    Performance,
    Security
}

public enum AlertSeverity
{
    Info,
    Warning,
    Error,
    Critical
}