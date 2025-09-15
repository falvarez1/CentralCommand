using System.Security.Claims;

namespace CentralCommand.Api.Services;

/// <summary>
/// Service for managing blacklisted/revoked JWT tokens
/// </summary>
public interface ITokenBlacklistService
{
    /// <summary>
    /// Add a token to the blacklist
    /// </summary>
    /// <param name="jti">JWT ID (jti claim) of the token to blacklist</param>
    /// <param name="expiry">Token expiry time</param>
    /// <param name="userId">User ID associated with the token</param>
    /// <param name="reason">Reason for blacklisting</param>
    Task BlacklistTokenAsync(string jti, DateTime expiry, Guid userId, string reason = "Logout");

    /// <summary>
    /// Check if a token is blacklisted
    /// </summary>
    /// <param name="jti">JWT ID (jti claim) to check</param>
    /// <returns>True if the token is blacklisted</returns>
    Task<bool> IsTokenBlacklistedAsync(string jti);

    /// <summary>
    /// Blacklist all tokens for a specific user
    /// </summary>
    /// <param name="userId">User ID whose tokens should be blacklisted</param>
    /// <param name="reason">Reason for blacklisting</param>
    Task BlacklistAllUserTokensAsync(Guid userId, string reason = "Security");

    /// <summary>
    /// Extract JTI from claims principal
    /// </summary>
    /// <param name="principal">Claims principal</param>
    /// <returns>JTI claim value or null</returns>
    string? GetJtiFromPrincipal(ClaimsPrincipal principal);

    /// <summary>
    /// Clean up expired blacklisted tokens
    /// </summary>
    Task CleanupExpiredTokensAsync();
}