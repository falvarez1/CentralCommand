using CentralCommand.Core.Domain.Entities;
using CentralCommand.Core.Domain.Enums;
using CentralCommand.Core.Domain.ValueObjects;
using Microsoft.EntityFrameworkCore;

namespace CentralCommand.Api.Infrastructure.Data;

/// <summary>
/// Service for seeding sample data in development environment
/// </summary>
public class DataSeedingService
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<DataSeedingService> _logger;
    private readonly Random _random = new();

    public DataSeedingService(ApplicationDbContext context, ILogger<DataSeedingService> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Seeds the database with sample data
    /// </summary>
    public async Task SeedAsync()
    {
        try
        {
            _logger.LogInformation("Starting data seeding...");

            // Only seed if database is empty
            if (await _context.Portals.AnyAsync())
            {
                _logger.LogInformation("Database already contains data. Skipping seed.");
                return;
            }

            // Seed portals
            var portals = GeneratePortals(10);
            await _context.Portals.AddRangeAsync(portals);
            await _context.SaveChangesAsync();
            _logger.LogInformation($"Seeded {portals.Count} portals");

            // Seed incidents
            var incidents = GenerateIncidents(20, portals.Select(p => p.Id).ToList());
            await _context.Incidents.AddRangeAsync(incidents);
            await _context.SaveChangesAsync();
            _logger.LogInformation($"Seeded {incidents.Count} incidents");

            // Seed health checks
            var healthChecks = GenerateHealthChecks(portals);
            await _context.HealthChecks.AddRangeAsync(healthChecks);
            await _context.SaveChangesAsync();
            _logger.LogInformation($"Seeded {healthChecks.Count} health checks");

            // Seed metrics history
            var metricsHistory = GenerateMetricsHistory(portals);
            await _context.MetricsHistory.AddRangeAsync(metricsHistory);
            await _context.SaveChangesAsync();
            _logger.LogInformation($"Seeded {metricsHistory.Count} metrics history entries");

            _logger.LogInformation("Data seeding completed successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred during data seeding");
            throw;
        }
    }

    private List<Portal> GeneratePortals(int count)
    {
        var portals = new List<Portal>();
        var portalTemplates = new[]
        {
            ("Customer Portal", PortalCategory.Customer, "https://portal.company.com"),
            ("Admin Dashboard", PortalCategory.Internal, "https://admin.company.com"),
            ("Partner Gateway", PortalCategory.Partner, "https://partners.company.com"),
            ("Developer Portal", PortalCategory.Developer, "https://developers.company.com"),
            ("Support Center", PortalCategory.Support, "https://support.company.com"),
            ("Analytics Platform", PortalCategory.Internal, "https://analytics.company.com"),
            ("Vendor Portal", PortalCategory.Partner, "https://vendors.company.com"),
            ("Employee Hub", PortalCategory.Internal, "https://hub.company.com"),
            ("API Documentation", PortalCategory.Developer, "https://api-docs.company.com"),
            ("Knowledge Base", PortalCategory.Support, "https://kb.company.com")
        };

        for (int i = 0; i < Math.Min(count, portalTemplates.Length); i++)
        {
            var template = portalTemplates[i];
            var portal = new Portal
            {
                Id = Guid.NewGuid(),
                Name = template.Item1,
                Description = $"Main {template.Item1.ToLower()} for company operations",
                Url = template.Item3,
                Category = template.Item2,
                Status = GetRandomStatus(),
                IsPublic = template.Item2 == PortalCategory.Customer || template.Item2 == PortalCategory.Developer,
                RequiresAuthentication = template.Item2 != PortalCategory.Developer,
                Tags = GenerateTags(template.Item2),
                CreatedAt = DateTime.UtcNow.AddDays(-_random.Next(30, 365)),
                UpdatedAt = DateTime.UtcNow.AddDays(-_random.Next(1, 30)),
                LastHealthCheckAt = DateTime.UtcNow.AddMinutes(-_random.Next(5, 60)),
                Config = new PortalConfig
                {
                    TimeoutSeconds = 30,
                    RetryCount = 3,
                    CacheDurationMinutes = 5,
                    RateLimitPerMinute = 100,
                    CustomHeaders = new Dictionary<string, string>
                    {
                        ["X-API-Version"] = "v1",
                        ["X-Client-ID"] = Guid.NewGuid().ToString()
                    },
                    AllowedIpRanges = new List<string> { "0.0.0.0/0" },
                    EnableSsl = true,
                    SslVersion = "TLS 1.3",
                    AuthenticationMethod = template.Item2 == PortalCategory.Internal ? "OAuth2" : "ApiKey",
                    MonitoringInterval = 300,
                    AlertThreshold = 5,
                    MaintenanceWindows = new List<string>(),
                    FeatureFlags = new Dictionary<string, bool>
                    {
                        ["EnableAnalytics"] = true,
                        ["EnableNotifications"] = true,
                        ["EnableAutoRecovery"] = false
                    }
                },
                Metrics = new PortalMetrics
                {
                    Uptime = 95 + _random.NextDouble() * 4.99,
                    ResponseTime = _random.Next(50, 500),
                    ErrorRate = _random.NextDouble() * 5,
                    RequestsPerMinute = _random.Next(10, 1000),
                    AverageLoadTime = _random.Next(100, 2000),
                    TotalRequests = _random.Next(10000, 1000000),
                    TotalErrors = _random.Next(10, 1000),
                    LastDayUptime = 95 + _random.NextDouble() * 4.99,
                    LastWeekUptime = 95 + _random.NextDouble() * 4.99,
                    LastMonthUptime = 95 + _random.NextDouble() * 4.99,
                    P95ResponseTime = _random.Next(200, 1000),
                    P99ResponseTime = _random.Next(500, 2000)
                }
            };

            portals.Add(portal);
        }

        return portals;
    }

    private List<Incident> GenerateIncidents(int count, List<Guid> portalIds)
    {
        var incidents = new List<Incident>();
        var incidentTemplates = new[]
        {
            ("Database connection timeout", "PostgreSQL primary database experiencing connection timeouts", IncidentType.Database, IncidentSeverity.High),
            ("API Gateway high latency", "Response times exceeding 5 seconds for API endpoints", IncidentType.Performance, IncidentSeverity.Medium),
            ("Security vulnerability detected", "Critical CVE found in dependency package", IncidentType.Security, IncidentSeverity.Critical),
            ("Kubernetes pod crashes", "Multiple pod restarts in production cluster", IncidentType.Infrastructure, IncidentSeverity.High),
            ("Payment service outage", "Payment processing service returning 503 errors", IncidentType.Service, IncidentSeverity.Critical),
            ("Network connectivity issues", "Intermittent packet loss between data centers", IncidentType.Network, IncidentSeverity.Medium),
            ("Storage capacity warning", "Primary storage cluster at 85% capacity", IncidentType.Infrastructure, IncidentSeverity.Low),
            ("Authentication service degraded", "OAuth provider experiencing intermittent failures", IncidentType.Service, IncidentSeverity.High),
            ("Memory leak detected", "Application server memory usage continuously increasing", IncidentType.Performance, IncidentSeverity.Medium),
            ("SSL certificate expiring", "Production SSL certificate expires in 7 days", IncidentType.Security, IncidentSeverity.Low),
            ("Cache server down", "Redis cache cluster unreachable", IncidentType.Database, IncidentSeverity.High),
            ("DDoS attack detected", "Unusual traffic pattern suggesting DDoS attempt", IncidentType.Security, IncidentSeverity.Critical),
            ("Backup failure", "Nightly backup job failed for the third consecutive time", IncidentType.Infrastructure, IncidentSeverity.Medium),
            ("API rate limit exceeded", "Multiple clients exceeding rate limits", IncidentType.Performance, IncidentSeverity.Low),
            ("Load balancer misconfiguration", "Uneven traffic distribution across servers", IncidentType.Network, IncidentSeverity.Medium),
            ("Data synchronization error", "Master-slave replication lag exceeding threshold", IncidentType.Database, IncidentSeverity.High),
            ("Third-party service integration failure", "Unable to connect to external payment provider", IncidentType.Service, IncidentSeverity.Critical),
            ("Disk space critical", "Root partition at 95% capacity", IncidentType.Infrastructure, IncidentSeverity.High),
            ("Application deployment failed", "Latest deployment rollback triggered automatically", IncidentType.Service, IncidentSeverity.Medium),
            ("Monitoring system offline", "Prometheus monitoring stack unresponsive", IncidentType.Infrastructure, IncidentSeverity.High)
        };

        for (int i = 0; i < Math.Min(count, incidentTemplates.Length); i++)
        {
            var template = incidentTemplates[i];
            var createdAt = DateTime.UtcNow.AddDays(-_random.Next(1, 30));
            var isResolved = _random.NextDouble() > 0.3;
            var status = isResolved ? IncidentStatus.Resolved : GetRandomIncidentStatus();

            var incident = new Incident
            {
                Id = Guid.NewGuid(),
                Title = template.Item1,
                Description = template.Item2,
                Type = template.Item3,
                Severity = template.Item4,
                Status = status,
                Priority = MapSeverityToPriority(template.Item4),
                PortalId = portalIds[_random.Next(portalIds.Count)],
                ImpactedUsers = _random.Next(1, 10000),
                CreatedAt = createdAt,
                UpdatedAt = isResolved ? createdAt.AddHours(_random.Next(1, 24)) : DateTime.UtcNow,
                ResolvedAt = isResolved ? createdAt.AddHours(_random.Next(2, 48)) : null,
                AcknowledgedAt = status != IncidentStatus.Open ? createdAt.AddMinutes(_random.Next(5, 60)) : null,
                RootCause = isResolved ? "Configuration issue in production environment" : null,
                Resolution = isResolved ? "Applied configuration patch and restarted services" : null,
                Tags = GenerateIncidentTags(template.Item3),
                IsPublic = _random.NextDouble() > 0.5,
                NotificationsSent = status != IncidentStatus.Open,
                EscalationLevel = status == IncidentStatus.InProgress ? _random.Next(1, 3) : 0,
                TimeToResolution = isResolved ? _random.Next(30, 480) : null,
                TimeToAcknowledge = status != IncidentStatus.Open ? _random.Next(5, 60) : null
            };

            incidents.Add(incident);
        }

        return incidents;
    }

    private List<HealthCheck> GenerateHealthChecks(List<Portal> portals)
    {
        var healthChecks = new List<HealthCheck>();

        foreach (var portal in portals)
        {
            for (int i = 0; i < 5; i++)
            {
                var isHealthy = _random.NextDouble() > 0.2;
                var checkTime = DateTime.UtcNow.AddHours(-i * 4);

                var healthCheck = new HealthCheck
                {
                    Id = Guid.NewGuid(),
                    PortalId = portal.Id,
                    Status = isHealthy ? HealthStatus.Healthy : GetRandomHealthStatus(),
                    ResponseTime = _random.Next(50, isHealthy ? 500 : 5000),
                    StatusCode = isHealthy ? 200 : GetRandomErrorCode(),
                    Message = isHealthy ? "Service is healthy" : "Service experiencing issues",
                    CheckedAt = checkTime,
                    NextCheckAt = checkTime.AddMinutes(5),
                    FailureCount = isHealthy ? 0 : _random.Next(1, 5),
                    LastSuccessAt = isHealthy ? checkTime : checkTime.AddHours(-_random.Next(1, 24)),
                    CreatedAt = checkTime,
                    UpdatedAt = checkTime
                };

                healthChecks.Add(healthCheck);
            }
        }

        return healthChecks;
    }

    private List<MetricsHistory> GenerateMetricsHistory(List<Portal> portals)
    {
        var metricsHistory = new List<MetricsHistory>();

        foreach (var portal in portals)
        {
            for (int i = 0; i < 24; i++)
            {
                var timestamp = DateTime.UtcNow.AddHours(-i);

                var metrics = new MetricsHistory
                {
                    Id = Guid.NewGuid(),
                    PortalId = portal.Id,
                    Timestamp = timestamp,
                    ResponseTime = _random.Next(50, 500),
                    ErrorRate = _random.NextDouble() * 5,
                    RequestCount = _random.Next(100, 10000),
                    SuccessRate = 95 + _random.NextDouble() * 4.99,
                    AverageLoadTime = _random.Next(100, 2000),
                    CpuUsage = _random.NextDouble() * 100,
                    MemoryUsage = _random.NextDouble() * 100,
                    ActiveConnections = _random.Next(10, 1000),
                    CreatedAt = timestamp,
                    UpdatedAt = timestamp
                };

                metricsHistory.Add(metrics);
            }
        }

        return metricsHistory;
    }

    private PortalStatus GetRandomStatus()
    {
        var statuses = new[] { PortalStatus.Active, PortalStatus.Active, PortalStatus.Active,
                               PortalStatus.Degraded, PortalStatus.Maintenance };
        return statuses[_random.Next(statuses.Length)];
    }

    private IncidentStatus GetRandomIncidentStatus()
    {
        var statuses = new[] { IncidentStatus.Open, IncidentStatus.Acknowledged,
                               IncidentStatus.InProgress, IncidentStatus.InProgress };
        return statuses[_random.Next(statuses.Length)];
    }

    private HealthStatus GetRandomHealthStatus()
    {
        var statuses = new[] { HealthStatus.Unhealthy, HealthStatus.Degraded };
        return statuses[_random.Next(statuses.Length)];
    }

    private int GetRandomErrorCode()
    {
        var codes = new[] { 400, 401, 403, 404, 500, 502, 503, 504 };
        return codes[_random.Next(codes.Length)];
    }

    private IncidentPriority MapSeverityToPriority(IncidentSeverity severity)
    {
        return severity switch
        {
            IncidentSeverity.Critical => IncidentPriority.P1,
            IncidentSeverity.High => IncidentPriority.P2,
            IncidentSeverity.Medium => IncidentPriority.P3,
            IncidentSeverity.Low => IncidentPriority.P4,
            _ => IncidentPriority.P4
        };
    }

    private List<string> GenerateTags(PortalCategory category)
    {
        var baseTags = new List<string> { "production", category.ToString().ToLower() };

        if (_random.NextDouble() > 0.5)
            baseTags.Add("critical");

        if (_random.NextDouble() > 0.5)
            baseTags.Add("monitored");

        return baseTags;
    }

    private List<string> GenerateIncidentTags(IncidentType type)
    {
        var baseTags = new List<string> { type.ToString().ToLower() };

        if (_random.NextDouble() > 0.5)
            baseTags.Add("automated-detection");

        if (_random.NextDouble() > 0.5)
            baseTags.Add("customer-impact");

        return baseTags;
    }
}