using CentralCommand.Api.Infrastructure.Data;
using CentralCommand.Core.Interfaces.Services;
using Microsoft.EntityFrameworkCore;

namespace CentralCommand.Api.Infrastructure.Services;

public class DatabaseMetadataService : IDatabaseMetadataService
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<DatabaseMetadataService> _logger;

    public DatabaseMetadataService(
        ApplicationDbContext context,
        ILogger<DatabaseMetadataService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<bool> CanConnectAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            return await _context.Database.CanConnectAsync(cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to check database connection");
            return false;
        }
    }

    public string GetProviderName()
    {
        return _context.Database.ProviderName ?? "Unknown";
    }

    public async Task<bool> IsDatabaseHealthyAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            var canConnect = await CanConnectAsync(cancellationToken);
            if (!canConnect)
            {
                return false;
            }

            // Perform a simple query to verify database is responsive
            var testQuery = await _context.Database
                .ExecuteSqlRawAsync("SELECT 1", cancellationToken);

            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Database health check failed");
            return false;
        }
    }
}