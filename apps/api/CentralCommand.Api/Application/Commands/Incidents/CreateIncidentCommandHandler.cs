using AutoMapper;
using CentralCommand.Core.Domain.Entities;
using CentralCommand.Core.Domain.Enums;
using CentralCommand.Core.DTOs.Responses;
using CentralCommand.Core.Interfaces.Repositories;
using MediatR;
using Microsoft.AspNetCore.SignalR;
using CentralCommand.Api.Hubs;
using Microsoft.Extensions.Logging;

namespace CentralCommand.Api.Application.Commands.Incidents;

public class CreateIncidentCommandHandler : IRequestHandler<CreateIncidentCommand, IncidentResponse>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    private readonly IHubContext<MetricsHub> _hubContext;
    private readonly ILogger<CreateIncidentCommandHandler> _logger;

    public CreateIncidentCommandHandler(
        IUnitOfWork unitOfWork,
        IMapper mapper,
        IHubContext<MetricsHub> hubContext,
        ILogger<CreateIncidentCommandHandler> logger)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
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
            Priority = request.Priority,
            Type = request.Type,
            ReportedBy = request.ReportedBy,
            AssignedTo = request.AssignedTo,
            AffectedPortalIds = request.AffectedPortalIds,
            Tags = request.Tags,
            CreatedAt = DateTime.UtcNow,
            Comments = new List<Comment>(),
            Timeline = new List<TimelineEntry>
            {
                new TimelineEntry
                {
                    Id = Guid.NewGuid(),
                    Timestamp = DateTime.UtcNow,
                    Action = "Incident created",
                    User = request.ReportedBy,
                    Details = $"Incident '{request.Title}' was created"
                }
            }
        };

        await _unitOfWork.Incidents.AddAsync(incident, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        // Notify connected clients
        await _hubContext.Clients.All.SendAsync(
            "IncidentCreated",
            new { incident.Id, incident.Title, incident.Status, incident.Priority },
            cancellationToken);

        _logger.LogInformation("Incident created successfully: {Id}", incident.Id);

        return _mapper.Map<IncidentResponse>(incident);
    }
}