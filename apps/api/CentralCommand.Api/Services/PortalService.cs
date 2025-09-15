using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using CentralCommand.Api.Infrastructure.Caching;
using CentralCommand.Api.Infrastructure.Exceptions;
using CentralCommand.Api.Infrastructure.Services;
using CentralCommand.Api.Models.DTOs;
using CentralCommand.Api.Models.Entities;
using CentralCommand.Api.Repositories;
using CentralCommand.Core.Domain.ValueObjects;
using CentralCommand.Core.Interfaces.Repositories;
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

    public async Task<PagedResponse<PortalDto>> GetPortalsAsync(PortalQuery query, CancellationToken cancellationToken = default)
    {
        var cacheKey = $"{CacheKeyPrefix}:list:{query.GetCacheKey()}";

        return await _cache.GetOrCreateAsync(
            cacheKey,
            async () =>
            {
                var result = await _repository.GetPortalsAsync(query, cancellationToken);

                var portalDtos = result.Items.Select(MapToDto).ToList();

                // Optionally include metrics
                if (query.IncludeMetrics)
                {
                    var portalIds = portalDtos.Select(p => p.Id).ToList();
                    var metrics = await GetBulkPortalMetricsAsync(portalIds, cancellationToken);

                    foreach (var portal in portalDtos)
                    {
                        if (metrics.TryGetValue(portal.Id, out var portalMetrics))
                        {
                            portal = portal with { CurrentMetrics = portalMetrics };
                        }
                    }
                }

                return new PagedResponse<PortalDto>
                {
                    Data = portalDtos,
                    Pagination = new PaginationMetadata
                    {
                        CurrentPage = result.CurrentPage,
                        PageSize = result.PageSize,
                        TotalCount = result.TotalCount,
                        TotalPages = result.TotalPages,
                        HasNext = result.HasNext,
                        HasPrevious = result.HasPrevious
                    },
                    Metadata = new ResponseMetadata
                    {
                        CacheDuration = DefaultCacheDurationMinutes * 60
                    }
                };
            },
            new CacheOptions
            {
                AbsoluteExpiration = TimeSpan.FromMinutes(DefaultCacheDurationMinutes),
                SlidingExpiration = TimeSpan.FromMinutes(2)
            });
    }

    public async Task<PortalDto?> GetPortalByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var cacheKey = $"{CacheKeyPrefix}:{id}";

        return await _cache.GetOrCreateAsync(
            cacheKey,
            async () =>
            {
                var portal = await _repository.GetByIdAsync(id, cancellationToken);
                if (portal == null)
                {
                    return null;
                }

                var dto = MapToDto(portal);

                // Always include current metrics for single portal retrieval
                var metrics = await GetPortalMetricsAsync(id, cancellationToken);
                return dto with { CurrentMetrics = metrics };
            },
            new CacheOptions
            {
                AbsoluteExpiration = TimeSpan.FromMinutes(DefaultCacheDurationMinutes)
            });
    }

    public async Task<PortalDto> CreatePortalAsync(CreatePortalRequest request, CancellationToken cancellationToken = default)
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
            Tags = request.Tags,
            Status = PortalStatus.Unknown,
            CreatedAt = DateTime.UtcNow,
            HealthCheckConfiguration = request.HealthCheck != null ? new HealthCheckConfig
            {
                Endpoint = request.HealthCheck.Endpoint,
                IntervalSeconds = request.HealthCheck.IntervalSeconds,
                TimeoutSeconds = request.HealthCheck.TimeoutSeconds,
                Headers = request.HealthCheck.Headers
            } : null
        };

        // Save to database
        await _repository.AddAsync(portal, cancellationToken);

        // Publish domain event
        await _eventBus.PublishAsync(new PortalCreatedEvent
        {
            PortalId = portal.Id,
            Name = portal.Name,
            Url = portal.Url,
            Environment = portal.Environment,
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

        return MapToDto(portal);
    }

    public async Task<PortalDto> UpdatePortalAsync(Guid id, UpdatePortalRequest request, CancellationToken cancellationToken = default)
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

        // Update entity
        portal.Name = request.Name;
        portal.Url = request.Url;
        portal.Description = request.Description;
        portal.Environment = request.Environment;
        portal.Tags = request.Tags;
        portal.LastModifiedAt = DateTime.UtcNow;

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

        return MapToDto(portal);
    }

    public async Task DeletePortalAsync(Guid id, CancellationToken cancellationToken = default)
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
    }

    public async Task<PortalMetricsDto?> GetPortalMetricsAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var cacheKey = $"{CacheKeyPrefix}:{id}:metrics";

        return await _cache.GetOrCreateAsync(
            cacheKey,
            async () =>
            {
                var metrics = await _repository.GetLatestMetricsAsync(id, cancellationToken);

                if (metrics == null)
                {
                    return null;
                }

                // Get sparkline data (last 10 data points)
                var sparklineData = await _repository.GetMetricsSparklineAsync(id, 10, cancellationToken);

                return new PortalMetricsDto
                {
                    ResponseTime = metrics.ResponseTime,
                    Uptime = metrics.Uptime,
                    CpuUsage = metrics.CpuUsage,
                    MemoryUsage = metrics.MemoryUsage,
                    RequestsPerMinute = metrics.RequestsPerMinute,
                    ErrorRate = metrics.ErrorRate,
                    ResponseTimeSparkline = sparklineData.Select(m => m.ResponseTime).ToList(),
                    Timestamp = metrics.Timestamp
                };
            },
            new CacheOptions
            {
                AbsoluteExpiration = TimeSpan.FromSeconds(30) // Short cache for metrics
            });
    }

    public async Task<PortalMetricsHistoryDto> GetPortalMetricsHistoryAsync(
        Guid id,
        DateTime from,
        DateTime to,
        MetricInterval interval = MetricInterval.Hour,
        List<string>? metrics = null,
        CancellationToken cancellationToken = default)
    {
        var cacheKey = $"{CacheKeyPrefix}:{id}:history:{from:yyyyMMddHHmmss}:{to:yyyyMMddHHmmss}:{interval}";

        return await _cache.GetOrCreateAsync(
            cacheKey,
            async () =>
            {
                var historicalMetrics = await _repository.GetMetricsHistoryAsync(id, from, to, interval, cancellationToken);

                return new PortalMetricsHistoryDto
                {
                    PortalId = id,
                    TimeRange = new TimeRangeDto { From = from, To = to },
                    DataPoints = historicalMetrics.Select(m => new MetricsDataPointDto
                    {
                        Timestamp = m.Timestamp,
                        ResponseTime = m.ResponseTime,
                        Uptime = m.Uptime,
                        CpuUsage = m.CpuUsage,
                        MemoryUsage = m.MemoryUsage,
                        RequestsPerMinute = m.RequestsPerMinute,
                        ErrorRate = m.ErrorRate
                    }).ToList()
                };
            },
            new CacheOptions
            {
                AbsoluteExpiration = TimeSpan.FromMinutes(15) // Longer cache for historical data
            });
    }

    public async Task RefreshPortalMetricsAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var portal = await _repository.GetByIdAsync(id, cancellationToken);

        if (portal == null)
        {
            throw new NotFoundException($"Portal with ID {id} not found");
        }

        // Collect fresh metrics
        var metrics = await _metricsCollector.CollectMetricsAsync(portal, cancellationToken);

        if (metrics != null)
        {
            // Save metrics to database
            await _repository.SaveMetricsAsync(metrics, cancellationToken);

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
    }

    public async Task<Dictionary<Guid, PortalMetricsDto>> GetBulkPortalMetricsAsync(
        List<Guid> portalIds,
        CancellationToken cancellationToken = default)
    {
        var result = new Dictionary<Guid, PortalMetricsDto>();

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

    public async Task<List<PortalDto>> GetUserPortalsAsync(string userId, CancellationToken cancellationToken = default)
    {
        var cacheKey = $"user:{userId}:portals";

        return await _cache.GetOrCreateAsync(
            cacheKey,
            async () =>
            {
                var portals = await _repository.GetUserPortalsAsync(userId, cancellationToken);
                return portals.Select(MapToDto).ToList();
            },
            new CacheOptions
            {
                AbsoluteExpiration = TimeSpan.FromMinutes(10)
            });
    }

    public async Task<List<PortalDto>> GetFavoritePortalsAsync(string userId, CancellationToken cancellationToken = default)
    {
        var cacheKey = $"user:{userId}:favorites";

        return await _cache.GetOrCreateAsync(
            cacheKey,
            async () =>
            {
                var favorites = await _repository.GetFavoritePortalsAsync(userId, cancellationToken);
                return favorites.Select(MapToDto).ToList();
            },
            new CacheOptions
            {
                AbsoluteExpiration = TimeSpan.FromMinutes(10)
            });
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
            var isHealthy = await _metricsCollector.CheckHealthAsync(portal, cancellationToken);

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

    public async Task<List<PortalDto>> SearchPortalsAsync(string searchTerm, int limit = 10, CancellationToken cancellationToken = default)
    {
        var portals = await _repository.SearchAsync(searchTerm, limit, cancellationToken);
        return portals.Select(MapToDto).ToList();
    }

    public async Task<List<PortalDto>> GetPortalsByEnvironmentAsync(string environment, CancellationToken cancellationToken = default)
    {
        var portals = await _repository.GetByEnvironmentAsync(environment, cancellationToken);
        return portals.Select(MapToDto).ToList();
    }

    public async Task<List<PortalDto>> GetPortalsByTagsAsync(List<string> tags, CancellationToken cancellationToken = default)
    {
        var portals = await _repository.GetByTagsAsync(tags, cancellationToken);
        return portals.Select(MapToDto).ToList();
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

    private static PortalDto MapToDto(Portal portal)
    {
        return new PortalDto
        {
            Id = portal.Id,
            Name = portal.Name,
            Url = portal.Url,
            Description = portal.Description,
            Status = portal.Status,
            Environment = portal.Environment,
            Tags = portal.Tags,
            CreatedAt = portal.CreatedAt,
            LastModifiedAt = portal.LastModifiedAt,
            ETag = GenerateETag(portal)
        };
    }

    private static PortalMetricsDto MapMetricsToDto(PortalMetrics metrics)
    {
        return new PortalMetricsDto
        {
            ResponseTime = metrics.ResponseTime,
            Uptime = metrics.Uptime,
            CpuUsage = metrics.CpuUsage,
            MemoryUsage = metrics.MemoryUsage,
            RequestsPerMinute = metrics.RequestsPerMinute,
            ErrorRate = metrics.ErrorRate,
            Timestamp = metrics.Timestamp
        };
    }

    private static string GenerateETag(Portal portal)
    {
        var lastModified = portal.LastModifiedAt ?? portal.CreatedAt;
        return $"\"{portal.Id}-{lastModified.Ticks}\"";
    }
}