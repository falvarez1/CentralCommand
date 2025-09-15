using CentralCommand.Api.Data.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

namespace CentralCommand.Api.Services;

/// <summary>
/// Service for generating and validating JWT tokens
/// </summary>
public class JwtTokenService : IJwtTokenService
{
    private readonly IConfiguration _configuration;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly ILogger<JwtTokenService> _logger;
    private readonly ITokenBlacklistService _blacklistService;
    private readonly string _secret;
    private readonly string _issuer;
    private readonly string _audience;
    private readonly int _accessTokenExpirationMinutes;
    private readonly int _refreshTokenExpirationDays;

    public JwtTokenService(
        IConfiguration configuration,
        UserManager<ApplicationUser> userManager,
        ILogger<JwtTokenService> logger,
        ITokenBlacklistService blacklistService)
    {
        _configuration = configuration;
        _userManager = userManager;
        _logger = logger;
        _blacklistService = blacklistService;

        // Load JWT settings from environment variables with fallback to configuration
        _secret = Environment.GetEnvironmentVariable("JWT_SECRET")
            ?? _configuration["JwtSettings:Secret"]
            ?? throw new InvalidOperationException("JWT Secret is not configured. Set JWT_SECRET environment variable.");

        // Validate secret strength
        if (_secret.Length < 32)
        {
            throw new InvalidOperationException("JWT Secret must be at least 32 characters long for security.");
        }

        _issuer = Environment.GetEnvironmentVariable("JWT_ISSUER")
            ?? _configuration["JwtSettings:Issuer"]
            ?? "CentralCommand.API";

        _audience = Environment.GetEnvironmentVariable("JWT_AUDIENCE")
            ?? _configuration["JwtSettings:Audience"]
            ?? "CentralCommand.Client";

        _accessTokenExpirationMinutes = int.TryParse(
            Environment.GetEnvironmentVariable("JWT_ACCESS_TOKEN_EXPIRATION_MINUTES"),
            out var accessMinutes)
            ? accessMinutes
            : int.Parse(_configuration["JwtSettings:AccessTokenExpirationMinutes"] ?? "15");

        _refreshTokenExpirationDays = int.TryParse(
            Environment.GetEnvironmentVariable("JWT_REFRESH_TOKEN_EXPIRATION_DAYS"),
            out var refreshDays)
            ? refreshDays
            : int.Parse(_configuration["JwtSettings:RefreshTokenExpirationDays"] ?? "7");

        _logger.LogInformation("JWT service initialized with issuer: {Issuer}, audience: {Audience}, " +
            "access token expiration: {AccessMinutes} minutes, refresh token expiration: {RefreshDays} days",
            _issuer, _audience, _accessTokenExpirationMinutes, _refreshTokenExpirationDays);
    }

    /// <inheritdoc />
    public async Task<string> GenerateAccessTokenAsync(ApplicationUser user)
    {
        var tokenHandler = new JwtSecurityTokenHandler();
        var key = Encoding.ASCII.GetBytes(_secret);

        // Get user roles
        var roles = await _userManager.GetRolesAsync(user);

        // Create claims
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Name, user.UserName ?? string.Empty),
            new Claim(ClaimTypes.Email, user.Email ?? string.Empty),
            new Claim("firstName", user.FirstName),
            new Claim("lastName", user.LastName),
            new Claim("displayName", user.DisplayName ?? $"{user.FirstName} {user.LastName}"),
            new Claim("role", user.Role.ToString()),
            new Claim("status", user.Status.ToString()),
            new Claim("authProvider", user.AuthProvider.ToString()),
            new Claim("rateLimitTier", user.RateLimitTier.ToString()),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new Claim(JwtRegisteredClaimNames.Iat, DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString(), ClaimValueTypes.Integer64)
        };

        // Add role claims
        foreach (var role in roles)
        {
            claims.Add(new Claim(ClaimTypes.Role, role));
        }

        // Add permission claims
        foreach (var permission in user.Permissions)
        {
            claims.Add(new Claim("permission", permission));
        }

        // Add department and job title if available
        if (!string.IsNullOrEmpty(user.Department))
            claims.Add(new Claim("department", user.Department));
        if (!string.IsNullOrEmpty(user.JobTitle))
            claims.Add(new Claim("jobTitle", user.JobTitle));

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = DateTime.UtcNow.AddMinutes(_accessTokenExpirationMinutes),
            Issuer = _issuer,
            Audience = _audience,
            SigningCredentials = new SigningCredentials(
                new SymmetricSecurityKey(key),
                SecurityAlgorithms.HmacSha256Signature)
        };

        var token = tokenHandler.CreateToken(tokenDescriptor);

        _logger.LogDebug("Generated access token for user {UserId} with expiration {Expiration}",
            user.Id, tokenDescriptor.Expires);

        return tokenHandler.WriteToken(token);
    }

    /// <inheritdoc />
    public string GenerateRefreshToken()
    {
        var randomNumber = new byte[64];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(randomNumber);
        return Convert.ToBase64String(randomNumber);
    }

    /// <inheritdoc />
    public ClaimsPrincipal? ValidateToken(string token)
    {
        try
        {
            var tokenHandler = new JwtSecurityTokenHandler();
            var key = Encoding.ASCII.GetBytes(_secret);

            var validationParameters = new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(key),
                ValidateIssuer = true,
                ValidIssuer = _issuer,
                ValidateAudience = true,
                ValidAudience = _audience,
                ValidateLifetime = true,
                ClockSkew = TimeSpan.Zero
            };

            var principal = tokenHandler.ValidateToken(token, validationParameters, out var validatedToken);

            // Ensure the token is a JWT token
            if (validatedToken is not JwtSecurityToken jwtToken ||
                !jwtToken.Header.Alg.Equals(SecurityAlgorithms.HmacSha256, StringComparison.InvariantCultureIgnoreCase))
            {
                _logger.LogWarning("Invalid token algorithm detected");
                return null;
            }

            // Check if token is blacklisted
            var jti = _blacklistService.GetJtiFromPrincipal(principal);
            if (!string.IsNullOrEmpty(jti) && _blacklistService.IsTokenBlacklistedAsync(jti).GetAwaiter().GetResult())
            {
                _logger.LogWarning("Attempted to use blacklisted token with JTI: {Jti}", jti);
                return null;
            }

            return principal;
        }
        catch (SecurityTokenExpiredException ex)
        {
            _logger.LogDebug("Token expired: {Message}", ex.Message);
            return null;
        }
        catch (SecurityTokenException ex)
        {
            _logger.LogWarning("Token validation failed: {Message}", ex.Message);
            return null;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error during token validation");
            return null;
        }
    }

    /// <inheritdoc />
    public Guid? GetUserIdFromToken(string token)
    {
        try
        {
            var tokenHandler = new JwtSecurityTokenHandler();
            var jwtToken = tokenHandler.ReadJwtToken(token);

            var userIdClaim = jwtToken.Claims.FirstOrDefault(c =>
                c.Type == ClaimTypes.NameIdentifier ||
                c.Type == "nameid" ||
                c.Type == "sub");

            if (userIdClaim != null && Guid.TryParse(userIdClaim.Value, out var userId))
            {
                return userId;
            }

            return null;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error extracting user ID from token");
            return null;
        }
    }

    /// <inheritdoc />
    public DateTime? GetTokenExpiration(string token)
    {
        try
        {
            var tokenHandler = new JwtSecurityTokenHandler();
            var jwtToken = tokenHandler.ReadJwtToken(token);
            return jwtToken.ValidTo;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error extracting expiration from token");
            return null;
        }
    }

    /// <inheritdoc />
    public RefreshToken CreateRefreshToken(string ipAddress)
    {
        return new RefreshToken
        {
            Token = GenerateRefreshToken(),
            ExpiresAt = DateTime.UtcNow.AddDays(_refreshTokenExpirationDays),
            CreatedAt = DateTime.UtcNow,
            CreatedByIp = ipAddress
        };
    }

    /// <summary>
    /// Extract JWT token from HTTP request cookies
    /// </summary>
    public string? ExtractTokenFromCookie(HttpRequest request)
    {
        if (request?.Cookies == null)
        {
            return null;
        }

        // Try to get token from cookie
        if (request.Cookies.TryGetValue("access_token", out var cookieToken))
        {
            return cookieToken;
        }

        return null;
    }

    /// <summary>
    /// Extract refresh token from HTTP request cookies
    /// </summary>
    public string? ExtractRefreshTokenFromCookie(HttpRequest request)
    {
        if (request?.Cookies == null)
        {
            return null;
        }

        // Try to get refresh token from cookie
        if (request.Cookies.TryGetValue("refresh_token", out var refreshToken))
        {
            return refreshToken;
        }

        return null;
    }
}