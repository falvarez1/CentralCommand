using CentralCommand.Core.DTOs.Requests;
using CentralCommand.Core.DTOs.Responses;

namespace CentralCommand.Core.Interfaces.Services;

/// <summary>
/// Service interface for user preferences management
/// </summary>
public interface IUserPreferencesService
{
    /// <summary>
    /// Gets user preferences
    /// </summary>
    Task<UserPreferencesResponse?> GetPreferencesAsync(Guid userId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Updates user preferences
    /// </summary>
    Task<UserPreferencesResponse> UpdatePreferencesAsync(Guid userId, UpdateUserPreferencesRequest request, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets a specific preference value
    /// </summary>
    Task<T?> GetPreferenceAsync<T>(Guid userId, string key, CancellationToken cancellationToken = default);

    /// <summary>
    /// Sets a specific preference value
    /// </summary>
    Task<bool> SetPreferenceAsync<T>(Guid userId, string key, T value, CancellationToken cancellationToken = default);

    /// <summary>
    /// Resets user preferences to defaults
    /// </summary>
    Task<UserPreferencesResponse> ResetToDefaultsAsync(Guid userId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets favorite portal IDs for a user
    /// </summary>
    Task<IEnumerable<Guid>> GetFavoritePortalsAsync(Guid userId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Adds a portal to favorites
    /// </summary>
    Task<bool> AddFavoritePortalAsync(Guid userId, Guid portalId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Removes a portal from favorites
    /// </summary>
    Task<bool> RemoveFavoritePortalAsync(Guid userId, Guid portalId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets user's dashboard layout preferences
    /// </summary>
    Task<DashboardLayoutResponse> GetDashboardLayoutAsync(Guid userId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Updates user's dashboard layout
    /// </summary>
    Task<DashboardLayoutResponse> UpdateDashboardLayoutAsync(Guid userId, UpdateDashboardLayoutRequest request, CancellationToken cancellationToken = default);
}

/// <summary>
/// User preferences response
/// </summary>
public class UserPreferencesResponse
{
    public Guid UserId { get; set; }
    public string Theme { get; set; } = "light";
    public string Language { get; set; } = "en";
    public string TimeZone { get; set; } = "UTC";
    public string DateFormat { get; set; } = "MM/DD/YYYY";
    public string TimeFormat { get; set; } = "12h";
    public bool EmailNotifications { get; set; } = true;
    public bool PushNotifications { get; set; } = true;
    public bool SoundNotifications { get; set; } = false;
    public string DefaultView { get; set; } = "grid";
    public int ItemsPerPage { get; set; } = 20;
    public bool ShowMetricsOnCards { get; set; } = true;
    public bool AutoRefresh { get; set; } = true;
    public int AutoRefreshInterval { get; set; } = 30; // seconds
    public Dictionary<string, object> CustomSettings { get; set; } = new();
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

/// <summary>
/// Update user preferences request
/// </summary>
public class UpdateUserPreferencesRequest
{
    public string? Theme { get; set; }
    public string? Language { get; set; }
    public string? TimeZone { get; set; }
    public string? DateFormat { get; set; }
    public string? TimeFormat { get; set; }
    public bool? EmailNotifications { get; set; }
    public bool? PushNotifications { get; set; }
    public bool? SoundNotifications { get; set; }
    public string? DefaultView { get; set; }
    public int? ItemsPerPage { get; set; }
    public bool? ShowMetricsOnCards { get; set; }
    public bool? AutoRefresh { get; set; }
    public int? AutoRefreshInterval { get; set; }
    public Dictionary<string, object>? CustomSettings { get; set; }
}

/// <summary>
/// Dashboard layout response
/// </summary>
public class DashboardLayoutResponse
{
    public Guid UserId { get; set; }
    public List<DashboardWidget> Widgets { get; set; } = new();
    public string LayoutType { get; set; } = "default";
    public Dictionary<string, object> Settings { get; set; } = new();
}

/// <summary>
/// Dashboard widget configuration
/// </summary>
public class DashboardWidget
{
    public string Id { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public int Row { get; set; }
    public int Column { get; set; }
    public int Width { get; set; }
    public int Height { get; set; }
    public Dictionary<string, object> Settings { get; set; } = new();
    public bool IsVisible { get; set; } = true;
}

/// <summary>
/// Update dashboard layout request
/// </summary>
public class UpdateDashboardLayoutRequest
{
    public List<DashboardWidget> Widgets { get; set; } = new();
    public string? LayoutType { get; set; }
    public Dictionary<string, object>? Settings { get; set; }
}