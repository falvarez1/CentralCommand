using CentralCommand.Core.DTOs.Responses;
using MediatR;

namespace CentralCommand.Api.Application.Queries.Incidents;

public record GetIncidentByIdQuery(Guid Id) : IRequest<IncidentResponse?>;