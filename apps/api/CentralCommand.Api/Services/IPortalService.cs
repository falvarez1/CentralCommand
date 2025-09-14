using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using CentralCommand.Api.Models.DTOs;

namespace CentralCommand.Api.Services;

public interface IPortalService
{
    // Portal CRUD operations
    Task<PagedResponse<PortalDto>> GetPortalsAsync(PortalQuery query, CancellationToken cancellationToken = default);
    Task<PortalDto?> GetPortalByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<PortalDto> CreatePortalAsync(CreatePortalRequest request, CancellationToken cancellationToken = default);
    Task<PortalDto> UpdatePortalAsync(Guid id, UpdatePortalRequest request, CancellationToken cancellationToken = default);
    Task DeletePortalAsync(Guid id, CancellationToken cancellationToken = default);

    // Metrics operations
    Task<PortalMetricsDto?> GetPortalMetricsAsync(Guid id, CancellationToken cancellationToken = default);
    Task<PortalMetricsHistoryDto> GetPortalMetricsHistoryAsync(
        Guid id,
        DateTime from,
        DateTime to,
        MetricInterval interval = MetricInterval.Hour,
        List<string>? metrics = null,
        CancellationToken cancellationToken = default);
    Task RefreshPortalMetricsAsync(Guid id, CancellationToken cancellationToken = default);
    Task<Dictionary<Guid, PortalMetricsDto>> GetBulkPortalMetricsAsync(
        List<Guid> portalIds,
        CancellationToken cancellationToken = default);

    // User-specific operations
    Task<List<PortalDto>> GetUserPortalsAsync(string userId, CancellationToken cancellationToken = default);
    Task<List<PortalDto>> GetFavoritePortalsAsync(string userId, CancellationToken cancellationToken = default);

    // Health check operations
    Task<bool> CheckPortalHealthAsync(Guid id, CancellationToken cancellationToken = default);
    Task UpdatePortalStatusAsync(Guid id, PortalStatus status, string? reason = null, CancellationToken cancellationToken = default);

    // Search and filter operations
    Task<List<PortalDto>> SearchPortalsAsync(string searchTerm, int limit = 10, CancellationToken cancellationToken = default);
    Task<List<PortalDto>> GetPortalsByEnvironmentAsync(string environment, CancellationToken cancellationToken = default);
    Task<List<PortalDto>> GetPortalsByTagsAsync(List<string> tags, CancellationToken cancellationToken = default);
}

public interface IConnectionManager
{
    Task AddConnectionAsync(string userId, string connectionId);
    Task RemoveConnectionAsync(string userId, string connectionId);
    Task<List<string>> GetUserConnectionsAsync(string userId);
    Task<bool> IsUserConnectedAsync(string userId);
    Task<int> GetTotalConnectionsAsync();
}