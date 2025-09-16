namespace CentralCommand.Api.Infrastructure.Services;

/// <summary>
/// Manages SignalR connections and groups
/// </summary>
public interface IConnectionManager
{
    /// <summary>
    /// Adds a connection to tracking
    /// </summary>
    Task AddConnectionAsync(string connectionId, string userId, Dictionary<string, object>? metadata = null);

    /// <summary>
    /// Removes a connection from tracking
    /// </summary>
    Task RemoveConnectionAsync(string connectionId);

    /// <summary>
    /// Gets all connections for a user
    /// </summary>
    Task<IEnumerable<string>> GetUserConnectionsAsync(string userId);

    /// <summary>
    /// Gets user ID for a connection
    /// </summary>
    Task<string?> GetUserIdAsync(string connectionId);

    /// <summary>
    /// Adds a connection to a group
    /// </summary>
    Task AddToGroupAsync(string connectionId, string groupName);

    /// <summary>
    /// Removes a connection from a group
    /// </summary>
    Task RemoveFromGroupAsync(string connectionId, string groupName);

    /// <summary>
    /// Gets all connections in a group
    /// </summary>
    Task<IEnumerable<string>> GetGroupConnectionsAsync(string groupName);

    /// <summary>
    /// Gets all groups for a connection
    /// </summary>
    Task<IEnumerable<string>> GetConnectionGroupsAsync(string connectionId);

    /// <summary>
    /// Gets total number of active connections
    /// </summary>
    Task<int> GetConnectionCountAsync();

    /// <summary>
    /// Gets total number of unique users connected
    /// </summary>
    Task<int> GetUserCountAsync();

    /// <summary>
    /// Updates metadata for a connection
    /// </summary>
    Task UpdateConnectionMetadataAsync(string connectionId, Dictionary<string, object> metadata);

    /// <summary>
    /// Gets metadata for a connection
    /// </summary>
    Task<Dictionary<string, object>?> GetConnectionMetadataAsync(string connectionId);
}