using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace CentralCommand.Api.Models.DTOs;

// Response DTOs
public record IncidentDto
{
    public Guid Id { get; init; }
    public string Title { get; init; } = string.Empty;
    public string Description { get; init; } = string.Empty;
    public IncidentSeverity Severity { get; init; }
    public IncidentStatus Status { get; init; }
    public Guid? PortalId { get; init; }
    public string? PortalName { get; init; }
    public string? AssignedTo { get; init; }
    public string ReportedBy { get; init; } = string.Empty;
    public DateTime CreatedAt { get; init; }
    public DateTime? ResolvedAt { get; init; }
    public TimeSpan? TimeToResolve { get; init; }
    public List<IncidentCommentDto> Comments { get; init; } = new();
    public List<string> Tags { get; init; } = new();
    public string ETag { get; init; } = string.Empty;
}

public record IncidentCommentDto
{
    public Guid Id { get; init; }
    public string Author { get; init; } = string.Empty;
    public string Content { get; init; } = string.Empty;
    public DateTime CreatedAt { get; init; }
    public bool IsSystemGenerated { get; init; }
}

// Request DTOs
public record CreateIncidentRequest
{
    [Required]
    [MaxLength(200)]
    public string Title { get; init; } = string.Empty;

    [Required]
    [MaxLength(2000)]
    public string Description { get; init; } = string.Empty;

    [Required]
    public IncidentSeverity Severity { get; init; }

    public Guid? PortalId { get; init; }
    public string? AssignedTo { get; init; }
    public List<string> Tags { get; init; } = new();
}

public record UpdateIncidentRequest
{
    [Required]
    public string Title { get; init; } = string.Empty;

    [Required]
    public string Description { get; init; } = string.Empty;

    public IncidentSeverity Severity { get; init; }
    public IncidentStatus Status { get; init; }
    public string? AssignedTo { get; init; }

    [Required]
    public string ETag { get; init; } = string.Empty;
}

public record ResolveIncidentRequest
{
    [Required]
    [MaxLength(1000)]
    public string Resolution { get; init; } = string.Empty;

    public string? RootCause { get; init; }
    public List<string> PreventiveMeasures { get; init; } = new();
}

public record AddCommentRequest
{
    [Required]
    [MaxLength(1000)]
    public string Content { get; init; } = string.Empty;
}

// Query Parameters
public record IncidentQuery
{
    public int PageNumber { get; init; } = 1;
    public int PageSize { get; init; } = 20;
    public IncidentSeverity? Severity { get; init; }
    public IncidentStatus? Status { get; init; }
    public Guid? PortalId { get; init; }
    public DateTime? From { get; init; }
    public DateTime? To { get; init; }
    public string? AssignedTo { get; init; }
    public string? Search { get; init; }
}

// Enums
public enum IncidentSeverity
{
    Critical,
    High,
    Medium,
    Low
}

public enum IncidentStatus
{
    Open,
    InProgress,
    Resolved,
    Closed
}