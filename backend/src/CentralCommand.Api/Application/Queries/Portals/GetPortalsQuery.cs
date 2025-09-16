using CentralCommand.Core.Domain.Enums;
using CentralCommand.Core.DTOs.Common;
using CentralCommand.Core.DTOs.Responses;
using MediatR;

namespace CentralCommand.Api.Application.Queries.Portals;

public record GetPortalsQuery : IRequest<PagedResult<PortalResponse>>
{
    public int PageNumber { get; init; } = 1;
    public int PageSize { get; init; } = 20;
    public string? SearchTerm { get; init; }
    public PortalStatus? Status { get; init; }
    public PortalEnvironment? Environment { get; init; }
    public string? Category { get; init; }
    public string? SortBy { get; init; }
    public bool SortDescending { get; init; } = false;
}