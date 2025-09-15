using CentralCommand.Core.Domain.Entities;
using CentralCommand.Core.Domain.Enums;

namespace CentralCommand.Core.Interfaces.Repositories;

/// <summary>
/// Repository interface for Incident entities
/// </summary>
public interface IIncidentRepository : IRepository<Incident>
{
    /// <summary>
    /// Gets incidents by status
    /// </summary>
    Task<IEnumerable<Incident>> GetByStatusAsync(IncidentStatus status, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets incidents by severity
    /// </summary>
    Task<IEnumerable<Incident>> GetBySeverityAsync(IncidentSeverity severity, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets incidents by type
    /// </summary>
    Task<IEnumerable<Incident>> GetByTypeAsync(IncidentType type, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets incidents by assignee
    /// </summary>
    Task<IEnumerable<Incident>> GetByAssigneeAsync(Guid assigneeId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets incidents by team
    /// </summary>
    Task<IEnumerable<Incident>> GetByTeamAsync(Guid teamId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets incidents affecting a portal
    /// </summary>
    Task<IEnumerable<Incident>> GetByAffectedPortalAsync(string portalId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets incident with comments
    /// </summary>
    Task<Incident?> GetWithCommentsAsync(Guid id, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets open incidents
    /// </summary>
    Task<IEnumerable<Incident>> GetOpenIncidentsAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets incidents in date range
    /// </summary>
    Task<IEnumerable<Incident>> GetByDateRangeAsync(DateTime startDate, DateTime endDate, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets incident statistics
    /// </summary>
    Task<Dictionary<IncidentStatus, int>> GetStatusStatisticsAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets incident severity statistics
    /// </summary>
    Task<Dictionary<IncidentSeverity, int>> GetSeverityStatisticsAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Calculates mean time to recovery
    /// </summary>
    Task<double> CalculateMTTRAsync(DateTime since, CancellationToken cancellationToken = default);

    /// <summary>
    /// Calculates mean time between failures
    /// </summary>
    Task<double> CalculateMTBFAsync(DateTime since, CancellationToken cancellationToken = default);

    /// <summary>
    /// Searches incidents
    /// </summary>
    Task<IEnumerable<Incident>> SearchAsync(string searchTerm, CancellationToken cancellationToken = default);
}