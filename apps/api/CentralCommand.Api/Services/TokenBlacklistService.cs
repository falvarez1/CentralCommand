using Microsoft.Extensions.Caching.Memory;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace CentralCommand.Api.Services;

/// <summary>
/// In-memory implementation of token blacklist service
/// In production, consider using Redis or a persistent store
/// </summary>
public class TokenBlacklistService : ITokenBlacklistService
{
    private readonly IMemoryCache _cache;
    private readonly ILogger<TokenBlacklistService> _logger;
    private readonly HashSet<Guid> _blacklistedUsers = new();
    private readonly object _lockObject = new();

    public TokenBlacklistService(
        IMemoryCache cache,
        ILogger<TokenBlacklistService> logger)
    {
        _cache = cache;
        _logger = logger;
    }

    /// <inheritdoc />
    public Task BlacklistTokenAsync(string jti, DateTime expiry, Guid userId, string reason = "Logout")
    {
        if (string.IsNullOrEmpty(jti))
        {
            _logger.LogWarning("Attempted to blacklist token with empty JTI");
            return Task.CompletedTask;
        }

        // Calculate how long to keep the token in the blacklist
        // Keep it until its original expiry time plus a small buffer
        var cacheExpiry = expiry.AddMinutes(5) - DateTime.UtcNow;

        if (cacheExpiry <= TimeSpan.Zero)
        {
            _logger.LogDebug("Token {Jti} already expired, not adding to blacklist", jti);
            return Task.CompletedTask;
        }

        // Store in cache with expiration
        var blacklistEntry = new BlacklistEntry
        {
            Jti = jti,
            UserId = userId,
            BlacklistedAt = DateTime.UtcNow,
            ExpiresAt = expiry,
            Reason = reason
        };

        _cache.Set($"blacklist:{jti}", blacklistEntry, cacheExpiry);

        _logger.LogInformation("Token {Jti} for user {UserId} blacklisted. Reason: {Reason}",
            jti, userId, reason);

        return Task.CompletedTask;
    }

    /// <inheritdoc />
    public Task<bool> IsTokenBlacklistedAsync(string jti)
    {
        if (string.IsNullOrEmpty(jti))
        {
            return Task.FromResult(false);
        }

        var isBlacklisted = _cache.TryGetValue($"blacklist:{jti}", out _);

        if (isBlacklisted)
        {
            _logger.LogDebug("Token {Jti} is blacklisted", jti);
        }

        return Task.FromResult(isBlacklisted);
    }

    /// <inheritdoc />
    public Task BlacklistAllUserTokensAsync(Guid userId, string reason = "Security")
    {
        lock (_lockObject)
        {
            _blacklistedUsers.Add(userId);
        }

        // In a production environment, you would also:
        // 1. Query all active tokens for this user from the database
        // 2. Add each token's JTI to the blacklist
        // 3. Revoke all refresh tokens for the user

        _logger.LogWarning("All tokens for user {UserId} have been blacklisted. Reason: {Reason}",
            userId, reason);

        return Task.CompletedTask;
    }

    /// <inheritdoc />
    public string? GetJtiFromPrincipal(ClaimsPrincipal principal)
    {
        if (principal == null)
        {
            return null;
        }

        // Try different claim types for JTI
        var jti = principal.FindFirst(JwtRegisteredClaimNames.Jti)?.Value
               ?? principal.FindFirst("jti")?.Value;

        return jti;
    }

    /// <inheritdoc />
    public Task CleanupExpiredTokensAsync()
    {
        // Memory cache automatically removes expired entries
        // This method is here for interface compatibility
        // In a Redis implementation, you might want to actively clean up

        _logger.LogDebug("Cleanup of expired tokens triggered (handled automatically by MemoryCache)");
        return Task.CompletedTask;
    }

    /// <summary>
    /// Check if a user is completely blacklisted
    /// </summary>
    public bool IsUserBlacklisted(Guid userId)
    {
        lock (_lockObject)
        {
            return _blacklistedUsers.Contains(userId);
        }
    }

    /// <summary>
    /// Internal class to store blacklist entry details
    /// </summary>
    private class BlacklistEntry
    {
        public string Jti { get; set; } = string.Empty;
        public Guid UserId { get; set; }
        public DateTime BlacklistedAt { get; set; }
        public DateTime ExpiresAt { get; set; }
        public string Reason { get; set; } = string.Empty;
    }
}