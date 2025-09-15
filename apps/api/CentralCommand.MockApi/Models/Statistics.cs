namespace CentralCommand.MockApi.Models;

public class Statistics
{
    public int TotalPortals { get; set; }
    public int OperationalPortals { get; set; }
    public int DegradedPortals { get; set; }
    public int DownPortals { get; set; }
    public double AverageUptime { get; set; }
    public double AverageResponseTime { get; set; }
    public int TotalIncidents { get; set; }
    public int OpenIncidents { get; set; }
    public int ResolvedIncidents { get; set; }
    public int CriticalIncidents { get; set; }
    public double SystemHealth { get; set; }
    public DateTime LastUpdated { get; set; } = DateTime.UtcNow;
    public List<TimeSeriesData> UptimeHistory { get; set; } = new();
    public List<TimeSeriesData> ResponseTimeHistory { get; set; } = new();
}

public class TimeSeriesData
{
    public DateTime Timestamp { get; set; }
    public double Value { get; set; }
}