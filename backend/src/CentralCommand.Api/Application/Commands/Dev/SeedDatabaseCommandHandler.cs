using CentralCommand.Core.Interfaces.Repositories;
using CentralCommand.Core.Interfaces.Services;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace CentralCommand.Api.Application.Commands.Dev;

public class SeedDatabaseCommandHandler : IRequestHandler<SeedDatabaseCommand, SeedDatabaseResponse>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IDataSeedingService _seedingService;
    private readonly ILogger<SeedDatabaseCommandHandler> _logger;

    public SeedDatabaseCommandHandler(
        IUnitOfWork unitOfWork,
        IDataSeedingService seedingService,
        ILogger<SeedDatabaseCommandHandler> logger)
    {
        _unitOfWork = unitOfWork;
        _seedingService = seedingService;
        _logger = logger;
    }

    public async Task<SeedDatabaseResponse> Handle(
        SeedDatabaseCommand request,
        CancellationToken cancellationToken)
    {
        try
        {
            _logger.LogInformation("Starting database seeding operation");

            await _seedingService.SeedAsync(request.SeedCount, cancellationToken);

            var portalsCount = await _unitOfWork.Portals.CountAsync(null, cancellationToken);
            var incidentsCount = await _unitOfWork.Incidents.CountAsync(null, cancellationToken);
            var healthChecksCount = await _unitOfWork.HealthChecks.CountAsync(null, cancellationToken);
            var metricsHistoryCount = await _unitOfWork.MetricsHistory.CountAsync(null, cancellationToken);

            _logger.LogInformation(
                "Database seeded successfully. Portals: {Portals}, Incidents: {Incidents}",
                portalsCount, incidentsCount);

            return new SeedDatabaseResponse
            {
                PortalsCount = portalsCount,
                IncidentsCount = incidentsCount,
                HealthChecksCount = healthChecksCount,
                MetricsHistoryCount = metricsHistoryCount,
                Message = "Database seeded successfully"
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error seeding database");
            throw;
        }
    }
}