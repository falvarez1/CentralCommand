using CentralCommand.Core.Domain.Entities;
using CentralCommand.Core.Domain.ValueObjects;
using MediatR;

namespace CentralCommand.Api.Application.Commands.Portals;

public record UpdatePortalMetricsCommand : IRequest<bool>
{
    public Guid PortalId { get; init; }
    public PortalMetrics Metrics { get; init; } = null!;
}