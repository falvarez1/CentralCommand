import type { PortalResponse } from '../types/service.types';
import {
  PortalStatus,
  PortalCategory,
  PortalEnvironment,
  PortalPriority,
  Portal,
  PortalFilter,
  PortalStats
} from '../types/portal.types';

/**
 * Comprehensive portal filtering with multiple criteria support
 * Handles both PortalResponse (from API) and Portal (from store) types
 */
export const filterPortals = <T extends PortalResponse | Portal>(
  portals: T[],
  filter: PortalFilter,
  searchTerm?: string,
  selectedCategory?: string
): T[] => {
  return portals.filter(portal => {
    // Category filter from selectedCategory
    if (selectedCategory && selectedCategory !== 'all' && portal.category !== selectedCategory) {
      return false;
    }

    // Category filter from filter object
    if (filter.category && filter.category !== PortalCategory.All && portal.category !== filter.category) {
      return false;
    }

    // Status filter - handle both single and array
    if (filter.status) {
      const statusArray = Array.isArray(filter.status) ? filter.status : [filter.status];
      if (statusArray.length > 0 && !statusArray.includes(portal.status)) {
        return false;
      }
    }

    // Environment filter - handle both single and array
    if (filter.environment) {
      const envArray = Array.isArray(filter.environment) ? filter.environment : [filter.environment];
      if (envArray.length > 0 && !envArray.includes(portal.environment)) {
        return false;
      }
    }

    // Priority filter - handle both single and array
    if (filter.priority && 'priority' in portal) {
      const priorityArray = Array.isArray(filter.priority) ? filter.priority : [filter.priority];
      if (priorityArray.length > 0 && !priorityArray.includes(portal.priority)) {
        return false;
      }
    }

    // Search term filter
    const search = searchTerm || filter.searchTerm;
    if (search) {
      const term = search.toLowerCase();
      const tags = 'tags' in portal ? portal.tags : [];
      if (
        !portal.name.toLowerCase().includes(term) &&
        !portal.description?.toLowerCase().includes(term) &&
        !portal.url.toLowerCase().includes(term) &&
        !tags.some(tag => tag.toLowerCase().includes(term))
      ) {
        return false;
      }
    }

    // Tags filter
    if (filter.tags && filter.tags.length > 0 && 'tags' in portal) {
      if (!filter.tags.some(tag => portal.tags.includes(tag))) {
        return false;
      }
    }

    // Favorite filter
    if (filter.isFavorite !== undefined && portal.isFavorite !== filter.isFavorite) {
      return false;
    }

    // Public filter
    if (filter.isPublic !== undefined && 'isPublic' in portal && portal.isPublic !== filter.isPublic) {
      return false;
    }

    // Has incidents filter
    if (filter.hasIncidents !== undefined) {
      const hasIncident = 'lastIncident' in portal
        ? portal.lastIncident !== undefined
        : ('incidentCount' in portal ? portal.incidentCount && portal.incidentCount > 0 : false);
      if (hasIncident !== filter.hasIncidents) {
        return false;
      }
    }

    return true;
  });
};

/**
 * Comprehensive portal statistics calculation
 * Supports both PortalResponse and Portal types
 */
export const calculatePortalStats = <T extends PortalResponse | Portal>(
  portals: T[]
): PortalStats => {
  const stats: PortalStats = {
    total: portals.length,
    operational: 0,
    degraded: 0,
    maintenance: 0,
    outage: 0,
    byCategory: {} as Record<PortalCategory, number>,
    byEnvironment: {} as Record<PortalEnvironment, number>,
    byPriority: {} as Record<PortalPriority, number>,
    averageUptime: 0,
    averageResponseTime: 0
  };

  // Initialize category counts
  Object.values(PortalCategory).forEach(cat => {
    stats.byCategory[cat] = 0;
  });

  // Initialize environment counts
  Object.values(PortalEnvironment).forEach(env => {
    stats.byEnvironment[env] = 0;
  });

  // Initialize priority counts
  Object.values(PortalPriority).forEach(pri => {
    stats.byPriority[pri] = 0;
  });

  // Calculate statistics
  let totalUptime = 0;
  let totalResponseTime = 0;
  let uptimeCount = 0;
  let responseTimeCount = 0;

  portals.forEach(portal => {
    // Status counts - handle different naming conventions
    switch (portal.status) {
      case PortalStatus.OPERATIONAL:
      case PortalStatus.Operational:
        stats.operational++;
        break;
      case PortalStatus.DEGRADED:
      case PortalStatus.Degraded:
        stats.degraded++;
        break;
      case PortalStatus.MAINTENANCE:
      case PortalStatus.Maintenance:
        stats.maintenance++;
        break;
      case PortalStatus.OUTAGE:
      case PortalStatus.Outage:
        stats.outage++;
        break;
    }

    // Category, environment, and priority counts
    if (portal.category) {
      stats.byCategory[portal.category]++;
    }
    if (portal.environment) {
      stats.byEnvironment[portal.environment]++;
    }
    if ('priority' in portal && portal.priority) {
      stats.byPriority[portal.priority]++;
    }

    // Metrics calculation
    if (portal.metrics) {
      if (portal.metrics.uptime !== undefined && portal.metrics.uptime !== null) {
        totalUptime += portal.metrics.uptime;
        uptimeCount++;
      }
      if (portal.metrics.responseTime !== undefined && portal.metrics.responseTime !== null) {
        totalResponseTime += portal.metrics.responseTime;
        responseTimeCount++;
      }
    }
  });

  // Calculate averages
  if (uptimeCount > 0) {
    stats.averageUptime = totalUptime / uptimeCount;
  }
  if (responseTimeCount > 0) {
    stats.averageResponseTime = totalResponseTime / responseTimeCount;
  }

  return stats;
};

export const sortPortals = (
  portals: PortalResponse[],
  sortBy: keyof PortalResponse | 'uptime' | 'responseTime',
  order: 'asc' | 'desc' = 'asc'
): PortalResponse[] => {
  return [...portals].sort((a, b) => {
    let aValue: any;
    let bValue: any;

    if (sortBy === 'uptime') {
      aValue = a.metrics?.uptime ?? 0;
      bValue = b.metrics?.uptime ?? 0;
    } else if (sortBy === 'responseTime') {
      aValue = a.metrics?.responseTime ?? 0;
      bValue = b.metrics?.responseTime ?? 0;
    } else {
      aValue = a[sortBy as keyof PortalResponse];
      bValue = b[sortBy as keyof PortalResponse];
    }

    if (aValue === null || aValue === undefined) return 1;
    if (bValue === null || bValue === undefined) return -1;

    let comparison = 0;
    if (aValue < bValue) comparison = -1;
    if (aValue > bValue) comparison = 1;

    return order === 'asc' ? comparison : -comparison;
  });
};

export const groupPortalsByCategory = (
  portals: PortalResponse[]
): Record<PortalCategory, PortalResponse[]> => {
  const grouped: Record<string, PortalResponse[]> = {};

  Object.values(PortalCategory).forEach(category => {
    grouped[category] = [];
  });

  portals.forEach(portal => {
    if (portal.category && grouped[portal.category]) {
      grouped[portal.category].push(portal);
    }
  });

  return grouped as Record<PortalCategory, PortalResponse[]>;
};

export const groupPortalsByEnvironment = (
  portals: PortalResponse[]
): Record<PortalEnvironment, PortalResponse[]> => {
  const grouped: Record<string, PortalResponse[]> = {};

  Object.values(PortalEnvironment).forEach(env => {
    grouped[env] = [];
  });

  portals.forEach(portal => {
    if (portal.environment && grouped[portal.environment]) {
      grouped[portal.environment].push(portal);
    }
  });

  return grouped as Record<PortalEnvironment, PortalResponse[]>;
};

export const getPortalStatusColor = (status: PortalStatus): string => {
  switch (status) {
    case PortalStatus.Operational:
      return 'green';
    case PortalStatus.Outage:
      return 'red';
    case PortalStatus.Degraded:
      return 'yellow';
    case PortalStatus.Maintenance:
      return 'blue';
    case PortalStatus.Unknown:
    default:
      return 'gray';
  }
};

export const getPortalStatusIcon = (status: PortalStatus): string => {
  switch (status) {
    case PortalStatus.Operational:
      return '✅';
    case PortalStatus.Outage:
      return '❌';
    case PortalStatus.Degraded:
      return '⚠️';
    case PortalStatus.Maintenance:
      return '🔧';
    case PortalStatus.Unknown:
    default:
      return '❓';
  }
};

export const formatUptime = (uptime: number): string => {
  if (uptime >= 99.9) return '99.9%';
  if (uptime >= 99) return `${uptime.toFixed(1)}%`;
  if (uptime >= 95) return `${uptime.toFixed(1)}%`;
  return `${uptime.toFixed(2)}%`;
};

export const formatResponseTime = (responseTime: number): string => {
  if (responseTime < 100) return `${responseTime.toFixed(0)}ms`;
  if (responseTime < 1000) return `${responseTime.toFixed(0)}ms`;
  if (responseTime < 10000) return `${(responseTime / 1000).toFixed(1)}s`;
  return `${(responseTime / 1000).toFixed(0)}s`;
};

export const calculateHealthScore = (portal: PortalResponse): number => {
  let score = 100;

  // Status impact
  switch (portal.status) {
    case PortalStatus.Outage:
      score -= 50;
      break;
    case PortalStatus.Degraded:
      score -= 25;
      break;
    case PortalStatus.Maintenance:
      score -= 10;
      break;
  }

  // Uptime impact
  if (portal.metrics?.uptime !== undefined) {
    const uptimePenalty = (100 - portal.metrics.uptime) * 0.5;
    score -= uptimePenalty;
  }

  // Response time impact
  if (portal.metrics?.responseTime !== undefined) {
    if (portal.metrics.responseTime > 5000) score -= 10;
    else if (portal.metrics.responseTime > 2000) score -= 5;
    else if (portal.metrics.responseTime > 1000) score -= 2;
  }

  // Incident impact
  if (portal.incidentCount && portal.incidentCount > 0) {
    score -= Math.min(portal.incidentCount * 5, 20);
  }

  return Math.max(0, Math.min(100, score));
};