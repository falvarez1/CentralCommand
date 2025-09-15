namespace CentralCommand.Api.Models;

/// <summary>
/// Standard API response wrapper
/// </summary>
/// <typeparam name="T">The type of data in the response</typeparam>
public class ApiResponse<T>
{
    /// <summary>
    /// Status of the API response
    /// </summary>
    public ApiStatus Status { get; set; }

    /// <summary>
    /// The response data
    /// </summary>
    public T? Data { get; set; }

    /// <summary>
    /// Error information if the request failed
    /// </summary>
    public ApiError? Error { get; set; }

    /// <summary>
    /// Response metadata
    /// </summary>
    public ApiMetadata? Metadata { get; set; }
}

/// <summary>
/// API response status
/// </summary>
public enum ApiStatus
{
    Success,
    Error,
    PartialSuccess
}

/// <summary>
/// API error information
/// </summary>
public class ApiError
{
    /// <summary>
    /// Error code
    /// </summary>
    public string Code { get; set; } = string.Empty;

    /// <summary>
    /// Error message
    /// </summary>
    public string Message { get; set; } = string.Empty;

    /// <summary>
    /// Detailed error information
    /// </summary>
    public string? Details { get; set; }

    /// <summary>
    /// Field-specific validation errors
    /// </summary>
    public Dictionary<string, string[]>? ValidationErrors { get; set; }
}

/// <summary>
/// API response metadata
/// </summary>
public class ApiMetadata
{
    /// <summary>
    /// Timestamp of the response
    /// </summary>
    public DateTime Timestamp { get; set; }

    /// <summary>
    /// Unique request identifier
    /// </summary>
    public string RequestId { get; set; } = string.Empty;

    /// <summary>
    /// API version
    /// </summary>
    public string? Version { get; set; }

    /// <summary>
    /// Pagination information
    /// </summary>
    public PaginationResponse? Pagination { get; set; }

    /// <summary>
    /// Response processing time in milliseconds
    /// </summary>
    public double? ProcessingTime { get; set; }
}

/// <summary>
/// Pagination response information
/// </summary>
public class PaginationResponse
{
    /// <summary>
    /// Current page number
    /// </summary>
    public int Page { get; set; }

    /// <summary>
    /// Items per page
    /// </summary>
    public int PageSize { get; set; }

    /// <summary>
    /// Total number of items
    /// </summary>
    public int TotalItems { get; set; }

    /// <summary>
    /// Total number of pages
    /// </summary>
    public int TotalPages { get; set; }

    /// <summary>
    /// Indicates if there is a next page
    /// </summary>
    public bool HasNext { get; set; }

    /// <summary>
    /// Indicates if there is a previous page
    /// </summary>
    public bool HasPrevious { get; set; }
}