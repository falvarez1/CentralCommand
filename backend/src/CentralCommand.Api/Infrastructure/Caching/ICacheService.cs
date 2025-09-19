namespace CentralCommand.Api.Infrastructure.Caching;

/// <summary>
/// Cache service interface for managing application caching
/// </summary>
public interface ICacheService
{
    /// <summary>
    /// Gets a value from the cache
    /// </summary>
    Task<T?> GetAsync<T>(string key, CancellationToken cancellationToken = default) where T : class;

    /// <summary>
    /// Sets a value in the cache
    /// </summary>
    Task SetAsync<T>(string key, T value, TimeSpan? expiration = null, CancellationToken cancellationToken = default) where T : class;

    /// <summary>
    /// Removes a value from the cache
    /// </summary>
    Task RemoveAsync(string key, CancellationToken cancellationToken = default);

    /// <summary>
    /// Removes values matching a pattern from the cache
    /// </summary>
    Task RemoveByPatternAsync(string pattern, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets or creates a cached value
    /// </summary>
    Task<T> GetOrCreateAsync<T>(string key, Func<Task<T>> factory, TimeSpan? expiration = null, CancellationToken cancellationToken = default) where T : class;

    /// <summary>
    /// Checks if a key exists in the cache
    /// </summary>
    Task<bool> ExistsAsync(string key, CancellationToken cancellationToken = default);

    /// <summary>
    /// Refreshes the expiration time of a cached item
    /// </summary>
    Task RefreshAsync(string key, CancellationToken cancellationToken = default);

    /// <summary>
    /// Invalidates all cache entries with a given prefix
    /// </summary>
    Task InvalidatePrefixAsync(string prefix, CancellationToken cancellationToken = default);

    /// <summary>
    /// Invalidates (removes) a cache entry
    /// </summary>
    Task InvalidateAsync(string key, CancellationToken cancellationToken = default);
}