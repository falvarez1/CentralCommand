namespace CentralCommand.Core.Domain.Enums;

/// <summary>
/// Metric interval for aggregation
/// </summary>
public enum MetricInterval
{
    /// <summary>Five minute interval</summary>
    FiveMinutes,
    /// <summary>Fifteen minute interval</summary>
    FifteenMinutes,
    /// <summary>Thirty minute interval</summary>
    ThirtyMinutes,
    /// <summary>Hourly interval</summary>
    Hour,
    /// <summary>Daily interval</summary>
    Day,
    /// <summary>Weekly interval</summary>
    Week,
    /// <summary>Monthly interval</summary>
    Month
}

/// <summary>
/// Alert types for system notifications
/// </summary>
public enum AlertType
{
    /// <summary>System alert</summary>
    System,
    /// <summary>Performance alert</summary>
    Performance,
    /// <summary>Security alert</summary>
    Security,
    /// <summary>Service alert</summary>
    Service,
    /// <summary>Infrastructure alert</summary>
    Infrastructure,
    /// <summary>Database alert</summary>
    Database,
    /// <summary>Network alert</summary>
    Network,
    /// <summary>Custom alert</summary>
    Custom
}

/// <summary>
/// Alert severity levels
/// </summary>
public enum AlertSeverity
{
    /// <summary>Critical severity - immediate action required</summary>
    Critical,
    /// <summary>High severity - urgent attention needed</summary>
    High,
    /// <summary>Medium severity - requires attention</summary>
    Medium,
    /// <summary>Low severity - can be addressed later</summary>
    Low,
    /// <summary>Info severity - informational only</summary>
    Info
}

/// <summary>
/// Batch operation types
/// </summary>
public enum BatchOperationType
{
    /// <summary>Update operation</summary>
    Update,
    /// <summary>Delete operation</summary>
    Delete,
    /// <summary>Archive operation</summary>
    Archive,
    /// <summary>Restore operation</summary>
    Restore,
    /// <summary>Enable operation</summary>
    Enable,
    /// <summary>Disable operation</summary>
    Disable
}