using System.Text.Json;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;

namespace CentralCommand.Api.Infrastructure.Caching;

/// <summary>
/// Hybrid cache service that combines in-memory and distributed caching
/// </summary>
public class HybridCacheService : ICacheService
{
    private readonly IMemoryCache _memoryCache;
    private readonly IDistributedCache _distributedCache;
    private readonly ILogger<HybridCacheService> _logger;
    private readonly JsonSerializerOptions _jsonOptions;

    public HybridCacheService(
        IMemoryCache memoryCache,
        IDistributedCache distributedCache,
        ILogger<HybridCacheService> logger)
    {
        _memoryCache = memoryCache;
        _distributedCache = distributedCache;
        _logger = logger;
        _jsonOptions = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            WriteIndented = false
        };
    }

    public async Task<T?> GetAsync<T>(string key, CancellationToken cancellationToken = default) where T : class
    {
        // Try memory cache first
        if (_memoryCache.TryGetValue<T>(key, out var cachedValue))
        {
            _logger.LogDebug("Cache hit (memory) for key: {Key}", key);
            return cachedValue;
        }

        // Try distributed cache
        try
        {
            var distributedData = await _distributedCache.GetStringAsync(key, cancellationToken);
            if (!string.IsNullOrEmpty(distributedData))
            {
                var value = JsonSerializer.Deserialize<T>(distributedData, _jsonOptions);

                // Store in memory cache for faster subsequent access
                _memoryCache.Set(key, value, TimeSpan.FromMinutes(5));

                _logger.LogDebug("Cache hit (distributed) for key: {Key}", key);
                return value;
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error retrieving from distributed cache for key: {Key}", key);
        }

        _logger.LogDebug("Cache miss for key: {Key}", key);
        return default;
    }

    public async Task SetAsync<T>(string key, T value, TimeSpan? expiration = null, CancellationToken cancellationToken = default) where T : class
    {
        var effectiveExpiration = expiration ?? TimeSpan.FromMinutes(30);

        // Set in memory cache
        _memoryCache.Set(key, value, effectiveExpiration);

        // Set in distributed cache
        try
        {
            var serialized = JsonSerializer.Serialize(value, _jsonOptions);
            var options = new DistributedCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = effectiveExpiration
            };

            await _distributedCache.SetStringAsync(key, serialized, options, cancellationToken);
            _logger.LogDebug("Cached value for key: {Key} with expiration: {Expiration}", key, effectiveExpiration);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error setting distributed cache for key: {Key}", key);
        }
    }

    public async Task<T> GetOrCreateAsync<T>(
        string key,
        Func<Task<T>> factory,
        TimeSpan? expiration = null,
        CancellationToken cancellationToken = default) where T : class
    {
        // Try to get from cache first
        var cached = await GetAsync<T>(key, cancellationToken);
        if (cached != null)
        {
            return cached;
        }

        // Create the value
        var value = await factory();
        if (value != null)
        {
            await SetAsync(key, value, expiration, cancellationToken);
        }

        return value;
    }

    public async Task RemoveAsync(string key, CancellationToken cancellationToken = default)
    {
        // Remove from memory cache
        _memoryCache.Remove(key);

        // Remove from distributed cache
        try
        {
            await _distributedCache.RemoveAsync(key, cancellationToken);
            _logger.LogDebug("Removed cache entry for key: {Key}", key);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error removing from distributed cache for key: {Key}", key);
        }
    }

    public async Task RemoveByPatternAsync(string pattern, CancellationToken cancellationToken = default)
    {
        // Note: This is a simplified implementation
        // In production, you'd need a more sophisticated approach for distributed cache

        _logger.LogInformation("Removing cache entries with pattern: {Pattern}", pattern);

        // For memory cache, we can't iterate keys, so this is a limitation
        // In production, you might maintain a separate index of keys

        // For distributed cache (Redis), you'd use pattern matching
        // This is a placeholder implementation
        await Task.CompletedTask;

        _logger.LogWarning("RemoveByPatternAsync is not fully implemented for distributed cache");
    }

    public async Task<bool> ExistsAsync(string key, CancellationToken cancellationToken = default)
    {
        // Check memory cache first
        if (_memoryCache.TryGetValue(key, out _))
        {
            return true;
        }

        // Check distributed cache
        try
        {
            var value = await _distributedCache.GetAsync(key, cancellationToken);
            return value != null;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error checking existence in distributed cache for key: {Key}", key);
            return false;
        }
    }

    public async Task RefreshAsync(string key, CancellationToken cancellationToken = default)
    {
        try
        {
            await _distributedCache.RefreshAsync(key, cancellationToken);
            _logger.LogDebug("Refreshed cache expiration for key: {Key}", key);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error refreshing distributed cache for key: {Key}", key);
        }
    }

    public async Task ClearAsync(CancellationToken cancellationToken = default)
    {
        // Note: Clearing all cache entries is generally not recommended in production
        // This is primarily for development/testing scenarios

        _logger.LogWarning("Clearing all cache entries");

        // Clear memory cache (limited capability)
        // In-memory cache doesn't provide a clear method, so we'd need to track keys separately

        // For distributed cache, this would depend on the implementation
        // For Redis, you'd use FLUSHDB or similar

        await Task.CompletedTask;

        _logger.LogWarning("ClearAsync is not fully implemented");
    }

    public async Task InvalidatePrefixAsync(string prefix, CancellationToken cancellationToken = default)
    {
        // For memory cache, you'd typically need to track keys with the prefix
        // For distributed cache (Redis), you'd use pattern matching
        // This is a simplified implementation

        await RemoveByPatternAsync($"{prefix}*", cancellationToken);
        _logger.LogDebug("Invalidated cache entries with prefix: {Prefix}", prefix);
    }

    public async Task InvalidateAsync(string key, CancellationToken cancellationToken = default)
    {
        // InvalidateAsync is an alias for RemoveAsync
        await RemoveAsync(key, cancellationToken);
        _logger.LogDebug("Invalidated cache entry for key: {Key}", key);
    }
}