namespace CentralCommand.Core.DTOs.Common;

/// <summary>
/// Paged response wrapper for API responses
/// </summary>
/// <typeparam name="T">The type of data in the response</typeparam>
public class PagedResponse<T>
{
    /// <summary>
    /// Gets or sets the data items
    /// </summary>
    public List<T> Data { get; set; } = new List<T>();

    /// <summary>
    /// Gets or sets the pagination metadata
    /// </summary>
    public PaginationMetadata Pagination { get; set; } = new();

    /// <summary>
    /// Gets or sets the response metadata
    /// </summary>
    public ResponseMetadata? Metadata { get; set; }
}

/// <summary>
/// Pagination metadata for paged responses
/// </summary>
public class PaginationMetadata
{
    /// <summary>
    /// Gets or sets the current page number (1-based)
    /// </summary>
    public int CurrentPage { get; set; }

    /// <summary>
    /// Gets or sets the page size
    /// </summary>
    public int PageSize { get; set; }

    /// <summary>
    /// Gets or sets the total count of items
    /// </summary>
    public int TotalCount { get; set; }

    /// <summary>
    /// Gets or sets the total number of pages
    /// </summary>
    public int TotalPages { get; set; }

    /// <summary>
    /// Gets or sets whether there is a next page
    /// </summary>
    public bool HasNext { get; set; }

    /// <summary>
    /// Gets or sets whether there is a previous page
    /// </summary>
    public bool HasPrevious { get; set; }
}

/// <summary>
/// Response metadata
/// </summary>
public class ResponseMetadata
{
    /// <summary>
    /// Gets or sets the cache duration in seconds
    /// </summary>
    public int? CacheDuration { get; set; }

    /// <summary>
    /// Gets or sets whether metrics are included
    /// </summary>
    public bool? IncludeMetrics { get; set; }

    /// <summary>
    /// Gets or sets the response timestamp
    /// </summary>
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}