using Microsoft.Extensions.Primitives;

namespace CentralCommand.Api.Middleware;

/// <summary>
/// Middleware to add security headers to HTTP responses
/// </summary>
public class SecurityHeadersMiddleware
{
    private readonly RequestDelegate _next;
    private readonly IConfiguration _configuration;
    private readonly ILogger<SecurityHeadersMiddleware> _logger;
    private readonly bool _isDevelopment;

    public SecurityHeadersMiddleware(
        RequestDelegate next,
        IConfiguration configuration,
        ILogger<SecurityHeadersMiddleware> logger,
        IWebHostEnvironment environment)
    {
        _next = next;
        _configuration = configuration;
        _logger = logger;
        _isDevelopment = environment.IsDevelopment();
    }

    public async Task InvokeAsync(HttpContext context)
    {
        // Add security headers before processing the request
        AddSecurityHeaders(context);

        // Process the request
        await _next(context);
    }

    private void AddSecurityHeaders(HttpContext context)
    {
        var headers = context.Response.Headers;

        // X-Frame-Options: Prevent clickjacking attacks
        if (!headers.ContainsKey("X-Frame-Options"))
        {
            headers.Add("X-Frame-Options", new StringValues("DENY"));
        }

        // X-Content-Type-Options: Prevent MIME type sniffing
        if (!headers.ContainsKey("X-Content-Type-Options"))
        {
            headers.Add("X-Content-Type-Options", new StringValues("nosniff"));
        }

        // X-XSS-Protection: Enable XSS filter (legacy but still useful for older browsers)
        if (!headers.ContainsKey("X-XSS-Protection"))
        {
            headers.Add("X-XSS-Protection", new StringValues("1; mode=block"));
        }

        // Referrer-Policy: Control referrer information
        if (!headers.ContainsKey("Referrer-Policy"))
        {
            headers.Add("Referrer-Policy", new StringValues("strict-origin-when-cross-origin"));
        }

        // Content-Security-Policy: Prevent XSS and injection attacks
        if (!headers.ContainsKey("Content-Security-Policy"))
        {
            var cspValue = _isDevelopment
                ? "default-src 'self' 'unsafe-inline' 'unsafe-eval' http://localhost:* ws://localhost:*; " +
                  "img-src 'self' data: https:; " +
                  "font-src 'self' data:; " +
                  "connect-src 'self' http://localhost:* ws://localhost:* wss://localhost:*"
                : "default-src 'self'; " +
                  "script-src 'self' 'unsafe-inline'; " +
                  "style-src 'self' 'unsafe-inline'; " +
                  "img-src 'self' data: https:; " +
                  "font-src 'self' data:; " +
                  "connect-src 'self' wss:; " +
                  "frame-ancestors 'none'; " +
                  "base-uri 'self'; " +
                  "form-action 'self'";

            headers.Add("Content-Security-Policy", new StringValues(cspValue));
        }

        // Permissions-Policy: Control browser features
        if (!headers.ContainsKey("Permissions-Policy"))
        {
            headers.Add("Permissions-Policy", new StringValues(
                "accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()"
            ));
        }

        // X-Permitted-Cross-Domain-Policies: Control cross-domain content handling
        if (!headers.ContainsKey("X-Permitted-Cross-Domain-Policies"))
        {
            headers.Add("X-Permitted-Cross-Domain-Policies", new StringValues("none"));
        }

        // Strict-Transport-Security (HSTS) - Only in production
        if (!_isDevelopment && context.Request.IsHttps && !headers.ContainsKey("Strict-Transport-Security"))
        {
            var hstsSettings = _configuration.GetSection("HstsSettings");
            var maxAge = hstsSettings.GetValue<int>("MaxAgeDays", 365) * 86400; // Convert days to seconds
            var includeSubDomains = hstsSettings.GetValue<bool>("IncludeSubDomains", true);
            var preload = hstsSettings.GetValue<bool>("Preload", true);

            var hstsValue = $"max-age={maxAge}";
            if (includeSubDomains)
                hstsValue += "; includeSubDomains";
            if (preload)
                hstsValue += "; preload";

            headers.Add("Strict-Transport-Security", new StringValues(hstsValue));
        }

        // Remove server header for security
        headers.Remove("Server");
        headers.Remove("X-Powered-By");
        headers.Remove("X-AspNet-Version");
        headers.Remove("X-AspNetCore-Version");

        _logger.LogDebug("Security headers added to response for {Path}", context.Request.Path);
    }
}

/// <summary>
/// Extension methods for SecurityHeadersMiddleware
/// </summary>
public static class SecurityHeadersMiddlewareExtensions
{
    public static IApplicationBuilder UseSecurityHeaders(this IApplicationBuilder builder)
    {
        return builder.UseMiddleware<SecurityHeadersMiddleware>();
    }
}