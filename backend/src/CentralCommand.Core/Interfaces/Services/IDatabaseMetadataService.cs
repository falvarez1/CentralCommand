namespace CentralCommand.Core.Interfaces.Services;

public interface IDatabaseMetadataService
{
    Task<bool> CanConnectAsync(CancellationToken cancellationToken = default);
    string GetProviderName();
    Task<bool> IsDatabaseHealthyAsync(CancellationToken cancellationToken = default);
}