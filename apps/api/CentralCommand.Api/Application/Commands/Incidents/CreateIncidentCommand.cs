using CentralCommand.Core.Domain.Enums;
using CentralCommand.Core.DTOs.Responses;
using MediatR;

namespace CentralCommand.Api.Application.Commands.Incidents;

public record CreateIncidentCommand : IRequest<IncidentResponse>
{
    public string Title { get; init; } = string.Empty;
    public string Description { get; init; } = string.Empty;
    public IncidentPriority Priority { get; init; }
    public IncidentType Type { get; init; }
    public string ReportedBy { get; init; } = string.Empty;
    public string? AssignedTo { get; init; }
    public List<Guid> AffectedPortalIds { get; init; } = new();
    public List<string> Tags { get; init; } = new();
}