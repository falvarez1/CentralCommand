using CentralCommand.Core.DTOs.Responses;
using MediatR;

namespace CentralCommand.Api.Application.Queries.Portals;

public record GetPortalByIdQuery(Guid Id) : IRequest<PortalResponse?>;