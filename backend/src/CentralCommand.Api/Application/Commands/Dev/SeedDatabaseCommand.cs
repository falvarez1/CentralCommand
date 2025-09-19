using MediatR;

namespace CentralCommand.Api.Application.Commands.Dev;

public record SeedDatabaseCommand : IRequest<SeedDatabaseResponse>
{
    public int? SeedCount { get; init; }
}

public record SeedDatabaseResponse
{
    public int PortalsCount { get; init; }
    public int IncidentsCount { get; init; }
    public int HealthChecksCount { get; init; }
    public int MetricsHistoryCount { get; init; }
    public string Message { get; init; } = "Database seeded successfully";
}