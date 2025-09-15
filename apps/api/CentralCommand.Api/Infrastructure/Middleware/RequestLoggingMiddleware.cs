using System.Diagnostics;
using System.Text;

namespace CentralCommand.Api.Infrastructure.Middleware;

public class RequestLoggingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<RequestLoggingMiddleware> _logger;
    private static readonly HashSet<string> SensitiveHeaders = new(StringComparer.OrdinalIgnoreCase)
    {
        "Authorization",
        "Cookie",
        "Set-Cookie",
        "X-Api-Key"
    };

    public RequestLoggingMiddleware(
        RequestDelegate next,
        ILogger<RequestLoggingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        // Generate correlation ID
        var correlationId = context.Request.Headers["X-Correlation-Id"].FirstOrDefault()
            ?? Guid.NewGuid().ToString();

        context.Items["CorrelationId"] = correlationId;
        context.Response.Headers.Add("X-Correlation-Id", correlationId);

        // Skip logging for health check endpoints
        if (context.Request.Path.StartsWithSegments("/health") ||
            context.Request.Path.StartsWithSegments("/api/health"))
        {
            await _next(context);
            return;
        }

        var stopwatch = Stopwatch.StartNew();

        // Log request
        LogRequest(context, correlationId);

        // Capture original response body stream
        var originalResponseBodyStream = context.Response.Body;

        using var responseBody = new MemoryStream();
        context.Response.Body = responseBody;

        try
        {
            await _next(context);
        }
        finally
        {
            stopwatch.Stop();

            // Log response
            LogResponse(context, correlationId, stopwatch.ElapsedMilliseconds);

            // Copy the response body back to the original stream
            await responseBody.CopyToAsync(originalResponseBodyStream);
        }
    }

    private void LogRequest(HttpContext context, string correlationId)
    {
        var request = context.Request;
        var logLevel = GetLogLevel(request.Path);

        _logger.Log(logLevel,
            "HTTP Request: {Method} {Path} {QueryString} | CorrelationId: {CorrelationId} | IP: {IP} | UserAgent: {UserAgent}",
            request.Method,
            request.Path,
            request.QueryString,
            correlationId,
            context.Connection.RemoteIpAddress,
            request.Headers["User-Agent"].FirstOrDefault());

        if (_logger.IsEnabled(LogLevel.Debug))
        {
            var headers = FormatHeaders(request.Headers);
            _logger.LogDebug("Request Headers: {Headers}", headers);
        }
    }

    private void LogResponse(HttpContext context, string correlationId, long elapsedMs)
    {
        var response = context.Response;
        var logLevel = response.StatusCode >= 400 ? LogLevel.Warning : LogLevel.Information;

        _logger.Log(logLevel,
            "HTTP Response: {StatusCode} | Duration: {Duration}ms | CorrelationId: {CorrelationId}",
            response.StatusCode,
            elapsedMs,
            correlationId);

        // Log slow requests
        if (elapsedMs > 1000)
        {
            _logger.LogWarning(
                "Slow request detected: {Method} {Path} took {Duration}ms | CorrelationId: {CorrelationId}",
                context.Request.Method,
                context.Request.Path,
                elapsedMs,
                correlationId);
        }
    }

    private static LogLevel GetLogLevel(PathString path)
    {
        // Reduce log level for frequently accessed endpoints
        if (path.StartsWithSegments("/api/v1/statistics") ||
            path.StartsWithSegments("/api/v1/portals/metrics"))
        {
            return LogLevel.Debug;
        }

        return LogLevel.Information;
    }

    private static string FormatHeaders(IHeaderDictionary headers)
    {
        var sb = new StringBuilder();
        foreach (var header in headers)
        {
            var value = SensitiveHeaders.Contains(header.Key)
                ? "[REDACTED]"
                : string.Join(", ", header.Value!);

            sb.AppendLine($"  {header.Key}: {value}");
        }
        return sb.ToString();
    }
}