using System;
using System.Collections.Generic;
using System.Linq;
using CentralCommand.Core.Domain.Entities;
using CentralCommand.Core.Domain.Enums;
using CentralCommand.Core.Domain.ValueObjects;
using CentralCommand.Core.DTOs.Requests;
using CentralCommand.Core.DTOs.Responses;

namespace CentralCommand.Core.Extensions;

public static class MappingExtensions
{
    #region Portal Mappings

    public static PortalResponse? ToResponse(this Portal? portal)
    {
        if (portal == null) return null;

        return new PortalResponse
        {
            Id = portal.Id,
            Name = portal.Name,
            Url = portal.Url,
            Description = portal.Description,
            Status = portal.Status,
            Category = portal.Category,
            Environment = portal.Environment,
            Priority = portal.Priority,
            AuthType = portal.AuthType,
            Owner = portal.Owner,
            Team = portal.Team,
            Tags = portal.GetTags(),
            IsFavorite = portal.IsFavorite,
            IsPublic = portal.IsPublic,
            Metrics = portal.Metrics,
            Config = portal.Config,
            Icon = portal.Icon,
            Color = portal.Color,
            Maintainers = portal.GetMaintainers(),
            LastChecked = portal.LastChecked,
            LastIncident = portal.LastIncident,
            CreatedAt = portal.CreatedAt,
            UpdatedAt = portal.UpdatedAt,
            CreatedBy = portal.CreatedBy,
            UpdatedBy = portal.UpdatedBy,
            ETag = portal.ETag,
            MetricsHistory = new List<MetricsDataPoint>()
        };
    }

    // Removed ToResponse for PortalMetrics as PortalResponse expects PortalMetrics directly, not PortalMetricsResponse

    // Removed ToResponse for PortalConfig as PortalResponse expects PortalConfig directly, not PortalConfigResponse

    public static HealthCheckResponse? ToResponse(this HealthCheck? healthCheck)
    {
        if (healthCheck == null) return null;

        return new HealthCheckResponse
        {
            Id = healthCheck.Id,
            Type = healthCheck.Type.ToString(),
            Status = healthCheck.Status.ToString(),
            LastCheckTime = healthCheck.LastChecked ?? DateTime.UtcNow,
            ResponseTime = healthCheck.LastResponseTime ?? 0,
            StatusCode = healthCheck.ExpectedStatusCode
        };
    }

    public static Portal? ToEntity(this CreatePortalRequest? request)
    {
        if (request == null) return null;

        var portal = new Portal
        {
            Id = Guid.NewGuid(),
            Name = request.Name,
            Url = request.Url,
            Description = request.Description,
            Status = PortalStatus.Unknown,
            Category = request.Category,
            Environment = request.Environment,
            Priority = request.Priority,
            AuthType = request.AuthType,
            Owner = request.Owner,
            Team = request.Team,
            Icon = request.Icon,
            Color = request.Color,
            IsFavorite = false,
            IsPublic = request.IsPublic,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            LastChecked = DateTime.UtcNow,
            Config = request.Config ?? PortalConfig.Default,
            Metrics = PortalMetrics.Default
        };

        // Set tags if provided
        if (request.Tags?.Any() == true)
        {
            portal.SetTags(request.Tags);
        }

        // Set maintainers if provided
        if (request.Maintainers?.Any() == true)
        {
            portal.SetMaintainers(request.Maintainers);
        }

        return portal;
    }

    public static void UpdateFrom(this Portal portal, UpdatePortalRequest request)
    {
        if (portal == null || request == null) return;

        // Update only if values are provided
        if (request.Name != null)
            portal.Name = request.Name;
        if (request.Url != null)
            portal.Url = request.Url;
        if (request.Description != null)
            portal.Description = request.Description;
        if (request.Category.HasValue)
            portal.Category = request.Category.Value;
        if (request.Environment.HasValue)
            portal.Environment = request.Environment.Value;
        if (request.Priority.HasValue)
            portal.Priority = request.Priority.Value;
        if (request.AuthType.HasValue)
            portal.AuthType = request.AuthType.Value;
        if (request.Owner.HasValue)
            portal.Owner = request.Owner;
        if (request.Team.HasValue)
            portal.Team = request.Team;
        if (request.Icon != null)
            portal.Icon = request.Icon;
        if (request.Color != null)
            portal.Color = request.Color;
        if (request.IsFavorite.HasValue)
            portal.IsFavorite = request.IsFavorite.Value;
        if (request.IsPublic.HasValue)
            portal.IsPublic = request.IsPublic.Value;

        // Update tags if provided
        if (request.Tags != null)
        {
            portal.SetTags(request.Tags);
        }

        // Update maintainers if provided
        if (request.Maintainers != null)
        {
            portal.SetMaintainers(request.Maintainers);
        }

        // Update config if provided
        if (request.Config != null)
        {
            portal.Config = request.Config;
        }

        // Update timestamps and ETag
        portal.UpdatedAt = DateTime.UtcNow;
        portal.LastModifiedAt = DateTime.UtcNow;
        portal.ETag = Guid.NewGuid().ToString();
    }

    #endregion

    #region Incident Mappings

    public static IncidentResponse? ToResponse(this Incident? incident)
    {
        if (incident == null) return null;

        return new IncidentResponse
        {
            Id = incident.Id,
            Title = incident.Title,
            Description = incident.Description,
            Type = incident.Type,
            Severity = incident.Severity,
            Status = incident.Status,
            Priority = incident.Priority,
            AffectedPortals = incident.GetAffectedPortals(),
            AffectedServices = incident.GetAffectedServices(),
            ImpactedUsers = incident.ImpactedUsers,
            Assignee = incident.Assignee,
            Team = incident.Team,
            ReportedBy = incident.ReportedBy,
            CreatedAt = incident.CreatedAt,
            UpdatedAt = incident.UpdatedAt,
            ResolvedAt = incident.ResolvedAt,
            AcknowledgedAt = incident.AcknowledgedAt,
            RootCause = incident.RootCause,
            Resolution = incident.Resolution,
            PostmortemUrl = incident.PostmortemUrl,
            Tags = incident.GetTags(),
            Timeline = incident.GetTimeline(),
            IsPublic = incident.IsPublic,
            CreatedBy = incident.CreatedBy,
            UpdatedBy = incident.UpdatedBy,
            ETag = incident.ETag,
            CommentCount = incident.CommentCount,
            Comments = incident.Comments?.Select(c => c.ToResponse()).Where(c => c != null).Select(c => c!).ToList() ?? new List<CommentResponse>()
        };
    }

    public static CommentResponse? ToResponse(this Comment? comment)
    {
        if (comment == null) return null;

        return new CommentResponse
        {
            Id = comment.Id,
            IncidentId = comment.IncidentId,
            Text = comment.Text,
            IsSystemGenerated = comment.IsSystemGenerated,
            IsInternal = comment.IsInternal,
            Attachments = comment.GetAttachments(),
            CreatedAt = comment.CreatedAt,
            CreatedBy = comment.Author
        };
    }

    public static TimelineEntryResponse? ToResponse(this TimelineEntry? entry)
    {
        if (entry == null) return null;

        return new TimelineEntryResponse
        {
            Id = Guid.NewGuid(), // Generate ID for response
            IncidentId = Guid.Empty, // Will be set by caller if needed
            Timestamp = entry.Timestamp,
            EventType = entry.Action,
            Description = entry.Description,
            UserId = entry.PerformedBy,
            Metadata = new Dictionary<string, object>()
        };
    }

    public static Incident? ToEntity(this CreateIncidentRequest? request)
    {
        if (request == null) return null;

        var incident = new Incident
        {
            Id = Guid.NewGuid(),
            Title = request.Title,
            Description = request.Description,
            Type = request.Type,
            Severity = request.Severity,
            Status = request.Status,
            Priority = request.Priority ?? IncidentPriority.Medium,
            ImpactedUsers = request.ImpactedUsers,
            Assignee = request.Assignee,
            AssignedTo = request.AssignedTo,
            Team = request.Team,
            ReportedBy = request.ReportedBy,
            IsPublic = request.IsPublic,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            Comments = new List<Comment>()
        };

        // Set affected portals
        if (request.AffectedPortals?.Any() == true)
        {
            incident.SetAffectedPortals(request.AffectedPortals);
        }

        // Set affected portal IDs
        if (request.AffectedPortalIds?.Any() == true)
        {
            incident.SetAffectedPortalIds(request.AffectedPortalIds);
        }

        // Set affected services
        if (request.AffectedServices?.Any() == true)
        {
            incident.SetAffectedServices(request.AffectedServices);
        }

        // Set tags
        if (request.Tags?.Any() == true)
        {
            incident.SetTags(request.Tags);
        }

        // Add initial timeline entry
        if (request.ReportedBy.HasValue)
        {
            incident.AddTimelineEntry("Incident created", $"Priority: {incident.Priority}, Severity: {incident.Severity}", request.ReportedBy.Value);
        }

        return incident;
    }

    public static void UpdateFrom(this Incident incident, UpdateIncidentRequest request)
    {
        if (incident == null || request == null) return;

        // Update only if values are provided
        if (request.Title != null)
            incident.Title = request.Title;
        if (request.Description != null)
            incident.Description = request.Description;
        if (request.Type.HasValue)
            incident.Type = request.Type.Value;
        if (request.Severity.HasValue)
            incident.Severity = request.Severity.Value;
        if (request.Status.HasValue)
            incident.Status = request.Status.Value;
        if (request.Priority.HasValue)
            incident.Priority = request.Priority.Value;
        if (request.AssignedTo != null)
            incident.AssignedTo = request.AssignedTo;
        if (request.Assignee.HasValue)
            incident.Assignee = request.Assignee;
        if (request.Team.HasValue)
            incident.Team = request.Team;
        if (request.ImpactedUsers.HasValue)
            incident.ImpactedUsers = request.ImpactedUsers;
        if (request.RootCause != null)
            incident.RootCause = request.RootCause;
        if (request.Resolution != null)
            incident.Resolution = request.Resolution;
        if (request.PostmortemUrl != null)
            incident.PostmortemUrl = request.PostmortemUrl;
        if (request.IsPublic.HasValue)
            incident.IsPublic = request.IsPublic.Value;

        // Update affected portals if provided
        if (request.AffectedPortals != null)
            incident.SetAffectedPortals(request.AffectedPortals);

        // Update affected portal IDs if provided
        if (request.AffectedPortalIds != null)
            incident.SetAffectedPortalIds(request.AffectedPortalIds);

        // Update affected services if provided
        if (request.AffectedServices != null)
            incident.SetAffectedServices(request.AffectedServices);

        // Update tags if provided
        if (request.Tags != null)
            incident.SetTags(request.Tags);

        // Update timestamps and ETag
        incident.UpdatedAt = DateTime.UtcNow;
        incident.ETag = Guid.NewGuid().ToString();
    }

    #endregion

    #region Statistics Mappings

    public static StatisticsResponse ToStatisticsResponse(
        this (int totalPortals, int healthyPortals, int degradedPortals, int downPortals,
              int totalIncidents, int openIncidents, int criticalIncidents,
              double averageResponseTime, double averageUptime, double averageErrorRate,
              int totalRequests) stats,
        List<(string Category, int Count)>? categoryBreakdown = null,
        List<Incident>? recentIncidents = null)
    {
        return new StatisticsResponse
        {
            TotalPortals = stats.totalPortals,
            HealthyPortals = stats.healthyPortals,
            DegradedPortals = stats.degradedPortals,
            DownPortals = stats.downPortals,
            ActiveIncidents = stats.openIncidents,
            CriticalIncidents = stats.criticalIncidents,
            AverageResponseTime = stats.averageResponseTime,
            AverageUptime = stats.averageUptime,
            AverageErrorRate = stats.averageErrorRate,
            TotalRequests = stats.totalRequests,
            Timestamp = DateTime.UtcNow,
            PortalStats = new PortalStatsResponse
            {
                Total = stats.totalPortals,
                Active = stats.healthyPortals,
                Degraded = stats.degradedPortals,
                Down = stats.downPortals,
                AverageUptime = stats.averageUptime,
                AverageResponseTime = stats.averageResponseTime
            },
            IncidentStats = new IncidentStatsResponse
            {
                Total = stats.totalIncidents,
                Open = stats.openIncidents
            }
        };
    }

    #endregion

    #region MetricsHistory Mappings

    public static PortalMetricsHistoryResponse? ToResponse(this MetricsHistory? history)
    {
        if (history == null) return null;

        return new PortalMetricsHistoryResponse
        {
            PortalId = history.PortalId,
            PortalName = string.Empty, // Will be set by caller if needed
            History = new List<MetricsDataPoint>
            {
                new MetricsDataPoint
                {
                    Timestamp = history.Timestamp,
                    Metrics = history.Metrics
                }
            }
        };
    }

    public static List<MetricsDataPoint> ToMetricDataPoints(this IEnumerable<MetricsHistory> histories)
    {
        if (histories == null) return new List<MetricsDataPoint>();

        return histories.Select(h => new MetricsDataPoint
        {
            Timestamp = h.Timestamp,
            Metrics = h.Metrics
        }).ToList();
    }

    #endregion

    #region Batch Operation Mappings

    public static BatchOperationItemResult ToItemResult(this (Guid Id, bool Success, string Message) result)
    {
        return new BatchOperationItemResult
        {
            PortalId = result.Id,
            Success = result.Success,
            Error = result.Success ? null : result.Message
        };
    }

    #endregion
}