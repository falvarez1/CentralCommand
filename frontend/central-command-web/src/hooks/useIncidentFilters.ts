/**
 * Custom hook for incident filtering logic
 * Provides memoized filtered incidents and stats
 */

import { useMemo } from 'react';
import { useIncidentStore } from '@/stores/useIncidentStore';
import {
  filterIncidents,
  calculateIncidentStats,
  getActiveIncidents,
  getRecentIncidents,
  sortIncidentsByDate
} from '@/utils/incident.utils';

export const useIncidentFilters = () => {
  const {
    incidents,
    filter,
    selectedIncident,
    setFilter,
    clearFilter,
    selectIncident,
    clearSelection
  } = useIncidentStore();

  // Memoized filtered incidents using utility function
  const filteredIncidents = useMemo(() => {
    const filtered = filterIncidents(incidents, filter);
    return sortIncidentsByDate(filtered, 'desc');
  }, [incidents, filter]);

  // Memoized incident stats using utility function
  const incidentStats = useMemo(() => {
    return calculateIncidentStats(incidents);
  }, [incidents]);

  // Memoized active incidents
  const activeIncidents = useMemo(() => {
    return getActiveIncidents(incidents);
  }, [incidents]);

  // Memoized recent incidents (last 24 hours)
  const recentIncidents = useMemo(() => {
    return getRecentIncidents(incidents, 24);
  }, [incidents]);

  return {
    incidents,
    filteredIncidents,
    incidentStats,
    activeIncidents,
    recentIncidents,
    selectedIncident,
    filter,
    setFilter,
    clearFilter,
    selectIncident,
    clearSelection
  };
};