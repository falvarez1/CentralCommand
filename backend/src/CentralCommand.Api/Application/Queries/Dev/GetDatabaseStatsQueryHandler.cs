using CentralCommand.Api.Infrastructure.Data;
using CentralCommand.Core.Interfaces.Repositories;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace CentralCommand.Api.Application.Queries.Dev;

public class GetDatabaseStatsQueryHandler : IRequestHandler<GetDatabaseStatsQuery, DatabaseStatsResponse>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ApplicationDbContext _context;
    private readonly ILogger<GetDatabaseStatsQueryHandler> _logger;

    public GetDatabaseStatsQueryHandler(
        IUnitOfWork unitOfWork,
        ApplicationDbContext context,
        ILogger<GetDatabaseStatsQueryHandler> logger)
    {
        _unitOfWork = unitOfWork;
        _context = context;
        _logger = logger;
    }

    public async Task<DatabaseStatsResponse> Handle(
        GetDatabaseStatsQuery request,
        CancellationToken cancellationToken)
    {
        try
        {
            var portals = await _unitOfWork.Portals.GetAllAsync(cancellationToken);
            var incidents = await _unitOfWork.Incidents.GetAllAsync(cancellationToken);
            var healthChecks = await _unitOfWork.HealthChecks.GetAllAsync(cancellationToken);

            var lastPortalCreated = portals.OrderByDescending(p => p.CreatedAt)
                .Select(p => p.CreatedAt)
                .FirstOrDefault();

            var lastIncidentCreated = incidents.OrderByDescending(i => i.CreatedAt)
                .Select(i => i.CreatedAt)
                .FirstOrDefault();

            var lastHealthCheck = healthChecks.OrderByDescending(h => h.LastChecked)
                .Select(h => h.LastChecked ?? DateTime.MinValue)
                .FirstOrDefault();

            return new DatabaseStatsResponse
            {
                Database = new DatabaseStatsResponse.DatabaseInfo
                {
                    Provider = _context.Database.ProviderName ?? string.Empty,
                    CanConnect = await _context.Database.CanConnectAsync(cancellationToken)
                },
                Counts = new DatabaseStatsResponse.EntityCounts
                {
                    Portals = await _unitOfWork.Portals.CountAsync(null, cancellationToken),
                    Incidents = await _unitOfWork.Incidents.CountAsync(null, cancellationToken),
                    HealthChecks = await _unitOfWork.HealthChecks.CountAsync(null, cancellationToken),
                    MetricsHistory = await _unitOfWork.MetricsHistory.CountAsync(null, cancellationToken),
                    Comments = await _unitOfWork.Comments.CountAsync(null, cancellationToken)
                },
                Recent = new DatabaseStatsResponse.RecentActivity
                {
                    LastPortalCreated = lastPortalCreated == default ? null : lastPortalCreated,
                    LastIncidentCreated = lastIncidentCreated == default ? null : lastIncidentCreated,
                    LastHealthCheck = lastHealthCheck == default ? null : lastHealthCheck
                }
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting database stats");
            throw;
        }
    }
}