using System.Collections.Concurrent;
using Microsoft.Extensions.Logging;

namespace CentralCommand.Api.Infrastructure.Services;

/// <summary>
/// Manages SignalR connections and groups
/// </summary>
public class ConnectionManager : IConnectionManager
{
    private readonly ILogger<ConnectionManager> _logger;
    private readonly ConcurrentDictionary<string, ConnectionInfo> _connections;
    private readonly ConcurrentDictionary<string, HashSet<string>> _userConnections;
    private readonly ConcurrentDictionary<string, HashSet<string>> _groups;
    private readonly ConcurrentDictionary<string, HashSet<string>> _connectionGroups;

    public ConnectionManager(ILogger<ConnectionManager> logger)
    {
        _logger = logger;
        _connections = new ConcurrentDictionary<string, ConnectionInfo>();
        _userConnections = new ConcurrentDictionary<string, HashSet<string>>();
        _groups = new ConcurrentDictionary<string, HashSet<string>>();
        _connectionGroups = new ConcurrentDictionary<string, HashSet<string>>();
    }

    public Task AddConnectionAsync(string connectionId, string userId, Dictionary<string, object>? metadata = null)
    {
        var connectionInfo = new ConnectionInfo
        {
            ConnectionId = connectionId,
            UserId = userId,
            ConnectedAt = DateTime.UtcNow,
            Metadata = metadata ?? new Dictionary<string, object>()
        };

        _connections[connectionId] = connectionInfo;

        // Add to user connections
        _userConnections.AddOrUpdate(userId,
            new HashSet<string> { connectionId },
            (key, set) =>
            {
                set.Add(connectionId);
                return set;
            });

        _logger.LogInformation("Added connection {ConnectionId} for user {UserId}", connectionId, userId);

        return Task.CompletedTask;
    }

    public Task RemoveConnectionAsync(string connectionId)
    {
        if (_connections.TryRemove(connectionId, out var connectionInfo))
        {
            // Remove from user connections
            if (_userConnections.TryGetValue(connectionInfo.UserId, out var userConnections))
            {
                userConnections.Remove(connectionId);
                if (userConnections.Count == 0)
                {
                    _userConnections.TryRemove(connectionInfo.UserId, out _);
                }
            }

            // Remove from all groups
            if (_connectionGroups.TryRemove(connectionId, out var groups))
            {
                foreach (var groupName in groups)
                {
                    if (_groups.TryGetValue(groupName, out var groupConnections))
                    {
                        groupConnections.Remove(connectionId);
                        if (groupConnections.Count == 0)
                        {
                            _groups.TryRemove(groupName, out _);
                        }
                    }
                }
            }

            _logger.LogInformation("Removed connection {ConnectionId} for user {UserId}", connectionId, connectionInfo.UserId);
        }

        return Task.CompletedTask;
    }

    public Task<IEnumerable<string>> GetUserConnectionsAsync(string userId)
    {
        if (_userConnections.TryGetValue(userId, out var connections))
        {
            return Task.FromResult<IEnumerable<string>>(connections.ToList());
        }

        return Task.FromResult<IEnumerable<string>>(Enumerable.Empty<string>());
    }

    public Task<string?> GetUserIdAsync(string connectionId)
    {
        if (_connections.TryGetValue(connectionId, out var connectionInfo))
        {
            return Task.FromResult<string?>(connectionInfo.UserId);
        }

        return Task.FromResult<string?>(null);
    }

    public Task AddToGroupAsync(string connectionId, string groupName)
    {
        // Add connection to group
        _groups.AddOrUpdate(groupName,
            new HashSet<string> { connectionId },
            (key, set) =>
            {
                set.Add(connectionId);
                return set;
            });

        // Track groups for connection
        _connectionGroups.AddOrUpdate(connectionId,
            new HashSet<string> { groupName },
            (key, set) =>
            {
                set.Add(groupName);
                return set;
            });

        _logger.LogDebug("Added connection {ConnectionId} to group {GroupName}", connectionId, groupName);

        return Task.CompletedTask;
    }

    public Task RemoveFromGroupAsync(string connectionId, string groupName)
    {
        // Remove connection from group
        if (_groups.TryGetValue(groupName, out var groupConnections))
        {
            groupConnections.Remove(connectionId);
            if (groupConnections.Count == 0)
            {
                _groups.TryRemove(groupName, out _);
            }
        }

        // Remove group from connection tracking
        if (_connectionGroups.TryGetValue(connectionId, out var connectionGroups))
        {
            connectionGroups.Remove(groupName);
            if (connectionGroups.Count == 0)
            {
                _connectionGroups.TryRemove(connectionId, out _);
            }
        }

        _logger.LogDebug("Removed connection {ConnectionId} from group {GroupName}", connectionId, groupName);

        return Task.CompletedTask;
    }

    public Task<IEnumerable<string>> GetGroupConnectionsAsync(string groupName)
    {
        if (_groups.TryGetValue(groupName, out var connections))
        {
            return Task.FromResult<IEnumerable<string>>(connections.ToList());
        }

        return Task.FromResult<IEnumerable<string>>(Enumerable.Empty<string>());
    }

    public Task<IEnumerable<string>> GetConnectionGroupsAsync(string connectionId)
    {
        if (_connectionGroups.TryGetValue(connectionId, out var groups))
        {
            return Task.FromResult<IEnumerable<string>>(groups.ToList());
        }

        return Task.FromResult<IEnumerable<string>>(Enumerable.Empty<string>());
    }

    public Task<int> GetConnectionCountAsync()
    {
        return Task.FromResult(_connections.Count);
    }

    public Task<int> GetUserCountAsync()
    {
        return Task.FromResult(_userConnections.Count);
    }

    public Task UpdateConnectionMetadataAsync(string connectionId, Dictionary<string, object> metadata)
    {
        if (_connections.TryGetValue(connectionId, out var connectionInfo))
        {
            foreach (var kvp in metadata)
            {
                connectionInfo.Metadata[kvp.Key] = kvp.Value;
            }

            _logger.LogDebug("Updated metadata for connection {ConnectionId}", connectionId);
        }

        return Task.CompletedTask;
    }

    public Task<Dictionary<string, object>?> GetConnectionMetadataAsync(string connectionId)
    {
        if (_connections.TryGetValue(connectionId, out var connectionInfo))
        {
            return Task.FromResult<Dictionary<string, object>?>(new Dictionary<string, object>(connectionInfo.Metadata));
        }

        return Task.FromResult<Dictionary<string, object>?>(null);
    }

    private class ConnectionInfo
    {
        public string ConnectionId { get; set; } = string.Empty;
        public string UserId { get; set; } = string.Empty;
        public DateTime ConnectedAt { get; set; }
        public Dictionary<string, object> Metadata { get; set; } = new();
    }
}