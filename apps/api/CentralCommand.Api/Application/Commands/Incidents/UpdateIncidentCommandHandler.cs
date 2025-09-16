using CentralCommand.Core.Domain.Entities;
using CentralCommand.Core.Domain.Enums;
using CentralCommand.Core.DTOs.Responses;
using CentralCommand.Core.Extensions;
using MediatR;
using Microsoft.AspNetCore.SignalR;
using CentralCommand.Api.Hubs;
using Microsoft.Extensions.Logging;
using System.Text;

namespace CentralCommand.Api.Application.Commands.Incidents;

public class UpdateIncidentCommandHandler : IRequestHandler<UpdateIncidentCommand, IncidentResponse>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IHubContext<MetricsHub> _hubContext;
    private readonly ILogger<UpdateIncidentCommandHandler> _logger;

    public UpdateIncidentCommandHandler(
        IUnitOfWork unitOfWork,
        IHubContext<MetricsHub> hubContext,
        ILogger<UpdateIncidentCommandHandler> logger)
    {
        _unitOfWork = unitOfWork;
        _hubContext = hubContext;
        _logger = logger;
    }

    public async Task<IncidentResponse> Handle(UpdateIncidentCommand request, CancellationToken cancellationToken)
    {
        _logger.LogInformation("Updating incident: {Id}", request.Id);

        var incident = await _unitOfWork.Incidents.GetIncidentWithDetailsAsync(request.Id, cancellationToken);
        if (incident == null)
        {
            throw new KeyNotFoundException($"Incident with ID {request.Id} not found.");
        }

        var changes = new StringBuilder();
        var oldStatus = incident.Status;

        // Track changes and update fields
        if (request.Title != null && request.Title != incident.Title)
        {
            changes.AppendLine($"Title changed from '{incident.Title}' to '{request.Title}'");
            incident.Title = request.Title;
        }

        if (request.Description != null && request.Description != incident.Description)
        {
            changes.AppendLine("Description updated");
            incident.Description = request.Description;
        }

        if (request.Status.HasValue && request.Status.Value != incident.Status)
        {
            changes.AppendLine($"Status changed from '{incident.Status}' to '{request.Status.Value}'");
            incident.Status = request.Status.Value;

            if (request.Status.Value == IncidentStatus.Resolved || request.Status.Value == IncidentStatus.Closed)
            {
                incident.ResolvedAt = DateTime.UtcNow;
            }
        }

        if (request.Priority.HasValue && request.Priority.Value != incident.Priority)
        {
            changes.AppendLine($"Priority changed from '{incident.Priority}' to '{request.Priority.Value}'");
            incident.Priority = request.Priority.Value;
        }

        if (request.Type.HasValue && request.Type.Value != incident.Type)
        {
            changes.AppendLine($"Type changed from '{incident.Type}' to '{request.Type.Value}'");
            incident.Type = request.Type.Value;
        }

        if (request.AssignedTo != null && request.AssignedTo != incident.AssignedTo)
        {
            changes.AppendLine($"Assigned to '{request.AssignedTo}'");
            incident.AssignedTo = request.AssignedTo;
        }

        if (request.Resolution != null)
        {
            incident.Resolution = request.Resolution;
            changes.AppendLine("Resolution added");
        }

        if (request.AffectedPortalIds != null)
        {
            incident.AffectedPortalIds = string.Join(",", request.AffectedPortalIds.Select(id => id.ToString()));
            changes.AppendLine($"Affected portals updated ({request.AffectedPortalIds.Count} portals)");
        }

        if (request.Tags != null)
        {
            incident.Tags = string.Join(",", request.Tags);
            changes.AppendLine("Tags updated");
        }

        incident.UpdatedAt = DateTime.UtcNow;

        // Add timeline entry for the update
        if (changes.Length > 0)
        {
            incident.AddTimelineEntry(
                "Incident updated",
                changes.ToString().TrimEnd(),
                request.UpdatedBy != null ? Guid.Parse(request.UpdatedBy) : Guid.Empty
            );
        }

        await _unitOfWork.Incidents.UpdateAsync(incident, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        // Notify connected clients if status changed
        if (oldStatus != incident.Status)
        {
            await _hubContext.Clients.All.SendAsync(
                "IncidentStatusChanged",
                new { incident.Id, OldStatus = oldStatus, NewStatus = incident.Status },
                cancellationToken);
        }

        _logger.LogInformation("Incident updated successfully: {Id}", incident.Id);

        return incident.ToResponse()!; // Incident is guaranteed to be non-null here
    }
}