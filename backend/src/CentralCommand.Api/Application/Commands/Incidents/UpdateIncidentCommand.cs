using CentralCommand.Core.Domain.Enums;
using CentralCommand.Core.DTOs.Responses;
using MediatR;

namespace CentralCommand.Api.Application.Commands.Incidents;

public record UpdateIncidentCommand : IRequest<IncidentResponse>
{
    public Guid Id { get; init; }
    public string? Title { get; init; }
    public string? Description { get; init; }
    public IncidentStatus? Status { get; init; }
    public IncidentPriority? Priority { get; init; }
    public IncidentType? Type { get; init; }
    public string? AssignedTo { get; init; }
    public string? Resolution { get; init; }
    public List<Guid>? AffectedPortalIds { get; init; }
    public List<string>? Tags { get; init; }
    public string UpdatedBy { get; init; } = string.Empty;
}