using System.Security.Claims;
using System.Security.Cryptography;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Extensions.Caching.Memory;

namespace CentralCommand.Api.Services;

/// <summary>
/// Service for CSRF protection token generation and validation
/// </summary>
public interface ICsrfProtectionService
{
    string GenerateToken(string userId);
    bool ValidateToken(string token, string userId);
    void InvalidateToken(string token);
}

public class CsrfProtectionService : ICsrfProtectionService
{
    private readonly IMemoryCache _cache;
    private readonly ILogger<CsrfProtectionService> _logger;
    private readonly TimeSpan _tokenLifetime = TimeSpan.FromHours(1);

    public CsrfProtectionService(
        IMemoryCache cache,
        ILogger<CsrfProtectionService> logger)
    {
        _cache = cache;
        _logger = logger;
    }

    public string GenerateToken(string userId)
    {
        // Generate a secure random token
        var tokenBytes = new byte[32];
        using (var rng = RandomNumberGenerator.Create())
        {
            rng.GetBytes(tokenBytes);
        }

        var token = Convert.ToBase64String(tokenBytes);
        var cacheKey = GetCacheKey(token);

        // Store token with user association
        _cache.Set(cacheKey, userId, new MemoryCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow = _tokenLifetime,
            SlidingExpiration = TimeSpan.FromMinutes(20)
        });

        _logger.LogDebug("Generated CSRF token for user {UserId}", userId);
        return token;
    }

    public bool ValidateToken(string token, string userId)
    {
        if (string.IsNullOrWhiteSpace(token))
        {
            _logger.LogWarning("CSRF token validation failed: empty token");
            return false;
        }

        var cacheKey = GetCacheKey(token);
        if (_cache.TryGetValue<string>(cacheKey, out var storedUserId))
        {
            var isValid = storedUserId == userId;
            if (!isValid)
            {
                _logger.LogWarning("CSRF token validation failed: user mismatch for token");
            }
            return isValid;
        }

        _logger.LogWarning("CSRF token validation failed: token not found or expired");
        return false;
    }

    public void InvalidateToken(string token)
    {
        if (!string.IsNullOrWhiteSpace(token))
        {
            var cacheKey = GetCacheKey(token);
            _cache.Remove(cacheKey);
            _logger.LogDebug("Invalidated CSRF token");
        }
    }

    private string GetCacheKey(string token)
    {
        return $"csrf_token_{token}";
    }
}

/// <summary>
/// Attribute to enforce CSRF protection on controller actions
/// </summary>
[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method)]
public class ValidateCsrfTokenAttribute : Attribute, IAsyncActionFilter
{
    private readonly bool _requireToken;

    public ValidateCsrfTokenAttribute(bool requireToken = true)
    {
        _requireToken = requireToken;
    }

    public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        if (!_requireToken)
        {
            await next();
            return;
        }

        var csrfService = context.HttpContext.RequestServices.GetService<ICsrfProtectionService>();
        if (csrfService == null)
        {
            await next();
            return;
        }

        // Skip CSRF check for safe methods
        var method = context.HttpContext.Request.Method.ToUpper();
        if (method == "GET" || method == "HEAD" || method == "OPTIONS")
        {
            await next();
            return;
        }

        // Get CSRF token from header or form
        var token = context.HttpContext.Request.Headers["X-CSRF-Token"].FirstOrDefault()
            ?? context.HttpContext.Request.Form["__RequestVerificationToken"].FirstOrDefault();

        if (string.IsNullOrWhiteSpace(token))
        {
            context.Result = new BadRequestObjectResult(new ProblemDetails
            {
                Title = "CSRF Token Missing",
                Detail = "A valid CSRF token is required for this request",
                Status = StatusCodes.Status400BadRequest
            });
            return;
        }

        // Get user ID from claims
        var userId = context.HttpContext.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
        {
            context.Result = new UnauthorizedResult();
            return;
        }

        // Validate token
        if (!csrfService.ValidateToken(token, userId))
        {
            context.Result = new BadRequestObjectResult(new ProblemDetails
            {
                Title = "Invalid CSRF Token",
                Detail = "The provided CSRF token is invalid or expired",
                Status = StatusCodes.Status400BadRequest
            });
            return;
        }

        await next();
    }
}