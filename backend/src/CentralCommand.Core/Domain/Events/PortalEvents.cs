using CentralCommand.Core.Domain.Enums;
using CentralCommand.Core.DTOs.Responses;

namespace CentralCommand.Core.Domain.Events;

/// <summary>
/// Base class for portal domain events
/// </summary>
public abstract class PortalDomainEvent
{
    /// <summary>
    /// Gets or sets the portal ID
    /// </summary>
    public Guid PortalId { get; set; }

    /// <summary>
    /// Gets or sets the event timestamp
    /// </summary>
    public DateTime OccurredAt { get; set; } = DateTime.UtcNow;
}

/// <summary>
/// Event raised when a portal is created
/// </summary>
public class PortalCreatedEvent : PortalDomainEvent
{
    /// <summary>
    /// Gets or sets the portal name
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the portal URL
    /// </summary>
    public string Url { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the portal environment
    /// </summary>
    public string Environment { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets when the portal was created
    /// </summary>
    public DateTime CreatedAt { get; set; }
}

/// <summary>
/// Event raised when a portal is updated
/// </summary>
public class PortalUpdatedEvent : PortalDomainEvent
{
    /// <summary>
    /// Gets or sets when the portal was updated
    /// </summary>
    public DateTime UpdatedAt { get; set; }
}

/// <summary>
/// Event raised when a portal is deleted
/// </summary>
public class PortalDeletedEvent : PortalDomainEvent
{
    /// <summary>
    /// Gets or sets when the portal was deleted
    /// </summary>
    public DateTime DeletedAt { get; set; }
}

/// <summary>
/// Event raised when portal metrics are updated
/// </summary>
public class PortalMetricsUpdatedEvent : PortalDomainEvent
{
    /// <summary>
    /// Gets or sets the updated metrics
    /// </summary>
    public PortalMetricsResponse? Metrics { get; set; }

    /// <summary>
    /// Gets or sets the timestamp
    /// </summary>
    public DateTime Timestamp { get; set; }
}

/// <summary>
/// Event raised when portal status changes
/// </summary>
public class PortalStatusChangedEvent : PortalDomainEvent
{
    /// <summary>
    /// Gets or sets the portal name
    /// </summary>
    public string PortalName { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the old status
    /// </summary>
    public PortalStatus OldStatus { get; set; }

    /// <summary>
    /// Gets or sets the new status
    /// </summary>
    public PortalStatus NewStatus { get; set; }

    /// <summary>
    /// Gets or sets the reason for the status change
    /// </summary>
    public string? Reason { get; set; }

    /// <summary>
    /// Gets or sets the timestamp
    /// </summary>
    public DateTime Timestamp { get; set; }
}