import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { enableMapSet } from 'immer';
import {
  Portal,
  PortalStatus,
  PortalCategory,
  PortalFilter,
  CreatePortalInput,
  UpdatePortalInput,
  BulkOperation,
  BulkOperationType,
  PortalStats,
  PortalEnvironment,
  PortalPriority,
} from '../types/portal.types';
import { portalsService } from '../lib/api/services/portals.service';
import { toast } from 'sonner';

// Enable Immer MapSet plugin
enableMapSet();

interface PortalState {
  // State
  portals: Portal[];
  filter: PortalFilter;
  selectedPortals: string[];
  isLoading: boolean;
  error: string | null;
  lastSync: Date | null;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };

  // Computed
  filteredPortals: Portal[];
  portalStats: PortalStats;

  // Actions - API integrated
  fetchPortals: (params?: {
    page?: number;
    pageSize?: number;
    category?: string;
    status?: string;
    search?: string;
  }) => Promise<void>;

  fetchPortal: (id: string) => Promise<Portal | null>;
  createPortal: (input: CreatePortalInput) => Promise<Portal | null>;
  updatePortal: (id: string, input: UpdatePortalInput) => Promise<void>;
  deletePortal: (id: string) => Promise<void>;
  deleteMultiplePortals: (ids: string[]) => Promise<void>;

  // Filter actions
  setFilter: (filter: Partial<PortalFilter>) => void;
  clearFilter: () => void;

  // Favorite actions
  toggleFavorite: (id: string) => Promise<void>;

  // Selection actions
  selectPortal: (id: string) => void;
  deselectPortal: (id: string) => void;
  selectAllPortals: () => void;
  clearSelection: () => void;

  // Bulk operations
  executeBulkOperation: (operation: BulkOperation) => Promise<void>;

  // Metrics updates
  updatePortalMetrics: (id: string, metrics: any) => Promise<void>;
  fetchPortalMetrics: (id: string) => Promise<void>;

  // Sync actions
  syncPortals: () => Promise<void>;
  setError: (error: string | null) => void;

  // Pagination
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  setPagination: (pagination: Partial<PortalState['pagination']>) => void;

  // Data setters
  setPortals: (portals: Portal[]) => void;

  // Real-time updates from SignalR
  handleMetricUpdate: (portalId: string, metrics: any) => void;
  handlePortalStatusChange: (portalId: string, status: PortalStatus) => void;
}

export const usePortalStoreApi = create<PortalState>()(
  devtools(
    persist(
      immer((set, get) => ({
        // Initial state
        portals: [],
        filter: {},
        selectedPortals: [],
        isLoading: false,
        error: null,
        lastSync: null,
        pagination: {
          page: 1,
          pageSize: 20,
          total: 0,
          totalPages: 0,
        },

        // Computed properties
        get filteredPortals() {
          const { portals, filter } = get();

          return portals.filter(portal => {
            // Category filter
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
            if (filter.searchTerm) {
              const term = filter.searchTerm.toLowerCase();
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

            return true;
          });
        },

        get portalStats() {
          const portals = get().filteredPortals;
          const stats: PortalStats = {
            total: portals.length,
            operational: portals.filter(p => p.status === PortalStatus.OPERATIONAL).length,
            degraded: portals.filter(p => p.status === PortalStatus.DEGRADED).length,
            maintenance: portals.filter(p => p.status === PortalStatus.MAINTENANCE).length,
            outage: portals.filter(p => p.status === PortalStatus.OUTAGE).length,
            byCategory: {} as Record<PortalCategory, number>,
            byEnvironment: {} as Record<PortalEnvironment, number>,
            byPriority: {} as Record<PortalPriority, number>,
            averageUptime: 0,
            averageResponseTime: 0
          };

          // Calculate counts and averages
          let totalUptime = 0;
          let totalResponseTime = 0;

          portals.forEach(portal => {
            stats.byCategory[portal.category] = (stats.byCategory[portal.category] || 0) + 1;
            stats.byEnvironment[portal.environment] = (stats.byEnvironment[portal.environment] || 0) + 1;
            stats.byPriority[portal.priority] = (stats.byPriority[portal.priority] || 0) + 1;

            if (portal.metrics) {
              totalUptime += portal.metrics.uptime || 0;
              totalResponseTime += portal.metrics.responseTime || 0;
            }
          });

          if (portals.length > 0) {
            stats.averageUptime = totalUptime / portals.length;
            stats.averageResponseTime = totalResponseTime / portals.length;
          }

          return stats;
        },

        // API Actions
        fetchPortals: async (params) => {
          set(state => {
            state.isLoading = true;
            state.error = null;
          });

          try {
            const response = await portalsService.getPortals({
              page: params?.page || get().pagination.page,
              pageSize: params?.pageSize || get().pagination.pageSize,
              category: params?.category,
              status: params?.status,
              search: params?.search,
            });

            set(state => {
              state.portals = response.data;
              state.pagination = {
                page: response.page,
                pageSize: response.pageSize,
                total: response.total,
                totalPages: response.totalPages,
              };
              state.lastSync = new Date();
              state.isLoading = false;
            });
          } catch (error: any) {
            set(state => {
              state.error = error.message || 'Failed to fetch portals';
              state.isLoading = false;
            });
            toast.error('Failed to fetch portals', {
              description: error.message,
            });
          }
        },

        fetchPortal: async (id) => {
          try {
            const portal = await portalsService.getPortal(id);

            set(state => {
              const index = state.portals.findIndex(p => p.id === id);
              if (index >= 0) {
                state.portals[index] = portal;
              } else {
                state.portals.push(portal);
              }
            });

            return portal;
          } catch (error: any) {
            toast.error('Failed to fetch portal', {
              description: error.message,
            });
            return null;
          }
        },

        createPortal: async (input) => {
          try {
            const portal = await portalsService.createPortal(input);

            set(state => {
              state.portals.unshift(portal);
            });

            toast.success('Portal created', {
              description: `${portal.name} has been created successfully.`,
            });

            return portal;
          } catch (error: any) {
            toast.error('Failed to create portal', {
              description: error.message,
            });
            return null;
          }
        },

        updatePortal: async (id, input) => {
          try {
            const updatedPortal = await portalsService.updatePortal(id, input);

            set(state => {
              const index = state.portals.findIndex(p => p.id === id);
              if (index >= 0) {
                state.portals[index] = updatedPortal;
              }
            });

            toast.success('Portal updated', {
              description: 'Portal has been updated successfully.',
            });
          } catch (error: any) {
            toast.error('Failed to update portal', {
              description: error.message,
            });
          }
        },

        deletePortal: async (id) => {
          try {
            await portalsService.deletePortal(id);

            set(state => {
              state.portals = state.portals.filter(p => p.id !== id);
              state.selectedPortals = state.selectedPortals.filter(pid => pid !== id);
            });

            toast.success('Portal deleted', {
              description: 'Portal has been deleted successfully.',
            });
          } catch (error: any) {
            toast.error('Failed to delete portal', {
              description: error.message,
            });
          }
        },

        deleteMultiplePortals: async (ids) => {
          try {
            await portalsService.bulkDeletePortals(ids);

            set(state => {
              state.portals = state.portals.filter(p => !ids.includes(p.id));
              state.selectedPortals = state.selectedPortals.filter(pid => !ids.includes(pid));
            });

            toast.success('Portals deleted', {
              description: `${ids.length} portal(s) have been deleted successfully.`,
            });
          } catch (error: any) {
            toast.error('Failed to delete portals', {
              description: error.message,
            });
          }
        },

        // Filter actions
        setFilter: (filter) => {
          set(state => {
            state.filter = { ...state.filter, ...filter };
          });
        },

        clearFilter: () => {
          set(state => {
            state.filter = {};
          });
        },

        // Favorite actions
        toggleFavorite: async (id) => {
          try {
            const updatedPortal = await portalsService.toggleFavorite(id);

            set(state => {
              const index = state.portals.findIndex(p => p.id === id);
              if (index >= 0) {
                state.portals[index] = updatedPortal;
              }
            });

            const action = updatedPortal.isFavorite ? 'added to' : 'removed from';
            toast.success('Favorite updated', {
              description: `Portal has been ${action} favorites.`,
            });
          } catch (error: any) {
            toast.error('Failed to update favorite', {
              description: error.message,
            });
          }
        },

        // Selection actions
        selectPortal: (id) => {
          set(state => {
            if (!state.selectedPortals.includes(id)) {
              state.selectedPortals.push(id);
            }
          });
        },

        deselectPortal: (id) => {
          set(state => {
            state.selectedPortals = state.selectedPortals.filter(pid => pid !== id);
          });
        },

        selectAllPortals: () => {
          set(state => {
            state.selectedPortals = state.filteredPortals.map(p => p.id);
          });
        },

        clearSelection: () => {
          set(state => {
            state.selectedPortals = [];
          });
        },

        // Bulk operations
        executeBulkOperation: async (operation) => {
          const { selectedPortals } = get();

          if (selectedPortals.length === 0) {
            toast.warning('No portals selected', {
              description: 'Please select portals to perform bulk operations.',
            });
            return;
          }

          switch (operation.type) {
            case BulkOperationType.DELETE:
              await get().deleteMultiplePortals(selectedPortals);
              break;

            case BulkOperationType.UPDATE_STATUS:
              if (operation.data?.status) {
                for (const id of selectedPortals) {
                  await get().updatePortal(id, { status: operation.data.status });
                }
              }
              break;

            case BulkOperationType.UPDATE_ENVIRONMENT:
              if (operation.data?.environment) {
                for (const id of selectedPortals) {
                  await get().updatePortal(id, { environment: operation.data.environment });
                }
              }
              break;

            case BulkOperationType.UPDATE_PRIORITY:
              if (operation.data?.priority) {
                for (const id of selectedPortals) {
                  await get().updatePortal(id, { priority: operation.data.priority });
                }
              }
              break;

            case BulkOperationType.ADD_TAGS:
              if (operation.data?.tags) {
                for (const id of selectedPortals) {
                  const portal = get().portals.find(p => p.id === id);
                  if (portal) {
                    const newTags = [...new Set([...portal.tags, ...operation.data.tags])];
                    await get().updatePortal(id, { tags: newTags });
                  }
                }
              }
              break;

            case BulkOperationType.REMOVE_TAGS:
              if (operation.data?.tags) {
                for (const id of selectedPortals) {
                  const portal = get().portals.find(p => p.id === id);
                  if (portal) {
                    const newTags = portal.tags.filter(tag => !operation.data.tags.includes(tag));
                    await get().updatePortal(id, { tags: newTags });
                  }
                }
              }
              break;
          }

          get().clearSelection();
        },

        // Metrics updates
        updatePortalMetrics: async (id, metrics) => {
          try {
            await portalsService.updatePortalMetrics(id, metrics);

            set(state => {
              const portal = state.portals.find(p => p.id === id);
              if (portal) {
                portal.metrics = { ...portal.metrics, ...metrics };
                portal.lastChecked = new Date();
              }
            });
          } catch (error: any) {
            console.error('Failed to update portal metrics:', error);
          }
        },

        fetchPortalMetrics: async (id) => {
          try {
            const metrics = await portalsService.getPortalMetrics(id);

            set(state => {
              const portal = state.portals.find(p => p.id === id);
              if (portal) {
                portal.metrics = metrics;
                portal.lastChecked = new Date();
              }
            });
          } catch (error: any) {
            console.error('Failed to fetch portal metrics:', error);
          }
        },

        // Sync actions
        syncPortals: async () => {
          await get().fetchPortals();
        },

        setError: (error) => {
          set(state => {
            state.error = error;
          });
        },

        // Pagination
        setPage: (page) => {
          set(state => {
            state.pagination.page = page;
          });
          get().fetchPortals({ page });
        },

        setPageSize: (pageSize) => {
          set(state => {
            state.pagination.pageSize = pageSize;
            state.pagination.page = 1; // Reset to first page
          });
          get().fetchPortals({ pageSize, page: 1 });
        },

        setPagination: (pagination) => {
          set(state => {
            state.pagination = { ...state.pagination, ...pagination };
          });
        },

        // Data setters
        setPortals: (portals) => {
          set(state => {
            state.portals = portals;
            state.lastSync = new Date();
          });
        },

        // Real-time updates from SignalR
        handleMetricUpdate: (portalId, metrics) => {
          set(state => {
            const portal = state.portals.find(p => p.id === portalId);
            if (portal) {
              portal.metrics = { ...portal.metrics, ...metrics };
              portal.lastChecked = new Date();
            }
          });
        },

        handlePortalStatusChange: (portalId, status) => {
          set(state => {
            const portal = state.portals.find(p => p.id === portalId);
            if (portal) {
              portal.status = status;
              portal.updatedAt = new Date();
            }
          });
        },
      })),
      {
        name: 'portal-store-api',
        partialize: (state) => ({
          filter: state.filter,
          pagination: {
            pageSize: state.pagination.pageSize,
          },
        }),
      }
    )
  )
);