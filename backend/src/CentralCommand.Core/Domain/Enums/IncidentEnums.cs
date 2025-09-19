namespace CentralCommand.Core.Domain.Enums;

/// <summary>
/// Incident severity levels
/// </summary>
public enum IncidentSeverity
{
    /// <summary>Critical severity - immediate action required</summary>
    Critical,
    /// <summary>High severity - urgent attention needed</summary>
    High,
    /// <summary>Medium severity - requires attention</summary>
    Medium,
    /// <summary>Low severity - can be addressed later</summary>
    Low
}

/// <summary>
/// Incident types
/// </summary>
public enum IncidentType
{
    /// <summary>System outage</summary>
    Outage,
    /// <summary>Performance degradation</summary>
    Performance,
    /// <summary>Scheduled maintenance</summary>
    Maintenance,
    /// <summary>Security incident</summary>
    Security,
    /// <summary>Database issue</summary>
    Database,
    /// <summary>Service issue</summary>
    Service,
    /// <summary>Infrastructure issue</summary>
    Infrastructure,
    /// <summary>Network issue</summary>
    Network
}

/// <summary>
/// Incident priority levels
/// </summary>
public enum IncidentPriority
{
    /// <summary>Critical priority - immediate action required</summary>
    Critical,
    /// <summary>High priority - urgent attention needed</summary>
    High,
    /// <summary>Medium priority - requires attention</summary>
    Medium,
    /// <summary>Low priority - can be addressed later</summary>
    Low
}

/// <summary>
/// Incident resolution status
/// </summary>
public enum IncidentStatus
{
    /// <summary>Incident is open</summary>
    Open,
    /// <summary>Incident has been acknowledged</summary>
    Acknowledged,
    /// <summary>Incident is being worked on</summary>
    InProgress,
    /// <summary>Incident has been resolved</summary>
    Resolved,
    /// <summary>Incident is closed</summary>
    Closed
}