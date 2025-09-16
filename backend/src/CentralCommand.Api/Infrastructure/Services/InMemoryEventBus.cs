using System.Collections.Concurrent;

namespace CentralCommand.Api.Infrastructure.Services;

/// <summary>
/// In-memory implementation of the event bus
/// </summary>
public class InMemoryEventBus : IEventBus
{
    private readonly ILogger<InMemoryEventBus> _logger;
    private readonly ConcurrentDictionary<Type, List<Delegate>> _handlers = new();

    public InMemoryEventBus(ILogger<InMemoryEventBus> logger)
    {
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    public async Task PublishAsync<T>(T @event, CancellationToken cancellationToken = default) where T : class
    {
        if (@event == null)
        {
            throw new ArgumentNullException(nameof(@event));
        }

        var eventType = typeof(T);
        _logger.LogDebug("Publishing event of type {EventType}", eventType.Name);

        if (_handlers.TryGetValue(eventType, out var handlers))
        {
            var tasks = new List<Task>();

            foreach (var handler in handlers.ToList())
            {
                if (handler is Func<T, Task> typedHandler)
                {
                    tasks.Add(ExecuteHandlerAsync(typedHandler, @event));
                }
            }

            await Task.WhenAll(tasks);
            _logger.LogDebug("Published event of type {EventType} to {HandlerCount} handlers", eventType.Name, tasks.Count);
        }
        else
        {
            _logger.LogDebug("No handlers registered for event type {EventType}", eventType.Name);
        }
    }

    public void Subscribe<T>(Func<T, Task> handler) where T : class
    {
        if (handler == null)
        {
            throw new ArgumentNullException(nameof(handler));
        }

        var eventType = typeof(T);
        _handlers.AddOrUpdate(eventType,
            new List<Delegate> { handler },
            (key, list) =>
            {
                list.Add(handler);
                return list;
            });

        _logger.LogDebug("Subscribed handler for event type {EventType}", eventType.Name);
    }

    public void Unsubscribe<T>() where T : class
    {
        var eventType = typeof(T);
        _handlers.TryRemove(eventType, out _);
        _logger.LogDebug("Unsubscribed all handlers for event type {EventType}", eventType.Name);
    }

    private async Task ExecuteHandlerAsync<T>(Func<T, Task> handler, T @event) where T : class
    {
        try
        {
            await handler(@event);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error executing handler for event type {EventType}", typeof(T).Name);
        }
    }
}