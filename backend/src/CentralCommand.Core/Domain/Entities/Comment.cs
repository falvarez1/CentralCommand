using CentralCommand.Core.Domain.Common;
using System.ComponentModel.DataAnnotations;

namespace CentralCommand.Core.Domain.Entities;

/// <summary>
/// Comment entity for incidents
/// </summary>
public class Comment : BaseEntity
{
    /// <summary>
    /// Gets or sets the incident ID this comment belongs to
    /// </summary>
    [Required]
    public Guid IncidentId { get; set; }

    /// <summary>
    /// Gets or sets the comment text
    /// </summary>
    [Required]
    [StringLength(5000)]
    public string Text { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the comment content (alias for Text)
    /// </summary>
    public string Content
    {
        get => Text;
        set => Text = value;
    }

    /// <summary>
    /// Gets or sets the author user ID
    /// </summary>
    public Guid Author { get; set; }

    /// <summary>
    /// Gets or sets the author's display name
    /// </summary>
    [StringLength(200)]
    public string AuthorName { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the author's email
    /// </summary>
    [StringLength(256)]
    public string? AuthorEmail { get; set; }

    /// <summary>
    /// Gets or sets the author's avatar URL
    /// </summary>
    [StringLength(500)]
    [Url]
    public string? AuthorAvatar { get; set; }

    /// <summary>
    /// Gets or sets whether this is a system-generated comment
    /// </summary>
    public bool IsSystemGenerated { get; set; }

    /// <summary>
    /// Gets or sets whether this comment is internal only
    /// </summary>
    public bool IsInternal { get; set; }

    /// <summary>
    /// Gets or sets any attachments (JSON array of URLs)
    /// </summary>
    public string? Attachments { get; set; }

    /// <summary>
    /// Navigation property for the incident
    /// </summary>
    public virtual Incident? Incident { get; set; }

    /// <summary>
    /// Gets the list of attachment URLs
    /// </summary>
    public List<string> GetAttachments()
    {
        if (string.IsNullOrWhiteSpace(Attachments))
            return new List<string>();

        try
        {
            return System.Text.Json.JsonSerializer.Deserialize<List<string>>(Attachments) ?? new List<string>();
        }
        catch
        {
            return new List<string>();
        }
    }

    /// <summary>
    /// Sets the list of attachment URLs
    /// </summary>
    public void SetAttachments(List<string> attachments)
    {
        Attachments = attachments?.Any() == true
            ? System.Text.Json.JsonSerializer.Serialize(attachments)
            : null;
    }
}