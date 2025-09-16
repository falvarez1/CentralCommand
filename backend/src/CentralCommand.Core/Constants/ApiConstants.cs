namespace CentralCommand.Core.Constants;

/// <summary>
/// API-related constants
/// </summary>
public static class ApiConstants
{
    /// <summary>
    /// API version constants
    /// </summary>
    public static class Versions
    {
        public const string V1 = "1.0";
        public const string V2 = "2.0";
        public const string Current = V1;
    }

    /// <summary>
    /// Route constants
    /// </summary>
    public static class Routes
    {
        public const string ApiBase = "api";
        public const string Version = "v{version:apiVersion}";
        public const string Portals = "portals";
        public const string Incidents = "incidents";
        public const string Statistics = "statistics";
        public const string Health = "health";
        public const string Comments = "comments";
        public const string Metrics = "metrics";
    }

    /// <summary>
    /// Pagination constants
    /// </summary>
    public static class Pagination
    {
        public const int DefaultPageSize = 20;
        public const int MaxPageSize = 100;
        public const int DefaultPageNumber = 1;
    }

    /// <summary>
    /// Cache constants
    /// </summary>
    public static class Cache
    {
        public const int DefaultDurationSeconds = 60;
        public const int ShortDurationSeconds = 30;
        public const int LongDurationSeconds = 300;
        public const string PortalPrefix = "portal:";
        public const string IncidentPrefix = "incident:";
        public const string StatsPrefix = "stats:";
    }

    /// <summary>
    /// Rate limiting constants
    /// </summary>
    public static class RateLimiting
    {
        public const int DefaultRequestsPerMinute = 60;
        public const int BurstRequestsPerMinute = 100;
        public const string PolicyName = "default";
    }

    /// <summary>
    /// SignalR hub names
    /// </summary>
    public static class Hubs
    {
        public const string Metrics = "/hubs/metrics";
        public const string Incidents = "/hubs/incidents";
        public const string Notifications = "/hubs/notifications";
    }

    /// <summary>
    /// SignalR method names
    /// </summary>
    public static class HubMethods
    {
        public const string PortalMetricsUpdated = "PortalMetricsUpdated";
        public const string IncidentCreated = "IncidentCreated";
        public const string IncidentUpdated = "IncidentUpdated";
        public const string IncidentStatusChanged = "IncidentStatusChanged";
        public const string StatisticsUpdated = "StatisticsUpdated";
        public const string NotificationReceived = "NotificationReceived";
    }

    /// <summary>
    /// HTTP header names
    /// </summary>
    public static class Headers
    {
        public const string ApiKey = "X-Api-Key";
        public const string RequestId = "X-Request-Id";
        public const string CorrelationId = "X-Correlation-Id";
        public const string ETag = "ETag";
        public const string IfMatch = "If-Match";
        public const string IfNoneMatch = "If-None-Match";
    }
}