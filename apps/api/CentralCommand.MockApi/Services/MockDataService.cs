using Bogus;
using CentralCommand.MockApi.Models;

namespace CentralCommand.MockApi.Services;

public class MockDataService
{
    private readonly List<Portal> _portals = new();
    private readonly List<Incident> _incidents = new();
    private readonly Faker _faker = new();

    public MockDataService()
    {
        InitializePortals();
        InitializeIncidents();
    }

    private void InitializePortals()
    {
        var portalFaker = new Faker<Portal>()
            .RuleFor(p => p.Id, f => Guid.NewGuid().ToString())
            .RuleFor(p => p.Name, f => f.Company.CompanyName() + " Portal")
            .RuleFor(p => p.Url, f => f.Internet.Url())
            .RuleFor(p => p.Status, f => f.PickRandom("operational", "degraded", "down", "maintenance"))
            .RuleFor(p => p.Environment, f => f.PickRandom("production", "staging", "development", "qa"))
            .RuleFor(p => p.Category, f => f.PickRandom("sales", "hr", "finance", "operations", "it", "marketing"))
            .RuleFor(p => p.Description, f => f.Lorem.Sentence())
            .RuleFor(p => p.IsFavorite, f => f.Random.Bool(0.3f))
            .RuleFor(p => p.Metrics, f => new PortalMetrics
            {
                ResponseTime = f.Random.Double(50, 2000),
                Uptime = f.Random.Double(95, 99.99),
                ErrorRate = f.Random.Int(0, 5),
                ActiveUsers = f.Random.Int(10, 5000),
                CpuUsage = f.Random.Double(10, 90),
                MemoryUsage = f.Random.Double(20, 85),
                LastChecked = DateTime.UtcNow.AddMinutes(-f.Random.Int(0, 5))
            })
            .RuleFor(p => p.CreatedAt, f => f.Date.Past(2))
            .RuleFor(p => p.UpdatedAt, f => f.Date.Recent(30));

        // Add some well-known portals for consistency
        _portals.AddRange(new[]
        {
            new Portal
            {
                Id = "portal-1",
                Name = "Customer Portal",
                Url = "https://customers.centralcommand.com",
                Status = "operational",
                Environment = "production",
                Category = "sales",
                Description = "Main customer-facing portal for account management",
                IsFavorite = true,
                Metrics = new PortalMetrics
                {
                    ResponseTime = 245.5,
                    Uptime = 99.95,
                    ErrorRate = 0,
                    ActiveUsers = 3421,
                    CpuUsage = 45.2,
                    MemoryUsage = 62.1
                }
            },
            new Portal
            {
                Id = "portal-2",
                Name = "Employee Portal",
                Url = "https://employees.centralcommand.com",
                Status = "operational",
                Environment = "production",
                Category = "hr",
                Description = "Internal employee self-service portal",
                IsFavorite = true,
                Metrics = new PortalMetrics
                {
                    ResponseTime = 180.3,
                    Uptime = 99.98,
                    ErrorRate = 0,
                    ActiveUsers = 892,
                    CpuUsage = 28.5,
                    MemoryUsage = 41.7
                }
            },
            new Portal
            {
                Id = "portal-3",
                Name = "Admin Dashboard",
                Url = "https://admin.centralcommand.com",
                Status = "degraded",
                Environment = "production",
                Category = "it",
                Description = "System administration and monitoring dashboard",
                IsFavorite = false,
                Metrics = new PortalMetrics
                {
                    ResponseTime = 890.2,
                    Uptime = 98.5,
                    ErrorRate = 3,
                    ActiveUsers = 45,
                    CpuUsage = 78.9,
                    MemoryUsage = 85.3
                }
            }
        });

        // Generate additional random portals
        _portals.AddRange(portalFaker.Generate(33));
    }

    private void InitializeIncidents()
    {
        var incidentFaker = new Faker<Incident>()
            .RuleFor(i => i.Id, f => Guid.NewGuid().ToString())
            .RuleFor(i => i.Title, f => f.PickRandom(
                "Database connection timeout",
                "High memory usage detected",
                "API response time degradation",
                "Authentication service failure",
                "Disk space warning",
                "SSL certificate expiring",
                "Backup job failed",
                "Network latency spike",
                "Service unavailable error",
                "Cache invalidation issue"
            ))
            .RuleFor(i => i.Description, f => f.Lorem.Paragraph())
            .RuleFor(i => i.Severity, f => f.PickRandom("critical", "high", "medium", "low"))
            .RuleFor(i => i.Status, f => f.PickRandom("open", "investigating", "resolved", "closed"))
            .RuleFor(i => i.AffectedService, f => f.PickRandom(_portals).Name)
            .RuleFor(i => i.AssignedTo, f => f.Name.FullName())
            .RuleFor(i => i.ReportedBy, f => f.Name.FullName())
            .RuleFor(i => i.CreatedAt, f => f.Date.Recent(7))
            .RuleFor(i => i.UpdatedAt, (f, i) => i.CreatedAt.AddHours(f.Random.Double(0, 24)))
            .RuleFor(i => i.ResolvedAt, (f, i) => i.Status == "resolved" || i.Status == "closed"
                ? i.UpdatedAt.AddHours(f.Random.Double(1, 12))
                : null)
            .RuleFor(i => i.Tags, f => f.Make(f.Random.Int(1, 4), () =>
                f.PickRandom("network", "database", "performance", "security", "infrastructure", "application")))
            .RuleFor(i => i.Comments, f => f.Make(f.Random.Int(0, 3), () => new IncidentComment
            {
                Id = Guid.NewGuid().ToString(),
                Author = f.Name.FullName(),
                Content = f.Lorem.Sentence(),
                CreatedAt = f.Date.Recent(1)
            }));

        // Add some specific incidents
        _incidents.AddRange(new[]
        {
            new Incident
            {
                Id = "incident-1",
                Title = "Customer Portal - High Response Time",
                Description = "Customer portal experiencing response times over 2 seconds. Users reporting slow page loads.",
                Severity = "high",
                Status = "investigating",
                AffectedService = "Customer Portal",
                AssignedTo = "John Smith",
                ReportedBy = "Monitoring System",
                CreatedAt = DateTime.UtcNow.AddHours(-2),
                UpdatedAt = DateTime.UtcNow.AddMinutes(-15),
                Tags = new List<string> { "performance", "customer-impact" }
            },
            new Incident
            {
                Id = "incident-2",
                Title = "Database Connection Pool Exhausted",
                Description = "Primary database connection pool reaching maximum capacity during peak hours.",
                Severity = "critical",
                Status = "open",
                AffectedService = "Admin Dashboard",
                AssignedTo = "Sarah Johnson",
                ReportedBy = "DevOps Team",
                CreatedAt = DateTime.UtcNow.AddMinutes(-30),
                UpdatedAt = DateTime.UtcNow.AddMinutes(-5),
                Tags = new List<string> { "database", "infrastructure" }
            }
        });

        // Generate additional random incidents
        _incidents.AddRange(incidentFaker.Generate(13));
    }

    public List<Portal> GetPortals() => _portals;
    public Portal? GetPortal(string id) => _portals.FirstOrDefault(p => p.Id == id);

    public Portal CreatePortal(Portal portal)
    {
        portal.Id = Guid.NewGuid().ToString();
        portal.CreatedAt = DateTime.UtcNow;
        portal.UpdatedAt = DateTime.UtcNow;
        _portals.Add(portal);
        return portal;
    }

    public Portal? UpdatePortal(string id, Portal updatedPortal)
    {
        var portal = _portals.FirstOrDefault(p => p.Id == id);
        if (portal == null) return null;

        portal.Name = updatedPortal.Name;
        portal.Url = updatedPortal.Url;
        portal.Status = updatedPortal.Status;
        portal.Environment = updatedPortal.Environment;
        portal.Category = updatedPortal.Category;
        portal.Description = updatedPortal.Description;
        portal.IsFavorite = updatedPortal.IsFavorite;
        portal.UpdatedAt = DateTime.UtcNow;

        return portal;
    }

    public bool DeletePortal(string id)
    {
        var portal = _portals.FirstOrDefault(p => p.Id == id);
        if (portal == null) return false;
        return _portals.Remove(portal);
    }

    public void UpdatePortalMetrics(string id)
    {
        var portal = _portals.FirstOrDefault(p => p.Id == id);
        if (portal == null) return;

        var faker = new Faker();
        portal.Metrics = new PortalMetrics
        {
            ResponseTime = faker.Random.Double(50, 2000),
            Uptime = faker.Random.Double(95, 99.99),
            ErrorRate = faker.Random.Int(0, 5),
            ActiveUsers = faker.Random.Int(10, 5000),
            CpuUsage = faker.Random.Double(10, 90),
            MemoryUsage = faker.Random.Double(20, 85),
            LastChecked = DateTime.UtcNow
        };
        portal.UpdatedAt = DateTime.UtcNow;
    }

    public List<Incident> GetIncidents() => _incidents;

    public Incident? GetIncident(string id) => _incidents.FirstOrDefault(i => i.Id == id);

    public Incident CreateIncident(Incident incident)
    {
        incident.Id = Guid.NewGuid().ToString();
        incident.CreatedAt = DateTime.UtcNow;
        incident.UpdatedAt = DateTime.UtcNow;
        _incidents.Add(incident);
        return incident;
    }

    public Statistics GetStatistics()
    {
        var stats = new Statistics
        {
            TotalPortals = _portals.Count,
            OperationalPortals = _portals.Count(p => p.Status == "operational"),
            DegradedPortals = _portals.Count(p => p.Status == "degraded"),
            DownPortals = _portals.Count(p => p.Status == "down"),
            AverageUptime = _portals.Average(p => p.Metrics.Uptime),
            AverageResponseTime = _portals.Average(p => p.Metrics.ResponseTime),
            TotalIncidents = _incidents.Count,
            OpenIncidents = _incidents.Count(i => i.Status == "open" || i.Status == "investigating"),
            ResolvedIncidents = _incidents.Count(i => i.Status == "resolved" || i.Status == "closed"),
            CriticalIncidents = _incidents.Count(i => i.Severity == "critical"),
            SystemHealth = CalculateSystemHealth(),
            LastUpdated = DateTime.UtcNow
        };

        // Generate time series data
        var faker = new Faker();
        for (int i = 24; i >= 0; i--)
        {
            stats.UptimeHistory.Add(new TimeSeriesData
            {
                Timestamp = DateTime.UtcNow.AddHours(-i),
                Value = faker.Random.Double(95, 99.99)
            });

            stats.ResponseTimeHistory.Add(new TimeSeriesData
            {
                Timestamp = DateTime.UtcNow.AddHours(-i),
                Value = faker.Random.Double(100, 500)
            });
        }

        return stats;
    }

    private double CalculateSystemHealth()
    {
        var operationalWeight = (_portals.Count(p => p.Status == "operational") / (double)_portals.Count) * 50;
        var uptimeWeight = (_portals.Average(p => p.Metrics.Uptime) / 100) * 30;
        var incidentWeight = Math.Max(0, 20 - (_incidents.Count(i => i.Status == "open" && i.Severity == "critical") * 5));
        return Math.Round(operationalWeight + uptimeWeight + incidentWeight, 2);
    }
}