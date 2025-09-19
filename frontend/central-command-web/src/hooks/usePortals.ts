import { useEffect, useMemo } from 'react';
import { usePortalStore } from '../stores/usePortalStore';
import { useUIStore } from '../stores/useUIStore';
import { Portal, PortalFilter } from '../types/portal.types';
import { portalService } from '../services/portal.service';
import { toast } from 'sonner';

/**
 * Custom hook for portal data with filtering and real-time updates
 */
export function usePortals() {
  const {
    portals,
    filteredPortals,
    portalStats,
    selectedPortals,
    isLoading,
    error,
    toggleFavorite,
    selectPortal,
    deselectPortal,
    selectAllPortals,
    clearSelection,
    setFilter,
    clearFilter,
    updatePortalMetrics,
    updateAllMetrics,
    setPortals,
    setLoading,
    setError
  } = usePortalStore();

  const {
    activeCategory,
    searchTerm,
    selectedTimeRange
  } = useUIStore();

  // Fetch portals from API
  const fetchPortals = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await portalService.getPortals({
        pageSize: 100,
        sortBy: 'name',
        sortOrder: 'asc'
      });

      // Map API response to store format
      const mappedPortals = response.items.map((item: any) => ({
        ...item,
        createdAt: new Date(item.createdAt),
        updatedAt: new Date(item.updatedAt),
        lastChecked: item.lastChecked ? new Date(item.lastChecked) : new Date(),
        lastIncident: item.lastIncident ? new Date(item.lastIncident) : undefined,
        metrics: item.metrics || {},
        config: item.config || {},
        tags: item.tags || [],
        maintainers: item.maintainers || []
      }));

      setPortals(mappedPortals);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch portals';
      setError(errorMessage);
      toast.error('Failed to fetch portals', {
        description: errorMessage
      });
    } finally {
      setLoading(false);
    }
  };

  // Initialize portals on mount
  useEffect(() => {
    if (portals.length === 0) {
      fetchPortals();
    }
  }, []);

  // Update filter when UI state changes
  useEffect(() => {
    const filter: PortalFilter = {};

    if (activeCategory && activeCategory !== 'all') {
      filter.category = activeCategory;
    }

    if (searchTerm) {
      filter.searchTerm = searchTerm;
    }

    setFilter(filter);
  }, [activeCategory, searchTerm, setFilter]);

  // Auto-refresh when time range changes
  useEffect(() => {
    updateAllMetrics();
  }, [selectedTimeRange, updateAllMetrics]);

  // Set up auto-refresh
  useEffect(() => {
    const preferences = useUIStore.getState().preferences;
    if (!preferences.autoRefresh) return;

    const interval = setInterval(() => {
      updateAllMetrics();
    }, preferences.refreshInterval * 1000);

    return () => clearInterval(interval);
  }, [updateAllMetrics]);

  // Memoized values
  const favoritePortals = useMemo(
    () => filteredPortals.filter(p => p.isFavorite),
    [filteredPortals]
  );

  const operationalPortals = useMemo(
    () => filteredPortals.filter(p => p.status === 'operational'),
    [filteredPortals]
  );

  const criticalPortals = useMemo(
    () => filteredPortals.filter(p => p.priority === 'critical'),
    [filteredPortals]
  );

  const hasSelection = selectedPortals.length > 0;
  const isAllSelected = selectedPortals.length === filteredPortals.length && filteredPortals.length > 0;

  return {
    // Data
    portals,
    filteredPortals,
    favoritePortals,
    operationalPortals,
    criticalPortals,
    portalStats,

    // Selection
    selectedPortals,
    hasSelection,
    isAllSelected,

    // State
    isLoading,
    error,

    // Actions
    toggleFavorite,
    selectPortal,
    deselectPortal,
    selectAllPortals,
    clearSelection,
    clearFilter,
    updatePortalMetrics,
    refresh: fetchPortals
  };
}

/**
 * Hook for individual portal data
 */
export function usePortal(portalId: string) {
  const portal = usePortalStore(state =>
    state.portals.find(p => p.id === portalId)
  );

  const updateMetrics = usePortalStore(state => state.updatePortalMetrics);
  const updatePortal = usePortalStore(state => state.updatePortal);
  const deletePortal = usePortalStore(state => state.deletePortal);
  const toggleFavorite = usePortalStore(state => state.toggleFavorite);

  // Auto-refresh metrics
  useEffect(() => {
    if (!portal) return;

    const preferences = useUIStore.getState().preferences;
    if (!preferences.autoRefresh) return;

    const interval = setInterval(() => {
      updateMetrics(portalId);
    }, preferences.refreshInterval * 1000);

    return () => clearInterval(interval);
  }, [portal, portalId, updateMetrics]);

  return {
    portal,
    updatePortal: (updates: Partial<Portal>) => updatePortal(portalId, updates),
    deletePortal: () => deletePortal(portalId),
    toggleFavorite: () => toggleFavorite(portalId),
    refreshMetrics: () => updateMetrics(portalId)
  };
}

/**
 * Hook for portal bulk operations
 */
export function usePortalBulkOperations() {
  const {
    selectedPortals,
    executeBulkOperation,
    deleteMultiplePortals,
    clearSelection
  } = usePortalStore();

  const { showToast } = useUIStore();

  const bulkDelete = () => {
    if (selectedPortals.length === 0) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete ${selectedPortals.length} portal(s)?`
    );

    if (confirmed) {
      deleteMultiplePortals(selectedPortals);
      clearSelection();
      showToast('success', 'Portals Deleted', `${selectedPortals.length} portal(s) deleted successfully`);
    }
  };

  const bulkUpdateStatus = (status: Portal['status']) => {
    if (selectedPortals.length === 0) return;

    executeBulkOperation({
      operation: 'update_status',
      portalIds: selectedPortals,
      payload: { status }
    });

    showToast('success', 'Status Updated', `Updated status for ${selectedPortals.length} portal(s)`);
  };

  const bulkUpdatePriority = (priority: Portal['priority']) => {
    if (selectedPortals.length === 0) return;

    executeBulkOperation({
      operation: 'update_priority',
      portalIds: selectedPortals,
      payload: { priority }
    });

    showToast('success', 'Priority Updated', `Updated priority for ${selectedPortals.length} portal(s)`);
  };

  const bulkAddTags = (tags: string[]) => {
    if (selectedPortals.length === 0) return;

    executeBulkOperation({
      operation: 'add_tags',
      portalIds: selectedPortals,
      payload: { tags }
    });

    showToast('success', 'Tags Added', `Added tags to ${selectedPortals.length} portal(s)`);
  };

  const bulkExport = () => {
    const portals = usePortalStore.getState().portals.filter(p =>
      selectedPortals.includes(p.id)
    );

    const json = JSON.stringify(portals, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `portals-export-${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);

    showToast('success', 'Export Complete', `Exported ${selectedPortals.length} portal(s)`);
  };

  return {
    selectedCount: selectedPortals.length,
    bulkDelete,
    bulkUpdateStatus,
    bulkUpdatePriority,
    bulkAddTags,
    bulkExport
  };
}