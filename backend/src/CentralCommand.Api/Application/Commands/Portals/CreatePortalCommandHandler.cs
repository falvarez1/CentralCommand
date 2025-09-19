using CentralCommand.Core.Domain.Entities;
using CentralCommand.Core.Domain.Enums;
using CentralCommand.Core.Domain.ValueObjects;
using CentralCommand.Core.DTOs.Responses;
using CentralCommand.Core.Extensions;
using MediatR;
using Microsoft.Extensions.Logging;

namespace CentralCommand.Api.Application.Commands.Portals;

public class CreatePortalCommandHandler : IRequestHandler<CreatePortalCommand, PortalResponse>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<CreatePortalCommandHandler> _logger;

    public CreatePortalCommandHandler(
        IUnitOfWork unitOfWork,
        ILogger<CreatePortalCommandHandler> logger)
    {
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    public async Task<PortalResponse> Handle(CreatePortalCommand request, CancellationToken cancellationToken)
    {
        _logger.LogInformation("Creating new portal: {Name}", request.Name);

        var portal = new Portal
        {
            Id = Guid.NewGuid(),
            Name = request.Name,
            Url = request.Url,
            Description = request.Description,
            Icon = request.Icon,
            Category = request.Category,
            Status = PortalStatus.Unknown,
            Environment = request.Environment,
            Priority = request.Priority,
            Owner = request.Owner,
            Team = request.Team,
            Tags = string.Join(",", request.Tags),
            Config = request.Config ?? PortalConfig.Default,
            Metrics = PortalMetrics.Default,
            CreatedAt = DateTime.UtcNow
        };

        await _unitOfWork.Portals.AddAsync(portal, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Portal created successfully: {Id}", portal.Id);

        return portal.ToResponse()!; // Portal is guaranteed to be non-null here
    }
}