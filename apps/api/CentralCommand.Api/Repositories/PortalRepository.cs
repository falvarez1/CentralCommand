using CentralCommand.Api.Infrastructure.Data;
using CentralCommand.Core.Domain.Entities;
using CentralCommand.Core.Domain.Enums;
using CentralCommand.Core.Domain.ValueObjects;
using CentralCommand.Core.Interfaces.Repositories;
using Microsoft.EntityFrameworkCore;

namespace CentralCommand.Api.Repositories;

/// <summary>
/// Portal repository implementation
/// </summary>
public class PortalRepository : Repository<Portal>, IPortalRepository
{
    /// <summary>
    /// Initializes a new instance of the PortalRepository
    /// </summary>
    public PortalRepository(ApplicationDbContext context) : base(context)
    {
    }

    /// <inheritdoc />
    public async Task<IEnumerable<Portal>> GetByCategoryAsync(PortalCategory category, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Where(p => p.Category == category)
            .ToListAsync(cancellationToken);
    }

    /// <inheritdoc />
    public async Task<IEnumerable<Portal>> GetByStatusAsync(PortalStatus status, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Where(p => p.Status == status)
            .ToListAsync(cancellationToken);
    }

    /// <inheritdoc />
    public async Task<IEnumerable<Portal>> GetByEnvironmentAsync(PortalEnvironment environment, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Where(p => p.Environment == environment)
            .ToListAsync(cancellationToken);
    }

    /// <inheritdoc />
    public async Task<IEnumerable<Portal>> GetFavoritesAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Where(p => p.IsFavorite && (p.Owner == userId || p.GetMaintainers().Contains(userId)))
            .ToListAsync(cancellationToken);
    }

    /// <inheritdoc />
    public async Task<IEnumerable<Portal>> GetByTeamAsync(Guid teamId, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Where(p => p.Team == teamId)
            .ToListAsync(cancellationToken);
    }

    /// <inheritdoc />
    public async Task<IEnumerable<Portal>> GetByOwnerAsync(Guid ownerId, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Where(p => p.Owner == ownerId)
            .ToListAsync(cancellationToken);
    }

    /// <inheritdoc />
    public async Task<IEnumerable<Portal>> GetPortalsForHealthCheckAsync(DateTime since, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Where(p => p.Config.EnableMonitoring && p.LastChecked < since)
            .OrderBy(p => p.LastChecked)
            .ToListAsync(cancellationToken);
    }

    /// <inheritdoc />
    public async Task<Portal?> GetWithMetricsHistoryAsync(Guid id, int historyCount = 100, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(p => p.MetricsHistory.OrderByDescending(m => m.Timestamp).Take(historyCount))
            .FirstOrDefaultAsync(p => p.Id == id, cancellationToken);
    }

    /// <inheritdoc />
    public async Task<Portal?> GetWithHealthChecksAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(p => p.HealthChecks)
            .FirstOrDefaultAsync(p => p.Id == id, cancellationToken);
    }

    /// <inheritdoc />
    public async Task<IEnumerable<Portal>> SearchAsync(string searchTerm, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(searchTerm))
            return await GetAllAsync(cancellationToken);

        var lowerSearchTerm = searchTerm.ToLower();
        return await _dbSet
            .Where(p => p.Name.ToLower().Contains(lowerSearchTerm) ||
                       p.Url.ToLower().Contains(lowerSearchTerm) ||
                       (p.Description != null && p.Description.ToLower().Contains(lowerSearchTerm)))
            .ToListAsync(cancellationToken);
    }

    /// <inheritdoc />
    public async Task<Dictionary<PortalStatus, int>> GetStatusStatisticsAsync(CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .GroupBy(p => p.Status)
            .Select(g => new { Status = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.Status, x => x.Count, cancellationToken);
    }

    /// <inheritdoc />
    public async Task UpdateMetricsAsync(Guid portalId, PortalMetrics metrics, CancellationToken cancellationToken = default)
    {
        var portal = await GetByIdAsync(portalId, cancellationToken);
        if (portal != null)
        {
            portal.UpdateMetrics(metrics);

            // Add to metrics history
            var metricsHistory = new MetricsHistory
            {
                PortalId = portalId,
                Metrics = metrics,
                Timestamp = DateTime.UtcNow
            };
            await _context.MetricsHistory.AddAsync(metricsHistory, cancellationToken);

            await UpdateAsync(portal, cancellationToken);
        }
    }

    /// <inheritdoc />
    public async Task BatchUpdateStatusAsync(IEnumerable<Guid> portalIds, PortalStatus status, CancellationToken cancellationToken = default)
    {
        var portals = await _dbSet
            .Where(p => portalIds.Contains(p.Id))
            .ToListAsync(cancellationToken);

        foreach (var portal in portals)
        {
            portal.UpdateStatus(status);
        }

        await UpdateRangeAsync(portals, cancellationToken);
    }
}