namespace CentralCommand.MockApi.Models;

/// <summary>
/// Batch operation types
/// </summary>
public enum BatchOperationType
{
    UpdateStatus,
    UpdatePriority,
    UpdateEnvironment,
    AddTags,
    RemoveTags,
    ToggleFavorite,
    EnableMonitoring,
    DisableMonitoring,
    Delete
}

/// <summary>
/// Batch operation request
/// </summary>
public class BatchOperationRequest
{
    public List<Guid> PortalIds { get; set; } = new();
    public BatchOperationType Operation { get; set; }
    public Dictionary<string, object>? Parameters { get; set; }
}

/// <summary>
/// Batch operation result for individual portal
/// </summary>
public class BatchOperationItemResult
{
    public Guid PortalId { get; set; }
    public bool Success { get; set; }
    public string? ErrorMessage { get; set; }
    public object? UpdatedData { get; set; }
}

/// <summary>
/// Batch operation response
/// </summary>
public class BatchOperationResponse
{
    public string OperationId { get; set; } = string.Empty;
    public BatchOperationType Operation { get; set; }
    public int TotalItems { get; set; }
    public int SuccessCount { get; set; }
    public int FailureCount { get; set; }
    public List<BatchOperationItemResult> Results { get; set; } = new();
    public DateTime StartedAt { get; set; }
    public DateTime CompletedAt { get; set; }
    public long DurationMs { get; set; }
}