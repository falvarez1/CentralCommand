using CentralCommand.Api.Data.Entities;
using System.Security.Claims;

namespace CentralCommand.Api.Services;

/// <summary>
/// Interface for JWT token service
/// </summary>
public interface IJwtTokenService
{
    /// <summary>
    /// Generates a JWT access token for the specified user
    /// </summary>
    Task<string> GenerateAccessTokenAsync(ApplicationUser user);

    /// <summary>
    /// Generates a refresh token
    /// </summary>
    string GenerateRefreshToken();

    /// <summary>
    /// Validates a JWT token and returns the claims principal
    /// </summary>
    ClaimsPrincipal? ValidateToken(string token);

    /// <summary>
    /// Gets the user ID from a JWT token
    /// </summary>
    Guid? GetUserIdFromToken(string token);

    /// <summary>
    /// Gets the expiration time from a JWT token
    /// </summary>
    DateTime? GetTokenExpiration(string token);

    /// <summary>
    /// Creates a new refresh token entity for a user
    /// </summary>
    RefreshToken CreateRefreshToken(string ipAddress);

    /// <summary>
    /// Extract JWT token from HTTP request cookies
    /// </summary>
    string? ExtractTokenFromCookie(HttpRequest request);

    /// <summary>
    /// Extract refresh token from HTTP request cookies
    /// </summary>
    string? ExtractRefreshTokenFromCookie(HttpRequest request);
}