namespace CentralCommand.Core.Domain.Enums;

/// <summary>
/// Time range options for metrics
/// </summary>
public enum TimeRange
{
    /// <summary>Last one hour</summary>
    OneHour,
    /// <summary>Last 24 hours</summary>
    TwentyFourHours,
    /// <summary>Last 7 days</summary>
    SevenDays,
    /// <summary>Last 30 days</summary>
    ThirtyDays
}

/// <summary>
/// Metric trend direction
/// </summary>
public enum MetricTrend
{
    /// <summary>Metric is trending up</summary>
    Up,
    /// <summary>Metric is trending down</summary>
    Down,
    /// <summary>Metric is stable</summary>
    Stable
}