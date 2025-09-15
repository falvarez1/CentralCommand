using CentralCommand.MockApi.Hubs;
using CentralCommand.MockApi.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();

// Add Swagger/OpenAPI
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo
    {
        Title = "Central Command Mock API",
        Version = "v1",
        Description = "Mock API for Central Command portal management system - For development and testing purposes only"
    });
});

// Add SignalR
builder.Services.AddSignalR();

// Add CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", builder =>
    {
        builder
            .AllowAnyOrigin()
            .AllowAnyMethod()
            .AllowAnyHeader();
    });

    options.AddPolicy("AllowLocalhost", builder =>
    {
        builder
            .WithOrigins(
                "http://localhost:3000",
                "http://localhost:3001",
                "http://localhost:5173",
                "http://localhost:5174",
                "http://127.0.0.1:3000",
                "http://127.0.0.1:3001",
                "http://127.0.0.1:5173",
                "http://127.0.0.1:5174"
            )
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials();
    });
});

// Register services
builder.Services.AddSingleton<MockDataService>();
builder.Services.AddHostedService<MetricsUpdateService>();

// Configure logging
builder.Logging.ClearProviders();
builder.Logging.AddConsole();
builder.Logging.AddDebug();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "Central Command Mock API v1");
        c.RoutePrefix = "swagger";
    });

    // Redirect root to Swagger UI
    app.MapGet("/", () => Results.Redirect("/swagger")).ExcludeFromDescription();
}

// Use CORS
app.UseCors("AllowLocalhost");

app.UseRouting();

app.MapControllers();

// Map SignalR hub
app.MapHub<MetricsHub>("/hubs/metrics", options =>
{
    options.Transports = Microsoft.AspNetCore.Http.Connections.HttpTransportType.WebSockets |
                        Microsoft.AspNetCore.Http.Connections.HttpTransportType.LongPolling;
});

// Add a simple health check endpoint
app.MapGet("/health", () => Results.Ok(new
{
    status = "healthy",
    timestamp = DateTime.UtcNow,
    service = "CentralCommand.MockApi",
    version = "1.0.0"
})).WithTags("Health");

// Add environment info endpoint
app.MapGet("/info", () => Results.Ok(new
{
    environment = app.Environment.EnvironmentName,
    applicationName = builder.Environment.ApplicationName,
    timestamp = DateTime.UtcNow,
    features = new
    {
        swagger = true,
        signalR = true,
        cors = true,
        mockData = true
    }
})).WithTags("Info");

// Log startup information
var logger = app.Services.GetRequiredService<ILogger<Program>>();
logger.LogInformation("Central Command Mock API starting...");
logger.LogInformation($"Environment: {app.Environment.EnvironmentName}");
logger.LogInformation($"URLs: {builder.Configuration["ASPNETCORE_URLS"] ?? "http://localhost:5000"}");
logger.LogInformation("Swagger UI: http://localhost:5000/swagger");
logger.LogInformation("SignalR Hub: http://localhost:5000/hubs/metrics");

app.Run();