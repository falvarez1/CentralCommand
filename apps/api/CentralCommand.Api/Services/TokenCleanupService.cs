using Microsoft.Extensions.Hosting;

namespace CentralCommand.Api.Services;

/// <summary>
/// Background service to clean up expired blacklisted tokens periodically
/// </summary>
public class TokenCleanupService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<TokenCleanupService> _logger;
    private readonly TimeSpan _cleanupInterval = TimeSpan.FromHours(1); // Run cleanup every hour

    public TokenCleanupService(
        IServiceProvider serviceProvider,
        ILogger<TokenCleanupService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Token cleanup service started");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await Task.Delay(_cleanupInterval, stoppingToken);

                using (var scope = _serviceProvider.CreateScope())
                {
                    var blacklistService = scope.ServiceProvider.GetRequiredService<ITokenBlacklistService>();

                    _logger.LogDebug("Running token cleanup...");
                    await blacklistService.CleanupExpiredTokensAsync();
                    _logger.LogDebug("Token cleanup completed");
                }
            }
            catch (TaskCanceledException)
            {
                // This is expected when the service is stopping
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during token cleanup");
                // Continue running even if cleanup fails
            }
        }

        _logger.LogInformation("Token cleanup service stopped");
    }
}