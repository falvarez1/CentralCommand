using CentralCommand.Core.Domain.Enums;
using CentralCommand.Core.DTOs.Common;
using CentralCommand.Core.DTOs.Responses;
using MediatR;

namespace CentralCommand.Api.Application.Queries.Incidents;

public record GetIncidentsQuery : IRequest<PagedResult<IncidentResponse>>
{
    public int PageNumber { get; init; } = 1;
    public int PageSize { get; init; } = 20;
    public string? SearchTerm { get; init; }
    public IncidentStatus? Status { get; init; }
    public IncidentPriority? Priority { get; init; }
    public IncidentType? Type { get; init; }
    public Guid? PortalId { get; init; }
    public string? AssignedTo { get; init; }
    public DateTime? StartDate { get; init; }
    public DateTime? EndDate { get; init; }
    public string? SortBy { get; init; }
    public bool SortDescending { get; init; } = true;
}