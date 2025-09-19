namespace CentralCommand.Api.Infrastructure.Services;

/// <summary>
/// Interface for publishing events across the application
/// </summary>
public interface IEventBus
{
    /// <summary>
    /// Publishes an event asynchronously
    /// </summary>
    Task PublishAsync<T>(T @event, CancellationToken cancellationToken = default) where T : class;

    /// <summary>
    /// Subscribes to an event type
    /// </summary>
    void Subscribe<T>(Func<T, Task> handler) where T : class;

    /// <summary>
    /// Unsubscribes from an event type
    /// </summary>
    void Unsubscribe<T>() where T : class;
}