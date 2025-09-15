using System.Net;
using System.Text.Json;
using CentralCommand.Core.DTOs.Common;

namespace CentralCommand.Api.Infrastructure.Middleware;

public class GlobalExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<GlobalExceptionHandlingMiddleware> _logger;
    private readonly IHostEnvironment _environment;

    public GlobalExceptionHandlingMiddleware(
        RequestDelegate next,
        ILogger<GlobalExceptionHandlingMiddleware> logger,
        IHostEnvironment environment)
    {
        _next = next;
        _logger = logger;
        _environment = environment;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "An unhandled exception occurred");
            await HandleExceptionAsync(context, ex);
        }
    }

    private async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        context.Response.ContentType = "application/json";

        var response = new ApiResponse<object>
        {
            Success = false,
            Timestamp = DateTime.UtcNow
        };

        switch (exception)
        {
            case KeyNotFoundException notFoundEx:
                context.Response.StatusCode = (int)HttpStatusCode.NotFound;
                response.Message = notFoundEx.Message;
                response.Errors = new List<string> { "The requested resource was not found" };
                break;

            case UnauthorizedAccessException unauthorizedEx:
                context.Response.StatusCode = (int)HttpStatusCode.Unauthorized;
                response.Message = "Unauthorized access";
                response.Errors = new List<string> { unauthorizedEx.Message };
                break;

            case ArgumentException argEx:
            case ArgumentNullException argNullEx:
                context.Response.StatusCode = (int)HttpStatusCode.BadRequest;
                response.Message = "Invalid request";
                response.Errors = new List<string> { exception.Message };
                break;

            case InvalidOperationException invalidOpEx:
                context.Response.StatusCode = (int)HttpStatusCode.Conflict;
                response.Message = "Operation cannot be performed";
                response.Errors = new List<string> { invalidOpEx.Message };
                break;

            case TimeoutException timeoutEx:
                context.Response.StatusCode = (int)HttpStatusCode.RequestTimeout;
                response.Message = "Request timeout";
                response.Errors = new List<string> { "The operation timed out" };
                break;

            case NotImplementedException notImplEx:
                context.Response.StatusCode = (int)HttpStatusCode.NotImplemented;
                response.Message = "Feature not implemented";
                response.Errors = new List<string> { notImplEx.Message };
                break;

            default:
                context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;
                response.Message = "An error occurred while processing your request";

                if (_environment.IsDevelopment())
                {
                    response.Errors = new List<string>
                    {
                        exception.Message,
                        exception.StackTrace ?? string.Empty
                    };
                }
                else
                {
                    response.Errors = new List<string> { "An internal server error occurred" };
                }
                break;
        }

        // Add correlation ID if available
        if (context.Items.TryGetValue("CorrelationId", out var correlationId))
        {
            response.Data = new { CorrelationId = correlationId };
        }

        var jsonResponse = JsonSerializer.Serialize(response, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            WriteIndented = _environment.IsDevelopment()
        });

        await context.Response.WriteAsync(jsonResponse);
    }
}