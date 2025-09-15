using AutoMapper;
using CentralCommand.Core.DTOs.Responses;
using CentralCommand.Core.Interfaces.Repositories;
using MediatR;
using Microsoft.Extensions.Logging;

namespace CentralCommand.Api.Application.Queries.Portals;

public class GetPortalByIdQueryHandler : IRequestHandler<GetPortalByIdQuery, PortalResponse?>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    private readonly ILogger<GetPortalByIdQueryHandler> _logger;

    public GetPortalByIdQueryHandler(
        IUnitOfWork unitOfWork,
        IMapper mapper,
        ILogger<GetPortalByIdQueryHandler> logger)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
        _logger = logger;
    }

    public async Task<PortalResponse?> Handle(GetPortalByIdQuery request, CancellationToken cancellationToken)
    {
        _logger.LogDebug("Getting portal by ID: {Id}", request.Id);

        var portal = await _unitOfWork.Portals.GetPortalWithDetailsAsync(request.Id, cancellationToken);

        if (portal == null)
        {
            _logger.LogWarning("Portal not found: {Id}", request.Id);
            return null;
        }

        return _mapper.Map<PortalResponse>(portal);
    }
}