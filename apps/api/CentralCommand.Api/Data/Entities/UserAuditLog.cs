namespace CentralCommand.Api.Data.Entities;

/// <summary>
/// Represents an audit log entry for user actions
/// </summary>
public class UserAuditLog
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public string Action { get; set; } = string.Empty;
    public string EntityType { get; set; } = string.Empty;
    public string? EntityId { get; set; }
    public AuditChanges? Changes { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    public string? IpAddress { get; set; }
    public string? UserAgent { get; set; }
    public bool Success { get; set; } = true;
    public string? ErrorMessage { get; set; }

    // Navigation property
    public virtual ApplicationUser User { get; set; } = null!;
}

/// <summary>
/// Represents before and after changes for audit logging
/// </summary>
public class AuditChanges
{
    public Dictionary<string, object?>? Before { get; set; }
    public Dictionary<string, object?>? After { get; set; }
}