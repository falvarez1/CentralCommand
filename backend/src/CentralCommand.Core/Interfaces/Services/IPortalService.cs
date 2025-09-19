using CentralCommand.Core.DTOs.Common;
using CentralCommand.Core.DTOs.Requests;
using CentralCommand.Core.DTOs.Responses;

namespace CentralCommand.Core.Interfaces.Services;

/// <summary>
/// Service interface for portal operations
/// </summary>
public interface IPortalService
{
    /// <summary>
    /// Gets a portal by ID
    /// </summary>
    Task<PortalResponse?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets all portals with optional filtering and pagination
    /// </summary>
    Task<PagedResult<PortalSummaryResponse>> GetPortalsAsync(PortalQueryRequest query, CancellationToken cancellationToken = default);

    /// <summary>
    /// Creates a new portal
    /// </summary>
    Task<PortalResponse> CreateAsync(CreatePortalRequest request, Guid userId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Updates an existing portal
    /// </summary>
    Task<PortalResponse?> UpdateAsync(Guid id, UpdatePortalRequest request, Guid userId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Deletes a portal
    /// </summary>
    Task<bool> DeleteAsync(Guid id, Guid userId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Updates portal metrics
    /// </summary>
    Task<bool> UpdateMetricsAsync(Guid id, UpdatePortalMetricsRequest request, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets portal metrics history
    /// </summary>
    Task<PortalMetricsHistoryResponse> GetMetricsHistoryAsync(Guid id, int days = 7, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets portal health check configuration
    /// </summary>
    Task<PortalHealthCheckResponse?> GetHealthCheckAsync(Guid id, CancellationToken cancellationToken = default);

    /// <summary>
    /// Performs batch operations on portals
    /// </summary>
    Task<BatchOperationResult> BatchOperationAsync(BatchPortalOperationRequest request, Guid userId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Toggles favorite status for a portal
    /// </summary>
    Task<bool> ToggleFavoriteAsync(Guid id, Guid userId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets portal statistics
    /// </summary>
    Task<PortalStatsResponse> GetStatisticsAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Exports portals to CSV
    /// </summary>
    Task<byte[]> ExportToCsvAsync(PortalQueryRequest query, CancellationToken cancellationToken = default);

    /// <summary>
    /// Imports portals from CSV
    /// </summary>
    Task<BatchOperationResult> ImportFromCsvAsync(Stream csvStream, Guid userId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Runs health checks for all enabled portals
    /// </summary>
    Task RunHealthChecksAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets portals that need attention (down, degraded, high error rate)
    /// </summary>
    Task<IEnumerable<PortalSummaryResponse>> GetPortalsNeedingAttentionAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets user-specific portals
    /// </summary>
    Task<IEnumerable<PortalSummaryResponse>> GetUserPortalsAsync(string userId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets portal metrics
    /// </summary>
    Task<PortalMetricsResponse> GetPortalMetricsAsync(Guid id, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets portal metrics history
    /// </summary>
    Task<PortalMetricsHistoryResponse> GetPortalMetricsHistoryAsync(Guid id, int days = 7, CancellationToken cancellationToken = default);

    /// <summary>
    /// Refreshes portal metrics
    /// </summary>
    Task<PortalMetricsResponse> RefreshPortalMetricsAsync(Guid id, CancellationToken cancellationToken = default);

    /// <summary>
    /// Searches portals
    /// </summary>
    Task<IEnumerable<PortalSummaryResponse>> SearchPortalsAsync(string query, int limit = 10, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets bulk portal metrics
    /// </summary>
    Task<Dictionary<Guid, PortalMetricsResponse>> GetBulkPortalMetricsAsync(List<Guid> portalIds, CancellationToken cancellationToken = default);
}