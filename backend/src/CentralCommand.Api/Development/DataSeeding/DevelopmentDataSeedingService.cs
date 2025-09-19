using CentralCommand.Core.Domain.Entities;
using CentralCommand.Core.Domain.Enums;
using CentralCommand.Core.Domain.ValueObjects;
using CentralCommand.Core.Interfaces.Repositories;
using CentralCommand.Core.Interfaces.Services;

namespace CentralCommand.Api.Development.DataSeeding;

/// <summary>
/// Implementation of data seeding for development environment
/// </summary>
public class DevelopmentDataSeedingService : IDataSeedingService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<DevelopmentDataSeedingService> _logger;
    private readonly Random _random = new();

    public DevelopmentDataSeedingService(
        IUnitOfWork unitOfWork,
        ILogger<DevelopmentDataSeedingService> logger)
    {
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    /// <summary>
    /// Seeds the database with sample data
    /// </summary>
    public async Task SeedAsync(int? count = null, CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogInformation("Starting data seeding...");

            if (!await IsDatabaseEmptyAsync(cancellationToken))
            {
                _logger.LogInformation("Database already contains data. Skipping seed.");
                return;
            }

            var portalCount = count ?? 10;

            await _unitOfWork.ExecuteInTransactionAsync(async () =>
            {
                var portals = GeneratePortals(portalCount);
                foreach (var portal in portals)
                {
                    await _unitOfWork.Portals.AddAsync(portal, cancellationToken);
                }
                await _unitOfWork.SaveChangesAsync(cancellationToken);
                _logger.LogInformation($"Seeded {portals.Count} portals");

                var incidents = GenerateIncidents(portalCount * 2, portals.Select(p => p.Id).ToList());
                foreach (var incident in incidents)
                {
                    await _unitOfWork.Incidents.AddAsync(incident, cancellationToken);
                }
                await _unitOfWork.SaveChangesAsync(cancellationToken);
                _logger.LogInformation($"Seeded {incidents.Count} incidents");

                var healthChecks = GenerateHealthChecks(portals);
                foreach (var healthCheck in healthChecks)
                {
                    await _unitOfWork.HealthChecks.AddAsync(healthCheck, cancellationToken);
                }
                await _unitOfWork.SaveChangesAsync(cancellationToken);
                _logger.LogInformation($"Seeded {healthChecks.Count} health checks");

                var metricsHistory = GenerateMetricsHistory(portals);
                foreach (var metric in metricsHistory)
                {
                    await _unitOfWork.MetricsHistory.AddAsync(metric, cancellationToken);
                }
                await _unitOfWork.SaveChangesAsync(cancellationToken);
                _logger.LogInformation($"Seeded {metricsHistory.Count} metrics history entries");

                return true;
            }, cancellationToken);

            _logger.LogInformation("Data seeding completed successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred during data seeding");
            throw;
        }
    }

    /// <summary>
    /// Checks if the database is empty
    /// </summary>
    public async Task<bool> IsDatabaseEmptyAsync(CancellationToken cancellationToken = default)
    {
        var portalCount = await _unitOfWork.Portals.CountAsync(null, cancellationToken);
        return portalCount == 0;
    }

    private List<Portal> GeneratePortals(int count)
    {
        var portals = new List<Portal>();
        var portalTemplates = new[]
        {
            ("Customer Portal", PortalCategory.Business, "https://portal.company.com"),
            ("Admin Dashboard", PortalCategory.Operations, "https://admin.company.com"),
            ("Engineering Gateway", PortalCategory.Engineering, "https://eng.company.com"),
            ("Developer Portal", PortalCategory.Development, "https://developers.company.com"),
            ("Support Center", PortalCategory.Support, "https://support.company.com"),
            ("Analytics Platform", PortalCategory.Analytics, "https://analytics.company.com"),
            ("Monitoring Hub", PortalCategory.Monitoring, "https://monitoring.company.com"),
            ("Services Portal", PortalCategory.Services, "https://services.company.com"),
            ("Infrastructure Dashboard", PortalCategory.Infrastructure, "https://infra.company.com"),
            ("Database Admin", PortalCategory.Databases, "https://db.company.com"),
            ("Security Portal", PortalCategory.Security, "https://security.company.com"),
            ("Communication Hub", PortalCategory.Communication, "https://comm.company.com"),
            ("Resource Center", PortalCategory.Support, "https://resources.company.com"),
            ("Integration Platform", PortalCategory.Development, "https://integrations.company.com"),
            ("Business Tools", PortalCategory.Business, "https://business.company.com")
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
                Config = new PortalConfig
                {
                    HealthCheckEndpoint = $"{template.Item3}/health",
                    HealthCheckInterval = _random.Next(30, 300),
                    Timeout = _random.Next(3000, 10000),
                    RetryAttempts = _random.Next(1, 5),
                    RetryDelay = _random.Next(500, 2000),
                    CustomHeaders = new Dictionary<string, string>
                    {
                        ["X-API-Key"] = Guid.NewGuid().ToString(),
                        ["User-Agent"] = "CentralCommand/1.0"
                    },
                    EnableMonitoring = true,
                    EnableAlerts = _random.Next(0, 2) == 1
                },
                Metrics = new PortalMetrics
                {
                    Uptime = 95 + _random.NextDouble() * 4.99,
                    ResponseTime = _random.Next(50, 500),
                    RequestsPerMinute = _random.Next(10, 1000),
                    ErrorRate = _random.NextDouble() * 5,
                    LastUpdated = DateTime.UtcNow
                },
                CreatedAt = DateTime.UtcNow.AddDays(-_random.Next(1, 365)),
                UpdatedAt = DateTime.UtcNow.AddDays(-_random.Next(0, 30))
            };

            portal.Owner = Guid.NewGuid();
            portal.SetTags(GenerateTags(portal.Category));
            portal.Environment = _random.Next(0, 3) switch
            {
                0 => PortalEnvironment.Production,
                1 => PortalEnvironment.Staging,
                _ => PortalEnvironment.Development
            };

            portals.Add(portal);
        }

        return portals;
    }

    private List<Incident> GenerateIncidents(int count, List<Guid> portalIds)
    {
        var incidents = new List<Incident>();
        var incidentTitles = new[]
        {
            "Login service unavailable",
            "Database connection timeout",
            "High CPU usage detected",
            "SSL certificate expiring soon",
            "API rate limit exceeded",
            "Memory leak detected",
            "Slow response times",
            "Authentication failures",
            "Data sync issues",
            "Service degradation"
        };

        for (int i = 0; i < count; i++)
        {
            var title = incidentTitles[_random.Next(incidentTitles.Length)];
            var incident = new Incident
            {
                Id = Guid.NewGuid(),
                AffectedPortals = System.Text.Json.JsonSerializer.Serialize(new[] { portalIds[_random.Next(portalIds.Count)] }),
                Title = title,
                Description = $"Detailed description of {title.ToLower()}. This incident requires immediate attention.",
                Status = GetRandomIncidentStatus(),
                Priority = GetRandomPriority(),
                CreatedAt = DateTime.UtcNow.AddDays(-_random.Next(0, 90)),
                UpdatedAt = DateTime.UtcNow.AddDays(-_random.Next(0, 7)),
                ReportedBy = Guid.NewGuid(),
                ReporterEmail = $"user{_random.Next(1, 100)}@company.com",
                AssignedTo = _random.Next(0, 2) == 0 ? null : $"engineer{_random.Next(1, 20)}@company.com",
                Tags = System.Text.Json.JsonSerializer.Serialize(new[] { "auto-generated", GetSeverityTag() })
            };

            if (incident.Status == IncidentStatus.Resolved)
            {
                incident.ResolvedAt = incident.UpdatedAt;
            }

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
                var healthCheck = new HealthCheck
                {
                    Id = Guid.NewGuid(),
                    PortalId = portal.Id,
                    Endpoint = portal.Url,
                    LastChecked = DateTime.UtcNow.AddHours(-i * 6),
                    Status = GetRandomHealthCheckStatus(),
                    LastResponseTime = _random.Next(50, 2000),
                    LastStatus = GetRandomStatus(),
                    ConsecutiveFailures = _random.Next(0, 3)
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
            for (int i = 0; i < 10; i++)
            {
                var metrics = new MetricsHistory
                {
                    Id = Guid.NewGuid(),
                    PortalId = portal.Id,
                    CreatedAt = DateTime.UtcNow.AddDays(-i),
                UpdatedAt = DateTime.UtcNow.AddDays(-i),
                    Metrics = new PortalMetrics
                    {
                        Uptime = 95 + _random.NextDouble() * 4.99,
                        ResponseTime = _random.Next(50, 500),
                            RequestsPerMinute = _random.Next(10, 1000),
                        ErrorRate = _random.NextDouble() * 5,
                        LastUpdated = DateTime.UtcNow.AddDays(-i)
                    }
                };

                metricsHistory.Add(metrics);
            }
        }

        return metricsHistory;
    }

    private PortalStatus GetRandomStatus()
    {
        return _random.Next(0, 10) switch
        {
            < 6 => PortalStatus.Healthy,
            < 7 => PortalStatus.Active,
            < 8 => PortalStatus.Degraded,
            < 9 => PortalStatus.Maintenance,
            _ => PortalStatus.Down
        };
    }

    private IncidentStatus GetRandomIncidentStatus()
    {
        return _random.Next(0, 10) switch
        {
            < 2 => IncidentStatus.Open,
            < 4 => IncidentStatus.InProgress,
            < 7 => IncidentStatus.Resolved,
            < 9 => IncidentStatus.Closed,
            _ => IncidentStatus.Closed
        };
    }

    private IncidentPriority GetRandomPriority()
    {
        return _random.Next(0, 10) switch
        {
            < 2 => IncidentPriority.Critical,
            < 4 => IncidentPriority.High,
            < 7 => IncidentPriority.Medium,
            _ => IncidentPriority.Low
        };
    }

    private HealthCheckStatus GetRandomHealthCheckStatus()
    {
        return _random.Next(0, 10) switch
        {
            < 7 => HealthCheckStatus.Healthy,
            < 9 => HealthCheckStatus.Degraded,
            _ => HealthCheckStatus.Unhealthy
        };
    }

    private List<string> GenerateFeatures()
    {
        var allFeatures = new[] { "SSO", "2FA", "API", "Webhooks", "Reports", "Analytics", "Notifications", "Audit", "Export" };
        var featureCount = _random.Next(3, 7);
        return allFeatures.OrderBy(_ => _random.Next()).Take(featureCount).ToList();
    }

    private List<string> GenerateTags(PortalCategory category)
    {
        var baseTags = new List<string> { category.ToString().ToLower() };
        var additionalTags = new[] { "production", "critical", "monitored", "public", "private", "beta", "legacy" };
        var tagCount = _random.Next(1, 4);
        baseTags.AddRange(additionalTags.OrderBy(_ => _random.Next()).Take(tagCount));
        return baseTags;
    }

    private string GetSeverityTag()
    {
        return _random.Next(0, 4) switch
        {
            0 => "critical",
            1 => "high",
            2 => "medium",
            _ => "low"
        };
    }
}