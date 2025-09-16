using CentralCommand.Core.Domain.Enums;
using CentralCommand.Core.DTOs.Responses;
using CentralCommand.Core.Extensions;
using MediatR;
using Microsoft.Extensions.Logging;

namespace CentralCommand.Api.Application.Commands.Portals;

public class UpdatePortalCommandHandler : IRequestHandler<UpdatePortalCommand, PortalResponse>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<UpdatePortalCommandHandler> _logger;

    public UpdatePortalCommandHandler(
        IUnitOfWork unitOfWork,
        ILogger<UpdatePortalCommandHandler> logger)
    {
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    public async Task<PortalResponse> Handle(UpdatePortalCommand request, CancellationToken cancellationToken)
    {
        _logger.LogInformation("Updating portal: {Id}", request.Id);

        var portal = await _unitOfWork.Portals.GetByIdAsync(request.Id, cancellationToken);
        if (portal == null)
        {
            throw new KeyNotFoundException($"Portal with ID {request.Id} not found.");
        }

        // Update only provided fields
        if (request.Name != null)
            portal.Name = request.Name;

        if (request.Url != null)
            portal.Url = request.Url;

        if (request.Description != null)
            portal.Description = request.Description;

        if (request.Icon != null)
            portal.Icon = request.Icon;

        if (request.Category.HasValue)
            portal.Category = request.Category.Value;

        if (request.Environment.HasValue)
            portal.Environment = request.Environment.Value;

        if (request.Priority.HasValue)
            portal.Priority = request.Priority.Value;

        if (request.Owner.HasValue)
            portal.Owner = request.Owner.Value;

        if (request.Team.HasValue)
            portal.Team = request.Team.Value;

        if (request.Tags != null)
            portal.SetTags(request.Tags);

        if (request.Config != null)
            portal.Config = request.Config;

        portal.UpdatedAt = DateTime.UtcNow;

        await _unitOfWork.Portals.UpdateAsync(portal, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Portal updated successfully: {Id}", portal.Id);

        return portal.ToResponse();
    }
}