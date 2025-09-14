namespace CentralCommand.MockApi.Models;

/// <summary>
/// Comment entity for incidents
/// </summary>
public class Comment
{
    public Guid Id { get; set; }
    public string Content { get; set; } = string.Empty;
    public Guid AuthorId { get; set; }
    public string AuthorName { get; set; } = string.Empty;
    public string AuthorEmail { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public bool IsInternal { get; set; }
    public bool IsEdited { get; set; }
    public List<string> Attachments { get; set; } = new();
    public List<Guid> MentionedUsers { get; set; } = new();
}

/// <summary>
/// Create comment request
/// </summary>
public record CreateCommentRequest
{
    public string Content { get; init; } = string.Empty;
    public bool IsInternal { get; init; }
    public List<string>? Attachments { get; init; }
    public List<Guid>? MentionedUsers { get; init; }
}