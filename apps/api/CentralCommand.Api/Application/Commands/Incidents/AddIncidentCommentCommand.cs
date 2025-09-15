using CentralCommand.Core.DTOs.Responses;
using MediatR;

namespace CentralCommand.Api.Application.Commands.Incidents;

public record AddIncidentCommentCommand : IRequest<CommentResponse>
{
    public Guid IncidentId { get; init; }
    public string Content { get; init; } = string.Empty;
    public string Author { get; init; } = string.Empty;
    public bool IsInternal { get; init; }
    public List<string>? Attachments { get; init; }
}