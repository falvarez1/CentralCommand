using MediatR;

namespace CentralCommand.Api.Application.Commands.Dev;

public record ResetDatabaseCommand : IRequest<ResetDatabaseResponse>
{
}

public record ResetDatabaseResponse
{
    public int PortalsCount { get; init; }
    public int IncidentsCount { get; init; }
    public int HealthChecksCount { get; init; }
    public int MetricsHistoryCount { get; init; }
    public string Message { get; init; } = "Database reset successfully";
}