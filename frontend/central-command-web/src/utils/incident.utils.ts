import type { IncidentResponse } from '@/types/api';
import { IncidentStatus, IncidentPriority, IncidentType, IncidentSeverity } from '@/types/api';

export interface IncidentFilter {
  status?: IncidentStatus;
  priority?: IncidentPriority;
  type?: IncidentType;
  severity?: IncidentSeverity;
  assignee?: string;
  search?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface IncidentStats {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
  closed: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  averageResolutionTime: number;
}

export const filterIncidents = (
  incidents: IncidentResponse[],
  filter: IncidentFilter
): IncidentResponse[] => {
  return incidents.filter(incident => {
    if (filter.status && incident.status !== filter.status) return false;
    if (filter.priority && incident.priority !== filter.priority) return false;
    if (filter.type && incident.type !== filter.type) return false;
    if (filter.severity && incident.severity !== filter.severity) return false;
    if (filter.assignee && incident.assignedTo !== filter.assignee) return false;

    if (filter.search) {
      const searchLower = filter.search.toLowerCase();
      const matchesSearch =
        incident.title.toLowerCase().includes(searchLower) ||
        incident.description?.toLowerCase().includes(searchLower) ||
        incident.incidentNumber.toLowerCase().includes(searchLower);
      if (!matchesSearch) return false;
    }

    if (filter.dateFrom && new Date(incident.createdAt) < filter.dateFrom) return false;
    if (filter.dateTo && new Date(incident.createdAt) > filter.dateTo) return false;

    return true;
  });
};

export const calculateIncidentStats = (incidents: IncidentResponse[]): IncidentStats => {
  const stats: IncidentStats = {
    total: incidents.length,
    open: 0,
    inProgress: 0,
    resolved: 0,
    closed: 0,
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    averageResolutionTime: 0
  };

  let totalResolutionTime = 0;
  let resolvedCount = 0;

  incidents.forEach(incident => {
    // Status counts
    switch (incident.status) {
      case IncidentStatus.Open:
        stats.open++;
        break;
      case IncidentStatus.InProgress:
        stats.inProgress++;
        break;
      case IncidentStatus.Resolved:
        stats.resolved++;
        if (incident.resolvedAt) {
          const resolutionTime = new Date(incident.resolvedAt).getTime() - new Date(incident.createdAt).getTime();
          totalResolutionTime += resolutionTime;
          resolvedCount++;
        }
        break;
      case IncidentStatus.Closed:
        stats.closed++;
        break;
    }

    // Priority counts
    switch (incident.priority) {
      case IncidentPriority.Critical:
        stats.critical++;
        break;
      case IncidentPriority.High:
        stats.high++;
        break;
      case IncidentPriority.Medium:
        stats.medium++;
        break;
      case IncidentPriority.Low:
        stats.low++;
        break;
    }
  });

  if (resolvedCount > 0) {
    stats.averageResolutionTime = totalResolutionTime / resolvedCount;
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

export const formatIncidentDuration = (startDate: string, endDate?: string): string => {
  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : new Date();
  const duration = end.getTime() - start.getTime();

  const days = Math.floor(duration / (1000 * 60 * 60 * 24));
  const hours = Math.floor((duration % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};