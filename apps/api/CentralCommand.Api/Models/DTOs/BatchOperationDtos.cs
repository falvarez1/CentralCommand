namespace CentralCommand.Api.Models.DTOs;

public class BatchOperationRequest
{
    public List<Guid> PortalIds { get; set; } = new();
    public string Operation { get; set; } = string.Empty;
    public Dictionary<string, object>? Data { get; set; }
}

public class BatchOperationResponse
{
    public string Operation { get; set; } = string.Empty;
    public int TotalCount { get; set; }
    public int SuccessCount { get; set; }
    public int FailureCount { get; set; }
    public List<BatchOperationResult> Results { get; set; } = new();
}

public class BatchOperationResult
{
    public Guid PortalId { get; set; }
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
}