namespace CentralCommand.Core.Interfaces.Services;

public interface IDataSeedingService
{
    Task SeedAsync(int? count = null, CancellationToken cancellationToken = default);
    Task<bool> IsDatabaseEmptyAsync(CancellationToken cancellationToken = default);
}