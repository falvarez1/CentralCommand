using CentralCommand.Api.Configuration;
using CentralCommand.Api.Data;
using CentralCommand.Api.Data.Entities;
using CentralCommand.Api.Hubs;
using CentralCommand.Api.Middleware;
using CentralCommand.Api.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Http.Json;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Supabase;
using System.Text;
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

// Configure Supabase settings
builder.Services.Configure<SupabaseSettings>(builder.Configuration.GetSection("Supabase"));
var supabaseSettings = builder.Configuration.GetSection("Supabase").Get<SupabaseSettings>() ?? new SupabaseSettings();

// Configure Supabase client
if (!string.IsNullOrEmpty(supabaseSettings.Url) && !string.IsNullOrEmpty(supabaseSettings.AnonKey))
{
    builder.Services.AddSingleton(provider =>
    {
        var options = new SupabaseOptions
        {
            AutoRefreshToken = true,
            AutoConnectRealtime = supabaseSettings.EnableRealtime
        };

        // Use service role key if available for server-side operations
        var key = !string.IsNullOrEmpty(supabaseSettings.ServiceRoleKey)
            ? supabaseSettings.ServiceRoleKey
            : supabaseSettings.AnonKey;

        return new Supabase.Client(supabaseSettings.Url, key, options);
    });

    // Register Supabase Auth Service
    builder.Services.AddScoped<ISupabaseAuthService, SupabaseAuthService>();
}

// Configure connection string from environment variables or configuration
var connectionString = Environment.GetEnvironmentVariable("DATABASE_CONNECTION_STRING");

// Use Supabase connection string if available and Supabase is enabled
if (string.IsNullOrEmpty(connectionString) && !string.IsNullOrEmpty(supabaseSettings.ConnectionString))
{
    connectionString = supabaseSettings.ConnectionString;
}

if (string.IsNullOrEmpty(connectionString))
{
    // Build connection string from individual components
    var host = Environment.GetEnvironmentVariable("DATABASE_HOST") ?? "localhost";
    var port = Environment.GetEnvironmentVariable("DATABASE_PORT") ?? "5432";
    var database = Environment.GetEnvironmentVariable("DATABASE_NAME") ?? "centralcommand";
    var username = Environment.GetEnvironmentVariable("DATABASE_USER") ?? "postgres";
    var password = Environment.GetEnvironmentVariable("DATABASE_PASSWORD");

    if (!string.IsNullOrEmpty(password))
    {
        connectionString = $"Host={host};Port={port};Database={database};Username={username};Password={password};Include Error Detail=true";
    }
    else
    {
        // Fall back to configuration if no environment variables
        connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
    }
}

// Configure Entity Framework Core with PostgreSQL
builder.Services.AddDbContext<ApplicationDbContext>(options =>
{
    options.UseNpgsql(connectionString,
        npgsqlOptions =>
        {
            npgsqlOptions.MigrationsAssembly("CentralCommand.Api");
            npgsqlOptions.MigrationsHistoryTable("__EFMigrationsHistory", "auth");
        });
});

// Configure ASP.NET Core Identity
builder.Services.AddIdentity<ApplicationUser, IdentityRole<Guid>>(options =>
{
    // Password settings
    options.Password.RequireDigit = true;
    options.Password.RequireLowercase = true;
    options.Password.RequireUppercase = true;
    options.Password.RequireNonAlphanumeric = true;
    options.Password.RequiredLength = 8;
    options.Password.RequiredUniqueChars = 4;

    // Lockout settings
    options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(15);
    options.Lockout.MaxFailedAccessAttempts = 5;
    options.Lockout.AllowedForNewUsers = true;

    // User settings
    options.User.RequireUniqueEmail = true;
    options.User.AllowedUserNameCharacters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-._@+";

    // Sign-in settings
    options.SignIn.RequireConfirmedEmail = false; // For demo purposes
    options.SignIn.RequireConfirmedPhoneNumber = false;
    options.SignIn.RequireConfirmedAccount = false;
})
.AddEntityFrameworkStores<ApplicationDbContext>()
.AddDefaultTokenProviders();

// Configure JWT authentication from environment variables with fallback to configuration
var jwtSecret = Environment.GetEnvironmentVariable("JWT_SECRET")
    ?? builder.Configuration["JwtSettings:Secret"];

if (string.IsNullOrEmpty(jwtSecret) || jwtSecret.Length < 32)
{
    throw new InvalidOperationException("JWT Secret must be configured and at least 32 characters long. Set JWT_SECRET environment variable.");
}

var jwtIssuer = Environment.GetEnvironmentVariable("JWT_ISSUER")
    ?? builder.Configuration["JwtSettings:Issuer"]
    ?? "CentralCommand.API";

var jwtAudience = Environment.GetEnvironmentVariable("JWT_AUDIENCE")
    ?? builder.Configuration["JwtSettings:Audience"]
    ?? "CentralCommand.Client";

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.SaveToken = true;
    options.RequireHttpsMetadata = !builder.Environment.IsDevelopment() ||
        builder.Configuration.GetValue<bool>("SecuritySettings:RequireHttpsMetadata", true);
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtIssuer,
        ValidAudience = jwtAudience,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
        ClockSkew = TimeSpan.Zero
    };

    // Configure JWT bearer events for SignalR and cookie authentication
    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            // Try to get token from cookie first
            if (context.Request.Cookies.TryGetValue("access_token", out var cookieToken))
            {
                context.Token = cookieToken;
            }
            // Then check query string for SignalR
            else
            {
                var accessToken = context.Request.Query["access_token"];

                // If the request is for our hub...
                var path = context.HttpContext.Request.Path;
                if (!string.IsNullOrEmpty(accessToken) &&
                    (path.StartsWithSegments("/hubs")))
                {
                    // Read the token out of the query string
                    context.Token = accessToken;
                }
            }
            return Task.CompletedTask;
        },
        OnTokenValidated = context =>
        {
            // Additional validation - check if token is blacklisted
            var blacklistService = context.HttpContext.RequestServices.GetRequiredService<ITokenBlacklistService>();
            var jti = blacklistService.GetJtiFromPrincipal(context.Principal);

            if (!string.IsNullOrEmpty(jti) && blacklistService.IsTokenBlacklistedAsync(jti).GetAwaiter().GetResult())
            {
                context.Fail("Token has been revoked");
            }

            return Task.CompletedTask;
        }
    };
});

// Add authorization
builder.Services.AddAuthorization(options =>
{
    // Add role-based policies
    options.AddPolicy("RequireSuperAdmin", policy => policy.RequireRole("SuperAdmin"));
    options.AddPolicy("RequireAdmin", policy => policy.RequireRole("SuperAdmin", "Admin"));
    options.AddPolicy("RequireManager", policy => policy.RequireRole("SuperAdmin", "Admin", "Manager"));
    options.AddPolicy("RequireDeveloper", policy => policy.RequireRole("SuperAdmin", "Admin", "Manager", "Developer"));
    options.AddPolicy("RequireAnalyst", policy => policy.RequireRole("SuperAdmin", "Admin", "Manager", "Developer", "Analyst"));
    options.AddPolicy("RequireViewer", policy => policy.RequireRole("SuperAdmin", "Admin", "Manager", "Developer", "Analyst", "Viewer"));
});

// Register application services
builder.Services.AddScoped<IJwtTokenService, JwtTokenService>();
builder.Services.AddSingleton<ICsrfProtectionService, CsrfProtectionService>();
builder.Services.AddSingleton<ITokenBlacklistService, TokenBlacklistService>();

// Add memory cache for rate limiting and CSRF tokens
builder.Services.AddMemoryCache();

// Configure antiforgery for CSRF protection
builder.Services.AddAntiforgery(options =>
{
    options.HeaderName = "X-CSRF-Token";
    options.Cookie.Name = "__Host-X-CSRF-TOKEN";
    options.Cookie.HttpOnly = true;
    options.Cookie.SecurePolicy = builder.Environment.IsDevelopment()
        ? CookieSecurePolicy.SameAsRequest
        : CookieSecurePolicy.Always;
    options.Cookie.SameSite = SameSiteMode.Strict;
});

// Add API documentation
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Central Command API",
        Version = "v1",
        Description = "Production API for Central Command portal management system with authentication"
    });

    // Add JWT authentication to Swagger
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Enter 'Bearer' [space] and then your token in the text input below.",
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

// Add SignalR
builder.Services.AddSignalR()
    .AddJsonProtocol(options =>
    {
        options.PayloadSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
        options.PayloadSerializerOptions.Converters.Add(new JsonStringEnumConverter(JsonNamingPolicy.CamelCase));
    });

// Configure CORS with environment-based allowed origins
var corsOrigins = Environment.GetEnvironmentVariable("CORS_ALLOWED_ORIGINS")?.Split(',')
    ?? new[] { "http://localhost:5173", "https://localhost:5173" };

builder.Services.AddCors(options =>
{
    options.AddPolicy("ReactApp", policy =>
    {
        if (builder.Environment.IsDevelopment())
        {
            // Allow any localhost port for development
            policy.SetIsOriginAllowed(origin =>
                {
                    var uri = new Uri(origin);
                    return uri.Host == "localhost" || uri.Host == "127.0.0.1";
                })
                .AllowAnyMethod()
                .AllowAnyHeader()
                .AllowCredentials() // Required for SignalR and cookies
                .WithExposedHeaders("X-CSRF-Token"); // Expose CSRF token header
        }
        else
        {
            // Use specific origins in production
            policy.WithOrigins(corsOrigins)
                .AllowAnyMethod()
                .AllowAnyHeader()
                .AllowCredentials()
                .WithExposedHeaders("X-CSRF-Token"); // Expose CSRF token header
        }
    });
});

// Register application services
builder.Services.AddScoped<StatisticsService>();
builder.Services.AddHostedService<TokenCleanupService>();

// Add health checks
builder.Services.AddHealthChecks()
    .AddDbContextCheck<ApplicationDbContext>("database");

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
        options.SwaggerEndpoint("/swagger/v1/swagger.json", "Central Command API v1");
        options.RoutePrefix = string.Empty; // Serve Swagger UI at root
    });
}

// Add security headers middleware (should be early in pipeline)
if (builder.Configuration.GetValue<bool>("SecuritySettings:EnableSecurityHeaders", true))
{
    app.UseSecurityHeaders();
}

// Add rate limiting middleware
if (builder.Configuration.GetValue<bool>("SecuritySettings:EnableRateLimiting", true))
{
    app.UseRateLimiting();
}

// Enable CORS
app.UseCors("ReactApp");

// Use HTTPS redirection in production
if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
    app.UseHsts();
}

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

// Add authentication and authorization
app.UseAuthentication();
app.UseAuthorization();

// Map controllers
app.MapControllers();

// Map SignalR hub
app.MapHub<MetricsHub>("/hubs/metrics");

// Map health check endpoint
app.MapHealthChecks("/health");

// Add a simple root endpoint
app.MapGet("/", () => Results.Json(new
{
    name = "Central Command API",
    version = "1.0.0",
    status = "operational",
    documentation = "/swagger",
    authentication = new
    {
        login = "/api/auth/login",
        register = "/api/auth/register",
        refresh = "/api/auth/refresh",
        logout = "/api/auth/logout"
    },
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
logger.LogInformation("Central Command API starting...");
logger.LogInformation($"Environment: {app.Environment.EnvironmentName}");
logger.LogInformation("CORS enabled for: http://localhost:* (any port)");
logger.LogInformation("SignalR hub available at: /hubs/metrics");
logger.LogInformation("Swagger UI available at: http://localhost:5000");
logger.LogInformation("Authentication: JWT Bearer tokens enabled");

// Apply database migrations and seed data in development
if (app.Environment.IsDevelopment())
{
    using (var scope = app.Services.CreateScope())
    {
        var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        try
        {
            // Check if we can connect to the database
            if (await dbContext.Database.CanConnectAsync())
            {
                logger.LogInformation("Applying database migrations...");
                await dbContext.Database.MigrateAsync();
                logger.LogInformation("Database migrations applied successfully");
            }
            else
            {
                logger.LogWarning("Cannot connect to database. Skipping migrations. Make sure PostgreSQL is running.");
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "An error occurred while migrating the database. Make sure PostgreSQL is installed and running.");
        }
    }
}

// Ready to serve requests
logger.LogInformation("API is ready to handle requests");

app.Run();