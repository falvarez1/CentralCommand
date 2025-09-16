using CentralCommand.Core.Domain.Entities;
using CentralCommand.Core.Domain.Enums;
using CentralCommand.Core.Domain.ValueObjects;
using CentralCommand.Core.Interfaces.Repositories;
using CentralCommand.Api.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using System.Linq.Expressions;

namespace CentralCommand.Api.Repositories;

public class IncidentRepository : Repository<Incident>, IIncidentRepository
{
    public IncidentRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<IEnumerable<Incident>> GetActiveIncidentsAsync(CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(i => i.Comments)
            .Where(i => i.Status != IncidentStatus.Resolved && i.Status != IncidentStatus.Closed)
            .OrderByDescending(i => i.Priority)
            .ThenByDescending(i => i.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<Incident>> GetIncidentsByPortalAsync(Guid portalId, CancellationToken cancellationToken = default)
    {
        var portalIdStr = $"\"{portalId}\"";
        return await _dbSet
            .Include(i => i.Comments)
            .Where(i => i.AffectedPortalIds != null && i.AffectedPortalIds.Contains(portalIdStr))
            .OrderByDescending(i => i.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<Incident>> GetIncidentsByDateRangeAsync(
        DateTime startDate,
        DateTime endDate,
        CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(i => i.Comments)
            .Where(i => i.CreatedAt >= startDate && i.CreatedAt <= endDate)
            .OrderByDescending(i => i.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<Incident>> GetIncidentsByStatusAsync(
        IncidentStatus status,
        CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(i => i.Comments)
            .Where(i => i.Status == status)
            .OrderByDescending(i => i.Priority)
            .ThenByDescending(i => i.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<Incident>> GetIncidentsByPriorityAsync(
        IncidentPriority priority,
        CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(i => i.Comments)
            .Where(i => i.Priority == priority)
            .OrderByDescending(i => i.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<int> GetActiveIncidentCountAsync(CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Where(i => i.Status != IncidentStatus.Resolved && i.Status != IncidentStatus.Closed)
            .CountAsync(cancellationToken);
    }

    public async Task<Dictionary<IncidentPriority, int>> GetIncidentCountByPriorityAsync(
        CancellationToken cancellationToken = default)
    {
        var counts = await _dbSet
            .Where(i => i.Status != IncidentStatus.Resolved && i.Status != IncidentStatus.Closed)
            .GroupBy(i => i.Priority)
            .Select(g => new { Priority = g.Key, Count = g.Count() })
            .ToListAsync(cancellationToken);

        return counts.ToDictionary(x => x.Priority, x => x.Count);
    }

    public async Task<Incident?> GetIncidentWithDetailsAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(i => i.Comments)
                .ThenInclude(c => c.Attachments)
            .Include(i => i.Timeline)
            .FirstOrDefaultAsync(i => i.Id == id, cancellationToken);
    }

    public async Task AddCommentAsync(Guid incidentId, Comment comment, CancellationToken cancellationToken = default)
    {
        var incident = await GetByIdAsync(incidentId, cancellationToken);
        if (incident != null)
        {
            incident.Comments.Add(comment);
            await UpdateAsync(incident, cancellationToken);
        }
    }

    public async Task AddTimelineEntryAsync(Guid incidentId, TimelineEntry entry, CancellationToken cancellationToken = default)
    {
        var incident = await GetByIdAsync(incidentId, cancellationToken);
        if (incident != null)
        {
            var timeline = incident.GetTimeline();
            timeline.Add(entry);
            incident.Timeline = System.Text.Json.JsonSerializer.Serialize(timeline);
            await UpdateAsync(incident, cancellationToken);
        }
    }

    public override async Task<IEnumerable<Incident>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(i => i.Comments)
            .OrderByDescending(i => i.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public override async Task<Incident?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(i => i.Comments)
            .FirstOrDefaultAsync(i => i.Id == id, cancellationToken);
    }

    // Additional missing interface methods
    public async Task<IEnumerable<Incident>> GetBySeverityAsync(IncidentSeverity severity, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(i => i.Comments)
            .Where(i => i.Severity == severity)
            .OrderByDescending(i => i.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<Incident>> GetByTypeAsync(IncidentType type, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(i => i.Comments)
            .Where(i => i.Type == type)
            .OrderByDescending(i => i.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<Incident>> GetByAssigneeAsync(Guid assigneeId, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(i => i.Comments)
            .Where(i => i.AssignedTo == assigneeId.ToString())
            .OrderByDescending(i => i.Priority)
            .ThenByDescending(i => i.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<Incident>> GetByTeamAsync(Guid teamId, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(i => i.Comments)
            .Where(i => i.Team == teamId)
            .OrderByDescending(i => i.Priority)
            .ThenByDescending(i => i.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<Incident>> GetByAffectedPortalAsync(string portalId, CancellationToken cancellationToken = default)
    {
        var portalGuid = Guid.Parse(portalId);
        return await GetIncidentsByPortalAsync(portalGuid, cancellationToken);
    }

    public async Task<Incident?> GetWithCommentsAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(i => i.Comments)
                .ThenInclude(c => c.Attachments)
            .FirstOrDefaultAsync(i => i.Id == id, cancellationToken);
    }

    public async Task<IEnumerable<Incident>> GetOpenIncidentsAsync(CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(i => i.Comments)
            .Where(i => i.Status == IncidentStatus.Open)
            .OrderByDescending(i => i.Priority)
            .ThenByDescending(i => i.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<Incident>> GetByDateRangeAsync(DateTime startDate, DateTime endDate, CancellationToken cancellationToken = default)
    {
        return await GetIncidentsByDateRangeAsync(startDate, endDate, cancellationToken);
    }

    public async Task<IEnumerable<Incident>> GetByStatusAsync(IncidentStatus status, CancellationToken cancellationToken = default)
    {
        return await GetIncidentsByStatusAsync(status, cancellationToken);
    }

    public async Task<Dictionary<IncidentStatus, int>> GetStatusStatisticsAsync(CancellationToken cancellationToken = default)
    {
        var counts = await _dbSet
            .GroupBy(i => i.Status)
            .Select(g => new { Status = g.Key, Count = g.Count() })
            .ToListAsync(cancellationToken);

        return counts.ToDictionary(x => x.Status, x => x.Count);
    }

    public async Task<Dictionary<IncidentSeverity, int>> GetSeverityStatisticsAsync(CancellationToken cancellationToken = default)
    {
        var counts = await _dbSet
            .GroupBy(i => i.Severity)
            .Select(g => new { Severity = g.Key, Count = g.Count() })
            .ToListAsync(cancellationToken);

        return counts.ToDictionary(x => x.Severity, x => x.Count);
    }

    public async Task<double> CalculateMTTRAsync(DateTime since, CancellationToken cancellationToken = default)
    {
        var resolvedIncidents = await _dbSet
            .Where(i => i.CreatedAt >= since && i.ResolvedAt.HasValue)
            .ToListAsync(cancellationToken);

        if (!resolvedIncidents.Any())
            return 0;

        var totalResolutionTime = resolvedIncidents
            .Sum(i => (i.ResolvedAt!.Value - i.CreatedAt).TotalMinutes);

        return totalResolutionTime / resolvedIncidents.Count;
    }

    public async Task<double> CalculateMTBFAsync(DateTime since, CancellationToken cancellationToken = default)
    {
        var incidents = await _dbSet
            .Where(i => i.CreatedAt >= since)
            .OrderBy(i => i.CreatedAt)
            .ToListAsync(cancellationToken);

        if (incidents.Count < 2)
            return 0;

        var totalTime = (DateTime.UtcNow - since).TotalHours;
        var totalDowntime = incidents
            .Where(i => i.ResolvedAt.HasValue)
            .Sum(i => (i.ResolvedAt!.Value - i.CreatedAt).TotalHours);

        var uptime = totalTime - totalDowntime;
        return uptime / incidents.Count;
    }

    public async Task<IEnumerable<Incident>> GetRecentResolvedAsync(int count, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(i => i.Comments)
            .Where(i => i.Status == IncidentStatus.Resolved)
            .OrderByDescending(i => i.ResolvedAt)
            .Take(count)
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<Incident>> GetCriticalIncidentsAsync(CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(i => i.Comments)
            .Where(i => i.Priority == IncidentPriority.Critical || i.Severity == IncidentSeverity.Critical)
            .Where(i => i.Status != IncidentStatus.Resolved && i.Status != IncidentStatus.Closed)
            .OrderByDescending(i => i.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<Incident>> SearchAsync(string searchTerm, CancellationToken cancellationToken = default)
    {
        searchTerm = searchTerm.ToLower();
        return await _dbSet
            .Include(i => i.Comments)
            .Where(i => i.Title.ToLower().Contains(searchTerm) ||
                       i.Description.ToLower().Contains(searchTerm) ||
                       i.Id.ToString().Contains(searchTerm))
            .OrderByDescending(i => i.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<bool> HasActiveIncidentsForPortalAsync(Guid portalId, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .AnyAsync(i => i.AffectedPortalIds != null &&
                          i.AffectedPortalIds.Contains(portalId.ToString()) &&
                          i.Status != IncidentStatus.Resolved &&
                          i.Status != IncidentStatus.Closed,
                     cancellationToken);
    }

    public async Task<int> GetImpactedUsersCountAsync(CancellationToken cancellationToken = default)
    {
        var activeIncidents = await _dbSet
            .Where(i => i.Status != IncidentStatus.Resolved && i.Status != IncidentStatus.Closed)
            .ToListAsync(cancellationToken);

        return activeIncidents.Sum(i => i.ImpactedUsers ?? 0);
    }
}