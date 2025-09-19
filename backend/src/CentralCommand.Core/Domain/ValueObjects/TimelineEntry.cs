namespace CentralCommand.Core.Domain.ValueObjects;

/// <summary>
/// Incident timeline entry value object
/// </summary>
public sealed record TimelineEntry
{
    /// <summary>
    /// Gets the entry identifier
    /// </summary>
    public Guid Id { get; init; } = Guid.NewGuid();

    /// <summary>
    /// Gets the timestamp
    /// </summary>
    public DateTime Timestamp { get; init; } = DateTime.UtcNow;

    /// <summary>
    /// Gets the action performed
    /// </summary>
    public string Action { get; init; } = string.Empty;

    /// <summary>
    /// Gets the description
    /// </summary>
    public string Description { get; init; } = string.Empty;

    /// <summary>
    /// Gets the user who performed the action
    /// </summary>
    public Guid PerformedBy { get; init; }

    /// <summary>
    /// Gets the user name (alias for compatibility)
    /// </summary>
    public string User { get; init; } = string.Empty;

    /// <summary>
    /// Gets the author name (alias for compatibility)
    /// </summary>
    public string Author { get; init; } = string.Empty;

    /// <summary>
    /// Gets the entry type
    /// </summary>
    public string Type { get; init; } = "general";

    /// <summary>
    /// Gets the details (alias for Description)
    /// </summary>
    public string Details => Description;

    /// <summary>
    /// Gets any additional metadata
    /// </summary>
    public Dictionary<string, object> Metadata { get; init; } = new();
}