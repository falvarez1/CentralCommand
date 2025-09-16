namespace CentralCommand.Api.Infrastructure.Caching;

/// <summary>
/// Options for cache entries
/// </summary>
public class CacheOptions
{
    /// <summary>
    /// Gets or sets the absolute expiration relative to now
    /// </summary>
    public TimeSpan? AbsoluteExpiration { get; set; }

    /// <summary>
    /// Gets or sets the absolute expiration date
    /// </summary>
    public DateTimeOffset? AbsoluteExpirationRelativeToNow { get; set; }

    /// <summary>
    /// Gets or sets the sliding expiration
    /// </summary>
    public TimeSpan? SlidingExpiration { get; set; }

    /// <summary>
    /// Gets or sets the priority for cache eviction
    /// </summary>
    public CachePriority Priority { get; set; } = CachePriority.Normal;
}

/// <summary>
/// Cache priority levels
/// </summary>
public enum CachePriority
{
    Low,
    Normal,
    High,
    NeverRemove
}