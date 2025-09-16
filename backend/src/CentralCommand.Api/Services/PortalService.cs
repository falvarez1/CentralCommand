using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using CentralCommand.Api.Infrastructure.Caching;
using CentralCommand.Api.Infrastructure.Exceptions;
using CentralCommand.Api.Infrastructure.Services;
using CentralCommand.Core.DTOs.Common;
using CentralCommand.Core.DTOs.Requests;
using CentralCommand.Core.DTOs.Responses;
using CentralCommand.Core.Domain.Enums;
using CentralCommand.Core.Domain.Entities;
using CentralCommand.Core.Domain.Events;
using CentralCommand.Core.Domain.ValueObjects;
using CentralCommand.Core.Extensions;
using CentralCommand.Core.Interfaces.Services;
using CentralCommand.Api.Repositories;
using Microsoft.Extensions.Logging;

namespace CentralCommand.Api.Services;

public class PortalService : IPortalService
{
    private readonly IPortalRepository _repository;
    private readonly ICacheService _cache;
    private readonly IMetricsCollector _metricsCollector;
    private readonly IEventBus _eventBus;
    private readonly ILogger<PortalService> _logger;

    private const string CacheKeyPrefix = "portal";
    private const int DefaultCacheDurationMinutes = 5;

    public PortalService(
        IPortalRepository repository,
        ICacheService cache,
        IMetricsCollector metricsCollector,
        IEventBus eventBus,
        ILogger<PortalService> logger)
    {
        _repository = repository;
        _cache = cache;
        _metricsCollector = metricsCollector;
        _eventBus = eventBus;
        _logger = logger;
    }

    public async Task<PagedResult<PortalSummaryResponse>> GetPortalsAsync(PortalQueryRequest query, CancellationToken cancellationToken = default)
    {
        var cacheKey = $"{CacheKeyPrefix}:list:{query.GetCacheKey()}";

        return await _cache.GetOrCreateAsync(
            cacheKey,
            async () =>
            {
                var result = await _repository.GetPortalsAsync(query, cancellationToken);

                var portalSummaries = result.Items
                    .Select(p => p.ToSummaryResponse())
                    .Where(r => r != null)
                    .Cast<PortalSummaryResponse>()
                    .ToList();

                // Optionally include metrics
                if (query.IncludeMetrics)
                {
                    var portalIds = portalSummaries.Select(p => p.Id).ToList();
                    var metrics = await GetBulkPortalMetricsAsync(portalIds, cancellationToken);

                    foreach (var portal in portalSummaries)
                    {
                        if (metrics.TryGetValue(portal.Id, out var portalMetrics))
                        {
                            // Update summary metrics if needed
                            portal.Uptime = portalMetrics.Uptime;
                            portal.ResponseTime = portalMetrics.ResponseTime;
                        }
                    }
                }

                return new PagedResult<PortalSummaryResponse>
                {
                    Items = portalSummaries,
                    PageNumber = result.PageNumber,
                    PageSize = result.PageSize,
                    TotalCount = result.TotalCount
                };
            },
            TimeSpan.FromMinutes(DefaultCacheDurationMinutes));
    }

    public async Task<PortalResponse?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var cacheKey = $"{CacheKeyPrefix}:{id}";

        return await _cache.GetOrCreateAsync<PortalResponse>(
            cacheKey,
            async () =>
            {
                var portal = await _repository.GetByIdAsync(id, cancellationToken);
                if (portal == null)
                {
                    return null!;
                }

                var dto = portal.ToResponse();
                if (dto == null)
                {
                    return null!;
                }

                // Always include current metrics for single portal retrieval
                var metrics = await GetPortalMetricsAsync(id, cancellationToken);
                // Metrics are already included in the response
                return dto;
            },
            TimeSpan.FromMinutes(DefaultCacheDurationMinutes));
    }

    public async Task<PortalResponse> CreateAsync(CreatePortalRequest request, Guid userId, CancellationToken cancellationToken = default)
    {
        // Validate business rules
        await ValidatePortalUrlUniqueness(request.Url, cancellationToken);

        // Create entity
        var portal = new Portal
        {
            Id = Guid.NewGuid(),
            Name = request.Name,
            Url = request.Url,
            Description = request.Description,
            Environment = request.Environment,
            Category = request.Category,
            Priority = request.Priority,
            AuthType = request.AuthType,
            Status = PortalStatus.Unknown,
            Config = request.Config,
            Icon = request.Icon,
            Color = request.Color,
            IsPublic = request.IsPublic,
            Owner = request.Owner,
            Team = request.Team,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        // Set tags if provided
        if (request.Tags != null)
        {
            portal.SetTags(request.Tags);
        }

        // Set maintainers if provided
        if (request.Maintainers != null)
        {
            portal.SetMaintainers(request.Maintainers);
        }

        // Save to database
        await _repository.AddAsync(portal, cancellationToken);

        // Publish domain event
        await _eventBus.PublishAsync(new PortalCreatedEvent
        {
            PortalId = portal.Id,
            Name = portal.Name,
            Url = portal.Url,
            Environment = portal.Environment.ToString(),
            CreatedAt = portal.CreatedAt
        }, cancellationToken);

        // Invalidate list cache
        await InvalidateListCache();

        // Trigger initial health check
        _ = Task.Run(async () =>
        {
            await Task.Delay(TimeSpan.FromSeconds(5));
            await CheckPortalHealthAsync(portal.Id, CancellationToken.None);
        }, CancellationToken.None);

        _logger.LogInformation("Portal created: {PortalId} - {PortalName}", portal.Id, portal.Name);

        return portal.ToResponse() ?? throw new InvalidOperationException("Failed to map portal to response");
    }

    public async Task<PortalResponse?> UpdateAsync(Guid id, UpdatePortalRequest request, Guid userId, CancellationToken cancellationToken = default)
    {
        var portal = await _repository.GetByIdAsync(id, cancellationToken);

        if (portal == null)
        {
            throw new NotFoundException($"Portal with ID {id} not found");
        }

        // Check ETag for optimistic concurrency
        var currentETag = GenerateETag(portal);
        if (currentETag != request.ETag)
        {
            throw new ConcurrencyException("Portal has been modified by another user");
        }

        // Validate business rules
        if (portal.Url != request.Url)
        {
            await ValidatePortalUrlUniqueness(request.Url, cancellationToken);
        }

        // Update entity using the mapping extension
        portal.UpdateFrom(request);

        // Save changes
        await _repository.UpdateAsync(portal, cancellationToken);

        // Publish event
        await _eventBus.PublishAsync(new PortalUpdatedEvent
        {
            PortalId = portal.Id,
            UpdatedAt = DateTime.UtcNow
        }, cancellationToken);

        // Invalidate cache
        await InvalidatePortalCache(id);

        _logger.LogInformation("Portal updated: {PortalId} - {PortalName}", portal.Id, portal.Name);

        return portal.ToResponse() ?? throw new InvalidOperationException("Failed to map portal to response");
    }

    public async Task<bool> DeleteAsync(Guid id, Guid userId, CancellationToken cancellationToken = default)
    {
        var portal = await _repository.GetByIdAsync(id, cancellationToken);

        if (portal == null)
        {
            throw new NotFoundException($"Portal with ID {id} not found");
        }

        // Soft delete
        portal.IsDeleted = true;
        portal.DeletedAt = DateTime.UtcNow;

        await _repository.UpdateAsync(portal, cancellationToken);

        // Publish event
        await _eventBus.PublishAsync(new PortalDeletedEvent
        {
            PortalId = portal.Id,
            DeletedAt = portal.DeletedAt.Value
        }, cancellationToken);

        // Invalidate cache
        await InvalidatePortalCache(id);
        await InvalidateListCache();

        _logger.LogInformation("Portal deleted: {PortalId} - {PortalName}", portal.Id, portal.Name);

        return true;
    }

    public async Task<PortalMetricsResponse> GetPortalMetricsAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var cacheKey = $"{CacheKeyPrefix}:{id}:metrics";

        return await _cache.GetOrCreateAsync<PortalMetricsResponse>(
            cacheKey,
            async () =>
            {
                var portal = await _repository.GetWithMetricsHistoryAsync(id, 10, cancellationToken);

                if (portal?.Metrics == null)
                {
                    return new PortalMetricsResponse();
                }

                return new PortalMetricsResponse
                {
                    ResponseTime = portal.Metrics.ResponseTime,
                    Uptime = portal.Metrics.Uptime,
                    CpuUsage = portal.Metrics.CpuUsage,
                    MemoryUsage = portal.Metrics.MemoryUsage,
                    RequestsPerMinute = portal.Metrics.RequestsPerMinute,
                    ErrorRate = portal.Metrics.ErrorRate,
                    Timestamp = portal.Metrics.Timestamp
                };
            },
            TimeSpan.FromSeconds(30)); // Short cache for metrics
    }

    public async Task<PortalMetricsHistoryResponse> GetPortalMetricsHistoryAsync(
        Guid id,
        int days = 7,
        CancellationToken cancellationToken = default)
    {
        var to = DateTime.UtcNow;
        var from = to.AddDays(-days);
        var interval = MetricInterval.Hour;
        var cacheKey = $"{CacheKeyPrefix}:{id}:history:{from:yyyyMMddHHmmss}:{to:yyyyMMddHHmmss}:{interval}";

        return await _cache.GetOrCreateAsync(
            cacheKey,
            async () =>
            {
                var historicalMetrics = await _repository.GetMetricsHistoryAsync(id, from, to, interval, cancellationToken);

                return new PortalMetricsHistoryResponse
                {
                    PortalId = id,
                    PortalName = string.Empty, // TODO: Get from portal entity
                    History = historicalMetrics.Select(m => new MetricsDataPoint
                    {
                        Timestamp = m.Timestamp,
                        Metrics = new PortalMetrics
                        {
                            ResponseTime = m.ResponseTime,
                            Uptime = m.Uptime,
                            Cpu = m.Cpu,
                            Memory = m.Memory,
                            Requests = m.RequestsPerMinute,
                            ErrorRate = m.ErrorRate
                        }
                    }).ToList()
                };
            },
            TimeSpan.FromMinutes(15)); // Longer cache for historical data
    }

    public async Task<PortalMetricsResponse> RefreshPortalMetricsAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var portal = await _repository.GetByIdAsync(id, cancellationToken);

        if (portal == null)
        {
            throw new NotFoundException($"Portal with ID {id} not found");
        }

        // Collect fresh metrics
        var metrics = await _metricsCollector.CollectMetricsAsync(portal.Id, cancellationToken);

        if (metrics != null)
        {
            // Save metrics to database
            var metricsHistory = new MetricsHistory
            {
                PortalId = portal.Id,
                Metrics = metrics,
                Timestamp = DateTime.UtcNow
            };
            await _repository.SaveMetricsAsync(metricsHistory, cancellationToken);

            // Invalidate metrics cache
            await _cache.InvalidateAsync($"{CacheKeyPrefix}:{id}:metrics");

            // Publish metrics update event
            await _eventBus.PublishAsync(new PortalMetricsUpdatedEvent
            {
                PortalId = id,
                Metrics = MapMetricsToDto(metrics),
                Timestamp = DateTime.UtcNow
            }, cancellationToken);

            _logger.LogDebug("Metrics refreshed for portal {PortalId}", id);
        }

        // Return the updated metrics
        return await GetPortalMetricsAsync(id, cancellationToken);
    }

    public async Task<Dictionary<Guid, PortalMetricsResponse>> GetBulkPortalMetricsAsync(
        List<Guid> portalIds,
        CancellationToken cancellationToken = default)
    {
        var result = new Dictionary<Guid, PortalMetricsResponse>();

        // Fetch metrics in parallel
        var tasks = portalIds.Select(async id =>
        {
            var metrics = await GetPortalMetricsAsync(id, cancellationToken);
            return (Id: id, Metrics: metrics);
        });

        var metricsResults = await Task.WhenAll(tasks);

        foreach (var (id, metrics) in metricsResults)
        {
            if (metrics != null)
            {
                result[id] = metrics;
            }
        }

        return result;
    }

    public async Task<IEnumerable<PortalSummaryResponse>> GetUserPortalsAsync(string userId, CancellationToken cancellationToken = default)
    {
        var cacheKey = $"user:{userId}:portals";

        return await _cache.GetOrCreateAsync<IEnumerable<PortalSummaryResponse>>(
            cacheKey,
            async () =>
            {
                var portals = await _repository.GetUserPortalsAsync(userId, cancellationToken);
                return portals.Select(p => p.ToSummaryResponse() ?? new PortalSummaryResponse()).ToList();
            },
            TimeSpan.FromMinutes(10));
    }

    public async Task<List<PortalResponse>> GetFavoritePortalsAsync(string userId, CancellationToken cancellationToken = default)
    {
        var cacheKey = $"user:{userId}:favorites";

        return await _cache.GetOrCreateAsync(
            cacheKey,
            async () =>
            {
                var favorites = await _repository.GetFavoritePortalsAsync(userId, cancellationToken);
                return favorites.Select(p => p.ToResponse()).ToList();
            },
            TimeSpan.FromMinutes(10));
    }

    public async Task<bool> CheckPortalHealthAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var portal = await _repository.GetByIdAsync(id, cancellationToken);

        if (portal == null)
        {
            return false;
        }

        try
        {
            var isHealthy = await _metricsCollector.CheckHealthAsync(portal.Url, cancellationToken);

            var newStatus = isHealthy ? PortalStatus.Active : PortalStatus.Down;

            if (portal.Status != newStatus)
            {
                await UpdatePortalStatusAsync(id, newStatus, null, cancellationToken);
            }

            return isHealthy;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking health for portal {PortalId}", id);
            return false;
        }
    }

    public async Task UpdatePortalStatusAsync(Guid id, PortalStatus status, string? reason = null, CancellationToken cancellationToken = default)
    {
        var portal = await _repository.GetByIdAsync(id, cancellationToken);

        if (portal == null)
        {
            throw new NotFoundException($"Portal with ID {id} not found");
        }

        var oldStatus = portal.Status;
        portal.Status = status;
        portal.LastStatusChange = DateTime.UtcNow;
        portal.StatusReason = reason;

        await _repository.UpdateAsync(portal, cancellationToken);

        // Publish status change event
        await _eventBus.PublishAsync(new PortalStatusChangedEvent
        {
            PortalId = id,
            PortalName = portal.Name,
            OldStatus = oldStatus,
            NewStatus = status,
            Reason = reason,
            Timestamp = DateTime.UtcNow
        }, cancellationToken);

        // Invalidate cache
        await InvalidatePortalCache(id);

        _logger.LogInformation("Portal status changed: {PortalId} from {OldStatus} to {NewStatus}",
            id, oldStatus, status);
    }

    public async Task<IEnumerable<PortalSummaryResponse>> SearchPortalsAsync(string query, int limit = 10, CancellationToken cancellationToken = default)
    {
        var portals = await _repository.SearchAsync(query, limit, cancellationToken);
        return portals.Select(p => p.ToSummaryResponse() ?? new PortalSummaryResponse()).ToList();
    }

    public async Task<List<PortalResponse>> GetPortalsByEnvironmentAsync(string environment, CancellationToken cancellationToken = default)
    {
        var portals = await _repository.GetByEnvironmentAsync(environment, cancellationToken);
        return portals.Select(p => p.ToResponse()).ToList();
    }

    public async Task<List<PortalResponse>> GetPortalsByTagsAsync(List<string> tags, CancellationToken cancellationToken = default)
    {
        var portals = await _repository.GetByTagsAsync(tags, cancellationToken);
        return portals.Select(p => p.ToResponse()).ToList();
    }

    // Helper methods
    private async Task ValidatePortalUrlUniqueness(string url, CancellationToken cancellationToken)
    {
        var existing = await _repository.GetByUrlAsync(url, cancellationToken);
        if (existing != null)
        {
            throw new BusinessRuleException($"A portal with URL '{url}' already exists");
        }
    }

    private async Task InvalidatePortalCache(Guid portalId)
    {
        var keys = new[]
        {
            $"{CacheKeyPrefix}:{portalId}",
            $"{CacheKeyPrefix}:{portalId}:metrics",
            $"{CacheKeyPrefix}:{portalId}:history"
        };

        foreach (var key in keys)
        {
            await _cache.InvalidatePrefixAsync(key);
        }
    }

    private async Task InvalidateListCache()
    {
        await _cache.InvalidatePrefixAsync($"{CacheKeyPrefix}:list");
    }

    // MapToDto method removed - use portal.ToResponse() extension method instead

    private static PortalMetricsResponse MapMetricsToDto(PortalMetrics metrics)
    {
        return new PortalMetricsResponse
        {
            ResponseTime = metrics.ResponseTime,
            Uptime = metrics.Uptime,
            CpuUsage = metrics.Cpu,
            MemoryUsage = metrics.Memory,
            RequestsPerMinute = metrics.Requests,
            ErrorRate = metrics.ErrorRate,
            Timestamp = metrics.Timestamp
        };
    }

    private static string GenerateETag(Portal portal)
    {
        var lastModified = portal.LastModifiedAt;
        return $"\"{portal.Id}-{lastModified.Ticks}\"";
    }

    // Additional IPortalService interface implementations

    public async Task<bool> UpdateMetricsAsync(Guid id, UpdatePortalMetricsRequest request, CancellationToken cancellationToken = default)
    {
        var portal = await _repository.GetByIdAsync(id, cancellationToken);
        if (portal == null)
            return false;

        portal.Metrics = request.Metrics;

        await _repository.UpdateAsync(portal, cancellationToken);
        await InvalidatePortalCache(id);

        return true;
    }

    public async Task<PortalMetricsHistoryResponse> GetMetricsHistoryAsync(Guid id, int days = 7, CancellationToken cancellationToken = default)
    {
        return await GetPortalMetricsHistoryAsync(id, days, cancellationToken);
    }

    public async Task<PortalHealthCheckResponse?> GetHealthCheckAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var portal = await _repository.GetByIdAsync(id, cancellationToken);
        if (portal == null)
            return null;

        var isHealthy = await CheckPortalHealthAsync(id, cancellationToken);

        return new PortalHealthCheckResponse
        {
            PortalId = id,
            PortalName = portal.Name,
            IsHealthy = isHealthy,
            Status = portal.Status.ToString(),
            LastChecked = portal.LastChecked,
            ResponseTime = portal.Metrics?.ResponseTime ?? 0,
            Uptime = portal.Metrics?.Uptime ?? 0,
            ErrorRate = portal.Metrics?.ErrorRate ?? 0
        };
    }

    public async Task<BatchOperationResult> BatchOperationAsync(BatchPortalOperationRequest request, Guid userId, CancellationToken cancellationToken = default)
    {
        var result = new BatchOperationResult
        {
            SuccessCount = 0,
            FailureCount = 0,
            Errors = new Dictionary<string, string>()
        };

        foreach (var portalId in request.PortalIds)
        {
            try
            {
                switch (request.Operation)
                {
                    case CentralCommand.Core.DTOs.Requests.BatchOperationType.Delete:
                        await DeleteAsync(portalId, userId, cancellationToken);
                        break;
                    case CentralCommand.Core.DTOs.Requests.BatchOperationType.Update:
                        if (request.UpdateData != null)
                            await UpdateAsync(portalId, request.UpdateData, userId, cancellationToken);
                        break;
                    case CentralCommand.Core.DTOs.Requests.BatchOperationType.EnableMonitoring:
                        await UpdatePortalStatusAsync(portalId, PortalStatus.Active, null, cancellationToken);
                        break;
                    case CentralCommand.Core.DTOs.Requests.BatchOperationType.DisableMonitoring:
                        await UpdatePortalStatusAsync(portalId, PortalStatus.Maintenance, "Monitoring disabled via batch operation", cancellationToken);
                        break;
                }
                result.SuccessCount++;
            }
            catch (Exception ex)
            {
                result.FailureCount++;
                result.Results.Add(new BatchOperationItemResult
                {
                    PortalId = portalId,
                    Success = false,
                    Error = ex.Message
                });
            }
        }

        return result;
    }

    public async Task<bool> ToggleFavoriteAsync(Guid id, Guid userId, CancellationToken cancellationToken = default)
    {
        var portal = await _repository.GetByIdAsync(id, cancellationToken);
        if (portal == null)
            return false;

        portal.IsFavorite = !portal.IsFavorite;
        portal.UpdatedBy = userId;
        portal.UpdatedAt = DateTime.UtcNow;

        await _repository.UpdateAsync(portal, cancellationToken);
        await InvalidatePortalCache(id);

        return true;
    }

    public async Task<PortalStatsResponse> GetStatisticsAsync(CancellationToken cancellationToken = default)
    {
        var portals = await _repository.GetAllAsync(cancellationToken);
        var portalsList = portals.ToList();

        return new PortalStatsResponse
        {
            Total = portalsList.Count,
            Active = portalsList.Count(p => p.Status == PortalStatus.Healthy),
            Degraded = portalsList.Count(p => p.Status == PortalStatus.Degraded),
            Down = portalsList.Count(p => p.Status == PortalStatus.Down),
            Maintenance = portalsList.Count(p => p.Status == PortalStatus.Maintenance),
            Unknown = portalsList.Count(p => p.Status == PortalStatus.Unknown),
            ByCategory = portalsList.GroupBy(p => p.Category).ToDictionary(g => g.Key, g => g.Count()),
            ByEnvironment = portalsList.GroupBy(p => p.Environment).ToDictionary(g => g.Key, g => g.Count()),
            ByPriority = portalsList.GroupBy(p => p.Priority).ToDictionary(g => g.Key, g => g.Count()),
            AverageUptime = portalsList.Any() ? portalsList.Average(p => p.Metrics?.Uptime ?? 0) : 100,
            AverageResponseTime = portalsList.Any() ? portalsList.Average(p => p.Metrics?.ResponseTime ?? 0) : 0
        };
    }

    public async Task<byte[]> ExportToCsvAsync(PortalQueryRequest query, CancellationToken cancellationToken = default)
    {
        var result = await GetPortalsAsync(query, cancellationToken);
        var csvBuilder = new StringBuilder();

        // Header
        csvBuilder.AppendLine("Id,Name,Url,Category,Status,Environment,Priority,Uptime,ResponseTime,LastChecked");

        // Data
        foreach (var portal in result.Items)
        {
            csvBuilder.AppendLine($"{portal.Id},{portal.Name},{portal.Url},{portal.Category},{portal.Status},{portal.Environment},{portal.Priority},{portal.Uptime},{portal.ResponseTime},{portal.LastChecked}");
        }

        return Encoding.UTF8.GetBytes(csvBuilder.ToString());
    }

    public async Task<BatchOperationResult> ImportFromCsvAsync(Stream csvStream, Guid userId, CancellationToken cancellationToken = default)
    {
        var result = new BatchOperationResult
        {
            SuccessCount = 0,
            FailureCount = 0,
            Results = new List<BatchOperationItemResult>()
        };

        using var reader = new StreamReader(csvStream);
        string? line;
        var lineNumber = 0;

        // Skip header
        await reader.ReadLineAsync(cancellationToken);

        while ((line = await reader.ReadLineAsync(cancellationToken)) != null)
        {
            lineNumber++;
            try
            {
                var parts = line.Split(',');
                if (parts.Length >= 4)
                {
                    var request = new CreatePortalRequest
                    {
                        Name = parts[0],
                        Url = parts[1],
                        Category = Enum.Parse<PortalCategory>(parts[2]),
                        Environment = parts.Length > 3 ? Enum.Parse<PortalEnvironment>(parts[3]) : PortalEnvironment.Production
                    };

                    await CreateAsync(request, userId, cancellationToken);
                    result.SuccessCount++;
                }
            }
            catch (Exception ex)
            {
                result.FailureCount++;
                result.Errors[$"Line_{lineNumber}"] = ex.Message;
            }
        }

        return result;
    }

    public async Task RunHealthChecksAsync(CancellationToken cancellationToken = default)
    {
        var portals = await _repository.GetAllAsync(cancellationToken);

        var tasks = portals.Select(portal => Task.Run(async () =>
        {
            try
            {
                await CheckPortalHealthAsync(portal.Id, cancellationToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Health check failed for portal {PortalId}", portal.Id);
            }
        }, cancellationToken));

        await Task.WhenAll(tasks);
    }

    public async Task<IEnumerable<PortalSummaryResponse>> GetPortalsNeedingAttentionAsync(CancellationToken cancellationToken = default)
    {
        var portals = await _repository.GetAllAsync(cancellationToken);

        var needingAttention = portals
            .Where(p =>
                p.Status == PortalStatus.Down ||
                p.Status == PortalStatus.Degraded ||
                (p.Metrics?.ErrorRate ?? 0) > 5 ||
                (p.Metrics?.Uptime ?? 100) < 95)
            .OrderBy(p => p.Priority)
            .ThenBy(p => p.Status);

        return needingAttention.Select(p => p.ToSummaryResponse()!).Where(r => r != null);
    }

}