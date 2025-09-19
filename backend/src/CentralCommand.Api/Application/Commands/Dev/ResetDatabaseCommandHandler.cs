using CentralCommand.Core.Interfaces.Repositories;
using CentralCommand.Core.Interfaces.Services;
using MediatR;

namespace CentralCommand.Api.Application.Commands.Dev;

public class ResetDatabaseCommandHandler : IRequestHandler<ResetDatabaseCommand, ResetDatabaseResponse>
{
    private readonly IMediator _mediator;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IDataSeedingService _seedingService;
    private readonly ILogger<ResetDatabaseCommandHandler> _logger;

    public ResetDatabaseCommandHandler(
        IMediator mediator,
        IUnitOfWork unitOfWork,
        IDataSeedingService seedingService,
        ILogger<ResetDatabaseCommandHandler> logger)
    {
        _mediator = mediator;
        _unitOfWork = unitOfWork;
        _seedingService = seedingService;
        _logger = logger;
    }

    public async Task<ResetDatabaseResponse> Handle(
        ResetDatabaseCommand request,
        CancellationToken cancellationToken)
    {
        try
        {
            _logger.LogWarning("Resetting database");

            await _mediator.Send(new ClearDatabaseCommand(), cancellationToken);

            await _seedingService.SeedAsync(null, cancellationToken);

            var portalsCount = await _unitOfWork.Portals.CountAsync(null, cancellationToken);
            var incidentsCount = await _unitOfWork.Incidents.CountAsync(null, cancellationToken);
            var healthChecksCount = await _unitOfWork.HealthChecks.CountAsync(null, cancellationToken);
            var metricsHistoryCount = await _unitOfWork.MetricsHistory.CountAsync(null, cancellationToken);

            _logger.LogInformation(
                "Database reset successfully. Portals: {Portals}, Incidents: {Incidents}",
                portalsCount, incidentsCount);

            return new ResetDatabaseResponse
            {
                PortalsCount = portalsCount,
                IncidentsCount = incidentsCount,
                HealthChecksCount = healthChecksCount,
                MetricsHistoryCount = metricsHistoryCount,
                Message = "Database reset successfully"
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error resetting database");
            throw;
        }
    }
}