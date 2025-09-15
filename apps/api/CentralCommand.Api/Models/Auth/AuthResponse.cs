using CentralCommand.Api.Data.Entities;

namespace CentralCommand.Api.Models.Auth;

/// <summary>
/// Response model for authentication operations
/// </summary>
public class AuthResponse
{
    /// <summary>
    /// Access token expiration time in UTC
    /// </summary>
    public DateTime AccessTokenExpiration { get; set; }

    /// <summary>
    /// Refresh token expiration time in UTC
    /// </summary>
    public DateTime RefreshTokenExpiration { get; set; }

    /// <summary>
    /// User information
    /// </summary>
    public UserDto User { get; set; } = null!;

    /// <summary>
    /// CSRF protection token
    /// </summary>
    public string? CsrfToken { get; set; }
}

/// <summary>
/// User data transfer object
/// </summary>
public class UserDto
{
    public Guid Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string Username { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string? DisplayName { get; set; }
    public string? Avatar { get; set; }

    // Authentication
    public string Role { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string AuthProvider { get; set; } = string.Empty;

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

    // Preferences
    public UserPreferences Preferences { get; set; } = new();

    // Metadata
    public DateTime CreatedAt { get; set; }
    public DateTime? LastLoginAt { get; set; }
    public int LoginCount { get; set; }

    // Permissions
    public List<string> Permissions { get; set; } = new();
    public List<Guid> RestrictedPortals { get; set; } = new();

    // API access
    public string RateLimitTier { get; set; } = string.Empty;

    /// <summary>
    /// Create a UserDto from an ApplicationUser entity
    /// </summary>
    public static UserDto FromEntity(ApplicationUser user)
    {
        return new UserDto
        {
            Id = user.Id,
            Email = user.Email ?? string.Empty,
            Username = user.UserName ?? string.Empty,
            FirstName = user.FirstName,
            LastName = user.LastName,
            DisplayName = user.DisplayName,
            Avatar = user.Avatar,
            Role = user.Role.ToString(),
            Status = user.Status.ToString(),
            AuthProvider = user.AuthProvider.ToString(),
            Department = user.Department,
            JobTitle = user.JobTitle,
            TeamId = user.TeamId,
            ManagerId = user.ManagerId,
            Phone = user.Phone,
            Timezone = user.Timezone,
            Language = user.Language,
            Country = user.Country,
            Preferences = user.Preferences,
            CreatedAt = user.CreatedAt,
            LastLoginAt = user.LastLoginAt,
            LoginCount = user.LoginCount,
            Permissions = user.Permissions,
            RestrictedPortals = user.RestrictedPortals,
            RateLimitTier = user.RateLimitTier.ToString()
        };
    }
}