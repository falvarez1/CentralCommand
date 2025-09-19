/**
 * Custom hook for portal filtering logic
 * Provides memoized filtered portals and stats
 */

import { useMemo } from 'react';
import { usePortalStore } from '@/stores/usePortalStore';
import { filterPortals, calculatePortalStats } from '@/utils/portal.utils';

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

  // Memoized filtered portals using utility function
  const filteredPortals = useMemo(() => {
    return filterPortals(portals, filter, searchTerm, selectedCategory);
  }, [portals, filter, searchTerm, selectedCategory]);

  // Memoized portal stats using utility function
  const portalStats = useMemo(() => {
    return calculatePortalStats(filteredPortals);
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