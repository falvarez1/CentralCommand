using AutoMapper;
using CentralCommand.Core.DTOs.Responses;
using CentralCommand.Core.Interfaces.Repositories;
using MediatR;
using Microsoft.Extensions.Logging;

namespace CentralCommand.Api.Application.Queries.Incidents;

public class GetIncidentByIdQueryHandler : IRequestHandler<GetIncidentByIdQuery, IncidentResponse?>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    private readonly ILogger<GetIncidentByIdQueryHandler> _logger;

    public GetIncidentByIdQueryHandler(
        IUnitOfWork unitOfWork,
        IMapper mapper,
        ILogger<GetIncidentByIdQueryHandler> logger)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
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

        return _mapper.Map<IncidentResponse>(incident);
    }
}