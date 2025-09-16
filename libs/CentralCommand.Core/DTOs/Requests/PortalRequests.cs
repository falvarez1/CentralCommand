using CentralCommand.Core.Domain.Enums;
using CentralCommand.Core.Domain.ValueObjects;
using System.ComponentModel.DataAnnotations;

namespace CentralCommand.Core.DTOs.Requests;

/// <summary>
/// Request to create a new portal
/// </summary>
public class CreatePortalRequest
{
    /// <summary>
    /// Gets or sets the portal name
    /// </summary>
    [Required]
    [StringLength(200)]
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the portal description
    /// </summary>
    [StringLength(1000)]
    public string? Description { get; set; }

    /// <summary>
    /// Gets or sets the portal URL
    /// </summary>
    [Required]
    [StringLength(500)]
    [Url]
    public string Url { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the portal category
    /// </summary>
    [Required]
    public PortalCategory Category { get; set; }

    /// <summary>
    /// Gets or sets the portal environment
    /// </summary>
    public PortalEnvironment Environment { get; set; } = PortalEnvironment.Production;

    /// <summary>
    /// Gets or sets the portal priority
    /// </summary>
    public PortalPriority Priority { get; set; } = PortalPriority.Medium;

    /// <summary>
    /// Gets or sets the authentication type
    /// </summary>
    public AuthType AuthType { get; set; } = AuthType.None;

    /// <summary>
    /// Gets or sets the authentication configuration
    /// </summary>
    public Dictionary<string, object>? AuthConfig { get; set; }

    /// <summary>
    /// Gets or sets the portal configuration
    /// </summary>
    public PortalConfig? Config { get; set; }

    /// <summary>
    /// Gets or sets the portal icon
    /// </summary>
    public string? Icon { get; set; }

    /// <summary>
    /// Gets or sets the portal color
    /// </summary>
    public string? Color { get; set; }

    /// <summary>
    /// Gets or sets the portal tags
    /// </summary>
    public List<string>? Tags { get; set; }

    /// <summary>
    /// Gets or sets whether the portal is public
    /// </summary>
    public bool IsPublic { get; set; }

    /// <summary>
    /// Gets or sets the owner ID
    /// </summary>
    public Guid? Owner { get; set; }

    /// <summary>
    /// Gets or sets the team ID
    /// </summary>
    public Guid? Team { get; set; }

    /// <summary>
    /// Gets or sets the maintainers
    /// </summary>
    public List<Guid>? Maintainers { get; set; }
}

/// <summary>
/// Request to update an existing portal
/// </summary>
public class UpdatePortalRequest
{
    /// <summary>
    /// Gets or sets the portal name
    /// </summary>
    [StringLength(200)]
    public string? Name { get; set; }

    /// <summary>
    /// Gets or sets the portal description
    /// </summary>
    [StringLength(1000)]
    public string? Description { get; set; }

    /// <summary>
    /// Gets or sets the portal URL
    /// </summary>
    [StringLength(500)]
    [Url]
    public string? Url { get; set; }

    /// <summary>
    /// Gets or sets the portal category
    /// </summary>
    public PortalCategory? Category { get; set; }

    /// <summary>
    /// Gets or sets the portal environment
    /// </summary>
    public PortalEnvironment? Environment { get; set; }

    /// <summary>
    /// Gets or sets the portal priority
    /// </summary>
    public PortalPriority? Priority { get; set; }

    /// <summary>
    /// Gets or sets the authentication type
    /// </summary>
    public AuthType? AuthType { get; set; }

    /// <summary>
    /// Gets or sets the authentication configuration
    /// </summary>
    public Dictionary<string, object>? AuthConfig { get; set; }

    /// <summary>
    /// Gets or sets the portal configuration
    /// </summary>
    public PortalConfig? Config { get; set; }

    /// <summary>
    /// Gets or sets the portal icon
    /// </summary>
    public string? Icon { get; set; }

    /// <summary>
    /// Gets or sets the portal color
    /// </summary>
    public string? Color { get; set; }

    /// <summary>
    /// Gets or sets the portal tags
    /// </summary>
    public List<string>? Tags { get; set; }

    /// <summary>
    /// Gets or sets whether the portal is marked as favorite
    /// </summary>
    public bool? IsFavorite { get; set; }

    /// <summary>
    /// Gets or sets whether the portal is public
    /// </summary>
    public bool? IsPublic { get; set; }

    /// <summary>
    /// Gets or sets the owner ID
    /// </summary>
    public Guid? Owner { get; set; }

    /// <summary>
    /// Gets or sets the team ID
    /// </summary>
    public Guid? Team { get; set; }

    /// <summary>
    /// Gets or sets the maintainers
    /// </summary>
    public List<Guid>? Maintainers { get; set; }

    /// <summary>
    /// Gets or sets the ETag for optimistic concurrency
    /// </summary>
    public string? ETag { get; set; }
}

/// <summary>
/// Request to update portal metrics
/// </summary>
public class UpdatePortalMetricsRequest
{
    /// <summary>
    /// Gets or sets the portal metrics
    /// </summary>
    [Required]
    public PortalMetrics Metrics { get; set; } = PortalMetrics.Default;
}

/// <summary>
/// Request to query portals
/// </summary>
public class PortalQueryRequest
{
    /// <summary>
    /// Gets or sets the search term
    /// </summary>
    public string? Search { get; set; }

    /// <summary>
    /// Gets or sets the category filter
    /// </summary>
    public PortalCategory? Category { get; set; }

    /// <summary>
    /// Gets or sets the status filter
    /// </summary>
    public PortalStatus? Status { get; set; }

    /// <summary>
    /// Gets or sets the environment filter
    /// </summary>
    public PortalEnvironment? Environment { get; set; }

    /// <summary>
    /// Gets or sets the priority filter
    /// </summary>
    public PortalPriority? Priority { get; set; }

    /// <summary>
    /// Gets or sets whether to include only favorites
    /// </summary>
    public bool? IsFavorite { get; set; }

    /// <summary>
    /// Gets or sets whether to include only public portals
    /// </summary>
    public bool? IsPublic { get; set; }

    /// <summary>
    /// Gets or sets the team filter
    /// </summary>
    public Guid? Team { get; set; }

    /// <summary>
    /// Gets or sets the owner filter
    /// </summary>
    public Guid? Owner { get; set; }

    /// <summary>
    /// Gets or sets tag filters
    /// </summary>
    public List<string>? Tags { get; set; }

    /// <summary>
    /// Gets or sets the sort field
    /// </summary>
    public string SortBy { get; set; } = "Name";

    /// <summary>
    /// Gets or sets whether to sort in descending order
    /// </summary>
    public bool SortDescending { get; set; }

    /// <summary>
    /// Gets or sets the page number (1-based)
    /// </summary>
    [Range(1, int.MaxValue)]
    public int PageNumber { get; set; } = 1;

    /// <summary>
    /// Gets or sets the page size
    /// </summary>
    [Range(1, 100)]
    public int PageSize { get; set; } = 20;

    /// <summary>
    /// Gets or sets whether to include metrics in the response
    /// </summary>
    public bool IncludeMetrics { get; set; }

    /// <summary>
    /// Gets the search term (alias for Search)
    /// </summary>
    public string? SearchTerm => Search;

    /// <summary>
    /// Gets the page (alias for PageNumber)
    /// </summary>
    public int Page => PageNumber;

    /// <summary>
    /// Gets a cache key for this query
    /// </summary>
    public string GetCacheKey()
    {
        var key = $"portals:{PageNumber}:{PageSize}";
        if (!string.IsNullOrWhiteSpace(Search))
            key += $":s:{Search}";
        if (Category.HasValue)
            key += $":c:{Category}";
        if (Status.HasValue)
            key += $":st:{Status}";
        if (Environment.HasValue)
            key += $":e:{Environment}";
        if (Priority.HasValue)
            key += $":p:{Priority}";
        if (IsFavorite.HasValue)
            key += $":f:{IsFavorite}";
        if (!string.IsNullOrWhiteSpace(SortBy))
            key += $":sb:{SortBy}:{SortDescending}";
        return key;
    }
}

/// <summary>
/// Request for batch portal operations
/// </summary>
public class BatchPortalOperationRequest
{
    /// <summary>
    /// Gets or sets the operation type
    /// </summary>
    [Required]
    public BatchOperationType Operation { get; set; }

    /// <summary>
    /// Gets or sets the portal IDs to operate on
    /// </summary>
    [Required]
    [MinLength(1)]
    public List<Guid> PortalIds { get; set; } = new();

    /// <summary>
    /// Gets or sets the update data (for update operations)
    /// </summary>
    public UpdatePortalRequest? UpdateData { get; set; }
}

/// <summary>
/// Batch operation types
/// </summary>
public enum BatchOperationType
{
    /// <summary>Update multiple portals</summary>
    Update,
    /// <summary>Delete multiple portals</summary>
    Delete,
    /// <summary>Enable monitoring for multiple portals</summary>
    EnableMonitoring,
    /// <summary>Disable monitoring for multiple portals</summary>
    DisableMonitoring,
    /// <summary>Mark multiple portals as favorites</summary>
    AddToFavorites,
    /// <summary>Remove multiple portals from favorites</summary>
    RemoveFromFavorites
}

/// <summary>
/// Request for batch operations (generic alias for BatchPortalOperationRequest)
/// </summary>
public class BatchOperationRequest : BatchPortalOperationRequest
{
}