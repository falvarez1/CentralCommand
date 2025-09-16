using CentralCommand.Core.DTOs.Responses;
using CentralCommand.Core.Extensions;
using MediatR;
using Microsoft.Extensions.Logging;

namespace CentralCommand.Api.Application.Queries.Incidents;

public class GetIncidentByIdQueryHandler : IRequestHandler<GetIncidentByIdQuery, IncidentResponse?>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<GetIncidentByIdQueryHandler> _logger;

    public GetIncidentByIdQueryHandler(
        IUnitOfWork unitOfWork,
        ILogger<GetIncidentByIdQueryHandler> logger)
    {
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    public async Task<IncidentResponse?> Handle(GetIncidentByIdQuery request, CancellationToken cancellationToken)
    {
        _logger.LogDebug("Getting incident by ID: {Id}", request.Id);

        var incident = await _unitOfWork.Incidents.GetIncidentWithDetailsAsync(request.Id, cancellationToken);

        if (incident == null)
        {
            _logger.LogWarning("Incident not found: {Id}", request.Id);
            return null;
        }

        return incident.ToResponse();
    }
}