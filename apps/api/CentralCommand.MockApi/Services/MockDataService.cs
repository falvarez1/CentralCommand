using Bogus;
using CentralCommand.MockApi.Models;

namespace CentralCommand.MockApi.Services;

/// <summary>
/// Service for generating realistic mock data
/// </summary>
public class MockDataService
{
    private readonly Faker _faker = new();
    private readonly List<Portal> _portals;
    private readonly List<Incident> _incidents;
    private readonly Dictionary<Guid, List<Comment>> _incidentComments = new();
    private readonly Dictionary<Guid, PortalHealth> _portalHealthData = new();
    private readonly Dictionary<Guid, List<MetricsDataPoint>> _portalMetricsHistory = new();
    private readonly Random _random = new();

    // Static portal names and descriptions for realistic data
    private readonly (string Name, string Description, string Url, PortalCategory Category)[] _portalTemplates =
    {
        // Engineering
        ("GitHub Enterprise", "Source code repository and collaboration platform", "https://github.company.com", PortalCategory.Engineering),
        ("Jenkins CI/CD", "Continuous integration and deployment server", "https://jenkins.company.com", PortalCategory.Engineering),
        ("SonarQube", "Code quality and security analysis", "https://sonar.company.com", PortalCategory.Engineering),
        ("GitLab", "DevOps platform for source control", "https://gitlab.company.com", PortalCategory.Engineering),
        ("Artifactory", "Binary repository manager", "https://artifactory.company.com", PortalCategory.Engineering),

        // Operations
        ("Kubernetes Dashboard", "Container orchestration platform", "https://k8s.company.com", PortalCategory.Operations),
        ("Terraform Cloud", "Infrastructure as Code management", "https://terraform.company.com", PortalCategory.Operations),
        ("AWS Console", "Amazon Web Services management", "https://aws.company.com", PortalCategory.Operations),
        ("Azure Portal", "Microsoft Azure cloud services", "https://azure.company.com", PortalCategory.Operations),

        // Monitoring
        ("Grafana", "Metrics visualization and monitoring", "https://grafana.company.com", PortalCategory.Monitoring),
        ("Prometheus", "Time-series metrics collection", "https://prometheus.company.com", PortalCategory.Monitoring),
        ("Datadog", "Application performance monitoring", "https://datadog.company.com", PortalCategory.Monitoring),
        ("New Relic", "Full-stack observability platform", "https://newrelic.company.com", PortalCategory.Monitoring),
        ("ELK Stack", "Log aggregation and analysis", "https://elastic.company.com", PortalCategory.Monitoring),

        // Support
        ("Jira Service Desk", "IT service management", "https://jira.company.com", PortalCategory.Support),
        ("ServiceNow", "Enterprise service management", "https://servicenow.company.com", PortalCategory.Support),
        ("PagerDuty", "Incident response platform", "https://pagerduty.company.com", PortalCategory.Support),
        ("Zendesk", "Customer support ticketing", "https://zendesk.company.com", PortalCategory.Support),

        // Analytics
        ("Tableau", "Business intelligence and analytics", "https://tableau.company.com", PortalCategory.Analytics),
        ("Power BI", "Microsoft business analytics", "https://powerbi.company.com", PortalCategory.Analytics),
        ("Google Analytics", "Web analytics service", "https://analytics.company.com", PortalCategory.Analytics),
        ("Mixpanel", "Product analytics platform", "https://mixpanel.company.com", PortalCategory.Analytics),

        // Services
        ("API Gateway", "Central API management", "https://api.company.com", PortalCategory.Services),
        ("Message Queue", "RabbitMQ message broker", "https://rabbitmq.company.com", PortalCategory.Services),
        ("Redis Cache", "In-memory data structure store", "https://redis.company.com", PortalCategory.Services),
        ("Elasticsearch", "Search and analytics engine", "https://search.company.com", PortalCategory.Services),

        // Databases
        ("PostgreSQL Primary", "Main production database", "https://pg-primary.company.com", PortalCategory.Databases),
        ("MongoDB Cluster", "NoSQL document database", "https://mongo.company.com", PortalCategory.Databases),
        ("MySQL Replica", "Read replica database", "https://mysql-replica.company.com", PortalCategory.Databases),
        ("Cassandra", "Distributed NoSQL database", "https://cassandra.company.com", PortalCategory.Databases),

        // Security
        ("Vault", "Secrets management system", "https://vault.company.com", PortalCategory.Security),
        ("Okta", "Identity and access management", "https://okta.company.com", PortalCategory.Security),
        ("CrowdStrike", "Endpoint protection platform", "https://crowdstrike.company.com", PortalCategory.Security),

        // Communication
        ("Slack", "Team collaboration platform", "https://slack.company.com", PortalCategory.Communication),
        ("Microsoft Teams", "Business communication platform", "https://teams.company.com", PortalCategory.Communication),
        ("Confluence", "Documentation and wiki", "https://confluence.company.com", PortalCategory.Communication),
    };

    public MockDataService()
    {
        _portals = GeneratePortals();
        _incidents = GenerateIncidents();
        GenerateIncidentComments();
        GeneratePortalHealthData();
        GenerateMetricsHistory();
    }

    public List<Portal> GetPortals() => _portals;
    public List<Incident> GetIncidents() => _incidents;

    public Portal? GetPortal(Guid id) => _portals.FirstOrDefault(p => p.Id == id);
    public Incident? GetIncident(Guid id) => _incidents.FirstOrDefault(i => i.Id == id);

    private List<Portal> GeneratePortals()
    {
        var portals = new List<Portal>();
        var usedNames = new HashSet<string>();

        foreach (var template in _portalTemplates)
        {
            if (usedNames.Contains(template.Name))
                continue;

            usedNames.Add(template.Name);

            var portal = new Portal
            {
                Id = Guid.NewGuid(),
                Name = template.Name,
                Description = template.Description,
                Url = template.Url,
                Category = template.Category,
                Status = GetRandomPortalStatus(),
                Environment = GetRandomEnvironment(),
                Priority = GetRandomPriority(),
                AuthType = GetRandomAuthType(),
                Metrics = GeneratePortalMetrics(),
                LastChecked = DateTime.UtcNow.AddMinutes(-_random.Next(1, 30)),
                Config = new PortalConfig
                {
                    HealthCheckEndpoint = $"{template.Url}/health",
                    HealthCheckInterval = _random.Next(15, 60),
                    Timeout = _random.Next(3000, 10000),
                    EnableMonitoring = _random.Next(100) > 20,
                    EnableAlerts = _random.Next(100) > 30,
                    EnableAutoRecovery = _random.Next(100) > 60
                },
                Icon = GetIconForCategory(template.Category),
                Color = GetColorForStatus(GetRandomPortalStatus()),
                Tags = GenerateTags(),
                IsFavorite = _random.Next(100) > 70,
                IsPublic = _random.Next(100) > 50,
                Owner = Guid.NewGuid(),
                Team = Guid.NewGuid(),
                Maintainers = Enumerable.Range(0, _random.Next(1, 4)).Select(_ => Guid.NewGuid()).ToList(),
                CreatedAt = DateTime.UtcNow.AddDays(-_random.Next(30, 365)),
                UpdatedAt = DateTime.UtcNow.AddHours(-_random.Next(1, 48)),
                CreatedBy = Guid.NewGuid(),
                UpdatedBy = Guid.NewGuid()
            };

            if (portal.Status == PortalStatus.Down || portal.Status == PortalStatus.Degraded)
            {
                portal.LastIncident = DateTime.UtcNow.AddHours(-_random.Next(1, 12));
            }

            // Set initial ETag
            portal.ETag = GenerateETag();

            portals.Add(portal);
        }

        return portals;
    }

    private List<Incident> GenerateIncidents()
    {
        var incidents = new List<Incident>();
        var incidentTitles = new[]
        {
            "Database connection timeout",
            "High CPU usage detected",
            "Memory leak in production",
            "API Gateway not responding",
            "Certificate expiration warning",
            "Disk space critical",
            "Network latency spike",
            "Authentication service degraded",
            "Cache invalidation failure",
            "Load balancer misconfiguration",
            "SSL handshake errors",
            "Rate limiting triggered",
            "Backup job failed",
            "Deployment rollback initiated",
            "Security vulnerability detected"
        };

        for (int i = 0; i < 15; i++)
        {
            var createdAt = DateTime.UtcNow.AddDays(-_random.Next(0, 30)).AddHours(-_random.Next(0, 24));
            var status = GetRandomIncidentStatus();
            var severity = GetRandomIncidentSeverity();

            var incident = new Incident
            {
                Id = Guid.NewGuid(),
                Title = incidentTitles[i % incidentTitles.Length],
                Description = _faker.Lorem.Paragraph(),
                Type = GetRandomIncidentType(),
                Severity = severity,
                Status = status,
                AffectedPortals = _portals.Take(_random.Next(1, 4)).Select(p => p.Id.ToString()).ToList(),
                AffectedServices = GenerateAffectedServices(),
                ImpactedUsers = severity == IncidentSeverity.Critical ? _random.Next(100, 1000) : _random.Next(10, 100),
                Assignee = _random.Next(100) > 30 ? Guid.NewGuid() : null,
                Team = Guid.NewGuid(),
                ReportedBy = Guid.NewGuid(),
                CreatedAt = createdAt,
                UpdatedAt = status == IncidentStatus.Resolved || status == IncidentStatus.Closed
                    ? createdAt.AddHours(_random.Next(1, 48))
                    : DateTime.UtcNow,
                Tags = GenerateIncidentTags(),
                Timeline = GenerateTimeline(createdAt, status),
                IsPublic = _random.Next(100) > 40,
                CreatedBy = Guid.NewGuid(),
                UpdatedBy = Guid.NewGuid(),
                ETag = GenerateETag()
            };

            if (status == IncidentStatus.Resolved || status == IncidentStatus.Closed)
            {
                incident.ResolvedAt = incident.UpdatedAt;
                incident.RootCause = "Issue identified and resolved by the engineering team.";
                incident.Resolution = "Applied hotfix and restarted affected services.";
            }

            if (status != IncidentStatus.Open)
            {
                incident.AcknowledgedAt = createdAt.AddMinutes(_random.Next(5, 30));
            }

            // Set initial ETag
            incident.ETag = GenerateETag();

            incident.Metrics = new IncidentMetrics
            {
                Mttr = incident.ResolvedAt.HasValue
                    ? (incident.ResolvedAt.Value - incident.CreatedAt).TotalMinutes
                    : null,
                ImpactDuration = incident.ResolvedAt.HasValue
                    ? (incident.ResolvedAt.Value - incident.CreatedAt).TotalMinutes
                    : (DateTime.UtcNow - incident.CreatedAt).TotalMinutes,
                SeverityChanges = _random.Next(0, 3)
            };

            incidents.Add(incident);
        }

        return incidents;
    }

    private PortalMetrics GeneratePortalMetrics()
    {
        var isHealthy = _random.Next(100) > 20;
        return new PortalMetrics
        {
            ResponseTime = isHealthy ? _random.Next(50, 500) : _random.Next(500, 5000),
            Uptime = isHealthy ? 95 + _random.NextDouble() * 4.99 : 70 + _random.NextDouble() * 25,
            Cpu = _random.Next(10, isHealthy ? 70 : 95),
            Memory = _random.Next(20, isHealthy ? 80 : 95),
            Requests = _random.Next(100, 10000),
            Errors = isHealthy ? _random.Next(0, 10) : _random.Next(10, 100),
            ErrorRate = isHealthy ? _random.NextDouble() * 2 : 2 + _random.NextDouble() * 8,
            Throughput = _random.Next(50, 1000),
            Latency = isHealthy ? _random.Next(10, 100) : _random.Next(100, 1000)
        };
    }

    private List<TimelineEntry> GenerateTimeline(DateTime startTime, IncidentStatus currentStatus)
    {
        var timeline = new List<TimelineEntry>
        {
            new()
            {
                Id = Guid.NewGuid(),
                Timestamp = startTime,
                Action = "Incident created",
                Description = "Automated monitoring detected an issue",
                PerformedBy = Guid.NewGuid()
            }
        };

        if (currentStatus == IncidentStatus.InProgress || currentStatus == IncidentStatus.Resolved || currentStatus == IncidentStatus.Closed)
        {
            timeline.Add(new TimelineEntry
            {
                Id = Guid.NewGuid(),
                Timestamp = startTime.AddMinutes(_random.Next(5, 15)),
                Action = "Status changed to InProgress",
                Description = "Team acknowledged and started investigation",
                PerformedBy = Guid.NewGuid()
            });
        }

        if (currentStatus == IncidentStatus.Resolved || currentStatus == IncidentStatus.Closed)
        {
            timeline.Add(new TimelineEntry
            {
                Id = Guid.NewGuid(),
                Timestamp = startTime.AddMinutes(_random.Next(30, 60)),
                Action = "Root cause identified",
                Description = "Issue traced to specific component",
                PerformedBy = Guid.NewGuid()
            });
        }

        if (currentStatus == IncidentStatus.Resolved || currentStatus == IncidentStatus.Closed)
        {
            timeline.Add(new TimelineEntry
            {
                Id = Guid.NewGuid(),
                Timestamp = startTime.AddHours(_random.Next(1, 4)),
                Action = "Incident resolved",
                Description = "Fix deployed and verified",
                PerformedBy = Guid.NewGuid()
            });
        }

        return timeline;
    }

    private List<string> GenerateTags()
    {
        var allTags = new[] { "production", "critical", "monitored", "automated", "cloud", "on-premise", "customer-facing", "internal", "beta", "legacy" };
        return allTags.OrderBy(_ => _random.Next()).Take(_random.Next(1, 4)).ToList();
    }

    private List<string> GenerateIncidentTags()
    {
        var allTags = new[] { "outage", "performance", "security", "urgent", "recurring", "planned", "unplanned", "customer-impact", "data-loss", "compliance" };
        return allTags.OrderBy(_ => _random.Next()).Take(_random.Next(1, 3)).ToList();
    }

    private List<string> GenerateAffectedServices()
    {
        var services = new[] { "API", "Database", "Cache", "Queue", "Storage", "CDN", "Load Balancer", "DNS", "Firewall", "VPN" };
        return services.OrderBy(_ => _random.Next()).Take(_random.Next(1, 3)).ToList();
    }

    private PortalStatus GetRandomPortalStatus()
    {
        var weights = new[] { 70, 15, 5, 5, 5 }; // Active, Degraded, Down, Maintenance, Unknown
        var randomValue = _random.Next(100);

        if (randomValue < weights[0]) return PortalStatus.Active;
        if (randomValue < weights[0] + weights[1]) return PortalStatus.Degraded;
        if (randomValue < weights[0] + weights[1] + weights[2]) return PortalStatus.Down;
        if (randomValue < weights[0] + weights[1] + weights[2] + weights[3]) return PortalStatus.Maintenance;
        return PortalStatus.Unknown;
    }

    private PortalEnvironment GetRandomEnvironment()
    {
        var environments = Enum.GetValues<PortalEnvironment>();
        return environments[_random.Next(environments.Length)];
    }

    private PortalPriority GetRandomPriority()
    {
        var priorities = Enum.GetValues<PortalPriority>();
        return priorities[_random.Next(priorities.Length)];
    }

    private AuthType GetRandomAuthType()
    {
        var authTypes = Enum.GetValues<AuthType>();
        return authTypes[_random.Next(authTypes.Length)];
    }

    private IncidentStatus GetRandomIncidentStatus()
    {
        var statuses = Enum.GetValues<IncidentStatus>();
        return statuses[_random.Next(statuses.Length)];
    }

    private IncidentSeverity GetRandomIncidentSeverity()
    {
        var severities = Enum.GetValues<IncidentSeverity>();
        return severities[_random.Next(severities.Length)];
    }

    private IncidentType GetRandomIncidentType()
    {
        var types = Enum.GetValues<IncidentType>();
        return types[_random.Next(types.Length)];
    }

    private string GetIconForCategory(PortalCategory category)
    {
        return category switch
        {
            PortalCategory.Engineering => "🔧",
            PortalCategory.Operations => "⚙️",
            PortalCategory.Support => "🎫",
            PortalCategory.Monitoring => "📊",
            PortalCategory.Analytics => "📈",
            PortalCategory.Services => "🔌",
            PortalCategory.Infrastructure => "🏗️",
            PortalCategory.Databases => "🗄️",
            PortalCategory.Security => "🔒",
            PortalCategory.Development => "💻",
            PortalCategory.Business => "💼",
            PortalCategory.Communication => "💬",
            _ => "📦"
        };
    }

    private string GetColorForStatus(PortalStatus status)
    {
        return status switch
        {
            PortalStatus.Active => "#10b981",
            PortalStatus.Degraded => "#f59e0b",
            PortalStatus.Down => "#ef4444",
            PortalStatus.Maintenance => "#3b82f6",
            PortalStatus.Unknown => "#6b7280",
            _ => "#6b7280"
        };
    }

    public void UpdatePortalMetrics(Guid portalId)
    {
        var portal = _portals.FirstOrDefault(p => p.Id == portalId);
        if (portal != null)
        {
            portal.Metrics = GeneratePortalMetrics();
            portal.LastChecked = DateTime.UtcNow;
            portal.UpdatedAt = DateTime.UtcNow;
            portal.ETag = GenerateETag();
        }
    }

    public Incident AddIncident(CreateIncidentRequest request)
    {
        var incident = new Incident
        {
            Id = Guid.NewGuid(),
            Title = request.Title,
            Description = request.Description,
            Type = request.Type,
            Severity = request.Severity,
            Status = request.Status,
            AffectedPortals = request.AffectedPortals ?? new List<string>(),
            AffectedServices = request.AffectedServices ?? new List<string>(),
            ImpactedUsers = request.ImpactedUsers,
            Assignee = request.Assignee,
            Team = request.Team,
            ReportedBy = request.ReportedBy ?? Guid.NewGuid(),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            Tags = request.Tags ?? new List<string>(),
            Timeline = new List<TimelineEntry>
            {
                new()
                {
                    Id = Guid.NewGuid(),
                    Timestamp = DateTime.UtcNow,
                    Action = "Incident created",
                    Description = $"Incident reported: {request.Title}",
                    PerformedBy = request.ReportedBy ?? Guid.NewGuid()
                }
            },
            IsPublic = request.IsPublic,
            CreatedBy = Guid.NewGuid(),
            UpdatedBy = Guid.NewGuid(),
            ETag = GenerateETag()
        };

        _incidents.Insert(0, incident);
        return incident;
    }

    private string GenerateETag()
    {
        return $"\"{Guid.NewGuid():N}\"";
    }

    // New methods for comments
    private void GenerateIncidentComments()
    {
        foreach (var incident in _incidents)
        {
            var commentCount = _random.Next(0, 8);
            var comments = new List<Comment>();

            for (int i = 0; i < commentCount; i++)
            {
                comments.Add(new Comment
                {
                    Id = Guid.NewGuid(),
                    Content = _faker.Lorem.Paragraph(),
                    AuthorId = Guid.NewGuid(),
                    AuthorName = _faker.Name.FullName(),
                    AuthorEmail = _faker.Internet.Email(),
                    CreatedAt = incident.CreatedAt.AddMinutes(_random.Next(10, 120)),
                    IsInternal = _random.Next(100) > 70,
                    IsEdited = _random.Next(100) > 80,
                    Attachments = _random.Next(100) > 70 ? new List<string> { "log-file.txt", "screenshot.png" } : new List<string>(),
                    MentionedUsers = _random.Next(100) > 60 ? new List<Guid> { Guid.NewGuid() } : new List<Guid>()
                });
            }

            _incidentComments[incident.Id] = comments.OrderBy(c => c.CreatedAt).ToList();
        }
    }

    public List<Comment> GetIncidentComments(Guid incidentId)
    {
        return _incidentComments.TryGetValue(incidentId, out var comments)
            ? comments
            : new List<Comment>();
    }

    public Comment AddIncidentComment(Guid incidentId, CreateCommentRequest request)
    {
        var comment = new Comment
        {
            Id = Guid.NewGuid(),
            Content = request.Content,
            AuthorId = Guid.NewGuid(),
            AuthorName = _faker.Name.FullName(),
            AuthorEmail = _faker.Internet.Email(),
            CreatedAt = DateTime.UtcNow,
            IsInternal = request.IsInternal,
            IsEdited = false,
            Attachments = request.Attachments ?? new List<string>(),
            MentionedUsers = request.MentionedUsers ?? new List<Guid>()
        };

        if (!_incidentComments.ContainsKey(incidentId))
        {
            _incidentComments[incidentId] = new List<Comment>();
        }

        _incidentComments[incidentId].Add(comment);
        return comment;
    }

    // Health check methods
    private void GeneratePortalHealthData()
    {
        foreach (var portal in _portals)
        {
            var healthChecks = new List<HealthCheckConfig>();
            var checkCount = _random.Next(1, 4);

            for (int i = 0; i < checkCount; i++)
            {
                healthChecks.Add(new HealthCheckConfig
                {
                    Id = Guid.NewGuid(),
                    PortalId = portal.Id,
                    Name = $"Health Check {i + 1}",
                    Description = $"Monitors {portal.Name} availability",
                    Type = (HealthCheckType)_random.Next(0, 4),
                    Endpoint = $"{portal.Url}/health",
                    IntervalSeconds = _random.Next(15, 60),
                    TimeoutSeconds = _random.Next(5, 15),
                    RetryCount = _random.Next(1, 5),
                    ExpectedStatusCode = 200,
                    Enabled = _random.Next(100) > 10,
                    Tags = GenerateTags(),
                    CreatedAt = DateTime.UtcNow.AddDays(-_random.Next(30, 90)),
                    UpdatedAt = DateTime.UtcNow.AddHours(-_random.Next(1, 48))
                });
            }

            var recentResults = new List<HealthCheckResult>();
            foreach (var check in healthChecks)
            {
                for (int i = 0; i < 5; i++)
                {
                    var status = portal.Status == PortalStatus.Active
                        ? (HealthStatus)_random.Next(0, 2)  // Healthy or Degraded
                        : (HealthStatus)_random.Next(1, 4);  // Degraded, Unhealthy, or Unknown

                    recentResults.Add(new HealthCheckResult
                    {
                        Id = Guid.NewGuid(),
                        HealthCheckId = check.Id,
                        Status = status,
                        ResponseTimeMs = _random.Next(50, 2000),
                        StatusMessage = status == HealthStatus.Healthy ? "OK" : "Service degraded",
                        CheckedAt = DateTime.UtcNow.AddMinutes(-i * 5),
                        Details = new Dictionary<string, object>
                        {
                            ["statusCode"] = status == HealthStatus.Healthy ? 200 : 503,
                            ["contentLength"] = _random.Next(1000, 10000)
                        }
                    });
                }
            }

            var healthScore = portal.Status switch
            {
                PortalStatus.Active => _random.Next(85, 100),
                PortalStatus.Degraded => _random.Next(60, 85),
                PortalStatus.Down => _random.Next(0, 30),
                PortalStatus.Maintenance => _random.Next(50, 70),
                _ => _random.Next(30, 60)
            };

            _portalHealthData[portal.Id] = new PortalHealth
            {
                PortalId = portal.Id,
                OverallStatus = portal.Status == PortalStatus.Active ? HealthStatus.Healthy : HealthStatus.Degraded,
                Checks = healthChecks,
                RecentResults = recentResults.OrderByDescending(r => r.CheckedAt).ToList(),
                LastChecked = DateTime.UtcNow,
                HealthScore = healthScore,
                StatusCounts = new Dictionary<string, int>
                {
                    ["healthy"] = recentResults.Count(r => r.Status == HealthStatus.Healthy),
                    ["degraded"] = recentResults.Count(r => r.Status == HealthStatus.Degraded),
                    ["unhealthy"] = recentResults.Count(r => r.Status == HealthStatus.Unhealthy),
                    ["unknown"] = recentResults.Count(r => r.Status == HealthStatus.Unknown)
                }
            };
        }
    }

    public PortalHealth? GetPortalHealth(Guid portalId)
    {
        return _portalHealthData.TryGetValue(portalId, out var health) ? health : null;
    }

    // Metrics history methods
    private void GenerateMetricsHistory()
    {
        foreach (var portal in _portals)
        {
            var history = new List<MetricsDataPoint>();
            var now = DateTime.UtcNow;

            // Generate 24 hours of data points (one per hour)
            for (int i = 24; i >= 0; i--)
            {
                var timestamp = now.AddHours(-i);
                var baseMetrics = portal.Metrics;

                history.Add(new MetricsDataPoint
                {
                    Timestamp = timestamp,
                    ResponseTime = Math.Max(10, baseMetrics.ResponseTime + _random.Next(-50, 50)),
                    Uptime = Math.Min(100, Math.Max(0, baseMetrics.Uptime + _random.NextDouble() * 2 - 1)),
                    Cpu = Math.Min(100, Math.Max(0, baseMetrics.Cpu + _random.Next(-10, 10))),
                    Memory = Math.Min(100, Math.Max(0, baseMetrics.Memory + _random.Next(-10, 10))),
                    Requests = Math.Max(0, baseMetrics.Requests + _random.Next(-100, 100)),
                    Errors = Math.Max(0, baseMetrics.Errors + _random.Next(-5, 5)),
                    ErrorRate = Math.Max(0, baseMetrics.ErrorRate + _random.NextDouble() * 2 - 1),
                    Throughput = Math.Max(0, baseMetrics.Throughput + _random.Next(-50, 50)),
                    Latency = Math.Max(1, baseMetrics.Latency + _random.Next(-20, 20))
                });
            }

            _portalMetricsHistory[portal.Id] = history;
        }
    }

    public MetricsHistory? GetPortalMetricsHistory(Guid portalId, MetricsTimeRange timeRange)
    {
        var portal = _portals.FirstOrDefault(p => p.Id == portalId);
        if (portal == null || !_portalMetricsHistory.TryGetValue(portalId, out var allData))
        {
            return null;
        }

        var now = DateTime.UtcNow;
        DateTime startTime;
        int intervalMinutes;

        switch (timeRange)
        {
            case MetricsTimeRange.LastHour:
                startTime = now.AddHours(-1);
                intervalMinutes = 5;
                break;
            case MetricsTimeRange.Last24Hours:
                startTime = now.AddHours(-24);
                intervalMinutes = 60;
                break;
            case MetricsTimeRange.Last7Days:
                startTime = now.AddDays(-7);
                intervalMinutes = 360;
                break;
            case MetricsTimeRange.Last30Days:
                startTime = now.AddDays(-30);
                intervalMinutes = 1440;
                break;
            default:
                startTime = now.AddHours(-24);
                intervalMinutes = 60;
                break;
        }

        var filteredData = allData.Where(d => d.Timestamp >= startTime).ToList();

        var summary = new MetricsSummary
        {
            AverageResponseTime = filteredData.Any() ? filteredData.Average(d => d.ResponseTime) : 0,
            AverageUptime = filteredData.Any() ? filteredData.Average(d => d.Uptime) : 0,
            AverageCpu = filteredData.Any() ? filteredData.Average(d => d.Cpu) : 0,
            AverageMemory = filteredData.Any() ? filteredData.Average(d => d.Memory) : 0,
            TotalRequests = filteredData.Sum(d => d.Requests),
            TotalErrors = filteredData.Sum(d => d.Errors),
            AverageErrorRate = filteredData.Any() ? filteredData.Average(d => d.ErrorRate) : 0,
            MaxResponseTime = filteredData.Any() ? filteredData.Max(d => d.ResponseTime) : 0,
            MinResponseTime = filteredData.Any() ? filteredData.Min(d => d.ResponseTime) : 0,
            MaxCpu = filteredData.Any() ? filteredData.Max(d => d.Cpu) : 0,
            MaxMemory = filteredData.Any() ? filteredData.Max(d => d.Memory) : 0,
            Anomalies = new List<string>()
        };

        // Detect anomalies
        if (summary.MaxResponseTime > 1000)
            summary.Anomalies.Add("High response time detected");
        if (summary.AverageErrorRate > 5)
            summary.Anomalies.Add("Elevated error rate");
        if (summary.MaxCpu > 90)
            summary.Anomalies.Add("High CPU usage");
        if (summary.MaxMemory > 90)
            summary.Anomalies.Add("High memory usage");

        return new MetricsHistory
        {
            PortalId = portalId,
            PortalName = portal.Name,
            TimeRange = timeRange,
            StartTime = startTime,
            EndTime = now,
            DataPoints = filteredData.Count,
            IntervalMinutes = intervalMinutes,
            Data = filteredData,
            Summary = summary
        };
    }

    // Batch operations
    public BatchOperationResponse PerformBatchOperation(BatchOperationRequest request)
    {
        var response = new BatchOperationResponse
        {
            OperationId = Guid.NewGuid().ToString(),
            Operation = request.Operation,
            TotalItems = request.PortalIds.Count,
            StartedAt = DateTime.UtcNow,
            Results = new List<BatchOperationItemResult>()
        };

        foreach (var portalId in request.PortalIds)
        {
            var portal = _portals.FirstOrDefault(p => p.Id == portalId);
            var result = new BatchOperationItemResult { PortalId = portalId };

            if (portal == null)
            {
                result.Success = false;
                result.ErrorMessage = $"Portal {portalId} not found";
            }
            else
            {
                try
                {
                    switch (request.Operation)
                    {
                        case BatchOperationType.UpdateStatus:
                            if (request.Parameters?.TryGetValue("status", out var statusObj) == true &&
                                Enum.TryParse<PortalStatus>(statusObj.ToString(), out var status))
                            {
                                portal.Status = status;
                                portal.UpdatedAt = DateTime.UtcNow;
                                result.Success = true;
                                result.UpdatedData = new { portal.Status };
                            }
                            break;

                        case BatchOperationType.UpdatePriority:
                            if (request.Parameters?.TryGetValue("priority", out var priorityObj) == true &&
                                Enum.TryParse<PortalPriority>(priorityObj.ToString(), out var priority))
                            {
                                portal.Priority = priority;
                                portal.UpdatedAt = DateTime.UtcNow;
                                result.Success = true;
                                result.UpdatedData = new { portal.Priority };
                            }
                            break;

                        case BatchOperationType.UpdateEnvironment:
                            if (request.Parameters?.TryGetValue("environment", out var envObj) == true &&
                                Enum.TryParse<PortalEnvironment>(envObj.ToString(), out var env))
                            {
                                portal.Environment = env;
                                portal.UpdatedAt = DateTime.UtcNow;
                                result.Success = true;
                                result.UpdatedData = new { portal.Environment };
                            }
                            break;

                        case BatchOperationType.AddTags:
                            if (request.Parameters?.TryGetValue("tags", out var tagsObj) == true &&
                                tagsObj is List<string> tags)
                            {
                                portal.Tags.AddRange(tags.Where(t => !portal.Tags.Contains(t)));
                                portal.UpdatedAt = DateTime.UtcNow;
                                result.Success = true;
                                result.UpdatedData = new { portal.Tags };
                            }
                            break;

                        case BatchOperationType.RemoveTags:
                            if (request.Parameters?.TryGetValue("tags", out var removeTagsObj) == true &&
                                removeTagsObj is List<string> removeTags)
                            {
                                portal.Tags.RemoveAll(t => removeTags.Contains(t));
                                portal.UpdatedAt = DateTime.UtcNow;
                                result.Success = true;
                                result.UpdatedData = new { portal.Tags };
                            }
                            break;

                        case BatchOperationType.ToggleFavorite:
                            portal.IsFavorite = !portal.IsFavorite;
                            portal.UpdatedAt = DateTime.UtcNow;
                            result.Success = true;
                            result.UpdatedData = new { portal.IsFavorite };
                            break;

                        case BatchOperationType.EnableMonitoring:
                            portal.Config.EnableMonitoring = true;
                            portal.UpdatedAt = DateTime.UtcNow;
                            result.Success = true;
                            result.UpdatedData = new { EnableMonitoring = true };
                            break;

                        case BatchOperationType.DisableMonitoring:
                            portal.Config.EnableMonitoring = false;
                            portal.UpdatedAt = DateTime.UtcNow;
                            result.Success = true;
                            result.UpdatedData = new { EnableMonitoring = false };
                            break;

                        case BatchOperationType.Delete:
                            _portals.Remove(portal);
                            result.Success = true;
                            result.UpdatedData = new { Deleted = true };
                            break;

                        default:
                            result.Success = false;
                            result.ErrorMessage = $"Unknown operation: {request.Operation}";
                            break;
                    }

                    if (result.Success && request.Operation != BatchOperationType.Delete)
                    {
                        portal.ETag = GenerateETag();
                    }
                }
                catch (Exception ex)
                {
                    result.Success = false;
                    result.ErrorMessage = ex.Message;
                }
            }

            response.Results.Add(result);
        }

        response.CompletedAt = DateTime.UtcNow;
        response.DurationMs = (long)(response.CompletedAt - response.StartedAt).TotalMilliseconds;
        response.SuccessCount = response.Results.Count(r => r.Success);
        response.FailureCount = response.Results.Count(r => !r.Success);

        return response;
    }
}