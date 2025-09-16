using CentralCommand.Api.Infrastructure.Data;
using CentralCommand.Core.Domain.Entities;
using CentralCommand.Core.Domain.Enums;
using CentralCommand.Core.Domain.ValueObjects;
using CentralCommand.Core.DTOs.Common;
using CentralCommand.Core.DTOs.Requests;
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

    public async Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var portal = await GetByIdAsync(id, cancellationToken);
        if (portal == null)
        {
            return false;
        }

        await base.RemoveAsync(portal, cancellationToken);
        return true;
    }

    public async Task<Portal?> GetPortalWithDetailsAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _context.Portals
            .Include(p => p.MetricsHistory)
            .Include(p => p.HealthChecks)
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == id, cancellationToken);
    }

    public async Task<PagedResult<Portal>> GetPortalsAsync(PortalQueryRequest query, CancellationToken cancellationToken = default)
    {
        var queryable = _context.Portals.AsQueryable();

        // Apply filters
        if (query.Status.HasValue)
            queryable = queryable.Where(p => p.Status == query.Status.Value);

        if (query.Category.HasValue)
            queryable = queryable.Where(p => p.Category == query.Category.Value);

        if (query.Environment.HasValue)
            queryable = queryable.Where(p => p.Environment == query.Environment.Value);

        if (!string.IsNullOrWhiteSpace(query.SearchTerm))
        {
            var searchTermLower = query.SearchTerm.ToLower();
            queryable = queryable.Where(p =>
                p.Name.ToLower().Contains(searchTermLower) ||
                p.Url.ToLower().Contains(searchTermLower) ||
                (p.Description != null && p.Description.ToLower().Contains(searchTermLower)));
        }

        // Apply sorting
        queryable = query.SortBy?.ToLower() switch
        {
            "name" => query.SortDescending ? queryable.OrderByDescending(p => p.Name) : queryable.OrderBy(p => p.Name),
            "status" => query.SortDescending ? queryable.OrderByDescending(p => p.Status) : queryable.OrderBy(p => p.Status),
            "category" => query.SortDescending ? queryable.OrderByDescending(p => p.Category) : queryable.OrderBy(p => p.Category),
            "updated" => query.SortDescending ? queryable.OrderByDescending(p => p.UpdatedAt) : queryable.OrderBy(p => p.UpdatedAt),
            _ => query.SortDescending ? queryable.OrderByDescending(p => p.CreatedAt) : queryable.OrderBy(p => p.CreatedAt)
        };

        // Get total count
        var totalCount = await queryable.CountAsync(cancellationToken);

        // Apply pagination
        var items = await queryable
            .Skip((query.Page - 1) * query.PageSize)
            .Take(query.PageSize)
            .AsNoTracking()
            .ToListAsync(cancellationToken);

        return new PagedResult<Portal>
        {
            Items = items,
            TotalCount = totalCount,
            Page = query.Page,
            PageSize = query.PageSize
        };
    }

    public async Task<IEnumerable<MetricsHistory>> GetMetricsHistoryAsync(Guid portalId, DateTime from, DateTime to, MetricInterval interval, CancellationToken cancellationToken = default)
    {
        return await _context.MetricsHistory
            .Where(m => m.PortalId == portalId && m.Timestamp >= from && m.Timestamp <= to)
            .OrderBy(m => m.Timestamp)
            .ToListAsync(cancellationToken);
    }

    public async Task SaveMetricsAsync(MetricsHistory metrics, CancellationToken cancellationToken = default)
    {
        await _context.MetricsHistory.AddAsync(metrics, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task<IEnumerable<Portal>> GetUserPortalsAsync(string userId, CancellationToken cancellationToken = default)
    {
        // For now, return all portals accessible to user
        // In a real system, this would filter based on user permissions
        return await _context.Portals
            .AsNoTracking()
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<Portal>> GetFavoritePortalsAsync(string userId, CancellationToken cancellationToken = default)
    {
        // For now, return top portals as favorites
        // In a real system, this would check user favorites
        return await _context.Portals
            .AsNoTracking()
            .Take(5)
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<Portal>> SearchAsync(string searchTerm, int limit, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(searchTerm))
            return await _context.Portals
                .Take(limit)
                .ToListAsync(cancellationToken);

        var searchLower = searchTerm.ToLowerInvariant();
        return await _context.Portals
            .Where(p => p.Name.ToLower().Contains(searchLower) ||
                       (p.Url != null && p.Url.ToLower().Contains(searchLower)) ||
                       (p.Description != null && p.Description.ToLower().Contains(searchLower)))
            .Take(limit)
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<Portal>> GetByEnvironmentAsync(string environment, CancellationToken cancellationToken = default)
    {
        if (Enum.TryParse<PortalEnvironment>(environment, true, out var envEnum))
        {
            return await GetByEnvironmentAsync(envEnum, cancellationToken);
        }

        return Enumerable.Empty<Portal>();
    }

    public async Task<IEnumerable<Portal>> GetByTagsAsync(List<string> tags, CancellationToken cancellationToken = default)
    {
        // For now, return all portals since we don't have a tags column
        // In a real system, this would filter by tags
        return await _context.Portals
            .AsNoTracking()
            .ToListAsync(cancellationToken);
    }

    public async Task<Portal?> GetByUrlAsync(string url, CancellationToken cancellationToken = default)
    {
        return await _context.Portals
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Url == url, cancellationToken);
    }
}