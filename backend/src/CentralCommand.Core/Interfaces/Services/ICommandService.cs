using CentralCommand.Core.DTOs.Requests;
using CentralCommand.Core.DTOs.Responses;

namespace CentralCommand.Core.Interfaces.Services;

/// <summary>
/// Service interface for command palette operations
/// </summary>
public interface ICommandService
{
    /// <summary>
    /// Searches for commands based on query
    /// </summary>
    Task<IEnumerable<CommandResponse>> SearchCommandsAsync(string query, CancellationToken cancellationToken = default);

    /// <summary>
    /// Executes a command
    /// </summary>
    Task<CommandExecutionResult> ExecuteCommandAsync(string commandId, Dictionary<string, object>? parameters = null, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets recently used commands for a user
    /// </summary>
    Task<IEnumerable<CommandResponse>> GetRecentCommandsAsync(Guid userId, int count = 5, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets all available commands
    /// </summary>
    Task<IEnumerable<CommandResponse>> GetAllCommandsAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Registers a custom command
    /// </summary>
    Task<bool> RegisterCommandAsync(RegisterCommandRequest request, CancellationToken cancellationToken = default);

    /// <summary>
    /// Removes a custom command
    /// </summary>
    Task<bool> UnregisterCommandAsync(string commandId, CancellationToken cancellationToken = default);
}

/// <summary>
/// Response for command information
/// </summary>
public class CommandResponse
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string Icon { get; set; } = string.Empty;
    public string[] Shortcuts { get; set; } = Array.Empty<string>();
    public Dictionary<string, object>? Parameters { get; set; }
    public bool RequiresConfirmation { get; set; }
    public DateTime? LastUsed { get; set; }
    public int UsageCount { get; set; }
}

/// <summary>
/// Result of command execution
/// </summary>
public class CommandExecutionResult
{
    public bool Success { get; set; }
    public string? Message { get; set; }
    public object? Data { get; set; }
    public string? RedirectUrl { get; set; }
    public Dictionary<string, object>? Metadata { get; set; }
}

/// <summary>
/// Request to register a new command
/// </summary>
public class RegisterCommandRequest
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string Icon { get; set; } = string.Empty;
    public string[] Shortcuts { get; set; } = Array.Empty<string>();
    public string? Handler { get; set; }
    public Dictionary<string, object>? DefaultParameters { get; set; }
    public bool RequiresConfirmation { get; set; }
}