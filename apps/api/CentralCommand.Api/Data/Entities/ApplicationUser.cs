using Microsoft.AspNetCore.Identity;

namespace CentralCommand.Api.Data.Entities;

/// <summary>
/// Custom application user entity extending IdentityUser with additional properties
/// Based on the TypeScript User interface from user.types.ts
/// </summary>
public class ApplicationUser : IdentityUser<Guid>
{
    // Personal Information
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string? DisplayName { get; set; }
    public string? Avatar { get; set; }

    // Authentication & Authorization
    public UserRole Role { get; set; } = UserRole.Viewer;
    public UserStatus Status { get; set; } = UserStatus.Pending;
    public AuthProvider AuthProvider { get; set; } = AuthProvider.Local;
    public string? ExternalId { get; set; } // ID from external auth provider

    // Organization
    public string? Department { get; set; }
    public string? JobTitle { get; set; }
    public Guid? TeamId { get; set; }
    public Guid? ManagerId { get; set; }

    // Contact
    public string? Phone { get; set; }
    public string Timezone { get; set; } = "UTC";
    public string Language { get; set; } = "en";
    public string? Country { get; set; }

    // User Preferences (stored as JSON)
    public UserPreferences Preferences { get; set; } = new();

    // Metadata
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? LastLoginAt { get; set; }
    public DateTime? LastActivityAt { get; set; }
    public int LoginCount { get; set; } = 0;

    // Permissions
    public List<string> Permissions { get; set; } = new();
    public List<Guid> RestrictedPortals { get; set; } = new(); // Portal IDs user cannot access

    // API access
    public string? ApiKey { get; set; }
    public DateTime? ApiKeyCreatedAt { get; set; }
    public RateLimitTier RateLimitTier { get; set; } = RateLimitTier.Standard;

    // Navigation properties
    public virtual ICollection<UserSession> Sessions { get; set; } = new List<UserSession>();
    public virtual ICollection<UserAuditLog> AuditLogs { get; set; } = new List<UserAuditLog>();
    public virtual ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();
}

/// <summary>
/// User role enumeration
/// </summary>
public enum UserRole
{
    SuperAdmin,
    Admin,
    Manager,
    Developer,
    Analyst,
    Viewer,
    Guest
}

/// <summary>
/// User status enumeration
/// </summary>
public enum UserStatus
{
    Active,
    Inactive,
    Suspended,
    Pending,
    Deleted
}

/// <summary>
/// Authentication provider enumeration
/// </summary>
public enum AuthProvider
{
    Local,
    Google,
    Microsoft,
    GitHub,
    Okta,
    Auth0,
    SAML,
    LDAP
}

/// <summary>
/// Rate limit tier enumeration
/// </summary>
public enum RateLimitTier
{
    Basic,
    Standard,
    Premium,
    Unlimited
}

/// <summary>
/// User preferences class
/// </summary>
public class UserPreferences
{
    public string Theme { get; set; } = "auto"; // light, dark, auto
    public bool EmailNotifications { get; set; } = true;
    public bool PushNotifications { get; set; } = true;
    public bool TwoFactorEnabled { get; set; } = false;
    public string DefaultView { get; set; } = "dashboard"; // grid, list, dashboard
    public bool CompactMode { get; set; } = false;
    public bool ShowTutorials { get; set; } = true;
}