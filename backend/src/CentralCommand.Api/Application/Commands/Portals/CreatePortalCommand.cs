using CentralCommand.Core.Domain.Entities;
using CentralCommand.Core.Domain.Enums;
using CentralCommand.Core.Domain.ValueObjects;
using CentralCommand.Core.DTOs.Responses;
using MediatR;

namespace CentralCommand.Api.Application.Commands.Portals;

public record CreatePortalCommand : IRequest<PortalResponse>
{
    public string Name { get; init; } = string.Empty;
    public string Url { get; init; } = string.Empty;
    public string? Description { get; init; }
    public string? Icon { get; init; }
    public PortalCategory Category { get; init; }
    public PortalEnvironment Environment { get; init; }
    public PortalPriority Priority { get; init; }
    public Guid? Owner { get; init; }
    public Guid? Team { get; init; }
    public List<string> Tags { get; init; } = new();
    public PortalConfig? Config { get; init; }
}