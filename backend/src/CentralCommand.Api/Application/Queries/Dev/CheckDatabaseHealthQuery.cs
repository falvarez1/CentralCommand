using MediatR;

namespace CentralCommand.Api.Application.Queries.Dev;

public record CheckDatabaseHealthQuery : IRequest<DatabaseHealthResponse>
{
}

public record DatabaseHealthResponse
{
    public string Status { get; init; } = "healthy";
    public string Database { get; init; } = string.Empty;
    public string Environment { get; init; } = string.Empty;
    public string? Error { get; init; }
}