using CentralCommand.Core.Domain.Entities;
using CentralCommand.Core.Domain.Enums;
using CentralCommand.Core.Domain.ValueObjects;
using CentralCommand.Core.DTOs.Common;
using CentralCommand.Core.DTOs.Requests;
using CentralCommand.Core.DTOs.Responses;
using CentralCommand.Core.Interfaces.Repositories;
using CentralCommand.Core.Interfaces.Services;
using Microsoft.Extensions.Logging;

namespace CentralCommand.Api.Services;

public partial class IncidentService : IIncidentService
{
    private readonly IIncidentRepository _repository;

    // Implement missing IIncidentService methods

    public async Task<IncidentResponse?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var incident = await _repository.GetByIdAsync(id, cancellationToken);
        return incident != null ? MapToResponse(incident) : null;
    }

    public async Task<PagedResult<IncidentSummaryResponse>> GetIncidentsAsync(IncidentQueryRequest query, CancellationToken cancellationToken = default)
    {
        var incidents = await _repository.GetPagedAsync(
            query.PageNumber,
            query.PageSize,
            null, // Add filtering logic based on query
            i => i.CreatedAt,
            query.SortDescending,
            cancellationToken);

        return new PagedResult<IncidentSummaryResponse>
        {
            Items = incidents.Items.Select(MapToSummaryResponse).ToList(),
            TotalCount = incidents.TotalCount,
            PageNumber = query.PageNumber,
            PageSize = query.PageSize
        };
    }

    public async Task<IncidentResponse> CreateAsync(CreateIncidentRequest request, Guid userId, CancellationToken cancellationToken = default)
    {
        var incident = new Incident
        {
            Id = Guid.NewGuid(),
            Title = request.Title,
            Description = request.Description,
            Type = request.Type,
            Severity = request.Severity,
            Status = request.Status,
            Priority = MapSeverityToPriority(request.Severity),
            AffectedPortalIds = request.AffectedPortals?.Select(p => Guid.Parse(p)).ToList() ?? new List<Guid>(),
            AffectedServices = request.AffectedServices ?? new List<string>(),
            ImpactedUsers = request.ImpactedUsers ?? 0,
            ReportedBy = userId.ToString(),
            CreatedAt = DateTime.UtcNow,
            CreatedBy = userId
        };

        await _repository.AddAsync(incident, cancellationToken);
        return MapToResponse(incident);
    }

    public async Task<IncidentResponse?> UpdateAsync(Guid id, UpdateIncidentRequest request, Guid userId, CancellationToken cancellationToken = default)
    {
        var incident = await _repository.GetByIdAsync(id, cancellationToken);
        if (incident == null) return null;

        // Update fields
        if (!string.IsNullOrEmpty(request.Title))
            incident.Title = request.Title;
        if (!string.IsNullOrEmpty(request.Description))
            incident.Description = request.Description;
        if (request.Type.HasValue)
            incident.Type = request.Type.Value;
        if (request.Severity.HasValue)
        {
            incident.Severity = request.Severity.Value;
            incident.Priority = MapSeverityToPriority(request.Severity.Value);
        }
        if (request.Status.HasValue)
            incident.Status = request.Status.Value;

        incident.UpdatedAt = DateTime.UtcNow;
        incident.UpdatedBy = userId;

        await _repository.UpdateAsync(incident, cancellationToken);
        return MapToResponse(incident);
    }

    public async Task<bool> DeleteAsync(Guid id, Guid userId, CancellationToken cancellationToken = default)
    {
        await _repository.SoftDeleteAsync(id, userId, cancellationToken);
        return true;
    }

    public async Task<IncidentResponse?> AcknowledgeAsync(Guid id, AcknowledgeIncidentRequest request, Guid userId, CancellationToken cancellationToken = default)
    {
        var incident = await _repository.GetByIdAsync(id, cancellationToken);
        if (incident == null) return null;

        incident.Status = IncidentStatus.Acknowledged;
        incident.AcknowledgedAt = DateTime.UtcNow;
        incident.AcknowledgedBy = userId;
        incident.UpdatedAt = DateTime.UtcNow;
        incident.UpdatedBy = userId;

        await _repository.UpdateAsync(incident, cancellationToken);
        return MapToResponse(incident);
    }

    public async Task<IncidentResponse?> ResolveAsync(Guid id, ResolveIncidentRequest request, Guid userId, CancellationToken cancellationToken = default)
    {
        var incident = await _repository.GetByIdAsync(id, cancellationToken);
        if (incident == null) return null;

        incident.Status = IncidentStatus.Resolved;
        incident.Resolution = request.Resolution;
        incident.RootCause = request.RootCause;
        incident.PostmortemUrl = request.PostmortemUrl;
        incident.ResolvedAt = DateTime.UtcNow;
        incident.ResolvedBy = userId;
        incident.UpdatedAt = DateTime.UtcNow;
        incident.UpdatedBy = userId;

        await _repository.UpdateAsync(incident, cancellationToken);
        return MapToResponse(incident);
    }

    public async Task<IncidentResponse?> CloseAsync(Guid id, Guid userId, CancellationToken cancellationToken = default)
    {
        var incident = await _repository.GetByIdAsync(id, cancellationToken);
        if (incident == null) return null;

        incident.Status = IncidentStatus.Closed;
        incident.ClosedAt = DateTime.UtcNow;
        incident.UpdatedAt = DateTime.UtcNow;
        incident.UpdatedBy = userId;

        await _repository.UpdateAsync(incident, cancellationToken);
        return MapToResponse(incident);
    }

    public async Task<CommentResponse> AddCommentAsync(Guid id, AddIncidentCommentRequest request, Guid userId, CancellationToken cancellationToken = default)
    {
        var incident = await _repository.GetByIdAsync(id, cancellationToken);
        if (incident == null)
            throw new KeyNotFoundException($"Incident with ID {id} not found");

        var comment = new Comment
        {
            Id = Guid.NewGuid(),
            Content = request.Text,
            Author = userId.ToString(),
            IsInternal = request.IsInternal,
            CreatedAt = DateTime.UtcNow
        };

        incident.Comments.Add(comment);
        await _repository.UpdateAsync(incident, cancellationToken);

        return new CommentResponse
        {
            Id = comment.Id,
            Text = comment.Content,
            AuthorId = userId,
            CreatedAt = comment.CreatedAt,
            IsInternal = comment.IsInternal
        };
    }

    public async Task<IEnumerable<CommentResponse>> GetCommentsAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var incident = await _repository.GetByIdAsync(id, cancellationToken);
        if (incident == null) return Enumerable.Empty<CommentResponse>();

        return incident.Comments.Select(c => new CommentResponse
        {
            Id = c.Id,
            Text = c.Content,
            AuthorId = Guid.Parse(c.Author),
            CreatedAt = c.CreatedAt,
            IsInternal = c.IsInternal
        });
    }

    public async Task<bool> DeleteCommentAsync(Guid incidentId, Guid commentId, Guid userId, CancellationToken cancellationToken = default)
    {
        var incident = await _repository.GetByIdAsync(incidentId, cancellationToken);
        if (incident == null) return false;

        var comment = incident.Comments.FirstOrDefault(c => c.Id == commentId);
        if (comment == null) return false;

        incident.Comments.Remove(comment);
        await _repository.UpdateAsync(incident, cancellationToken);
        return true;
    }

    public async Task<IncidentStatsResponse> GetStatisticsAsync(CancellationToken cancellationToken = default)
    {
        var incidents = await _repository.GetAllAsync(cancellationToken);
        var incidentList = incidents.ToList();

        return new IncidentStatsResponse
        {
            TotalIncidents = incidentList.Count,
            OpenIncidents = incidentList.Count(i => i.Status == IncidentStatus.Open),
            AcknowledgedIncidents = incidentList.Count(i => i.Status == IncidentStatus.Acknowledged),
            ResolvedIncidents = incidentList.Count(i => i.Status == IncidentStatus.Resolved),
            ClosedIncidents = incidentList.Count(i => i.Status == IncidentStatus.Closed),
            CriticalIncidents = incidentList.Count(i => i.Severity == IncidentSeverity.Critical),
            HighIncidents = incidentList.Count(i => i.Severity == IncidentSeverity.High),
            MediumIncidents = incidentList.Count(i => i.Severity == IncidentSeverity.Medium),
            LowIncidents = incidentList.Count(i => i.Severity == IncidentSeverity.Low)
        };
    }

    public async Task<IEnumerable<IncidentSummaryResponse>> GetByPortalAsync(Guid portalId, CancellationToken cancellationToken = default)
    {
        var incidents = await _repository.FindAsync(i => i.AffectedPortalIds.Contains(portalId), cancellationToken);
        return incidents.Select(MapToSummaryResponse);
    }

    public async Task<IEnumerable<IncidentSummaryResponse>> GetActiveIncidentsAsync(CancellationToken cancellationToken = default)
    {
        var incidents = await _repository.FindAsync(
            i => i.Status != IncidentStatus.Resolved && i.Status != IncidentStatus.Closed,
            cancellationToken);
        return incidents.Select(MapToSummaryResponse);
    }

    public async Task<IEnumerable<TimelineEntry>> GetTimelineAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var incident = await _repository.GetByIdAsync(id, cancellationToken);
        return incident?.Timeline ?? Enumerable.Empty<TimelineEntry>();
    }

    public async Task<IncidentResponse?> EscalateAsync(Guid id, IncidentSeverity newSeverity, string reason, Guid userId, CancellationToken cancellationToken = default)
    {
        var incident = await _repository.GetByIdAsync(id, cancellationToken);
        if (incident == null) return null;

        incident.Severity = newSeverity;
        incident.Priority = MapSeverityToPriority(newSeverity);
        incident.UpdatedAt = DateTime.UtcNow;
        incident.UpdatedBy = userId;

        // Add timeline entry
        incident.Timeline.Add(new TimelineEntry
        {
            Id = Guid.NewGuid(),
            Timestamp = DateTime.UtcNow,
            Action = "Escalated",
            User = userId.ToString(),
            Details = $"Severity changed to {newSeverity}: {reason}"
        });

        await _repository.UpdateAsync(incident, cancellationToken);
        return MapToResponse(incident);
    }

    public async Task<bool> LinkIncidentsAsync(Guid parentId, Guid childId, Guid userId, CancellationToken cancellationToken = default)
    {
        var parent = await _repository.GetByIdAsync(parentId, cancellationToken);
        var child = await _repository.GetByIdAsync(childId, cancellationToken);

        if (parent == null || child == null) return false;

        parent.RelatedIncidentIds.Add(childId.ToString());
        child.RelatedIncidentIds.Add(parentId.ToString());

        await _repository.UpdateAsync(parent, cancellationToken);
        await _repository.UpdateAsync(child, cancellationToken);

        return true;
    }

    public async Task<byte[]> GenerateReportAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var incident = await _repository.GetByIdAsync(id, cancellationToken);
        if (incident == null) return Array.Empty<byte>();

        // Generate a simple text report
        var report = $@"INCIDENT REPORT
================
ID: {incident.Id}
Title: {incident.Title}
Status: {incident.Status}
Severity: {incident.Severity}
Created: {incident.CreatedAt}
Resolved: {incident.ResolvedAt?.ToString() ?? "Not resolved"}

Description:
{incident.Description}

Resolution:
{incident.Resolution ?? "N/A"}

Root Cause:
{incident.RootCause ?? "N/A"}
";

        return System.Text.Encoding.UTF8.GetBytes(report);
    }

    public async Task SendNotificationsAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var incident = await _repository.GetByIdAsync(id, cancellationToken);
        if (incident == null)
            throw new KeyNotFoundException($"Incident with ID {id} not found");

        // In a real implementation, this would send notifications via email, SMS, etc.
        _logger.LogInformation("Sending notifications for incident {IncidentId}", id);

        await Task.CompletedTask; // Placeholder for actual notification logic
    }

    // Helper methods
    private static IncidentPriority MapSeverityToPriority(IncidentSeverity severity)
    {
        return severity switch
        {
            IncidentSeverity.Critical => IncidentPriority.Critical,
            IncidentSeverity.High => IncidentPriority.High,
            IncidentSeverity.Medium => IncidentPriority.Medium,
            IncidentSeverity.Low => IncidentPriority.Low,
            _ => IncidentPriority.Medium
        };
    }

    private static IncidentResponse MapToResponse(Incident incident)
    {
        return new IncidentResponse
        {
            Id = incident.Id,
            Title = incident.Title,
            Description = incident.Description,
            Type = incident.Type,
            Severity = incident.Severity,
            Status = incident.Status,
            Priority = incident.Priority,
            AffectedPortals = incident.AffectedPortalIds.Select(id => id.ToString()).ToList(),
            AffectedServices = incident.AffectedServices,
            ImpactedUsers = incident.ImpactedUsers,
            CreatedAt = incident.CreatedAt,
            UpdatedAt = incident.UpdatedAt,
            ResolvedAt = incident.ResolvedAt,
            ClosedAt = incident.ClosedAt,
            AcknowledgedAt = incident.AcknowledgedAt,
            Resolution = incident.Resolution,
            RootCause = incident.RootCause,
            PostmortemUrl = incident.PostmortemUrl,
            Comments = incident.Comments.Select(c => new CommentResponse
            {
                Id = c.Id,
                Text = c.Content,
                AuthorId = Guid.Parse(c.Author),
                CreatedAt = c.CreatedAt,
                IsInternal = c.IsInternal
            }).ToList()
        };
    }

    private static IncidentSummaryResponse MapToSummaryResponse(Incident incident)
    {
        return new IncidentSummaryResponse
        {
            Id = incident.Id,
            Title = incident.Title,
            Type = incident.Type,
            Severity = incident.Severity,
            Status = incident.Status,
            Priority = incident.Priority,
            CreatedAt = incident.CreatedAt,
            UpdatedAt = incident.UpdatedAt
        };
    }
}