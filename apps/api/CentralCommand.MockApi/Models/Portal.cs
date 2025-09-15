namespace CentralCommand.MockApi.Models;

public class Portal
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string Name { get; set; } = string.Empty;
    public string Url { get; set; } = string.Empty;
    public string Status { get; set; } = "operational";
    public string Environment { get; set; } = "production";
    public string Category { get; set; } = "general";
    public string Description { get; set; } = string.Empty;
    public bool IsFavorite { get; set; }
    public PortalMetrics Metrics { get; set; } = new();
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

public class PortalMetrics
{
    public double ResponseTime { get; set; }
    public double Uptime { get; set; }
    public int ErrorRate { get; set; }
    public int ActiveUsers { get; set; }
    public double CpuUsage { get; set; }
    public double MemoryUsage { get; set; }
    public DateTime LastChecked { get; set; } = DateTime.UtcNow;
}