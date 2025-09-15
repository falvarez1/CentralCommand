namespace CentralCommand.MockApi.Models;

public class Incident
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Severity { get; set; } = "medium";
    public string Status { get; set; } = "open";
    public string AffectedService { get; set; } = string.Empty;
    public string AssignedTo { get; set; } = string.Empty;
    public string ReportedBy { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ResolvedAt { get; set; }
    public List<string> Tags { get; set; } = new();
    public List<IncidentComment> Comments { get; set; } = new();
}

public class IncidentComment
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string Author { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}