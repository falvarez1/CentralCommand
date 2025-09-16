using CentralCommand.Core.Domain.Entities;

namespace CentralCommand.Core.Interfaces.Repositories;

/// <summary>
/// Unit of Work pattern interface for managing transactions
/// </summary>
public interface IUnitOfWork : IDisposable
{
    /// <summary>
    /// Gets the portal repository
    /// </summary>
    IPortalRepository Portals { get; }

    /// <summary>
    /// Gets the incident repository
    /// </summary>
    IIncidentRepository Incidents { get; }

    /// <summary>
    /// Gets the comment repository
    /// </summary>
    IRepository<Comment> Comments { get; }

    /// <summary>
    /// Gets the metrics history repository
    /// </summary>
    IRepository<MetricsHistory> MetricsHistory { get; }

    /// <summary>
    /// Gets the health check repository
    /// </summary>
    IRepository<HealthCheck> HealthChecks { get; }

    /// <summary>
    /// Commits all changes to the database
    /// </summary>
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Begins a new transaction
    /// </summary>
    Task BeginTransactionAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Commits the current transaction
    /// </summary>
    Task CommitTransactionAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Rolls back the current transaction
    /// </summary>
    Task RollbackTransactionAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Executes a callback within a transaction
    /// </summary>
    Task<T> ExecuteInTransactionAsync<T>(Func<Task<T>> operation, CancellationToken cancellationToken = default);
}