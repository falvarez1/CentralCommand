namespace CentralCommand.Api.Data.Entities;

/// <summary>
/// Represents a user session for tracking login activity
/// </summary>
public class UserSession
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public string Token { get; set; } = string.Empty;
    public string? RefreshToken { get; set; }

    // Session details
    public string IpAddress { get; set; } = string.Empty;
    public string UserAgent { get; set; } = string.Empty;
    public DeviceInfo? Device { get; set; }

    // Timing
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime LastActivityAt { get; set; } = DateTime.UtcNow;
    public DateTime ExpiresAt { get; set; }

    // Security
    public bool IsActive { get; set; } = true;
    public DateTime? RevokedAt { get; set; }
    public string? RevokedReason { get; set; }

    // Navigation property
    public virtual ApplicationUser User { get; set; } = null!;
}

/// <summary>
/// Device information for session tracking
/// </summary>
public class DeviceInfo
{
    public string? Type { get; set; } // desktop, mobile, tablet
    public string? Os { get; set; }
    public string? Browser { get; set; }
}