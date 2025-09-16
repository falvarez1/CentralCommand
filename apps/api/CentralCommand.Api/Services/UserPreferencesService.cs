using System.Collections.Concurrent;
using System.Text.Json;
using CentralCommand.Core.Interfaces.Services;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;

namespace CentralCommand.Api.Services;

/// <summary>
/// Service for managing user preferences
/// </summary>
public class UserPreferencesService : IUserPreferencesService
{
    private readonly ILogger<UserPreferencesService> _logger;
    private readonly IMemoryCache _cache;
    private readonly ConcurrentDictionary<Guid, UserPreferencesData> _preferences;
    private readonly ConcurrentDictionary<Guid, HashSet<Guid>> _favoritePortals;
    private readonly ConcurrentDictionary<Guid, DashboardLayoutResponse> _dashboardLayouts;

    public UserPreferencesService(ILogger<UserPreferencesService> logger, IMemoryCache cache)
    {
        _logger = logger;
        _cache = cache;
        _preferences = new ConcurrentDictionary<Guid, UserPreferencesData>();
        _favoritePortals = new ConcurrentDictionary<Guid, HashSet<Guid>>();
        _dashboardLayouts = new ConcurrentDictionary<Guid, DashboardLayoutResponse>();
    }

    public async Task<UserPreferencesResponse?> GetPreferencesAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        await Task.CompletedTask; // Make async for future enhancements

        var cacheKey = $"user_preferences_{userId}";
        if (_cache.TryGetValue<UserPreferencesResponse>(cacheKey, out var cached))
        {
            return cached;
        }

        if (!_preferences.TryGetValue(userId, out var data))
        {
            // Return default preferences for new users
            data = CreateDefaultPreferences(userId);
            _preferences[userId] = data;
        }

        var response = MapToResponse(data);
        _cache.Set(cacheKey, response, TimeSpan.FromMinutes(5));

        return response;
    }

    public async Task<UserPreferencesResponse> UpdatePreferencesAsync(Guid userId, UpdateUserPreferencesRequest request, CancellationToken cancellationToken = default)
    {
        await Task.CompletedTask; // Make async for future enhancements

        var data = _preferences.GetOrAdd(userId, CreateDefaultPreferences(userId));

        // Update only provided fields
        if (request.Theme != null) data.Theme = request.Theme;
        if (request.Language != null) data.Language = request.Language;
        if (request.TimeZone != null) data.TimeZone = request.TimeZone;
        if (request.DateFormat != null) data.DateFormat = request.DateFormat;
        if (request.TimeFormat != null) data.TimeFormat = request.TimeFormat;
        if (request.EmailNotifications.HasValue) data.EmailNotifications = request.EmailNotifications.Value;
        if (request.PushNotifications.HasValue) data.PushNotifications = request.PushNotifications.Value;
        if (request.SoundNotifications.HasValue) data.SoundNotifications = request.SoundNotifications.Value;
        if (request.DefaultView != null) data.DefaultView = request.DefaultView;
        if (request.ItemsPerPage.HasValue) data.ItemsPerPage = request.ItemsPerPage.Value;
        if (request.ShowMetricsOnCards.HasValue) data.ShowMetricsOnCards = request.ShowMetricsOnCards.Value;
        if (request.AutoRefresh.HasValue) data.AutoRefresh = request.AutoRefresh.Value;
        if (request.AutoRefreshInterval.HasValue) data.AutoRefreshInterval = request.AutoRefreshInterval.Value;

        if (request.CustomSettings != null)
        {
            foreach (var kvp in request.CustomSettings)
            {
                data.CustomSettings[kvp.Key] = kvp.Value;
            }
        }

        data.UpdatedAt = DateTime.UtcNow;

        // Clear cache
        var cacheKey = $"user_preferences_{userId}";
        _cache.Remove(cacheKey);

        _logger.LogInformation("Updated preferences for user {UserId}", userId);

        return MapToResponse(data);
    }

    public async Task<T?> GetPreferenceAsync<T>(Guid userId, string key, CancellationToken cancellationToken = default)
    {
        await Task.CompletedTask; // Make async for future enhancements

        if (!_preferences.TryGetValue(userId, out var data))
        {
            return default;
        }

        if (data.CustomSettings.TryGetValue(key, out var value))
        {
            try
            {
                if (value is JsonElement jsonElement)
                {
                    return JsonSerializer.Deserialize<T>(jsonElement.GetRawText());
                }
                return (T)Convert.ChangeType(value, typeof(T));
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to convert preference value for key {Key} to type {Type}", key, typeof(T).Name);
                return default;
            }
        }

        return default;
    }

    public async Task<bool> SetPreferenceAsync<T>(Guid userId, string key, T value, CancellationToken cancellationToken = default)
    {
        await Task.CompletedTask; // Make async for future enhancements

        var data = _preferences.GetOrAdd(userId, CreateDefaultPreferences(userId));
        data.CustomSettings[key] = value!;
        data.UpdatedAt = DateTime.UtcNow;

        // Clear cache
        var cacheKey = $"user_preferences_{userId}";
        _cache.Remove(cacheKey);

        _logger.LogDebug("Set preference {Key} for user {UserId}", key, userId);
        return true;
    }

    public async Task<UserPreferencesResponse> ResetToDefaultsAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        await Task.CompletedTask; // Make async for future enhancements

        var data = CreateDefaultPreferences(userId);
        _preferences[userId] = data;

        // Clear cache
        var cacheKey = $"user_preferences_{userId}";
        _cache.Remove(cacheKey);

        _logger.LogInformation("Reset preferences to defaults for user {UserId}", userId);

        return MapToResponse(data);
    }

    public async Task<IEnumerable<Guid>> GetFavoritePortalsAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        await Task.CompletedTask; // Make async for future enhancements

        if (_favoritePortals.TryGetValue(userId, out var favorites))
        {
            return favorites.ToList();
        }

        return Enumerable.Empty<Guid>();
    }

    public async Task<bool> AddFavoritePortalAsync(Guid userId, Guid portalId, CancellationToken cancellationToken = default)
    {
        await Task.CompletedTask; // Make async for future enhancements

        var favorites = _favoritePortals.GetOrAdd(userId, _ => new HashSet<Guid>());
        var added = favorites.Add(portalId);

        if (added)
        {
            _logger.LogInformation("Added portal {PortalId} to favorites for user {UserId}", portalId, userId);
        }

        return added;
    }

    public async Task<bool> RemoveFavoritePortalAsync(Guid userId, Guid portalId, CancellationToken cancellationToken = default)
    {
        await Task.CompletedTask; // Make async for future enhancements

        if (_favoritePortals.TryGetValue(userId, out var favorites))
        {
            var removed = favorites.Remove(portalId);
            if (removed)
            {
                _logger.LogInformation("Removed portal {PortalId} from favorites for user {UserId}", portalId, userId);
            }
            return removed;
        }

        return false;
    }

    public async Task<DashboardLayoutResponse> GetDashboardLayoutAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        await Task.CompletedTask; // Make async for future enhancements

        if (!_dashboardLayouts.TryGetValue(userId, out var layout))
        {
            layout = CreateDefaultDashboardLayout(userId);
            _dashboardLayouts[userId] = layout;
        }

        return layout;
    }

    public async Task<DashboardLayoutResponse> UpdateDashboardLayoutAsync(Guid userId, UpdateDashboardLayoutRequest request, CancellationToken cancellationToken = default)
    {
        await Task.CompletedTask; // Make async for future enhancements

        var layout = _dashboardLayouts.GetOrAdd(userId, CreateDefaultDashboardLayout(userId));

        if (request.Widgets != null && request.Widgets.Any())
        {
            layout.Widgets = request.Widgets;
        }

        if (request.LayoutType != null)
        {
            layout.LayoutType = request.LayoutType;
        }

        if (request.Settings != null)
        {
            foreach (var kvp in request.Settings)
            {
                layout.Settings[kvp.Key] = kvp.Value;
            }
        }

        _logger.LogInformation("Updated dashboard layout for user {UserId}", userId);

        return layout;
    }

    private UserPreferencesData CreateDefaultPreferences(Guid userId)
    {
        return new UserPreferencesData
        {
            UserId = userId,
            Theme = "light",
            Language = "en",
            TimeZone = "UTC",
            DateFormat = "MM/DD/YYYY",
            TimeFormat = "12h",
            EmailNotifications = true,
            PushNotifications = true,
            SoundNotifications = false,
            DefaultView = "grid",
            ItemsPerPage = 20,
            ShowMetricsOnCards = true,
            AutoRefresh = true,
            AutoRefreshInterval = 30,
            CustomSettings = new Dictionary<string, object>(),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
    }

    private DashboardLayoutResponse CreateDefaultDashboardLayout(Guid userId)
    {
        return new DashboardLayoutResponse
        {
            UserId = userId,
            LayoutType = "default",
            Widgets = new List<DashboardWidget>
            {
                new DashboardWidget
                {
                    Id = "stats-overview",
                    Type = "statistics",
                    Title = "System Overview",
                    Row = 0,
                    Column = 0,
                    Width = 12,
                    Height = 1,
                    IsVisible = true
                },
                new DashboardWidget
                {
                    Id = "recent-incidents",
                    Type = "incidents",
                    Title = "Recent Incidents",
                    Row = 1,
                    Column = 0,
                    Width = 6,
                    Height = 2,
                    IsVisible = true
                },
                new DashboardWidget
                {
                    Id = "portal-health",
                    Type = "portal-health",
                    Title = "Portal Health",
                    Row = 1,
                    Column = 6,
                    Width = 6,
                    Height = 2,
                    IsVisible = true
                },
                new DashboardWidget
                {
                    Id = "metrics-chart",
                    Type = "chart",
                    Title = "Performance Metrics",
                    Row = 3,
                    Column = 0,
                    Width = 12,
                    Height = 2,
                    IsVisible = true
                }
            },
            Settings = new Dictionary<string, object>()
        };
    }

    private UserPreferencesResponse MapToResponse(UserPreferencesData data)
    {
        return new UserPreferencesResponse
        {
            UserId = data.UserId,
            Theme = data.Theme,
            Language = data.Language,
            TimeZone = data.TimeZone,
            DateFormat = data.DateFormat,
            TimeFormat = data.TimeFormat,
            EmailNotifications = data.EmailNotifications,
            PushNotifications = data.PushNotifications,
            SoundNotifications = data.SoundNotifications,
            DefaultView = data.DefaultView,
            ItemsPerPage = data.ItemsPerPage,
            ShowMetricsOnCards = data.ShowMetricsOnCards,
            AutoRefresh = data.AutoRefresh,
            AutoRefreshInterval = data.AutoRefreshInterval,
            CustomSettings = data.CustomSettings,
            CreatedAt = data.CreatedAt,
            UpdatedAt = data.UpdatedAt
        };
    }

    private class UserPreferencesData
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
        public int AutoRefreshInterval { get; set; } = 30;
        public Dictionary<string, object> CustomSettings { get; set; } = new();
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }
}