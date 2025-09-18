using CentralCommand.Core.Interfaces.Repositories;
using MediatR;

namespace CentralCommand.Api.Application.Commands.Dev;

public class ClearDatabaseCommandHandler : IRequestHandler<ClearDatabaseCommand, ClearDatabaseResponse>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<ClearDatabaseCommandHandler> _logger;

    public ClearDatabaseCommandHandler(
        IUnitOfWork unitOfWork,
        ILogger<ClearDatabaseCommandHandler> logger)
    {
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    public async Task<ClearDatabaseResponse> Handle(
        ClearDatabaseCommand request,
        CancellationToken cancellationToken)
    {
        try
        {
            _logger.LogWarning("Clearing all data from database");

            await _unitOfWork.ExecuteInTransactionAsync(async () =>
            {
                var comments = await _unitOfWork.Comments.GetAllAsync(cancellationToken);
                await _unitOfWork.Comments.RemoveRangeAsync(comments, cancellationToken);

                var metricsHistory = await _unitOfWork.MetricsHistory.GetAllAsync(cancellationToken);
                await _unitOfWork.MetricsHistory.RemoveRangeAsync(metricsHistory, cancellationToken);

                var healthChecks = await _unitOfWork.HealthChecks.GetAllAsync(cancellationToken);
                await _unitOfWork.HealthChecks.RemoveRangeAsync(healthChecks, cancellationToken);

                var incidents = await _unitOfWork.Incidents.GetAllAsync(cancellationToken);
                await _unitOfWork.Incidents.RemoveRangeAsync(incidents, cancellationToken);

                var portals = await _unitOfWork.Portals.GetAllAsync(cancellationToken);
                await _unitOfWork.Portals.RemoveRangeAsync(portals, cancellationToken);

                await _unitOfWork.SaveChangesAsync(cancellationToken);

                return true;
            }, cancellationToken);

            _logger.LogInformation("Database cleared successfully");

            return new ClearDatabaseResponse
            {
                Success = true,
                Message = "Database cleared successfully"
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error clearing database");
            throw;
        }
    }
}