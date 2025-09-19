namespace CentralCommand.Core.Utilities;

/// <summary>
/// DateTime extension methods
/// </summary>
public static class DateTimeExtensions
{
    /// <summary>
    /// Converts a DateTime to Unix timestamp (seconds since epoch)
    /// </summary>
    public static long ToUnixTimestamp(this DateTime dateTime)
    {
        var epoch = new DateTime(1970, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        var timeSpan = dateTime.ToUniversalTime() - epoch;
        return (long)timeSpan.TotalSeconds;
    }

    /// <summary>
    /// Converts a DateTime to Unix timestamp in milliseconds
    /// </summary>
    public static long ToUnixTimestampMillis(this DateTime dateTime)
    {
        var epoch = new DateTime(1970, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        var timeSpan = dateTime.ToUniversalTime() - epoch;
        return (long)timeSpan.TotalMilliseconds;
    }

    /// <summary>
    /// Converts Unix timestamp to DateTime
    /// </summary>
    public static DateTime FromUnixTimestamp(this long timestamp)
    {
        var epoch = new DateTime(1970, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        return epoch.AddSeconds(timestamp);
    }

    /// <summary>
    /// Gets the start of the day
    /// </summary>
    public static DateTime StartOfDay(this DateTime dateTime)
    {
        return new DateTime(dateTime.Year, dateTime.Month, dateTime.Day, 0, 0, 0, 0, dateTime.Kind);
    }

    /// <summary>
    /// Gets the end of the day
    /// </summary>
    public static DateTime EndOfDay(this DateTime dateTime)
    {
        return new DateTime(dateTime.Year, dateTime.Month, dateTime.Day, 23, 59, 59, 999, dateTime.Kind);
    }

    /// <summary>
    /// Gets the start of the week
    /// </summary>
    public static DateTime StartOfWeek(this DateTime dateTime, DayOfWeek startOfWeek = DayOfWeek.Monday)
    {
        int diff = (7 + (dateTime.DayOfWeek - startOfWeek)) % 7;
        return dateTime.AddDays(-1 * diff).StartOfDay();
    }

    /// <summary>
    /// Gets the end of the week
    /// </summary>
    public static DateTime EndOfWeek(this DateTime dateTime, DayOfWeek startOfWeek = DayOfWeek.Monday)
    {
        return dateTime.StartOfWeek(startOfWeek).AddDays(6).EndOfDay();
    }

    /// <summary>
    /// Gets the start of the month
    /// </summary>
    public static DateTime StartOfMonth(this DateTime dateTime)
    {
        return new DateTime(dateTime.Year, dateTime.Month, 1, 0, 0, 0, 0, dateTime.Kind);
    }

    /// <summary>
    /// Gets the end of the month
    /// </summary>
    public static DateTime EndOfMonth(this DateTime dateTime)
    {
        return dateTime.StartOfMonth().AddMonths(1).AddDays(-1).EndOfDay();
    }

    /// <summary>
    /// Gets a human-readable relative time string
    /// </summary>
    public static string ToRelativeTime(this DateTime dateTime, DateTime? relativeTo = null)
    {
        var now = relativeTo ?? DateTime.UtcNow;
        var timeSpan = now - dateTime;

        if (timeSpan.TotalSeconds < 60)
            return "just now";

        if (timeSpan.TotalMinutes < 60)
        {
            var minutes = (int)timeSpan.TotalMinutes;
            return $"{minutes} minute{(minutes != 1 ? "s" : "")} ago";
        }

        if (timeSpan.TotalHours < 24)
        {
            var hours = (int)timeSpan.TotalHours;
            return $"{hours} hour{(hours != 1 ? "s" : "")} ago";
        }

        if (timeSpan.TotalDays < 30)
        {
            var days = (int)timeSpan.TotalDays;
            return $"{days} day{(days != 1 ? "s" : "")} ago";
        }

        if (timeSpan.TotalDays < 365)
        {
            var months = (int)(timeSpan.TotalDays / 30);
            return $"{months} month{(months != 1 ? "s" : "")} ago";
        }

        var years = (int)(timeSpan.TotalDays / 365);
        return $"{years} year{(years != 1 ? "s" : "")} ago";
    }

    /// <summary>
    /// Checks if a date is a weekend
    /// </summary>
    public static bool IsWeekend(this DateTime dateTime)
    {
        return dateTime.DayOfWeek == DayOfWeek.Saturday || dateTime.DayOfWeek == DayOfWeek.Sunday;
    }

    /// <summary>
    /// Checks if a date is today
    /// </summary>
    public static bool IsToday(this DateTime dateTime)
    {
        return dateTime.Date == DateTime.Today;
    }

    /// <summary>
    /// Checks if a date is in the future
    /// </summary>
    public static bool IsFuture(this DateTime dateTime)
    {
        return dateTime > DateTime.UtcNow;
    }

    /// <summary>
    /// Checks if a date is in the past
    /// </summary>
    public static bool IsPast(this DateTime dateTime)
    {
        return dateTime < DateTime.UtcNow;
    }

    /// <summary>
    /// Gets the age in years from a date
    /// </summary>
    public static int GetAge(this DateTime dateTime, DateTime? asOfDate = null)
    {
        var today = asOfDate ?? DateTime.Today;
        var age = today.Year - dateTime.Year;

        if (dateTime.Date > today.AddYears(-age))
            age--;

        return age;
    }
}