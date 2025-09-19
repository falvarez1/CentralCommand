namespace CentralCommand.Core.DTOs.Common;

/// <summary>
/// Standard API response wrapper
/// </summary>
/// <typeparam name="T">The type of data in the response</typeparam>
public class ApiResponse<T>
{
    /// <summary>
    /// Gets or sets whether the request was successful
    /// </summary>
    public bool Success { get; set; }

    /// <summary>
    /// Gets or sets the response data
    /// </summary>
    public T? Data { get; set; }

    /// <summary>
    /// Gets or sets the error message if the request failed
    /// </summary>
    public string? Error { get; set; }

    /// <summary>
    /// Gets or sets a success or informational message
    /// </summary>
    public string? Message { get; set; }

    /// <summary>
    /// Gets or sets additional error details
    /// </summary>
    public Dictionary<string, string[]>? Errors { get; set; }

    /// <summary>
    /// Gets or sets the timestamp of the response
    /// </summary>
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Gets or sets the request ID for tracing
    /// </summary>
    public string? RequestId { get; set; }

    /// <summary>
    /// Creates a successful response
    /// </summary>
    public static ApiResponse<T> SuccessResult(T data)
    {
        return new ApiResponse<T>
        {
            Success = true,
            Data = data
        };
    }

    /// <summary>
    /// Creates a failed response
    /// </summary>
    public static ApiResponse<T> FailureResult(string error, Dictionary<string, string[]>? errors = null)
    {
        return new ApiResponse<T>
        {
            Success = false,
            Error = error,
            Errors = errors
        };
    }
}