using AutoMapper;
using CentralCommand.Core.Domain.Entities;
using CentralCommand.Core.DTOs.Responses;
using CentralCommand.Core.Interfaces.Repositories;
using MediatR;
using Microsoft.Extensions.Logging;

namespace CentralCommand.Api.Application.Commands.Incidents;

public class AddIncidentCommentCommandHandler : IRequestHandler<AddIncidentCommentCommand, CommentResponse>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    private readonly ILogger<AddIncidentCommentCommandHandler> _logger;

    public AddIncidentCommentCommandHandler(
        IUnitOfWork unitOfWork,
        IMapper mapper,
        ILogger<AddIncidentCommentCommandHandler> logger)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
        _logger = logger;
    }

    public async Task<CommentResponse> Handle(AddIncidentCommentCommand request, CancellationToken cancellationToken)
    {
        _logger.LogInformation("Adding comment to incident: {IncidentId}", request.IncidentId);

        var incident = await _unitOfWork.Incidents.GetIncidentWithDetailsAsync(request.IncidentId, cancellationToken);
        if (incident == null)
        {
            throw new KeyNotFoundException($"Incident with ID {request.IncidentId} not found.");
        }

        var comment = new Comment
        {
            Id = Guid.NewGuid(),
            Content = request.Content,
            Author = request.Author,
            CreatedAt = DateTime.UtcNow,
            IsInternal = request.IsInternal,
            Attachments = request.Attachments ?? new List<string>()
        };

        incident.Comments.Add(comment);

        // Add timeline entry
        incident.Timeline.Add(new TimelineEntry
        {
            Id = Guid.NewGuid(),
            Timestamp = DateTime.UtcNow,
            Action = request.IsInternal ? "Internal comment added" : "Comment added",
            User = request.Author,
            Details = $"Comment added: {request.Content.Substring(0, Math.Min(request.Content.Length, 100))}..."
        });

        incident.UpdatedAt = DateTime.UtcNow;

        await _unitOfWork.Incidents.UpdateAsync(incident, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Comment added successfully to incident: {IncidentId}", request.IncidentId);

        return _mapper.Map<CommentResponse>(comment);
    }
}