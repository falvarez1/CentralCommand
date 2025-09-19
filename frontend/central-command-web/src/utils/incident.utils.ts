import type { IncidentResponse } from '../types/service.types';
import {
  IncidentStatus,
  IncidentPriority,
  IncidentType,
  IncidentSeverity,
  Incident,
  IncidentFilter,
  IncidentStats
} from '../types/incident.types';

/**
 * Comprehensive incident filtering with multiple criteria
 * Handles both IncidentResponse (from API) and Incident (from store) types
 */
export const filterIncidents = <T extends IncidentResponse | Incident>(
  incidents: T[],
  filter: IncidentFilter
): T[] => {
  return incidents.filter(incident => {
    // Status filter - handle both single and array
    if (filter.status) {
      const statusArray = Array.isArray(filter.status) ? filter.status : [filter.status];
      if (statusArray.length > 0 && !statusArray.includes(incident.status)) {
        return false;
      }
    }

    // Type filter - handle both single and array
    if (filter.type) {
      const typeArray = Array.isArray(filter.type) ? filter.type : [filter.type];
      if (typeArray.length > 0 && !typeArray.includes(incident.type)) {
        return false;
      }
    }

    // Severity filter - handle both single and array
    if (filter.severity) {
      const severityArray = Array.isArray(filter.severity) ? filter.severity : [filter.severity];
      if (severityArray.length > 0 && !severityArray.includes(incident.severity)) {
        return false;
      }
    }

    // Priority filter (if exists in the incident type)
    if (filter.priority && 'priority' in incident) {
      const priorityArray = Array.isArray(filter.priority) ? filter.priority : [filter.priority];
      if (priorityArray.length > 0 && !priorityArray.includes(incident.priority)) {
        return false;
      }
    }

    // Date range filter
    if (filter.dateRange) {
      const incidentDate = 'createdAt' in incident
        ? (incident.createdAt instanceof Date ? incident.createdAt.getTime() : new Date(incident.createdAt).getTime())
        : new Date(incident.createdAt).getTime();

      if (filter.dateRange.from && incidentDate < filter.dateRange.from.getTime()) {
        return false;
      }
      if (filter.dateRange.to && incidentDate > filter.dateRange.to.getTime()) {
        return false;
      }
    }

    // Search term filter
    const searchTerm = filter.searchTerm;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const tags = 'tags' in incident ? incident.tags : [];
      const incidentNumber = 'incidentNumber' in incident ? incident.incidentNumber : '';

      if (
        !incident.title.toLowerCase().includes(term) &&
        !incident.description.toLowerCase().includes(term) &&
        !incidentNumber.toLowerCase().includes(term) &&
        !tags.some(tag => tag.toLowerCase().includes(term))
      ) {
        return false;
      }
    }

    // Assignee filter
    if (filter.assignee) {
      const assigneeField = 'assignee' in incident ? incident.assignee :
                           ('assignedTo' in incident ? incident.assignedTo : undefined);
      if (assigneeField !== filter.assignee) {
        return false;
      }
    }

    // Team filter
    if (filter.team && 'team' in incident && incident.team !== filter.team) {
      return false;
    }

    // Affected portal filter
    if (filter.affectedPortal) {
      const affectedPortals = 'affectedPortals' in incident ? incident.affectedPortals :
                             ('portalId' in incident ? [incident.portalId] : []);
      if (!affectedPortals.includes(filter.affectedPortal)) {
        return false;
      }
    }

    // Tags filter
    if (filter.tags && filter.tags.length > 0 && 'tags' in incident) {
      if (!filter.tags.some(tag => incident.tags.includes(tag))) {
        return false;
      }
    }

    // Unresolved filter
    if (filter.isUnresolved && incident.status === IncidentStatus.Resolved) {
      return false;
    }

    // Public filter
    if (filter.isPublic !== undefined && 'isPublic' in incident && incident.isPublic !== filter.isPublic) {
      return false;
    }

    return true;
  });
};

/**
 * Comprehensive incident statistics calculation
 * Supports both IncidentResponse and Incident types
 */
export const calculateIncidentStats = <T extends IncidentResponse | Incident>(
  incidents: T[]
): IncidentStats => {
  const now = new Date();
  const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const stats: IncidentStats = {
    total: incidents.length,
    open: 0,
    inProgress: 0,
    acknowledgedIncidents: 0,
    resolved: 0,
    closed: 0,
    // Legacy aliases
    investigating: 0,
    acknowledged: 0,
    bySeverity: {
      [IncidentSeverity.Critical]: 0,
      [IncidentSeverity.High]: 0,
      [IncidentSeverity.Medium]: 0,
      [IncidentSeverity.Low]: 0
    },
    byType: {} as Record<IncidentType, number>,
    last24Hours: 0,
    last7Days: 0,
    averageMTTR: 0,
    averageMTBF: 0
  };

  // Initialize type counts
  Object.values(IncidentType).forEach(type => {
    stats.byType[type] = 0;
  });

  let totalMTTR = 0;
  let mttrCount = 0;
  let totalMTBF = 0;
  let mtbfCount = 0;

  incidents.forEach(incident => {
    // Status counts
    switch (incident.status) {
      case IncidentStatus.Open:
        stats.open++;
        break;
      case IncidentStatus.InProgress:
        stats.inProgress++;
        stats.investigating++;  // Legacy alias
        break;
      case IncidentStatus.Acknowledged:
        stats.acknowledgedIncidents++;
        stats.acknowledged++;  // Legacy alias
        break;
      case IncidentStatus.Resolved:
        stats.resolved++;
        break;
      case IncidentStatus.Closed:
        stats.closed++;
        break;
    }

    // Severity counts
    stats.bySeverity[incident.severity]++;

    // Type counts
    stats.byType[incident.type]++;

    // Time-based counts
    const createdAt = incident.createdAt instanceof Date
      ? incident.createdAt
      : new Date(incident.createdAt);

    if (createdAt > last24h) {
      stats.last24Hours++;
    }
    if (createdAt > last7d) {
      stats.last7Days++;
    }

    // Calculate MTTR (Mean Time To Resolution)
    if (incident.status === IncidentStatus.Resolved && 'metrics' in incident) {
      if (incident.metrics?.mttr) {
        totalMTTR += incident.metrics.mttr;
        mttrCount++;
      } else if ('resolvedAt' in incident && incident.resolvedAt && 'acknowledgedAt' in incident && incident.acknowledgedAt) {
        const resolvedAt = incident.resolvedAt instanceof Date ? incident.resolvedAt : new Date(incident.resolvedAt);
        const acknowledgedAt = incident.acknowledgedAt instanceof Date ? incident.acknowledgedAt : new Date(incident.acknowledgedAt);
        const mttr = Math.floor((resolvedAt.getTime() - acknowledgedAt.getTime()) / 60000);
        totalMTTR += mttr;
        mttrCount++;
      }
    }

    // Calculate MTBF (Mean Time Between Failures)
    if ('metrics' in incident && incident.metrics?.mtbf) {
      totalMTBF += incident.metrics.mtbf;
      mtbfCount++;
    }
  });

  // Calculate averages
  if (mttrCount > 0) {
    stats.averageMTTR = totalMTTR / mttrCount;
  }
  if (mtbfCount > 0) {
    stats.averageMTBF = totalMTBF / mtbfCount;
  }

  return stats;
};

export const sortIncidents = (
  incidents: IncidentResponse[],
  sortBy: keyof IncidentResponse,
  order: 'asc' | 'desc' = 'desc'
): IncidentResponse[] => {
  return [...incidents].sort((a, b) => {
    const aValue = a[sortBy];
    const bValue = b[sortBy];

    if (aValue === null || aValue === undefined) return 1;
    if (bValue === null || bValue === undefined) return -1;

    let comparison = 0;
    if (aValue < bValue) comparison = -1;
    if (aValue > bValue) comparison = 1;

    return order === 'asc' ? comparison : -comparison;
  });
};

export const groupIncidentsByStatus = (
  incidents: IncidentResponse[]
): Record<IncidentStatus, IncidentResponse[]> => {
  const grouped: Record<string, IncidentResponse[]> = {};

  Object.values(IncidentStatus).forEach(status => {
    grouped[status] = [];
  });

  incidents.forEach(incident => {
    if (grouped[incident.status]) {
      grouped[incident.status].push(incident);
    }
  });

  return grouped as Record<IncidentStatus, IncidentResponse[]>;
};

export const getIncidentSeverityColor = (severity: IncidentSeverity): string => {
  switch (severity) {
    case IncidentSeverity.Critical:
      return 'red';
    case IncidentSeverity.High:
      return 'orange';
    case IncidentSeverity.Medium:
      return 'yellow';
    case IncidentSeverity.Low:
      return 'blue';
    default:
      return 'gray';
  }
};

export const getIncidentPriorityIcon = (priority: IncidentPriority): string => {
  switch (priority) {
    case IncidentPriority.Critical:
      return '🔴';
    case IncidentPriority.High:
      return '🟠';
    case IncidentPriority.Medium:
      return '🟡';
    case IncidentPriority.Low:
      return '🔵';
    default:
      return '⚪';
  }
};

export const formatIncidentDuration = (startDate: string | Date, endDate?: string | Date): string => {
  const start = startDate instanceof Date ? startDate : new Date(startDate);
  const end = endDate ? (endDate instanceof Date ? endDate : new Date(endDate)) : new Date();
  const duration = end.getTime() - start.getTime();

  const days = Math.floor(duration / (1000 * 60 * 60 * 24));
  const hours = Math.floor((duration % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};

/**
 * Get active incidents (not resolved)
 */
export const getActiveIncidents = <T extends IncidentResponse | Incident>(
  incidents: T[]
): T[] => {
  return incidents.filter(i => i.status !== IncidentStatus.Resolved && i.status !== IncidentStatus.Closed);
};

/**
 * Get recent incidents (last 24 hours)
 */
export const getRecentIncidents = <T extends IncidentResponse | Incident>(
  incidents: T[],
  hours: number = 24
): T[] => {
  const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
  return incidents.filter(i => {
    const createdAt = i.createdAt instanceof Date ? i.createdAt : new Date(i.createdAt);
    return createdAt > cutoff;
  });
};

/**
 * Sort incidents with proper date handling
 */
export const sortIncidentsByDate = <T extends IncidentResponse | Incident>(
  incidents: T[],
  order: 'asc' | 'desc' = 'desc'
): T[] => {
  return [...incidents].sort((a, b) => {
    const dateA = a.createdAt instanceof Date ? a.createdAt.getTime() : new Date(a.createdAt).getTime();
    const dateB = b.createdAt instanceof Date ? b.createdAt.getTime() : new Date(b.createdAt).getTime();
    return order === 'desc' ? dateB - dateA : dateA - dateB;
  });
};