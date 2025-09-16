using System.Collections.Concurrent;
using CentralCommand.Core.Interfaces.Services;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;

namespace CentralCommand.Api.Services;

/// <summary>
/// Service for managing command palette operations
/// </summary>
public class CommandService : ICommandService
{
    private readonly ILogger<CommandService> _logger;
    private readonly IMemoryCache _cache;
    private readonly ConcurrentDictionary<string, CommandResponse> _commands;
    private readonly ConcurrentDictionary<string, List<CommandUsage>> _userCommandHistory;

    public CommandService(ILogger<CommandService> logger, IMemoryCache cache)
    {
        _logger = logger;
        _cache = cache;
        _commands = new ConcurrentDictionary<string, CommandResponse>();
        _userCommandHistory = new ConcurrentDictionary<string, List<CommandUsage>>();

        InitializeDefaultCommands();
    }

    public async Task<IEnumerable<CommandResponse>> SearchCommandsAsync(string query, CancellationToken cancellationToken = default)
    {
        await Task.CompletedTask; // Make async for future enhancements

        if (string.IsNullOrWhiteSpace(query))
        {
            return _commands.Values.OrderBy(c => c.Category).ThenBy(c => c.Name);
        }

        var normalizedQuery = query.ToLowerInvariant();

        return _commands.Values
            .Where(c =>
                c.Name.Contains(normalizedQuery, StringComparison.OrdinalIgnoreCase) ||
                c.Description.Contains(normalizedQuery, StringComparison.OrdinalIgnoreCase) ||
                c.Category.Contains(normalizedQuery, StringComparison.OrdinalIgnoreCase) ||
                c.Shortcuts.Any(s => s.Contains(normalizedQuery, StringComparison.OrdinalIgnoreCase)))
            .OrderByDescending(c => CalculateRelevance(c, normalizedQuery))
            .ThenBy(c => c.Name);
    }

    public async Task<CommandExecutionResult> ExecuteCommandAsync(string commandId, Dictionary<string, object>? parameters = null, CancellationToken cancellationToken = default)
    {
        await Task.CompletedTask; // Make async for future enhancements

        if (!_commands.TryGetValue(commandId, out var command))
        {
            return new CommandExecutionResult
            {
                Success = false,
                Message = $"Command '{commandId}' not found"
            };
        }

        try
        {
            _logger.LogInformation("Executing command {CommandId} with parameters {Parameters}", commandId, parameters);

            // Track command usage
            TrackCommandUsage(commandId);

            // Stub implementation - return success for now
            return new CommandExecutionResult
            {
                Success = true,
                Message = $"Command '{command.Name}' executed successfully",
                Data = new { CommandId = commandId, Parameters = parameters },
                Metadata = new Dictionary<string, object>
                {
                    ["executedAt"] = DateTime.UtcNow,
                    ["commandName"] = command.Name
                }
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error executing command {CommandId}", commandId);
            return new CommandExecutionResult
            {
                Success = false,
                Message = $"Error executing command: {ex.Message}"
            };
        }
    }

    public async Task<IEnumerable<CommandResponse>> GetRecentCommandsAsync(Guid userId, int count = 5, CancellationToken cancellationToken = default)
    {
        await Task.CompletedTask; // Make async for future enhancements

        var userKey = userId.ToString();
        if (!_userCommandHistory.TryGetValue(userKey, out var history))
        {
            return Enumerable.Empty<CommandResponse>();
        }

        var recentCommandIds = history
            .OrderByDescending(h => h.ExecutedAt)
            .Select(h => h.CommandId)
            .Distinct()
            .Take(count);

        return recentCommandIds
            .Select(id => _commands.GetValueOrDefault(id))
            .Where(c => c != null)
            .Select(c => c!);
    }

    public async Task<IEnumerable<CommandResponse>> GetAllCommandsAsync(CancellationToken cancellationToken = default)
    {
        await Task.CompletedTask; // Make async for future enhancements
        return _commands.Values.OrderBy(c => c.Category).ThenBy(c => c.Name);
    }

    public async Task<bool> RegisterCommandAsync(RegisterCommandRequest request, CancellationToken cancellationToken = default)
    {
        await Task.CompletedTask; // Make async for future enhancements

        var command = new CommandResponse
        {
            Id = request.Id,
            Name = request.Name,
            Description = request.Description,
            Category = request.Category,
            Icon = request.Icon,
            Shortcuts = request.Shortcuts,
            Parameters = request.DefaultParameters,
            RequiresConfirmation = request.RequiresConfirmation
        };

        var added = _commands.TryAdd(request.Id, command);
        if (added)
        {
            _logger.LogInformation("Registered command {CommandId}: {CommandName}", request.Id, request.Name);
        }

        return added;
    }

    public async Task<bool> UnregisterCommandAsync(string commandId, CancellationToken cancellationToken = default)
    {
        await Task.CompletedTask; // Make async for future enhancements

        var removed = _commands.TryRemove(commandId, out _);
        if (removed)
        {
            _logger.LogInformation("Unregistered command {CommandId}", commandId);
        }

        return removed;
    }

    private void InitializeDefaultCommands()
    {
        // Portal commands
        RegisterCommand("portal.create", "Create Portal", "Create a new portal", "Portals", "plus", new[] { "cp", "new portal" });
        RegisterCommand("portal.search", "Search Portals", "Search for portals", "Portals", "search", new[] { "sp", "find portal" });
        RegisterCommand("portal.export", "Export Portals", "Export portals to CSV", "Portals", "download", new[] { "ep" });
        RegisterCommand("portal.import", "Import Portals", "Import portals from CSV", "Portals", "upload", new[] { "ip" });

        // Incident commands
        RegisterCommand("incident.create", "Create Incident", "Report a new incident", "Incidents", "alert-triangle", new[] { "ci", "new incident" });
        RegisterCommand("incident.search", "Search Incidents", "Search for incidents", "Incidents", "search", new[] { "si", "find incident" });
        RegisterCommand("incident.resolve", "Resolve Incident", "Mark incident as resolved", "Incidents", "check-circle", new[] { "ri" });

        // Navigation commands
        RegisterCommand("nav.dashboard", "Go to Dashboard", "Navigate to dashboard", "Navigation", "home", new[] { "gd", "dashboard" });
        RegisterCommand("nav.portals", "Go to Portals", "Navigate to portals page", "Navigation", "grid", new[] { "gp", "portals" });
        RegisterCommand("nav.incidents", "Go to Incidents", "Navigate to incidents page", "Navigation", "alert-circle", new[] { "gi", "incidents" });
        RegisterCommand("nav.settings", "Go to Settings", "Navigate to settings", "Navigation", "settings", new[] { "gs", "settings" });

        // System commands
        RegisterCommand("system.refresh", "Refresh Data", "Refresh current view data", "System", "refresh-cw", new[] { "r", "refresh" });
        RegisterCommand("system.theme", "Toggle Theme", "Switch between light and dark theme", "System", "moon", new[] { "tt", "theme" });
        RegisterCommand("system.notifications", "View Notifications", "Show notifications panel", "System", "bell", new[] { "vn", "notifications" });
        RegisterCommand("system.help", "Show Help", "Display help documentation", "System", "help-circle", new[] { "h", "help", "?" });
    }

    private void RegisterCommand(string id, string name, string description, string category, string icon, string[] shortcuts, bool requiresConfirmation = false)
    {
        _commands[id] = new CommandResponse
        {
            Id = id,
            Name = name,
            Description = description,
            Category = category,
            Icon = icon,
            Shortcuts = shortcuts,
            RequiresConfirmation = requiresConfirmation
        };
    }

    private void TrackCommandUsage(string commandId)
    {
        // For now, track globally. In production, this would be user-specific
        var globalKey = "global";
        _userCommandHistory.AddOrUpdate(globalKey,
            new List<CommandUsage> { new CommandUsage { CommandId = commandId, ExecutedAt = DateTime.UtcNow } },
            (key, list) =>
            {
                list.Add(new CommandUsage { CommandId = commandId, ExecutedAt = DateTime.UtcNow });
                // Keep only last 100 entries
                if (list.Count > 100)
                {
                    list.RemoveRange(0, list.Count - 100);
                }
                return list;
            });

        // Update command usage count
        if (_commands.TryGetValue(commandId, out var command))
        {
            command.UsageCount++;
            command.LastUsed = DateTime.UtcNow;
        }
    }

    private double CalculateRelevance(CommandResponse command, string query)
    {
        double score = 0;

        // Exact match in name
        if (command.Name.Equals(query, StringComparison.OrdinalIgnoreCase))
            score += 10;
        // Starts with query in name
        else if (command.Name.StartsWith(query, StringComparison.OrdinalIgnoreCase))
            score += 5;
        // Contains query in name
        else if (command.Name.Contains(query, StringComparison.OrdinalIgnoreCase))
            score += 3;

        // Shortcut match
        if (command.Shortcuts.Any(s => s.Equals(query, StringComparison.OrdinalIgnoreCase)))
            score += 8;

        // Description contains query
        if (command.Description.Contains(query, StringComparison.OrdinalIgnoreCase))
            score += 1;

        // Recent usage boost
        if (command.LastUsed.HasValue)
        {
            var daysSinceUsed = (DateTime.UtcNow - command.LastUsed.Value).TotalDays;
            if (daysSinceUsed < 1)
                score += 3;
            else if (daysSinceUsed < 7)
                score += 2;
            else if (daysSinceUsed < 30)
                score += 1;
        }

        // Usage frequency boost
        if (command.UsageCount > 10)
            score += 2;
        else if (command.UsageCount > 5)
            score += 1;

        return score;
    }

    private class CommandUsage
    {
        public string CommandId { get; set; } = string.Empty;
        public DateTime ExecutedAt { get; set; }
    }
}