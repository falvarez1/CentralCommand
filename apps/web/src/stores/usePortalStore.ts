import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { enableMapSet } from 'immer';

// Enable Immer MapSet plugin
enableMapSet();
import { v4 as uuidv4 } from 'uuid';
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
  AuthType
} from '../types/portal.types';

/**
 * Mock data generator for portals
 */
const generateMockPortals = (): Portal[] => {
  const categories = Object.values(PortalCategory).filter(c => c !== PortalCategory.All);
  const statuses = Object.values(PortalStatus);
  const environments = Object.values(PortalEnvironment);
  const priorities = Object.values(PortalPriority);

  const portalNames = [
    { name: 'Grafana Dashboard', category: PortalCategory.Operations, url: 'https://grafana.internal' },
    { name: 'Prometheus Metrics', category: PortalCategory.Operations, url: 'https://prometheus.internal' },
    { name: 'Kibana Logs', category: PortalCategory.Security, url: 'https://kibana.internal' },
    { name: 'Jenkins CI/CD', category: PortalCategory.Engineering, url: 'https://jenkins.internal' },
    { name: 'GitLab', category: PortalCategory.Engineering, url: 'https://gitlab.internal' },
    { name: 'Kubernetes Dashboard', category: PortalCategory.Engineering, url: 'https://k8s.internal' },
    { name: 'PostgreSQL Admin', category: PortalCategory.Engineering, url: 'https://pgadmin.internal' },
    { name: 'MongoDB Atlas', category: PortalCategory.Engineering, url: 'https://mongodb.internal' },
    { name: 'SonarQube', category: PortalCategory.Engineering, url: 'https://sonarqube.internal' },
    { name: 'Vault Secrets', category: PortalCategory.Security, url: 'https://vault.internal' },
    { name: 'Confluence Wiki', category: PortalCategory.Business, url: 'https://confluence.internal' },
    { name: 'JIRA Board', category: PortalCategory.Business, url: 'https://jira.internal' },
    { name: 'Slack Gateway', category: PortalCategory.Support, url: 'https://slack-gateway.internal' },
    { name: 'Email Service', category: PortalCategory.Support, url: 'https://email.internal' },
    { name: 'API Gateway', category: PortalCategory.Operations, url: 'https://api-gateway.internal' }
  ];

  return portalNames.map((portal, index) => ({
    id: uuidv4(),
    name: portal.name,
    description: `Enterprise ${portal.name} for internal operations and monitoring`,
    url: portal.url,
    category: portal.category,
    status: statuses[Math.floor(Math.random() * statuses.length)],
    environment: environments[Math.floor(Math.random() * environments.length)],
    priority: priorities[Math.floor(Math.random() * priorities.length)],
    authType: AuthType.OAUTH,
    authConfig: {},
    metrics: {
      responseTime: Math.floor(Math.random() * 500) + 50,
      uptime: 95 + Math.random() * 5,
      cpu: Math.random() * 100,
      memory: Math.random() * 100,
      requests: Math.floor(Math.random() * 10000),
      errors: Math.floor(Math.random() * 100),
      errorRate: Math.random() * 5,
      throughput: Math.floor(Math.random() * 1000),
      latency: Math.floor(Math.random() * 100)
    },
    lastChecked: new Date(),
    lastIncident: index % 3 === 0 ? new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000) : undefined,
    config: {
      healthCheckEndpoint: `${portal.url}/health`,
      healthCheckInterval: 30,
      timeout: 5000,
      retryAttempts: 3,
      retryDelay: 1000,
      enableMonitoring: true,
      enableAlerts: true,
      enableAutoRecovery: false
    },
    icon: '🌐',
    color: `#${Math.floor(Math.random()*16777215).toString(16)}`,
    tags: ['production', 'critical'].slice(0, Math.floor(Math.random() * 2) + 1),
    isFavorite: index < 3,
    isPublic: index % 2 === 0,
    owner: uuidv4(),
    team: uuidv4(),
    maintainers: [uuidv4(), uuidv4()],
    createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(),
    createdBy: uuidv4(),
    updatedBy: uuidv4()
  }));
};

interface PortalState {
  // State
  portals: Portal[];
  filter: PortalFilter;
  selectedPortals: string[];
  isLoading: boolean;
  error: string | null;
  lastSync: Date | null;
  searchTerm: string;
  selectedCategory: string;

  // Computed - will be derived in selectors
  filteredPortals: Portal[];
  portalStats: PortalStats;

  // Actions
  setPortals: (portals: Portal[]) => void;
  addPortal: (input: CreatePortalInput) => Portal;
  updatePortal: (id: string, input: UpdatePortalInput) => void;
  deletePortal: (id: string) => void;
  deleteMultiplePortals: (ids: string[]) => void;

  // Filter actions
  setFilter: (filter: Partial<PortalFilter>) => void;
  clearFilter: () => void;
  setSearchTerm: (term: string) => void;
  setSelectedCategory: (category: string) => void;

  // Favorite actions
  toggleFavorite: (id: string) => void;

  // Selection actions
  selectPortal: (id: string) => void;
  deselectPortal: (id: string) => void;
  selectAllPortals: () => void;
  clearSelection: () => void;

  // Bulk operations
  executeBulkOperation: (operation: BulkOperation) => void;

  // Metrics updates
  updatePortalMetrics: (id: string) => void;
  updateAllMetrics: () => void;
  simulateRealtimeUpdates: () => void;

  // Sync actions
  syncPortals: () => Promise<void>;
  setError: (error: string | null) => void;

  // Initialize
  initialize: () => void;
}

export const usePortalStore = create<PortalState>()(
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
        searchTerm: '',
        selectedCategory: 'all',

        // Computed properties - must be recalculated when accessed
        get filteredPortals() {
          const { portals, filter, searchTerm, selectedCategory } = get();

          return portals.filter(portal => {
            // Category filter from selectedCategory
            if (selectedCategory && selectedCategory !== 'all' && portal.category !== selectedCategory) {
              return false;
            }

            // Category filter from filter object
            if (filter.category && filter.category !== PortalCategory.All && portal.category !== filter.category) {
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

            // Search term filter from state
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

          portals.forEach(portal => {
            stats.byCategory[portal.category]++;
            stats.byEnvironment[portal.environment]++;
            stats.byPriority[portal.priority]++;
            totalUptime += portal.metrics.uptime;
            totalResponseTime += portal.metrics.responseTime;
          });

          if (portals.length > 0) {
            stats.averageUptime = totalUptime / portals.length;
            stats.averageResponseTime = totalResponseTime / portals.length;
          }

          return stats;
        },

        // Actions
        setPortals: (portals) => set(state => {
          state.portals = portals;
        }),

        addPortal: (input) => {
          const newPortal: Portal = {
            id: uuidv4(),
            name: input.name,
            description: input.description,
            url: input.url,
            category: input.category,
            status: input.status,
            environment: input.environment || PortalEnvironment.PRODUCTION,
            priority: input.priority || PortalPriority.MEDIUM,
            authType: input.authType || AuthType.NONE,
            authConfig: input.authConfig,
            metrics: input.metrics || {
              responseTime: 0,
              uptime: 100,
              cpu: 0,
              memory: 0,
              requests: 0,
              errors: 0,
              errorRate: 0,
              throughput: 0,
              latency: 0
            },
            lastChecked: new Date(),
            lastIncident: undefined,
            config: input.config || {
              healthCheckEndpoint: `${input.url}/health`,
              healthCheckInterval: 30,
              timeout: 5000,
              retryAttempts: 3,
              retryDelay: 1000,
              enableMonitoring: true,
              enableAlerts: true,
              enableAutoRecovery: false
            },
            icon: input.icon,
            color: input.color,
            tags: input.tags || [],
            isFavorite: input.isFavorite || false,
            isPublic: input.isPublic || false,
            owner: input.owner,
            team: input.team,
            maintainers: input.maintainers || [],
            createdAt: new Date(),
            updatedAt: new Date(),
            createdBy: uuidv4(), // Would come from auth context
            updatedBy: uuidv4()
          };

          set(state => {
            state.portals.push(newPortal);
          });

          return newPortal;
        },

        updatePortal: (id, input) => set(state => {
          const index = state.portals.findIndex((p: Portal) => p.id === id);
          if (index !== -1) {
            state.portals[index] = {
              ...state.portals[index],
              ...input,
              updatedAt: new Date(),
              updatedBy: uuidv4() // Would come from auth context
            };
          }
        }),

        deletePortal: (id) => set(state => {
          state.portals = state.portals.filter((p: Portal) => p.id !== id);
          state.selectedPortals = state.selectedPortals.filter((pid: string) => pid !== id);
        }),

        deleteMultiplePortals: (ids) => set(state => {
          state.portals = state.portals.filter((p: Portal) => !ids.includes(p.id));
          state.selectedPortals = state.selectedPortals.filter((pid: string) => !ids.includes(pid));
        }),

        setFilter: (filter) => set(state => {
          state.filter = { ...state.filter, ...filter };
        }),

        clearFilter: () => set(state => {
          state.filter = {};
          state.searchTerm = '';
          state.selectedCategory = 'all';
        }),

        setSearchTerm: (term) => set(state => {
          state.searchTerm = term;
        }),

        setSelectedCategory: (category) => set(state => {
          state.selectedCategory = category;
        }),

        toggleFavorite: (id) => set(state => {
          const portal = state.portals.find((p: Portal) => p.id === id);
          if (portal) {
            portal.isFavorite = !portal.isFavorite;
            portal.updatedAt = new Date();
          }
        }),

        selectPortal: (id) => set(state => {
          if (!state.selectedPortals.includes(id)) {
            state.selectedPortals.push(id);
          }
        }),

        deselectPortal: (id) => set(state => {
          state.selectedPortals = state.selectedPortals.filter((pid: string) => pid !== id);
        }),

        selectAllPortals: () => set(state => {
          state.selectedPortals = state.filteredPortals.map((p: Portal) => p.id);
        }),

        clearSelection: () => set(state => {
          state.selectedPortals = [];
        }),

        executeBulkOperation: (operation) => set(state => {
          const { portalIds, payload } = operation;

          portalIds.forEach(id => {
            const portal = state.portals.find((p: Portal) => p.id === id);
            if (!portal) return;

            switch (operation.operation) {
              case BulkOperationType.UPDATE_STATUS:
                if (payload?.status) {
                  portal.status = payload.status as PortalStatus;
                }
                break;

              case BulkOperationType.UPDATE_PRIORITY:
                if (payload?.priority) {
                  portal.priority = payload.priority as PortalPriority;
                }
                break;

              case BulkOperationType.UPDATE_ENVIRONMENT:
                if (payload?.environment) {
                  portal.environment = payload.environment as PortalEnvironment;
                }
                break;

              case BulkOperationType.ADD_TAGS:
                if (payload?.tags && Array.isArray(payload.tags)) {
                  portal.tags = [...new Set([...portal.tags, ...payload.tags])];
                }
                break;

              case BulkOperationType.REMOVE_TAGS:
                if (payload?.tags && Array.isArray(payload.tags)) {
                  portal.tags = portal.tags.filter((tag: string) => !payload.tags.includes(tag));
                }
                break;

              case BulkOperationType.ASSIGN_TEAM:
                if (payload?.team) {
                  portal.team = payload.team;
                }
                break;

              case BulkOperationType.ENABLE_MONITORING:
                portal.config.enableMonitoring = true;
                break;

              case BulkOperationType.DISABLE_MONITORING:
                portal.config.enableMonitoring = false;
                break;

              case BulkOperationType.DELETE:
                // Handled separately
                break;

              case BulkOperationType.EXPORT:
                // Handled by UI component
                break;
            }

            portal.updatedAt = new Date();
            portal.updatedBy = uuidv4(); // Would come from auth context
          });

          if (operation.operation === BulkOperationType.DELETE) {
            state.portals = state.portals.filter((p: Portal) => !portalIds.includes(p.id));
            state.selectedPortals = state.selectedPortals.filter((id: string) => !portalIds.includes(id));
          }
        }),

        updatePortalMetrics: (id) => set(state => {
          const portal = state.portals.find((p: Portal) => p.id === id);
          if (portal) {
            // Simulate metric updates
            portal.metrics = {
              responseTime: Math.max(50, portal.metrics.responseTime + (Math.random() - 0.5) * 50),
              uptime: Math.min(100, Math.max(90, portal.metrics.uptime + (Math.random() - 0.5) * 2)),
              cpu: Math.min(100, Math.max(0, portal.metrics.cpu + (Math.random() - 0.5) * 10)),
              memory: Math.min(100, Math.max(0, portal.metrics.memory + (Math.random() - 0.5) * 10)),
              requests: Math.max(0, portal.metrics.requests + Math.floor(Math.random() * 100)),
              errors: Math.max(0, portal.metrics.errors + Math.floor(Math.random() * 5)),
              errorRate: Math.min(10, Math.max(0, portal.metrics.errorRate + (Math.random() - 0.5))),
              throughput: Math.max(0, portal.metrics.throughput + (Math.random() - 0.5) * 100),
              latency: Math.max(10, portal.metrics.latency + (Math.random() - 0.5) * 10)
            };
            portal.lastChecked = new Date();

            // Randomly change status based on metrics
            if (portal.metrics.errorRate > 5) {
              portal.status = PortalStatus.DEGRADED;
            } else if (portal.metrics.uptime < 95) {
              portal.status = PortalStatus.OUTAGE;
            } else {
              portal.status = PortalStatus.OPERATIONAL;
            }
          }
        }),

        updateAllMetrics: () => {
          const { portals } = get();
          portals.forEach(portal => {
            get().updatePortalMetrics(portal.id);
          });
        },

        simulateRealtimeUpdates: () => {
          // Update metrics every 30 seconds
          setInterval(() => {
            get().updateAllMetrics();
          }, 30000);
        },

        syncPortals: async () => {
          set(state => {
            state.isLoading = true;
            state.error = null;
          });

          try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));

            // In real app, would fetch from API
            // const response = await fetch('/api/portals');
            // const portals = await response.json();

            set(state => {
              state.lastSync = new Date();
              state.isLoading = false;
            });
          } catch (error) {
            set(state => {
              state.error = error instanceof Error ? error.message : 'Failed to sync portals';
              state.isLoading = false;
            });
          }
        },

        setError: (error) => set(state => {
          state.error = error;
        }),

        initialize: () => {
          set(state => { state.portals = generateMockPortals(); });
          get().simulateRealtimeUpdates();
        },
      
        // Aliases for App.tsx compatibility
        initializePortals: () => {
          get().initialize();
        },

        startRealTimeUpdates: () => {
          get().simulateRealtimeUpdates();
          // Return cleanup function
          return () => {
            // In a real app, we'd clear intervals here
          };
        }
      }),
      {
        name: 'portal-store',
        partialize: (state) => ({
          portals: state.portals,
          filter: state.filter
        })
      }
    )
  )
));