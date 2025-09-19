import type { PortalResponse } from '@/types/api';
import { PortalStatus, PortalCategory, PortalEnvironment } from '@/types/api';

export interface PortalFilter {
  status?: PortalStatus;
  category?: PortalCategory;
  environment?: PortalEnvironment;
  search?: string;
  isFavorite?: boolean;
  hasIncidents?: boolean;
}

export interface PortalStats {
  total: number;
  online: number;
  offline: number;
  degraded: number;
  maintenance: number;
  byCategory: Record<string, number>;
  byEnvironment: Record<string, number>;
  averageUptime: number;
  averageResponseTime: number;
}

export const filterPortals = (
  portals: PortalResponse[],
  filter: PortalFilter
): PortalResponse[] => {
  return portals.filter(portal => {
    if (filter.status && portal.status !== filter.status) return false;
    if (filter.category && portal.category !== filter.category) return false;
    if (filter.environment && portal.environment !== filter.environment) return false;
    if (filter.isFavorite && !portal.isFavorite) return false;
    if (filter.hasIncidents && (!portal.incidentCount || portal.incidentCount === 0)) return false;

    if (filter.search) {
      const searchLower = filter.search.toLowerCase();
      const matchesSearch =
        portal.name.toLowerCase().includes(searchLower) ||
        portal.description?.toLowerCase().includes(searchLower) ||
        portal.url.toLowerCase().includes(searchLower);
      if (!matchesSearch) return false;
    }

    return true;
  });
};

export const calculatePortalStats = (portals: PortalResponse[]): PortalStats => {
  const stats: PortalStats = {
    total: portals.length,
    online: 0,
    offline: 0,
    degraded: 0,
    maintenance: 0,
    byCategory: {},
    byEnvironment: {},
    averageUptime: 0,
    averageResponseTime: 0
  };

  let totalUptime = 0;
  let totalResponseTime = 0;
  let responseTimeCount = 0;

  portals.forEach(portal => {
    // Status counts
    switch (portal.status) {
      case PortalStatus.Online:
        stats.online++;
        break;
      case PortalStatus.Offline:
        stats.offline++;
        break;
      case PortalStatus.Degraded:
        stats.degraded++;
        break;
      case PortalStatus.Maintenance:
        stats.maintenance++;
        break;
    }

    // Category counts
    if (portal.category) {
      stats.byCategory[portal.category] = (stats.byCategory[portal.category] || 0) + 1;
    }

    // Environment counts
    if (portal.environment) {
      stats.byEnvironment[portal.environment] = (stats.byEnvironment[portal.environment] || 0) + 1;
    }

    // Metrics
    if (portal.metrics) {
      if (portal.metrics.uptime !== undefined) {
        totalUptime += portal.metrics.uptime;
      }
      if (portal.metrics.responseTime !== undefined) {
        totalResponseTime += portal.metrics.responseTime;
        responseTimeCount++;
      }
    }
  });

  if (portals.length > 0) {
    stats.averageUptime = totalUptime / portals.length;
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
    case PortalStatus.Online:
      return 'green';
    case PortalStatus.Offline:
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
    case PortalStatus.Online:
      return '✅';
    case PortalStatus.Offline:
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
    case PortalStatus.Offline:
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