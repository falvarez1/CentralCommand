/**
 * Custom hook for portal filtering logic
 * Provides memoized filtered portals and stats
 */

import { useMemo } from 'react';
import { usePortalStore } from '@/stores/usePortalStore';
import { Portal, PortalStatus, PortalCategory, PortalEnvironment, PortalPriority } from '@/types/portal.types';

interface PortalStats {
  total: number;
  operational: number;
  degraded: number;
  maintenance: number;
  outage: number;
  byCategory: Record<PortalCategory, number>;
  byEnvironment: Record<PortalEnvironment, number>;
  byPriority: Record<PortalPriority, number>;
  averageUptime: number;
  averageResponseTime: number;
}

export const usePortalFilters = () => {
  const {
    portals,
    filter,
    searchTerm,
    selectedCategory,
    setSearchTerm,
    setSelectedCategory,
    setFilter,
    clearFilter
  } = usePortalStore();

  // Memoized filtered portals
  const filteredPortals = useMemo(() => {
    return portals.filter(portal => {
      // Category filter from selectedCategory
      if (selectedCategory && selectedCategory !== 'all' && portal.category !== selectedCategory) {
        return false;
      }

      // Category filter from filter object
      if (filter.category && filter.category !== PortalCategory.ALL && portal.category !== filter.category) {
        return false;
      }

      // Status filter
      if (filter.status && filter.status.length > 0 && !filter.status.includes(portal.status)) {
        return false;
      }

      // Environment filter
      if (filter.environment && filter.environment.length > 0 && !filter.environment.includes(portal.environment)) {
        return false;
      }

      // Priority filter
      if (filter.priority && filter.priority.length > 0 && !filter.priority.includes(portal.priority)) {
        return false;
      }

      // Search term filter
      const search = searchTerm || filter.searchTerm;
      if (search) {
        const term = search.toLowerCase();
        if (
          !portal.name.toLowerCase().includes(term) &&
          !portal.description?.toLowerCase().includes(term) &&
          !portal.url.toLowerCase().includes(term) &&
          !portal.tags.some(tag => tag.toLowerCase().includes(term))
        ) {
          return false;
        }
      }

      // Tags filter
      if (filter.tags && filter.tags.length > 0) {
        if (!filter.tags.some(tag => portal.tags.includes(tag))) {
          return false;
        }
      }

      // Favorite filter
      if (filter.isFavorite !== undefined && portal.isFavorite !== filter.isFavorite) {
        return false;
      }

      // Public filter
      if (filter.isPublic !== undefined && portal.isPublic !== filter.isPublic) {
        return false;
      }

      // Has incidents filter
      if (filter.hasIncidents !== undefined) {
        const hasIncident = portal.lastIncident !== undefined;
        if (hasIncident !== filter.hasIncidents) {
          return false;
        }
      }

      return true;
    });
  }, [portals, filter, searchTerm, selectedCategory]);

  // Memoized portal stats
  const portalStats = useMemo(() => {
    const stats: PortalStats = {
      total: filteredPortals.length,
      operational: filteredPortals.filter(p => p.status === PortalStatus.OPERATIONAL).length,
      degraded: filteredPortals.filter(p => p.status === PortalStatus.DEGRADED).length,
      maintenance: filteredPortals.filter(p => p.status === PortalStatus.MAINTENANCE).length,
      outage: filteredPortals.filter(p => p.status === PortalStatus.OUTAGE).length,
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

    filteredPortals.forEach(portal => {
      stats.byCategory[portal.category]++;
      stats.byEnvironment[portal.environment]++;
      stats.byPriority[portal.priority]++;
      totalUptime += portal.metrics.uptime;
      totalResponseTime += portal.metrics.responseTime;
    });

    if (filteredPortals.length > 0) {
      stats.averageUptime = totalUptime / filteredPortals.length;
      stats.averageResponseTime = totalResponseTime / filteredPortals.length;
    }

    return stats;
  }, [filteredPortals]);

  return {
    portals,
    filteredPortals,
    portalStats,
    searchTerm,
    selectedCategory,
    filter,
    setSearchTerm,
    setSelectedCategory,
    setFilter,
    clearFilter
  };
};