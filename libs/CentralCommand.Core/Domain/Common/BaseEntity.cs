using System.ComponentModel.DataAnnotations;

namespace CentralCommand.Core.Domain.Common;

/// <summary>
/// Base entity class providing common properties for all domain entities
/// </summary>
public abstract class BaseEntity
{
    /// <summary>
    /// Gets or sets the unique identifier
    /// </summary>
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    /// <summary>
    /// Gets or sets the creation timestamp
    /// </summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Gets or sets the last update timestamp
    /// </summary>
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Gets or sets the user who created the entity
    /// </summary>
    public Guid CreatedBy { get; set; }

    /// <summary>
    /// Gets or sets the user who last updated the entity
    /// </summary>
    public Guid UpdatedBy { get; set; }

    /// <summary>
    /// Gets or sets the concurrency token for optimistic concurrency control
    /// </summary>
    [ConcurrencyCheck]
    public string ETag { get; set; } = Guid.NewGuid().ToString();

    /// <summary>
    /// Gets or sets whether the entity is deleted (soft delete)
    /// </summary>
    public bool IsDeleted { get; set; }

    /// <summary>
    /// Gets or sets the deletion timestamp
    /// </summary>
    public DateTime? DeletedAt { get; set; }

    /// <summary>
    /// Gets or sets the user who deleted the entity
    /// </summary>
    public Guid? DeletedBy { get; set; }
}