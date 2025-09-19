using CentralCommand.Core.Domain.Entities;
using CentralCommand.Core.Domain.Enums;
using CentralCommand.Core.Domain.ValueObjects;
using CentralCommand.Core.DTOs.Responses;
using MediatR;

namespace CentralCommand.Api.Application.Commands.Portals;

public record UpdatePortalCommand : IRequest<PortalResponse>
{
    public Guid Id { get; init; }
    public string? Name { get; init; }
    public string? Url { get; init; }
    public string? Description { get; init; }
    public string? Icon { get; init; }
    public PortalCategory? Category { get; init; }
    public PortalEnvironment? Environment { get; init; }
    public PortalPriority? Priority { get; init; }
    public Guid? Owner { get; init; }
    public Guid? Team { get; init; }
    public List<string>? Tags { get; init; }
    public PortalConfig? Config { get; init; }
}