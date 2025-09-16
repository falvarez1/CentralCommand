using System;
using System.Text;
using System.Threading.RateLimiting;
using CentralCommand.Api.Extensions;
using CentralCommand.Api.Hubs;
using CentralCommand.Api.Infrastructure.BackgroundServices;
using CentralCommand.Api.Infrastructure.Caching;
using CentralCommand.Api.Infrastructure.Data;
using CentralCommand.Api.Infrastructure.Middleware;
using CentralCommand.Api.Infrastructure.Services;
using CentralCommand.Api.Repositories;
using CentralCommand.Api.Services;
using CentralCommand.Core.Interfaces.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.AspNetCore.ResponseCompression;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Serilog;

var builder = WebApplication.CreateBuilder(args);

// Configure Serilog
Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .Enrich.FromLogContext()
    .WriteTo.Console()
    .WriteTo.File("logs/centralcommand-.txt", rollingInterval: RollingInterval.Day)
    .CreateLogger();

builder.Host.UseSerilog();

// Add services to the container
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Central Command API",
        Version = "v1",
        Description = "Enterprise Portal Management System API",
        Contact = new OpenApiContact
        {
            Name = "Central Command Team",
            Email = "support@centralcommand.com"
        }
    });

    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

// Configure CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp", policy =>
    {
        policy.WithOrigins(
                builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? new[] { "http://localhost:3000" })
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials();
    });
});

// Configure Authentication
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(builder.Configuration["Jwt:SecretKey"] ?? throw new InvalidOperationException("JWT Secret Key not configured"))),
            ClockSkew = TimeSpan.Zero
        };

        // Support SignalR authentication
        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                var accessToken = context.Request.Query["access_token"];
                var path = context.HttpContext.Request.Path;

                if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs"))
                {
                    context.Token = accessToken;
                }

                return Task.CompletedTask;
            }
        };
    });

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("PortalRead", policy =>
        policy.RequireClaim("permissions", "portal:read"));

    options.AddPolicy("PortalWrite", policy =>
        policy.RequireClaim("permissions", "portal:write"));

    options.AddPolicy("IncidentManage", policy =>
        policy.RequireClaim("permissions", "incident:manage"));

    options.AddPolicy("AdminOnly", policy =>
        policy.RequireRole("Admin"));
});

// Configure Entity Framework
builder.Services.AddDbContext<ApplicationDbContext>(options =>
{
    options.UseSqlServer(
        builder.Configuration.GetConnectionString("DefaultConnection"),
        sqlOptions =>
        {
            sqlOptions.EnableRetryOnFailure(
                maxRetryCount: 3,
                maxRetryDelay: TimeSpan.FromSeconds(10),
                errorNumbersToAdd: null);
            sqlOptions.CommandTimeout(30);
        });

    if (builder.Environment.IsDevelopment())
    {
        options.EnableSensitiveDataLogging();
        options.EnableDetailedErrors();
    }
});

// Configure Redis caching
builder.Services.AddStackExchangeRedisCache(options =>
{
    options.Configuration = builder.Configuration.GetConnectionString("Redis");
    options.InstanceName = "CentralCommand";
});

// Configure in-memory caching
builder.Services.AddMemoryCache();

// Configure response caching
builder.Services.AddResponseCaching();

// Configure response compression
builder.Services.AddResponseCompression(options =>
{
    options.EnableForHttps = true;
    options.Providers.Add<BrotliCompressionProvider>();
    options.Providers.Add<GzipCompressionProvider>();
});

// Configure rate limiting
builder.Services.AddRateLimiter(options =>
{
    options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(
        httpContext => RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: httpContext.User?.Identity?.Name ?? httpContext.Connection.RemoteIpAddress?.ToString() ?? "anonymous",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                AutoReplenishment = true,
                PermitLimit = 100,
                Window = TimeSpan.FromMinutes(1)
            }));

    options.AddPolicy("ApiKeyPolicy", httpContext =>
        RateLimitPartition.GetSlidingWindowLimiter(
            partitionKey: httpContext.Request.Headers["X-API-Key"].ToString(),
            factory: _ => new SlidingWindowRateLimiterOptions
            {
                PermitLimit = 1000,
                Window = TimeSpan.FromMinutes(1),
                SegmentsPerWindow = 4,
                AutoReplenishment = true
            }));

    options.OnRejected = async (context, token) =>
    {
        context.HttpContext.Response.StatusCode = StatusCodes.Status429TooManyRequests;

        if (context.Lease.TryGetMetadata(MetadataName.RetryAfter, out var retryAfter))
        {
            context.HttpContext.Response.Headers.RetryAfter = retryAfter.TotalSeconds.ToString();
        }

        await context.HttpContext.Response.WriteAsJsonAsync(new
        {
            type = "https://tools.ietf.org/html/rfc6585#section-4",
            title = "Too Many Requests",
            status = StatusCodes.Status429TooManyRequests,
            detail = "Rate limit exceeded. Please retry after some time.",
            instance = context.HttpContext.Request.Path
        }, cancellationToken: token);
    };
});

// Configure SignalR
builder.Services.AddSignalR(options =>
{
    options.EnableDetailedErrors = builder.Environment.IsDevelopment();
    options.KeepAliveInterval = TimeSpan.FromSeconds(15);
    options.ClientTimeoutInterval = TimeSpan.FromSeconds(30);
    options.MaximumReceiveMessageSize = 32 * 1024; // 32KB
})
.AddJsonProtocol(options =>
{
    options.PayloadSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
});

// Configure Health Checks
builder.Services.AddHealthChecks()
    .AddDbContextCheck<ApplicationDbContext>("database");
    // TODO: Add Redis health check when Redis package is installed
    // .AddRedis(builder.Configuration.GetConnectionString("Redis") ?? string.Empty, name: "redis");

// Register application services
builder.Services.AddScoped<CentralCommand.Core.Interfaces.Services.IPortalService, CentralCommand.Api.Services.PortalService>();
builder.Services.AddScoped<CentralCommand.Core.Interfaces.Services.IIncidentService, CentralCommand.Api.Services.IncidentService>();
builder.Services.AddScoped<CentralCommand.Core.Interfaces.Services.IStatisticsService, CentralCommand.Api.Services.StatisticsService>();
builder.Services.AddScoped<CentralCommand.Core.Interfaces.Services.ICommandService, CentralCommand.Api.Services.CommandService>();
builder.Services.AddScoped<CentralCommand.Core.Interfaces.Services.IUserPreferencesService, CentralCommand.Api.Services.UserPreferencesService>();

// Register infrastructure services
builder.Services.AddScoped<IPortalRepository, PortalRepository>();
builder.Services.AddScoped<IIncidentRepository, IncidentRepository>();
builder.Services.AddSingleton<ICacheService, HybridCacheService>();
builder.Services.AddSingleton<IConnectionManager, ConnectionManager>();
builder.Services.AddScoped<IMetricsCollector, MetricsCollector>();
builder.Services.AddSingleton<IEventBus, InMemoryEventBus>();

// Register background services
builder.Services.AddHostedService<MetricsCollectionService>();
builder.Services.AddHostedService<HealthCheckService>();
builder.Services.AddHostedService<CacheWarmupService>();

// Configure API versioning
builder.Services.AddApiVersioning(options =>
{
    options.DefaultApiVersion = new Microsoft.AspNetCore.Mvc.ApiVersion(1, 0);
    options.AssumeDefaultVersionWhenUnspecified = true;
    options.ReportApiVersions = true;
});

builder.Services.AddVersionedApiExplorer(options =>
{
    options.GroupNameFormat = "'v'VVV";
    options.SubstituteApiVersionInUrl = true;
});


// Configure HttpClient
builder.Services.AddHttpClient<IMetricsCollector, MetricsCollector>()
    .ConfigurePrimaryHttpMessageHandler(() => new SocketsHttpHandler
    {
        PooledConnectionLifetime = TimeSpan.FromMinutes(5),
        PooledConnectionIdleTimeout = TimeSpan.FromMinutes(2),
        MaxConnectionsPerServer = 50
    });

var app = builder.Build();

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "Central Command API v1");
        c.RoutePrefix = string.Empty;
    });
}
else
{
    app.UseExceptionHandler("/error");
    app.UseHsts();
}

// Global error handler
app.UseMiddleware<GlobalExceptionHandlingMiddleware>();

// Request logging
app.UseSerilogRequestLogging(options =>
{
    options.MessageTemplate = "HTTP {RequestMethod} {RequestPath} responded {StatusCode} in {Elapsed:0.0000} ms";
});

app.UseHttpsRedirection();
app.UseResponseCompression();
app.UseCors("AllowReactApp");
app.UseAuthentication();
app.UseAuthorization();
app.UseRateLimiter();
app.UseResponseCaching();

// Map health checks
app.MapHealthChecks("/health");
app.MapHealthChecks("/health/ready", new Microsoft.AspNetCore.Diagnostics.HealthChecks.HealthCheckOptions
{
    Predicate = check => check.Tags.Contains("ready")
});
app.MapHealthChecks("/health/live", new Microsoft.AspNetCore.Diagnostics.HealthChecks.HealthCheckOptions
{
    Predicate = _ => false
});

// Map API endpoints
var apiGroup = app.MapGroup("/api/v{version:apiVersion}")
    .RequireAuthorization()
    .WithOpenApi();

// Portal endpoints
// TODO: Uncomment when MapPortalEndpoints is implemented
// apiGroup.MapGroup("/portals")
//     .MapPortalEndpoints()
//     .WithTags("Portals")
//     .RequireAuthorization("PortalRead");

// Incident endpoints
// TODO: Uncomment when MapIncidentEndpoints is implemented
// apiGroup.MapGroup("/incidents")
//     .MapIncidentEndpoints()
//     .WithTags("Incidents")
//     .RequireAuthorization("IncidentManage");

// Statistics endpoints
// TODO: Uncomment when MapStatisticsEndpoints is implemented
// apiGroup.MapGroup("/statistics")
//     .MapStatisticsEndpoints()
//     .WithTags("Statistics")
//     .RequireAuthorization("PortalRead");

// Command palette endpoints
// TODO: Uncomment when MapCommandEndpoints is implemented
// apiGroup.MapGroup("/commands")
//     .MapCommandEndpoints()
//     .WithTags("Commands")
//     .RequireAuthorization();

// User preference endpoints
// TODO: Uncomment when MapUserEndpoints is implemented
// apiGroup.MapGroup("/users/me")
//     .MapUserEndpoints()
//     .WithTags("User")
//     .RequireAuthorization();

// Map SignalR hubs
app.MapHub<MetricsHub>("/hubs/metrics");

// Ensure database is created and migrations are applied
using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    if (app.Environment.IsDevelopment())
    {
        await dbContext.Database.EnsureCreatedAsync();
    }
    else
    {
        await dbContext.Database.MigrateAsync();
    }
}

app.Run();

// Make Program class accessible for testing
public partial class Program { }