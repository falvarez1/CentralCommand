using CentralCommand.Core.Domain.Enums;
using CentralCommand.Core.DTOs.Responses;
using MediatR;

namespace CentralCommand.Api.Application.Commands.Incidents;

public record CreateIncidentCommand : IRequest<IncidentResponse>
{
    public string Title { get; init; } = string.Empty;
    public string Description { get; init; } = string.Empty;
    public IncidentPriority? Priority { get; init; }
    public IncidentType Type { get; init; }
    public IncidentSeverity Severity { get; init; }
    public Guid? ReportedBy { get; init; }
    public string? AssignedTo { get; init; }
    public Guid? Assignee { get; init; }
    public Guid? Team { get; init; }
    public List<Guid>? AffectedPortalIds { get; init; }
    public List<string>? Tags { get; init; }
}