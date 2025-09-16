using System.Net;
using System.Text.Json;
using CentralCommand.Core.DTOs.Common;

namespace CentralCommand.Api.Infrastructure.Middleware;

public class ApiKeyAuthenticationMiddleware
{
    private readonly RequestDelegate _next;
    private readonly IConfiguration _configuration;
    private readonly ILogger<ApiKeyAuthenticationMiddleware> _logger;
    private const string ApiKeyHeaderName = "X-API-Key";

    public ApiKeyAuthenticationMiddleware(
        RequestDelegate next,
        IConfiguration configuration,
        ILogger<ApiKeyAuthenticationMiddleware> logger)
    {
        _next = next;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        // Skip authentication for certain paths
        if (ShouldSkipAuthentication(context.Request.Path))
        {
            await _next(context);
            return;
        }

        // Check if API key authentication is enabled
        var apiKeyAuthEnabled = _configuration.GetValue<bool>("Authentication:ApiKey:Enabled");
        if (!apiKeyAuthEnabled)
        {
            await _next(context);
            return;
        }

        // Extract API key from header
        if (!context.Request.Headers.TryGetValue(ApiKeyHeaderName, out var extractedApiKey))
        {
            _logger.LogWarning("API Key missing in request to {Path}", context.Request.Path);
            await WriteUnauthorizedResponse(context, "API Key is required");
            return;
        }

        // Validate API key
        var validApiKeys = _configuration.GetSection("Authentication:ApiKey:ValidKeys").Get<List<string>>() ?? new List<string>();

        if (!validApiKeys.Contains(extractedApiKey!))
        {
            _logger.LogWarning("Invalid API Key provided for request to {Path}", context.Request.Path);
            await WriteUnauthorizedResponse(context, "Invalid API Key");
            return;
        }

        // Log successful authentication
        _logger.LogDebug("API Key authentication successful for request to {Path}", context.Request.Path);

        // Add claims or user information to context if needed
        context.Items["ApiKeyAuthenticated"] = true;
        context.Items["ApiKey"] = extractedApiKey.ToString();

        await _next(context);
    }

    private static bool ShouldSkipAuthentication(PathString path)
    {
        var skipPaths = new[]
        {
            "/health",
            "/api/health",
            "/swagger",
            "/api-docs"
        };

        return skipPaths.Any(skipPath => path.StartsWithSegments(skipPath, StringComparison.OrdinalIgnoreCase));
    }

    private static async Task WriteUnauthorizedResponse(HttpContext context, string message)
    {
        context.Response.StatusCode = (int)HttpStatusCode.Unauthorized;
        context.Response.ContentType = "application/json";

        var response = new ApiResponse<object>
        {
            Success = false,
            Message = message,
            Errors = new Dictionary<string, string[]> { ["Authentication"] = new[] { "Authentication failed" } },
            Timestamp = DateTime.UtcNow
        };

        var jsonResponse = JsonSerializer.Serialize(response, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        });

        await context.Response.WriteAsync(jsonResponse);
    }
}