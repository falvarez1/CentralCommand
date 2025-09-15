using System.Collections.Concurrent;
using System.Net;
using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Caching.Memory;

namespace CentralCommand.Api.Middleware;

/// <summary>
/// Middleware for rate limiting requests to prevent abuse
/// </summary>
public class RateLimitingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly IConfiguration _configuration;
    private readonly ILogger<RateLimitingMiddleware> _logger;
    private readonly IMemoryCache _cache;
    private readonly bool _enabled;
    private readonly int _maxRequests;
    private readonly TimeSpan _windowDuration;
    private readonly ConcurrentDictionary<string, LoginAttemptInfo> _loginAttempts;

    public RateLimitingMiddleware(
        RequestDelegate next,
        IConfiguration configuration,
        ILogger<RateLimitingMiddleware> logger,
        IMemoryCache cache)
    {
        _next = next;
        _configuration = configuration;
        _logger = logger;
        _cache = cache;
        _loginAttempts = new ConcurrentDictionary<string, LoginAttemptInfo>();

        var securitySettings = _configuration.GetSection("SecuritySettings");
        _enabled = securitySettings.GetValue<bool>("EnableRateLimiting", true);
        _maxRequests = securitySettings.GetValue<int>("RateLimitMaxRequests", 10);
        _windowDuration = TimeSpan.FromMinutes(securitySettings.GetValue<int>("RateLimitWindowMinutes", 1));
    }

    public async Task InvokeAsync(HttpContext context)
    {
        if (!_enabled)
        {
            await _next(context);
            return;
        }

        var path = context.Request.Path.ToString().ToLower();

        // Apply stricter rate limiting to auth endpoints
        if (IsAuthEndpoint(path))
        {
            if (!await CheckAuthRateLimit(context))
            {
                await HandleRateLimitExceeded(context);
                return;
            }
        }
        // Apply general rate limiting to all other endpoints
        else if (!await CheckGeneralRateLimit(context))
        {
            await HandleRateLimitExceeded(context);
            return;
        }

        await _next(context);
    }

    private bool IsAuthEndpoint(string path)
    {
        return path.Contains("/auth/login") ||
               path.Contains("/auth/register") ||
               path.Contains("/auth/refresh") ||
               path.Contains("/auth/password");
    }

    private async Task<bool> CheckAuthRateLimit(HttpContext context)
    {
        var clientId = GetClientIdentifier(context);
        var path = context.Request.Path.ToString().ToLower();

        // Special handling for login attempts
        if (path.Contains("/auth/login"))
        {
            return await CheckLoginAttempts(clientId, context);
        }

        // Stricter limits for auth endpoints
        var maxAuthRequests = _configuration.GetValue<int>("SecuritySettings:MaxLoginAttempts", 5);
        var key = $"auth_rate_limit_{clientId}";

        return await CheckRateLimit(key, maxAuthRequests, _windowDuration);
    }

    private async Task<bool> CheckLoginAttempts(string clientId, HttpContext context)
    {
        var maxAttempts = _configuration.GetValue<int>("SecuritySettings:MaxLoginAttempts", 5);
        var lockoutDuration = TimeSpan.FromMinutes(_configuration.GetValue<int>("SecuritySettings:LockoutDurationMinutes", 15));

        var attemptInfo = _loginAttempts.GetOrAdd(clientId, new LoginAttemptInfo());

        lock (attemptInfo)
        {
            // Check if currently locked out
            if (attemptInfo.IsLockedOut && DateTime.UtcNow < attemptInfo.LockoutEndTime)
            {
                var remainingTime = attemptInfo.LockoutEndTime - DateTime.UtcNow;
                context.Response.Headers.Add("Retry-After", remainingTime.TotalSeconds.ToString());
                _logger.LogWarning("Login attempt blocked for {ClientId}. Locked out for {RemainingSeconds} seconds",
                    clientId, remainingTime.TotalSeconds);
                return false;
            }

            // Reset if lockout period has passed
            if (attemptInfo.IsLockedOut && DateTime.UtcNow >= attemptInfo.LockoutEndTime)
            {
                attemptInfo.Reset();
            }

            // Check attempt count within window
            attemptInfo.CleanOldAttempts(_windowDuration);
            attemptInfo.Attempts.Add(DateTime.UtcNow);

            if (attemptInfo.Attempts.Count > maxAttempts)
            {
                // Apply exponential backoff for repeated violations
                var backoffMultiplier = Math.Min(attemptInfo.LockoutCount + 1, 5); // Cap at 5x
                var effectiveLockoutDuration = TimeSpan.FromMinutes(lockoutDuration.TotalMinutes * backoffMultiplier);

                attemptInfo.IsLockedOut = true;
                attemptInfo.LockoutEndTime = DateTime.UtcNow.Add(effectiveLockoutDuration);
                attemptInfo.LockoutCount++;

                context.Response.Headers.Add("Retry-After", effectiveLockoutDuration.TotalSeconds.ToString());
                _logger.LogWarning("Login rate limit exceeded for {ClientId}. Locked out for {Minutes} minutes (attempt #{LockoutCount})",
                    clientId, effectiveLockoutDuration.TotalMinutes, attemptInfo.LockoutCount);
                return false;
            }
        }

        return true;
    }

    private async Task<bool> CheckGeneralRateLimit(HttpContext context)
    {
        var clientId = GetClientIdentifier(context);
        var key = $"general_rate_limit_{clientId}";

        return await CheckRateLimit(key, _maxRequests, _windowDuration);
    }

    private async Task<bool> CheckRateLimit(string key, int maxRequests, TimeSpan window)
    {
        var requestCount = await _cache.GetOrCreateAsync(key, async entry =>
        {
            entry.AbsoluteExpirationRelativeToNow = window;
            return 0;
        });

        if (requestCount >= maxRequests)
        {
            _logger.LogWarning("Rate limit exceeded for key {Key}. Count: {Count}/{Max}",
                key, requestCount, maxRequests);
            return false;
        }

        _cache.Set(key, requestCount + 1, new MemoryCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow = window
        });

        return true;
    }

    private string GetClientIdentifier(HttpContext context)
    {
        // Try to get authenticated user ID first
        var userId = context.User?.Identity?.Name;
        if (!string.IsNullOrEmpty(userId))
        {
            return $"user_{userId}";
        }

        // Fall back to IP address
        var ipAddress = GetIpAddress(context);

        // Add user agent hash for better fingerprinting
        var userAgent = context.Request.Headers["User-Agent"].ToString();
        var fingerprint = GetFingerprint(ipAddress, userAgent);

        return $"ip_{fingerprint}";
    }

    private string GetIpAddress(HttpContext context)
    {
        // Check for forwarded IP (when behind proxy/load balancer)
        if (context.Request.Headers.ContainsKey("X-Forwarded-For"))
        {
            var forwardedFor = context.Request.Headers["X-Forwarded-For"].ToString();
            var ips = forwardedFor.Split(',', StringSplitOptions.RemoveEmptyEntries);
            if (ips.Length > 0)
            {
                return ips[0].Trim();
            }
        }

        // Check for real IP header (some proxies use this)
        if (context.Request.Headers.ContainsKey("X-Real-IP"))
        {
            return context.Request.Headers["X-Real-IP"].ToString();
        }

        // Fall back to remote IP address
        return context.Connection.RemoteIpAddress?.ToString() ?? "unknown";
    }

    private string GetFingerprint(string ipAddress, string userAgent)
    {
        var combined = $"{ipAddress}:{userAgent}";
        using var sha256 = SHA256.Create();
        var bytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(combined));
        return Convert.ToBase64String(bytes).Substring(0, 16);
    }

    private async Task HandleRateLimitExceeded(HttpContext context)
    {
        context.Response.StatusCode = (int)HttpStatusCode.TooManyRequests;
        context.Response.ContentType = "application/json";

        var response = new
        {
            status = "error",
            error = new
            {
                code = 429,
                message = "Too many requests. Please try again later.",
                timestamp = DateTime.UtcNow
            }
        };

        await context.Response.WriteAsJsonAsync(response);

        _logger.LogWarning("Rate limit exceeded for {Path} from {Client}",
            context.Request.Path, GetClientIdentifier(context));
    }

    private class LoginAttemptInfo
    {
        public List<DateTime> Attempts { get; } = new List<DateTime>();
        public bool IsLockedOut { get; set; }
        public DateTime LockoutEndTime { get; set; }
        public int LockoutCount { get; set; }

        public void CleanOldAttempts(TimeSpan window)
        {
            var cutoff = DateTime.UtcNow.Subtract(window);
            Attempts.RemoveAll(a => a < cutoff);
        }

        public void Reset()
        {
            Attempts.Clear();
            IsLockedOut = false;
            LockoutEndTime = DateTime.MinValue;
        }
    }
}

/// <summary>
/// Extension methods for RateLimitingMiddleware
/// </summary>
public static class RateLimitingMiddlewareExtensions
{
    public static IApplicationBuilder UseRateLimiting(this IApplicationBuilder builder)
    {
        return builder.UseMiddleware<RateLimitingMiddleware>();
    }
}