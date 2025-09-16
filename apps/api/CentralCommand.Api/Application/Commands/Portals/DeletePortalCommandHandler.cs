using MediatR;
using Microsoft.Extensions.Logging;

namespace CentralCommand.Api.Application.Commands.Portals;

public class DeletePortalCommandHandler : IRequestHandler<DeletePortalCommand, bool>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<DeletePortalCommandHandler> _logger;

    public DeletePortalCommandHandler(
        IUnitOfWork unitOfWork,
        ILogger<DeletePortalCommandHandler> logger)
    {
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    public async Task<bool> Handle(DeletePortalCommand request, CancellationToken cancellationToken)
    {
        _logger.LogInformation("Deleting portal: {Id}", request.Id);

        var portal = await _unitOfWork.Portals.GetByIdAsync(request.Id, cancellationToken);
        if (portal == null)
        {
            _logger.LogWarning("Portal not found: {Id}", request.Id);
            return false;
        }

        await _unitOfWork.Portals.DeleteAsync(portal.Id, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Portal deleted successfully: {Id}", request.Id);

        return true;
    }
}