using CentralCommand.Core.Interfaces.Services;
using MediatR;

namespace CentralCommand.Api.Application.Queries.Dev;

public class CheckDatabaseHealthQueryHandler : IRequestHandler<CheckDatabaseHealthQuery, DatabaseHealthResponse>
{
    private readonly IDatabaseMetadataService _databaseMetadata;
    private readonly IWebHostEnvironment _environment;
    private readonly ILogger<CheckDatabaseHealthQueryHandler> _logger;

    public CheckDatabaseHealthQueryHandler(
        IDatabaseMetadataService databaseMetadata,
        IWebHostEnvironment environment,
        ILogger<CheckDatabaseHealthQueryHandler> logger)
    {
        _databaseMetadata = databaseMetadata;
        _environment = environment;
        _logger = logger;
    }

    public async Task<DatabaseHealthResponse> Handle(
        CheckDatabaseHealthQuery request,
        CancellationToken cancellationToken)
    {
        try
        {
            var canConnect = await _databaseMetadata.CanConnectAsync(cancellationToken);

            if (!canConnect)
            {
                return new DatabaseHealthResponse
                {
                    Status = "unhealthy",
                    Database = _databaseMetadata.GetProviderName(),
                    Environment = _environment.EnvironmentName,
                    Error = "Cannot connect to database"
                };
            }

            return new DatabaseHealthResponse
            {
                Status = "healthy",
                Database = _databaseMetadata.GetProviderName(),
                Environment = _environment.EnvironmentName
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Health check failed");
            return new DatabaseHealthResponse
            {
                Status = "unhealthy",
                Database = _databaseMetadata.GetProviderName(),
                Environment = _environment.EnvironmentName,
                Error = ex.Message
            };
        }
    }
}