using MediatR;

namespace CentralCommand.Api.Application.Commands.Portals;

public record DeletePortalCommand(Guid Id) : IRequest<bool>;