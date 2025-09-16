using CentralCommand.Core.Domain.Entities;
using CentralCommand.Core.Domain.Enums;
using CentralCommand.Core.DTOs.Responses;
using CentralCommand.Core.Extensions;
using MediatR;
using Microsoft.AspNetCore.SignalR;
using CentralCommand.Api.Hubs;
using Microsoft.Extensions.Logging;

namespace CentralCommand.Api.Application.Commands.Incidents;

public class CreateIncidentCommandHandler : IRequestHandler<CreateIncidentCommand, IncidentResponse>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IHubContext<MetricsHub> _hubContext;
    private readonly ILogger<CreateIncidentCommandHandler> _logger;

    public CreateIncidentCommandHandler(
        IUnitOfWork unitOfWork,
        IHubContext<MetricsHub> hubContext,
        ILogger<CreateIncidentCommandHandler> logger)
    {
        _unitOfWork = unitOfWork;
        _hubContext = hubContext;
        _logger = logger;
    }

    public async Task<IncidentResponse> Handle(CreateIncidentCommand request, CancellationToken cancellationToken)
    {
        _logger.LogInformation("Creating new incident: {Title}", request.Title);

        var incident = new Incident
        {
            Id = Guid.NewGuid(),
            Title = request.Title,
            Description = request.Description,
            Status = IncidentStatus.Open,
            Priority = request.Priority ?? IncidentPriority.Medium,
            Type = request.Type,
            Severity = request.Severity,
            ReportedBy = request.ReportedBy,
            AssignedTo = request.AssignedTo,
            Assignee = request.Assignee,
            Team = request.Team,
            CreatedAt = DateTime.UtcNow,
            Comments = new List<Comment>()
        };

        // Set the affected portal IDs
        if (request.AffectedPortalIds != null)
            incident.SetAffectedPortalIds(request.AffectedPortalIds);

        // Set the tags
        if (request.Tags != null)
            incident.SetTags(request.Tags);

        // Add initial timeline entry
        incident.AddTimelineEntry(
            "Incident created",
            $"Incident '{request.Title}' was created",
            request.ReportedBy ?? Guid.Empty
        );

        await _unitOfWork.Incidents.AddAsync(incident, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        // Notify connected clients
        await _hubContext.Clients.All.SendAsync(
            "IncidentCreated",
            new { incident.Id, incident.Title, incident.Status, incident.Priority },
            cancellationToken);

        _logger.LogInformation("Incident created successfully: {Id}", incident.Id);

        return incident.ToResponse();
    }
}