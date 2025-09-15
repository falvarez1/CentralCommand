using CentralCommand.Core.DTOs.Common;
using CentralCommand.Core.DTOs.Requests;
using CentralCommand.Core.DTOs.Responses;

namespace CentralCommand.Core.Interfaces.Services;

/// <summary>
/// Service interface for incident operations
/// </summary>
public interface IIncidentService
{
    /// <summary>
    /// Gets an incident by ID
    /// </summary>
    Task<IncidentResponse?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets all incidents with optional filtering and pagination
    /// </summary>
    Task<PagedResult<IncidentSummaryResponse>> GetIncidentsAsync(IncidentQueryRequest query, CancellationToken cancellationToken = default);

    /// <summary>
    /// Creates a new incident
    /// </summary>
    Task<IncidentResponse> CreateAsync(CreateIncidentRequest request, Guid userId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Updates an existing incident
    /// </summary>
    Task<IncidentResponse?> UpdateAsync(Guid id, UpdateIncidentRequest request, Guid userId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Deletes an incident
    /// </summary>
    Task<bool> DeleteAsync(Guid id, Guid userId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Acknowledges an incident
    /// </summary>
    Task<IncidentResponse?> AcknowledgeAsync(Guid id, AcknowledgeIncidentRequest request, Guid userId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Resolves an incident
    /// </summary>
    Task<IncidentResponse?> ResolveAsync(Guid id, ResolveIncidentRequest request, Guid userId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Closes an incident
    /// </summary>
    Task<IncidentResponse?> CloseAsync(Guid id, Guid userId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Adds a comment to an incident
    /// </summary>
    Task<CommentResponse> AddCommentAsync(Guid incidentId, AddIncidentCommentRequest request, Guid userId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets comments for an incident
    /// </summary>
    Task<IEnumerable<CommentResponse>> GetCommentsAsync(Guid incidentId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Deletes a comment
    /// </summary>
    Task<bool> DeleteCommentAsync(Guid incidentId, Guid commentId, Guid userId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets incident statistics
    /// </summary>
    Task<IncidentStatsResponse> GetStatisticsAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets incidents affecting a specific portal
    /// </summary>
    Task<IEnumerable<IncidentSummaryResponse>> GetByPortalAsync(Guid portalId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets active incidents
    /// </summary>
    Task<IEnumerable<IncidentSummaryResponse>> GetActiveIncidentsAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets incident timeline
    /// </summary>
    Task<IEnumerable<Domain.ValueObjects.TimelineEntry>> GetTimelineAsync(Guid id, CancellationToken cancellationToken = default);

    /// <summary>
    /// Escalates an incident
    /// </summary>
    Task<IncidentResponse?> EscalateAsync(Guid id, Domain.Enums.IncidentSeverity newSeverity, string reason, Guid userId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Links incidents together
    /// </summary>
    Task<bool> LinkIncidentsAsync(Guid primaryId, Guid relatedId, Guid userId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Generates an incident report
    /// </summary>
    Task<byte[]> GenerateReportAsync(Guid id, CancellationToken cancellationToken = default);

    /// <summary>
    /// Sends incident notifications
    /// </summary>
    Task SendNotificationsAsync(Guid id, CancellationToken cancellationToken = default);
}