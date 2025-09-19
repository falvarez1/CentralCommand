using CentralCommand.MockApi.Hubs;
using CentralCommand.MockApi.Services;
using Microsoft.AspNetCore.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;

var builder = WebApplication.CreateBuilder(args);

// Configure JSON serialization options
builder.Services.Configure<JsonOptions>(options =>
{
    options.SerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
    options.SerializerOptions.WriteIndented = true;
    options.SerializerOptions.Converters.Add(new JsonStringEnumConverter(JsonNamingPolicy.CamelCase));
    options.SerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
});

// Add services to the container
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
        options.JsonSerializerOptions.WriteIndented = true;
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter(JsonNamingPolicy.CamelCase));
        options.JsonSerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
    });

// Add API documentation
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo
    {
        Title = "Central Command Mock API",
        Version = "v1",
        Description = "Mock API for Central Command portal management system"
    });
});

// Add SignalR
builder.Services.AddSignalR()
    .AddJsonProtocol(options =>
    {
        options.PayloadSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
        options.PayloadSerializerOptions.Converters.Add(new JsonStringEnumConverter(JsonNamingPolicy.CamelCase));
    });

// Configure CORS for development - allow any localhost port
builder.Services.AddCors(options =>
{
    options.AddPolicy("ReactApp", policy =>
    {
        // Allow any localhost port for development
        policy.SetIsOriginAllowed(origin =>
            {
                var uri = new Uri(origin);
                return uri.Host == "localhost" || uri.Host == "127.0.0.1";
            })
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials(); // Required for SignalR
    });
});

// Register application services
builder.Services.AddSingleton<MockDataService>();
builder.Services.AddSingleton<StatisticsService>();
builder.Services.AddHostedService<MetricsUpdateService>();

// Add health checks
builder.Services.AddHealthChecks();

// Configure logging
builder.Logging.ClearProviders();
builder.Logging.AddConsole();
builder.Logging.AddDebug();

var app = builder.Build();

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(options =>
    {
        options.SwaggerEndpoint("/swagger/v1/swagger.json", "Central Command Mock API v1");
        options.RoutePrefix = string.Empty; // Serve Swagger UI at root
    });
}

// Enable CORS
app.UseCors("ReactApp");

// Add exception handling middleware
app.UseExceptionHandler(appError =>
{
    appError.Run(async context =>
    {
        context.Response.StatusCode = 500;
        context.Response.ContentType = "application/json";

        var response = new
        {
            status = "error",
            error = new
            {
                code = 5001,
                message = "An internal server error occurred",
                timestamp = DateTime.UtcNow
            }
        };

        await context.Response.WriteAsJsonAsync(response);
    });
});

// Map controllers
app.MapControllers();

// Map SignalR hub
app.MapHub<MetricsHub>("/hubs/metrics");

// Map health check endpoint
app.MapHealthChecks("/health");

// Add a simple root endpoint
app.MapGet("/", () => Results.Json(new
{
    name = "Central Command Mock API",
    version = "1.0.0",
    status = "operational",
    documentation = "/swagger",
    endpoints = new
    {
        portals = "/api/v1/portals",
        incidents = "/api/v1/incidents",
        statistics = "/api/v1/statistics",
        health = "/health",
        signalr = "/hubs/metrics"
    }
}));

// Log startup information
var logger = app.Services.GetRequiredService<ILogger<Program>>();
logger.LogInformation("Central Command Mock API starting...");
logger.LogInformation($"Environment: {app.Environment.EnvironmentName}");
logger.LogInformation("CORS enabled for: http://localhost:5173, 5174, 5175, 3000");
logger.LogInformation("SignalR hub available at: /hubs/metrics");
logger.LogInformation("Swagger UI available at: http://localhost:5000");

// Initialize mock data
var mockDataService = app.Services.GetRequiredService<MockDataService>();
var portals = mockDataService.GetPortals();
var incidents = mockDataService.GetIncidents();
logger.LogInformation($"Initialized with {portals.Count} portals and {incidents.Count} incidents");

app.Run();