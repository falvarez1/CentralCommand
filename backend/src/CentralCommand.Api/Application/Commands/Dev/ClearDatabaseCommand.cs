using MediatR;

namespace CentralCommand.Api.Application.Commands.Dev;

public record ClearDatabaseCommand : IRequest<ClearDatabaseResponse>
{
}

public record ClearDatabaseResponse
{
    public bool Success { get; init; }
    public string Message { get; init; } = "Database cleared successfully";
}