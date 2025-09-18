using MediatR;

namespace CentralCommand.Api.Application.Queries.Dev;

public record GetDatabaseStatsQuery : IRequest<DatabaseStatsResponse>
{
}

public record DatabaseStatsResponse
{
    public DatabaseInfo Database { get; init; } = new();
    public EntityCounts Counts { get; init; } = new();
    public RecentActivity Recent { get; init; } = new();

    public record DatabaseInfo
    {
        public string Provider { get; init; } = string.Empty;
        public bool CanConnect { get; init; }
        public bool IsInMemory { get; init; }
    }

    public record EntityCounts
    {
        public int Portals { get; init; }
        public int Incidents { get; init; }
        public int HealthChecks { get; init; }
        public int MetricsHistory { get; init; }
        public int Comments { get; init; }
    }

    public record RecentActivity
    {
        public DateTime? LastPortalCreated { get; init; }
        public DateTime? LastIncidentCreated { get; init; }
        public DateTime? LastHealthCheck { get; init; }
    }
}