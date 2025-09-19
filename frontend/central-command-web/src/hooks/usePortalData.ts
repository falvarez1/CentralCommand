import { useEffect, useCallback } from 'react';
import { usePortals, usePortalStats } from './queries/usePortalQueries';
import { usePortalStoreApi } from '../stores/usePortalStoreApi';
import { useSignalR } from './useSignalR';
import { env } from '../config/env';

/**
 * Custom hook that combines React Query with Zustand store for portal data management
 * This provides a unified interface for components to access portal data
 */
export const usePortalData = (params?: {
  page?: number;
  pageSize?: number;
  category?: string;
  status?: string;
  search?: string;
  autoFetch?: boolean;
}) => {
  const {
    autoFetch = true,
    ...queryParams
  } = params || {};

  // Zustand store
  const store = usePortalStoreApi();

  // React Query hooks
  const portalsQuery = usePortals(queryParams, {
    enabled: autoFetch && !env.api.enableMock,
  });

  const statsQuery = usePortalStats({
    enabled: autoFetch && !env.api.enableMock,
  });

  // SignalR integration for real-time updates
  useSignalR({
    autoConnect: env.features.enableRealtimeUpdates,
    onMetricUpdate: useCallback((update) => {
      // Update store with real-time metric data
      store.handleMetricUpdate(update.portalId, {
        [update.metric]: update.value,
      });
    }, [store]),
    onPortalStatusChanged: useCallback((data) => {
      // Update store with status change
      store.handlePortalStatusChange(data.portalId, data.status as any);
    }, [store]),
  });

  // Sync React Query data with Zustand store
  useEffect(() => {
    if (portalsQuery.data && !portalsQuery.isLoading) {
      // Update store with fetched data
      store.setPortals(portalsQuery.data.data);
      store.setPagination({
        page: portalsQuery.data.page,
        pageSize: portalsQuery.data.pageSize,
        total: portalsQuery.data.total,
        totalPages: portalsQuery.data.totalPages,
      });
    }
  }, [portalsQuery.data, portalsQuery.isLoading, store]);

  // Refresh function that updates both React Query and store
  const refresh = useCallback(async () => {
    await Promise.all([
      portalsQuery.refetch(),
      statsQuery.refetch(),
    ]);
  }, [portalsQuery, statsQuery]);

  // Combined loading state
  const isLoading = portalsQuery.isLoading || store.isLoading;

  // Combined error state
  const error = portalsQuery.error || store.error;

  return {
    // Data
    portals: store.filteredPortals,
    stats: store.portalStats,
    pagination: store.pagination,

    // State
    isLoading,
    error,
    isRefetching: portalsQuery.isRefetching,
    lastSync: store.lastSync,

    // Actions
    refresh,
    setFilter: store.setFilter,
    clearFilter: store.clearFilter,
    setPage: store.setPage,
    setPageSize: store.setPageSize,

    // Portal actions
    createPortal: store.createPortal,
    updatePortal: store.updatePortal,
    deletePortal: store.deletePortal,
    toggleFavorite: store.toggleFavorite,

    // Selection actions
    selectedPortals: store.selectedPortals,
    selectPortal: store.selectPortal,
    deselectPortal: store.deselectPortal,
    selectAllPortals: store.selectAllPortals,
    clearSelection: store.clearSelection,

    // Bulk operations
    executeBulkOperation: store.executeBulkOperation,
    deleteMultiplePortals: store.deleteMultiplePortals,
  };
};

/**
 * Hook for individual portal data with real-time updates
 */
export const usePortalDetail = (portalId: string) => {
  const store = usePortalStoreApi();

  // Subscribe to portal-specific updates via SignalR
  useSignalR({
    autoConnect: env.features.enableRealtimeUpdates,
    onMetricUpdate: useCallback((update) => {
      if (update.portalId === portalId) {
        store.handleMetricUpdate(portalId, {
          [update.metric]: update.value,
        });
      }
    }, [portalId, store]),
    onPortalStatusChanged: useCallback((data) => {
      if (data.portalId === portalId) {
        store.handlePortalStatusChange(portalId, data.status as any);
      }
    }, [portalId, store]),
  });

  // Find portal in store
  const portal = store.portals.find(p => p.id === portalId);

  // Fetch if not in store
  useEffect(() => {
    if (!portal && portalId) {
      store.fetchPortal(portalId);
    }
  }, [portal, portalId, store]);

  return {
    portal,
    isLoading: store.isLoading,
    error: store.error,
    updatePortal: (input: any) => store.updatePortal(portalId, input),
    deletePortal: () => store.deletePortal(portalId),
    toggleFavorite: () => store.toggleFavorite(portalId),
    updateMetrics: (metrics: any) => store.updatePortalMetrics(portalId, metrics),
  };
};