using CentralCommand.Api.Infrastructure.Data;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace CentralCommand.Api.Application.Queries.Dev;

public class CheckDatabaseHealthQueryHandler : IRequestHandler<CheckDatabaseHealthQuery, DatabaseHealthResponse>
{
    private readonly ApplicationDbContext _context;
    private readonly IWebHostEnvironment _environment;
    private readonly ILogger<CheckDatabaseHealthQueryHandler> _logger;

    public CheckDatabaseHealthQueryHandler(
        ApplicationDbContext context,
        IWebHostEnvironment environment,
        ILogger<CheckDatabaseHealthQueryHandler> logger)
    {
        _context = context;
        _environment = environment;
        _logger = logger;
    }

    public async Task<DatabaseHealthResponse> Handle(
        CheckDatabaseHealthQuery request,
        CancellationToken cancellationToken)
    {
        try
        {
            var canConnect = await _context.Database.CanConnectAsync(cancellationToken);

            if (!canConnect)
            {
                return new DatabaseHealthResponse
                {
                    Status = "unhealthy",
                    Database = _context.Database.ProviderName ?? string.Empty,
                    IsInMemory = _context.Database.IsInMemory(),
                    Environment = _environment.EnvironmentName,
                    Error = "Cannot connect to database"
                };
            }

            return new DatabaseHealthResponse
            {
                Status = "healthy",
                Database = _context.Database.ProviderName ?? string.Empty,
                IsInMemory = _context.Database.IsInMemory(),
                Environment = _environment.EnvironmentName
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Health check failed");
            return new DatabaseHealthResponse
            {
                Status = "unhealthy",
                Database = _context.Database.ProviderName ?? string.Empty,
                IsInMemory = false,
                Environment = _environment.EnvironmentName,
                Error = ex.Message
            };
        }
    }
}