using Microsoft.Extensions.Caching.Memory;
using System.Text.Json;

namespace CentralCommand.Api.Infrastructure.Caching;

/// <summary>
/// In-memory cache service implementation
/// </summary>
public class MemoryCacheService : ICacheService
{
    private readonly IMemoryCache _cache;
    private readonly ILogger<MemoryCacheService> _logger;
    private readonly HashSet<string> _cacheKeys = new();
    private readonly SemaphoreSlim _semaphore = new(1, 1);

    public MemoryCacheService(IMemoryCache cache, ILogger<MemoryCacheService> logger)
    {
        _cache = cache ?? throw new ArgumentNullException(nameof(cache));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    public Task<T?> GetAsync<T>(string key, CancellationToken cancellationToken = default) where T : class
    {
        try
        {
            if (_cache.TryGetValue(key, out T? value))
            {
                _logger.LogDebug("Cache hit for key: {Key}", key);
                return Task.FromResult(value);
            }

            _logger.LogDebug("Cache miss for key: {Key}", key);
            return Task.FromResult<T?>(null);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving cache entry for key: {Key}", key);
            return Task.FromResult<T?>(null);
        }
    }

    public async Task SetAsync<T>(string key, T value, TimeSpan? expiration = null, CancellationToken cancellationToken = default) where T : class
    {
        try
        {
            var options = new MemoryCacheEntryOptions();

            if (expiration.HasValue)
            {
                options.AbsoluteExpirationRelativeToNow = expiration.Value;
            }
            else
            {
                options.SlidingExpiration = TimeSpan.FromMinutes(5);
            }

            options.RegisterPostEvictionCallback((evictedKey, evictedValue, reason, state) =>
            {
                _logger.LogDebug("Cache entry evicted: {Key}, Reason: {Reason}", evictedKey, reason);
                RemoveKeyFromTracking(evictedKey.ToString()!);
            });

            _cache.Set(key, value, options);
            await TrackKeyAsync(key);

            _logger.LogDebug("Cache entry set for key: {Key}", key);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error setting cache entry for key: {Key}", key);
        }
    }

    public Task RemoveAsync(string key, CancellationToken cancellationToken = default)
    {
        try
        {
            _cache.Remove(key);
            RemoveKeyFromTracking(key);
            _logger.LogDebug("Cache entry removed for key: {Key}", key);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error removing cache entry for key: {Key}", key);
        }

        return Task.CompletedTask;
    }

    public async Task RemoveByPatternAsync(string pattern, CancellationToken cancellationToken = default)
    {
        try
        {
            await _semaphore.WaitAsync(cancellationToken);

            var keysToRemove = _cacheKeys.Where(k => k.Contains(pattern, StringComparison.OrdinalIgnoreCase)).ToList();

            foreach (var key in keysToRemove)
            {
                _cache.Remove(key);
                _cacheKeys.Remove(key);
            }

            _logger.LogDebug("Removed {Count} cache entries matching pattern: {Pattern}", keysToRemove.Count, pattern);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error removing cache entries by pattern: {Pattern}", pattern);
        }
        finally
        {
            _semaphore.Release();
        }
    }

    public async Task<T> GetOrCreateAsync<T>(string key, Func<Task<T>> factory, TimeSpan? expiration = null, CancellationToken cancellationToken = default) where T : class
    {
        var cached = await GetAsync<T>(key, cancellationToken);
        if (cached != null)
        {
            return cached;
        }

        var value = await factory();
        await SetAsync(key, value, expiration, cancellationToken);
        return value;
    }

    public Task<bool> ExistsAsync(string key, CancellationToken cancellationToken = default)
    {
        return Task.FromResult(_cache.TryGetValue(key, out _));
    }

    public Task RefreshAsync(string key, CancellationToken cancellationToken = default)
    {
        try
        {
            if (_cache.TryGetValue(key, out var value))
            {
                // Re-set the value to refresh its expiration
                _cache.Set(key, value, new MemoryCacheEntryOptions
                {
                    SlidingExpiration = TimeSpan.FromMinutes(5)
                });
                _logger.LogDebug("Cache entry refreshed for key: {Key}", key);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error refreshing cache entry for key: {Key}", key);
        }

        return Task.CompletedTask;
    }

    private async Task TrackKeyAsync(string key)
    {
        await _semaphore.WaitAsync();
        try
        {
            _cacheKeys.Add(key);
        }
        finally
        {
            _semaphore.Release();
        }
    }

    private void RemoveKeyFromTracking(string key)
    {
        _semaphore.Wait();
        try
        {
            _cacheKeys.Remove(key);
        }
        finally
        {
            _semaphore.Release();
        }
    }

    public async Task InvalidatePrefixAsync(string prefix, CancellationToken cancellationToken = default)
    {
        await RemoveByPatternAsync(prefix, cancellationToken);
        _logger.LogDebug("Invalidated cache entries with prefix: {Prefix}", prefix);
    }

    public async Task InvalidateAsync(string key, CancellationToken cancellationToken = default)
    {
        await RemoveAsync(key, cancellationToken);
        _logger.LogDebug("Invalidated cache entry for key: {Key}", key);
    }
}