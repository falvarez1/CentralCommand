using CentralCommand.Core.Domain.Entities;
using CentralCommand.Core.Domain.Enums;

namespace CentralCommand.Core.Interfaces.Repositories;

/// <summary>
/// Repository interface for Portal entities
/// </summary>
public interface IPortalRepository : IRepository<Portal>
{
    /// <summary>
    /// Gets portals by category
    /// </summary>
    Task<IEnumerable<Portal>> GetByCategoryAsync(PortalCategory category, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets portals by status
    /// </summary>
    Task<IEnumerable<Portal>> GetByStatusAsync(PortalStatus status, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets portals by environment
    /// </summary>
    Task<IEnumerable<Portal>> GetByEnvironmentAsync(PortalEnvironment environment, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets favorite portals for a user
    /// </summary>
    Task<IEnumerable<Portal>> GetFavoritesAsync(Guid userId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets portals by team
    /// </summary>
    Task<IEnumerable<Portal>> GetByTeamAsync(Guid teamId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets portals by owner
    /// </summary>
    Task<IEnumerable<Portal>> GetByOwnerAsync(Guid ownerId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets portals that need health checks
    /// </summary>
    Task<IEnumerable<Portal>> GetPortalsForHealthCheckAsync(DateTime since, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets portal with metrics history
    /// </summary>
    Task<Portal?> GetWithMetricsHistoryAsync(Guid id, int historyCount = 100, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets portal with health checks
    /// </summary>
    Task<Portal?> GetWithHealthChecksAsync(Guid id, CancellationToken cancellationToken = default);

    /// <summary>
    /// Searches portals by name or URL
    /// </summary>
    Task<IEnumerable<Portal>> SearchAsync(string searchTerm, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets portal statistics
    /// </summary>
    Task<Dictionary<PortalStatus, int>> GetStatusStatisticsAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Updates portal metrics
    /// </summary>
    Task UpdateMetricsAsync(Guid portalId, Domain.ValueObjects.PortalMetrics metrics, CancellationToken cancellationToken = default);

    /// <summary>
    /// Batch update portal status
    /// </summary>
    Task BatchUpdateStatusAsync(IEnumerable<Guid> portalIds, PortalStatus status, CancellationToken cancellationToken = default);

    /// <summary>
    /// Deletes a portal
    /// </summary>
    Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default);
}