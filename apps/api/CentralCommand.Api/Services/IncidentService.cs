using CentralCommand.Core.Domain.Entities;
using CentralCommand.Core.Domain.Enums;
using CentralCommand.Core.Domain.ValueObjects;
using CentralCommand.Core.Interfaces.Services;
using Microsoft.Extensions.Logging;
using System.Text.Json;

namespace CentralCommand.Api.Services;

public partial class IncidentService : IIncidentService
{
    private readonly IUnitOfWork _unitOfWork = null!;
    private readonly INotificationService _notificationService;
    private readonly ILogger<IncidentService> _logger;

    public IncidentService(
        IUnitOfWork unitOfWork,
        INotificationService notificationService,
        ILogger<IncidentService> logger)
    {
        _unitOfWork = unitOfWork;
        _notificationService = notificationService;
        _logger = logger;
    }

    public async Task<Incident> CreateIncidentAsync(
        string title,
        string description,
        IncidentPriority priority,
        IncidentType type,
        Guid? reportedBy,
        List<Guid> affectedPortalIds,
        CancellationToken cancellationToken = default)
    {
        var incident = new Incident
        {
            Id = Guid.NewGuid(),
            Title = title,
            Description = description,
            Status = IncidentStatus.Open,
            Priority = priority,
            Type = type,
            ReportedBy = reportedBy,
            AffectedPortalIds = affectedPortalIds != null ? System.Text.Json.JsonSerializer.Serialize(affectedPortalIds) : null,
            CreatedAt = DateTime.UtcNow,
            Timeline = System.Text.Json.JsonSerializer.Serialize(new List<TimelineEntry>
            {
                new TimelineEntry
                {
                    Id = Guid.NewGuid(),
                    Timestamp = DateTime.UtcNow,
                    Action = "Incident created",
                    User = reportedBy?.ToString() ?? "System",
                    Description = $"Incident '{title}' was created"
                }
            })
        };

        await _unitOfWork.Incidents.AddAsync(incident, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        // Send notifications for high priority incidents
        if (priority == IncidentPriority.Critical || priority == IncidentPriority.High)
        {
            await _notificationService.SendIncidentNotificationAsync(incident, "created", cancellationToken);
        }

        _logger.LogInformation("Incident created: {IncidentId} - {Title}", incident.Id, title);

        return incident;
    }

    public async Task<Incident?> UpdateIncidentStatusAsync(
        Guid incidentId,
        IncidentStatus newStatus,
        string updatedBy,
        string? resolution = null,
        CancellationToken cancellationToken = default)
    {
        var incident = await _unitOfWork.Incidents.GetIncidentWithDetailsAsync(incidentId, cancellationToken);
        if (incident == null)
        {
            _logger.LogWarning("Incident not found: {IncidentId}", incidentId);
            return null;
        }

        var oldStatus = incident.Status;
        incident.Status = newStatus;
        incident.UpdatedAt = DateTime.UtcNow;

        if (newStatus == IncidentStatus.Resolved || newStatus == IncidentStatus.Closed)
        {
            incident.ResolvedAt = DateTime.UtcNow;
            incident.Resolution = resolution;
        }

        // Add timeline entry
        var timeline = string.IsNullOrEmpty(incident.Timeline)
            ? new List<TimelineEntry>()
            : JsonSerializer.Deserialize<List<TimelineEntry>>(incident.Timeline) ?? new List<TimelineEntry>();

        timeline.Add(new TimelineEntry
        {
            Id = Guid.NewGuid(),
            Timestamp = DateTime.UtcNow,
            Action = $"Status changed from {oldStatus} to {newStatus}",
            User = updatedBy ?? "System",
            Description = resolution ?? string.Empty
        });

        incident.Timeline = JsonSerializer.Serialize(timeline);

        await _unitOfWork.Incidents.UpdateAsync(incident, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        // Send notification for status changes
        await _notificationService.SendIncidentNotificationAsync(incident, "status_changed", cancellationToken);

        _logger.LogInformation("Incident status updated: {IncidentId} from {OldStatus} to {NewStatus}",
            incidentId, oldStatus, newStatus);

        return incident;
    }

    public async Task<Incident?> AssignIncidentAsync(
        Guid incidentId,
        string assignedTo,
        string assignedBy,
        CancellationToken cancellationToken = default)
    {
        var incident = await _unitOfWork.Incidents.GetByIdAsync(incidentId, cancellationToken);
        if (incident == null)
        {
            _logger.LogWarning("Incident not found: {IncidentId}", incidentId);
            return null;
        }

        var previousAssignee = incident.AssignedTo;
        incident.AssignedTo = assignedTo;
        incident.UpdatedAt = DateTime.UtcNow;

        // Add timeline entry
        var timeline = string.IsNullOrEmpty(incident.Timeline)
            ? new List<TimelineEntry>()
            : JsonSerializer.Deserialize<List<TimelineEntry>>(incident.Timeline) ?? new List<TimelineEntry>();

        timeline.Add(new TimelineEntry
        {
            Id = Guid.NewGuid(),
            Timestamp = DateTime.UtcNow,
            Action = "Incident assigned",
            User = assignedBy,
            Description = $"Assigned to {assignedTo}" + (previousAssignee != null ? $" (was: {previousAssignee})" : "")
        });

        incident.Timeline = JsonSerializer.Serialize(timeline);

        await _unitOfWork.Incidents.UpdateAsync(incident, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Incident assigned: {IncidentId} to {AssignedTo}", incidentId, assignedTo);

        return incident;
    }

    public async Task<Comment> AddCommentAsync(
        Guid incidentId,
        string content,
        string author,
        bool isInternal = false,
        CancellationToken cancellationToken = default)
    {
        var comment = new Comment
        {
            Id = Guid.NewGuid(),
            Content = content,
            AuthorName = author ?? "System",
            Author = Guid.Empty, // In a real implementation, this would be the user's GUID
            CreatedAt = DateTime.UtcNow,
            IsInternal = isInternal
        };

        await _unitOfWork.Incidents.AddCommentAsync(incidentId, comment, cancellationToken);

        // Add timeline entry
        var timelineEntry = new TimelineEntry
        {
            Id = Guid.NewGuid(),
            Timestamp = DateTime.UtcNow,
            Action = isInternal ? "Internal comment added" : "Comment added",
            User = author,
            Description = content.Length > 100 ? $"{content.Substring(0, 100)}..." : content
        };

        await _unitOfWork.Incidents.AddTimelineEntryAsync(incidentId, timelineEntry, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Comment added to incident: {IncidentId}", incidentId);

        return comment;
    }


    public async Task<IEnumerable<Incident>> GetIncidentsByPortalAsync(Guid portalId, CancellationToken cancellationToken = default)
    {
        return await _unitOfWork.Incidents.GetIncidentsByPortalAsync(portalId, cancellationToken);
    }

    public async Task<Dictionary<IncidentPriority, int>> GetIncidentStatisticsAsync(CancellationToken cancellationToken = default)
    {
        return await _unitOfWork.Incidents.GetIncidentCountByPriorityAsync(cancellationToken);
    }

    public async Task EscalateIncidentAsync(Guid incidentId, string escalatedBy, CancellationToken cancellationToken = default)
    {
        var incident = await _unitOfWork.Incidents.GetByIdAsync(incidentId, cancellationToken);
        if (incident == null)
        {
            _logger.LogWarning("Incident not found: {IncidentId}", incidentId);
            return;
        }

        // Increase priority if not already critical
        if (incident.Priority != IncidentPriority.Critical)
        {
            var oldPriority = incident.Priority;
            incident.Priority = incident.Priority switch
            {
                IncidentPriority.Low => IncidentPriority.Medium,
                IncidentPriority.Medium => IncidentPriority.High,
                IncidentPriority.High => IncidentPriority.Critical,
                _ => IncidentPriority.Critical
            };

            incident.UpdatedAt = DateTime.UtcNow;

            // Add timeline entry
            var timeline = string.IsNullOrEmpty(incident.Timeline)
                ? new List<TimelineEntry>()
                : JsonSerializer.Deserialize<List<TimelineEntry>>(incident.Timeline) ?? new List<TimelineEntry>();

            timeline.Add(new TimelineEntry
            {
                Id = Guid.NewGuid(),
                Timestamp = DateTime.UtcNow,
                Action = "Incident escalated",
                User = escalatedBy,
                Description = $"Priority increased from {oldPriority} to {incident.Priority}"
            });

            incident.Timeline = JsonSerializer.Serialize(timeline);

            await _unitOfWork.Incidents.UpdateAsync(incident, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            // Send escalation notification
            await _notificationService.SendIncidentNotificationAsync(incident, "escalated", cancellationToken);

            _logger.LogInformation("Incident escalated: {IncidentId} from {OldPriority} to {NewPriority}",
                incidentId, oldPriority, incident.Priority);
        }
    }
}