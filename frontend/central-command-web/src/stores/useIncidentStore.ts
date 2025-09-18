import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { v4 as uuidv4 } from 'uuid';
import { incidentsService } from '../lib/api/services/incidents.service';
import { useAppConfigStore } from './useAppConfigStore';
import { toast } from 'sonner';
import {
  Incident,
  IncidentSeverity,
  IncidentType,
  IncidentStatus,
  IncidentFilter,
  CreateIncidentInput,
  UpdateIncidentInput,
  IncidentStats
} from '../types/incident.types';

interface IncidentState {
  // State
  incidents: Incident[];
  filter: IncidentFilter;
  selectedIncident: Incident | null;
  isLoading: boolean;
  error: string | null;

  // Computed
  filteredIncidents: Incident[];
  incidentStats: IncidentStats;
  activeIncidents: Incident[];
  recentIncidents: Incident[];

  // Actions
  setIncidents: (incidents: Incident[]) => void;
  createIncident: (input: CreateIncidentInput) => Incident;
  updateIncident: (id: string, input: UpdateIncidentInput) => void;
  deleteIncident: (id: string) => void;

  // Status actions
  acknowledgeIncident: (id: string) => void;
  resolveIncident: (id: string, resolution: string, rootCause?: string) => void;
  escalateIncident: (id: string) => void;
  reopenIncident: (id: string) => void;

  // Filter actions
  setFilter: (filter: Partial<IncidentFilter>) => void;
  clearFilter: () => void;

  // Selection actions
  selectIncident: (id: string) => void;
  clearSelection: () => void;

  // Timeline actions
  addTimelineEntry: (incidentId: string, action: string, description: string) => void;

  // Assignment actions
  assignIncident: (id: string, assigneeId: string) => void;
  assignToTeam: (id: string, teamId: string) => void;

  // Relationship actions
  linkIncidents: (id: string, relatedIds: string[]) => void;
  linkToPortal: (incidentId: string, portalId: string) => void;

  // Sync actions
  syncIncidents: () => Promise<void>;
  fetchIncidentsFromApi: () => Promise<void>;
  fetchIncidentStatsFromApi: () => Promise<void>;
  setError: (error: string | null) => void;

  // Initialize
  initialize: () => Promise<void>;
}

export const useIncidentStore = create<IncidentState>()(
  devtools(
    persist(
      immer((set, get) => ({
        // Initial state
        incidents: [],
        filter: {},
        selectedIncident: null,
        isLoading: false,
        error: null,

        // Computed properties
        get filteredIncidents() {
          const { incidents, filter } = get();

          return [...incidents].filter(incident => {
            // Status filter
            if (filter.status && filter.status.length > 0 && !filter.status.includes(incident.status)) {
              return false;
            }

            // Type filter
            if (filter.type && filter.type.length > 0 && !filter.type.includes(incident.type)) {
              return false;
            }

            // Severity filter
            if (filter.severity && filter.severity.length > 0 && !filter.severity.includes(incident.severity)) {
              return false;
            }

            // Date range filter
            if (filter.dateRange) {
              const incidentDate = incident.createdAt.getTime();
              if (filter.dateRange.from && incidentDate < filter.dateRange.from.getTime()) {
                return false;
              }
              if (filter.dateRange.to && incidentDate > filter.dateRange.to.getTime()) {
                return false;
              }
            }

            // Search term filter
            if (filter.searchTerm) {
              const term = filter.searchTerm.toLowerCase();
              if (
                !incident.title.toLowerCase().includes(term) &&
                !incident.description.toLowerCase().includes(term) &&
                !incident.tags.some(tag => tag.toLowerCase().includes(term))
              ) {
                return false;
              }
            }

            // Assignee filter
            if (filter.assignee && incident.assignee !== filter.assignee) {
              return false;
            }

            // Team filter
            if (filter.team && incident.team !== filter.team) {
              return false;
            }

            // Portal filter
            if (filter.affectedPortal && !incident.affectedPortals.includes(filter.affectedPortal)) {
              return false;
            }

            // Tags filter
            if (filter.tags && filter.tags.length > 0) {
              if (!filter.tags.some(tag => incident.tags.includes(tag))) {
                return false;
              }
            }

            // Unresolved filter
            if (filter.isUnresolved && incident.status === IncidentStatus.Resolved) {
              return false;
            }

            // Public filter
            if (filter.isPublic !== undefined && incident.isPublic !== filter.isPublic) {
              return false;
            }

            return true;
          }).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        },

        get incidentStats() {
          const incidents = get().incidents;
          const now = new Date();
          const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

          const stats: IncidentStats = {
            total: incidents.length,
            open: incidents.filter(i => i.status === IncidentStatus.Open).length,
            inProgress: incidents.filter(i => i.status === IncidentStatus.InProgress).length,
            acknowledgedIncidents: incidents.filter(i => i.status === IncidentStatus.Acknowledged).length,
            resolved: incidents.filter(i => i.status === IncidentStatus.Resolved).length,
            closed: incidents.filter(i => i.status === IncidentStatus.Closed).length,
            // Legacy aliases for backward compatibility
            investigating: incidents.filter(i => i.status === IncidentStatus.InProgress).length,
            acknowledged: incidents.filter(i => i.status === IncidentStatus.Acknowledged).length,
            bySeverity: {
              [IncidentSeverity.Critical]: incidents.filter(i => i.severity === IncidentSeverity.Critical).length,
              [IncidentSeverity.High]: incidents.filter(i => i.severity === IncidentSeverity.High).length,
              [IncidentSeverity.Medium]: incidents.filter(i => i.severity === IncidentSeverity.Medium).length,
              [IncidentSeverity.Low]: incidents.filter(i => i.severity === IncidentSeverity.Low).length
            },
            byType: {} as Record<IncidentType, number>,
            last24Hours: incidents.filter(i => i.createdAt > last24h).length,
            last7Days: incidents.filter(i => i.createdAt > last7d).length,
            averageMTTR: 0,
            averageMTBF: 0
          };

          // Initialize type counts
          Object.values(IncidentType).forEach(type => {
            stats.byType[type] = incidents.filter(i => i.type === type).length;
          });

          // Calculate average MTTR and MTBF
          const resolvedIncidents = incidents.filter(i => i.status === IncidentStatus.Resolved && i.metrics?.mttr);
          if (resolvedIncidents.length > 0) {
            stats.averageMTTR = resolvedIncidents.reduce((sum, i) => sum + (i.metrics?.mttr || 0), 0) / resolvedIncidents.length;
          }

          const incidentsWithMTBF = incidents.filter(i => i.metrics?.mtbf);
          if (incidentsWithMTBF.length > 0) {
            stats.averageMTBF = incidentsWithMTBF.reduce((sum, i) => sum + (i.metrics?.mtbf || 0), 0) / incidentsWithMTBF.length;
          }

          return stats;
        },

        get activeIncidents() {
          return get().incidents.filter(i => i.status !== IncidentStatus.Resolved);
        },

        get recentIncidents() {
          const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
          return get().incidents.filter(i => i.createdAt > last24h);
        },

        // Actions
        setIncidents: (incidents) => set(state => {
          state.incidents = incidents;
        }),

        createIncident: (input) => {
          const newIncident: Incident = {
            id: uuidv4(),
            title: input.title,
            description: input.description,
            type: input.type,
            severity: input.severity,
            status: input.status || IncidentStatus.Open,
            affectedPortals: input.affectedPortals || [],
            affectedServices: input.affectedServices || [],
            impactedUsers: input.impactedUsers || 0,
            assignee: input.assignee,
            team: input.team,
            reportedBy: input.reportedBy || uuidv4(),
            createdAt: new Date(),
            updatedAt: new Date(),
            resolvedAt: undefined,
            acknowledgedAt: undefined,
            rootCause: undefined,
            resolution: undefined,
            postmortemUrl: undefined,
            tags: input.tags || [],
            timeline: [
              {
                id: uuidv4(),
                timestamp: new Date(),
                action: 'Incident created',
                description: input.description,
                performedBy: input.reportedBy || uuidv4()
              }
            ],
            metrics: {
              mttr: undefined,
              mtbf: undefined,
              impactDuration: undefined,
              severityChanges: 0
            },
            notifications: input.notifications || {
              emailSent: false,
              slackSent: false,
              smsSent: false,
              teamsNotified: []
            },
            relatedIncidents: input.relatedIncidents || [],
            isPublic: input.isPublic || false,
            createdBy: uuidv4(), // Would come from auth context
            updatedBy: uuidv4()
          };

          set(state => {
            state.incidents.push(newIncident);
          });

          return newIncident;
        },

        updateIncident: (id, input) => set(state => {
          const index = state.incidents.findIndex(i => i.id === id);
          if (index !== -1) {
            const previousSeverity = state.incidents[index].severity;
            state.incidents[index] = {
              ...state.incidents[index],
              ...input,
              updatedAt: new Date(),
              updatedBy: uuidv4() // Would come from auth context
            };

            // Track severity changes
            if (input.severity && input.severity !== previousSeverity) {
              state.incidents[index].metrics.severityChanges++;
            }
          }
        }),

        deleteIncident: (id) => set(state => {
          state.incidents = state.incidents.filter(i => i.id !== id);
          if (state.selectedIncident?.id === id) {
            state.selectedIncident = null;
          }
        }),

        acknowledgeIncident: (id) => set(state => {
          const incident = state.incidents.find(i => i.id === id);
          if (incident) {
            incident.acknowledgedAt = new Date();
            incident.status = IncidentStatus.Acknowledged;
            incident.updatedAt = new Date();
            get().addTimelineEntry(id, 'Incident acknowledged', 'Team has begun investigating the issue');
          }
        }),

        resolveIncident: (id, resolution, rootCause) => set(state => {
          const incident = state.incidents.find(i => i.id === id);
          if (incident) {
            const now = new Date();
            incident.status = IncidentStatus.Resolved;
            incident.resolvedAt = now;
            incident.resolution = resolution;
            incident.rootCause = rootCause;
            incident.updatedAt = now;

            // Calculate MTTR if acknowledged
            if (incident.acknowledgedAt) {
              incident.metrics.mttr = Math.floor((now.getTime() - incident.acknowledgedAt.getTime()) / 60000);
            }

            // Calculate impact duration
            incident.metrics.impactDuration = Math.floor((now.getTime() - incident.createdAt.getTime()) / 60000);

            get().addTimelineEntry(id, 'Incident resolved', resolution);
          }
        }),

        escalateIncident: (id) => set(state => {
          const incident = state.incidents.find(i => i.id === id);
          if (incident && incident.severity !== IncidentSeverity.Critical) {
            const severityOrder = [IncidentSeverity.Low, IncidentSeverity.Medium, IncidentSeverity.High, IncidentSeverity.Critical];
            const currentIndex = severityOrder.indexOf(incident.severity);
            if (currentIndex < severityOrder.length - 1) {
              incident.severity = severityOrder[currentIndex + 1];
              incident.metrics.severityChanges++;
              incident.updatedAt = new Date();
              get().addTimelineEntry(id, 'Incident escalated', `Severity changed to ${incident.severity}`);
            }
          }
        }),

        reopenIncident: (id) => set(state => {
          const incident = state.incidents.find(i => i.id === id);
          if (incident && incident.status === IncidentStatus.Resolved) {
            incident.status = IncidentStatus.Open;
            incident.resolvedAt = undefined;
            incident.resolution = undefined;
            incident.updatedAt = new Date();
            get().addTimelineEntry(id, 'Incident reopened', 'Issue has recurred or was not fully resolved');
          }
        }),

        setFilter: (filter) => set(state => {
          state.filter = { ...state.filter, ...filter };
        }),

        clearFilter: () => set(state => {
          state.filter = {};
        }),

        selectIncident: (id) => set(state => {
          state.selectedIncident = state.incidents.find(i => i.id === id) || null;
        }),

        clearSelection: () => set(state => {
          state.selectedIncident = null;
        }),

        addTimelineEntry: (incidentId, action, description) => set(state => {
          const incident = state.incidents.find(i => i.id === incidentId);
          if (incident) {
            incident.timeline.push({
              id: uuidv4(),
              timestamp: new Date(),
              action,
              description,
              performedBy: uuidv4() // Would come from auth context
            });
            incident.updatedAt = new Date();
          }
        }),

        assignIncident: (id, assigneeId) => set(state => {
          const incident = state.incidents.find(i => i.id === id);
          if (incident) {
            incident.assignee = assigneeId;
            incident.updatedAt = new Date();
            get().addTimelineEntry(id, 'Incident assigned', `Assigned to user ${assigneeId}`);
          }
        }),

        assignToTeam: (id, teamId) => set(state => {
          const incident = state.incidents.find(i => i.id === id);
          if (incident) {
            incident.team = teamId;
            incident.updatedAt = new Date();
            get().addTimelineEntry(id, 'Team assigned', `Assigned to team ${teamId}`);
          }
        }),

        linkIncidents: (id, relatedIds) => set(state => {
          const incident = state.incidents.find(i => i.id === id);
          if (incident) {
            incident.relatedIncidents = [...new Set([...incident.relatedIncidents, ...relatedIds])];
            incident.updatedAt = new Date();
            get().addTimelineEntry(id, 'Incidents linked', `Linked to ${relatedIds.length} related incidents`);
          }
        }),

        linkToPortal: (incidentId, portalId) => set(state => {
          const incident = state.incidents.find(i => i.id === incidentId);
          if (incident && !incident.affectedPortals.includes(portalId)) {
            incident.affectedPortals.push(portalId);
            incident.updatedAt = new Date();
            get().addTimelineEntry(incidentId, 'Portal linked', `Linked to affected portal`);
          }
        }),

        syncIncidents: async () => {
          const { dataSourceMode } = useAppConfigStore.getState();

          set(state => {
            state.isLoading = true;
            state.error = null;
          });

          try {
            // Always fetch from API (which will use the correct endpoint based on mode)
            await get().fetchIncidentsFromApi();
          } catch (error) {
            console.error('Failed to sync incidents:', error);

            // If API fails and we're in real mode, try to seed the database
            if (dataSourceMode === 'real' && get().incidents.length === 0) {
              try {
                // Try to seed the database
                const response = await fetch('http://localhost:5000/api/v1/dev/seed', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' }
                });

                if (response.ok) {
                  // Retry fetching incidents after seeding
                  await get().fetchIncidentsFromApi();
                  toast.success('Database initialized with sample data');
                }
              } catch (seedError) {
                console.error('Failed to seed database:', seedError);
              }
            }

            // Show error if no data available
            if (get().incidents.length === 0) {
              set(state => {
                state.isLoading = false;
                state.error = 'Unable to connect to API. Check if the backend is running.';
              });
              toast.error('Connection Failed', {
                description: 'Unable to connect to API. Check if the backend is running.'
              });
            }
          }
        },

        fetchIncidentsFromApi: async () => {
          set(state => {
            state.isLoading = true;
            state.error = null;
          });

          try {
            const response = await incidentsService.getIncidents({
              pageSize: 100, // Get more incidents for demo
              sortBy: 'createdAt',
              sortOrder: 'desc'
            });

            // Map API response to store format
            const incidents = response.items.map((item: any) => ({
              ...item,
              createdAt: new Date(item.createdAt),
              updatedAt: new Date(item.updatedAt),
              resolvedAt: item.resolvedAt ? new Date(item.resolvedAt) : undefined,
              acknowledgedAt: item.acknowledgedAt ? new Date(item.acknowledgedAt) : undefined,
              closedAt: item.closedAt ? new Date(item.closedAt) : undefined,
              timeline: item.timeline || [],
              affectedPortals: item.affectedPortals || [],
              affectedServices: item.affectedServices || [],
              tags: item.tags || [],
              relatedIncidents: item.relatedIncidents || []
            }));

            set(state => {
              state.incidents = incidents;
              state.isLoading = false;
            });

            // Update API connection status
            useAppConfigStore.getState().setApiConnected(true);

          } catch (error) {
            console.error('Failed to fetch incidents from API:', error);
            set(state => {
              state.error = error instanceof Error ? error.message : 'Failed to fetch incidents from API';
              state.isLoading = false;
            });

            // Update API connection status
            useAppConfigStore.getState().setApiConnected(false);

            // Show error toast
            toast.error('Failed to fetch incidents', {
              description: 'Unable to connect to the API. Please check your connection.'
            });
          }
        },

        fetchIncidentStatsFromApi: async () => {
          try {
            const stats = await incidentsService.getIncidentStats();
            // Stats will be used directly by components that need them
            return stats;
          } catch (error) {
            console.error('Failed to fetch incident stats from API:', error);
            return null;
          }
        },

        setError: (error) => set(state => {
          state.error = error;
        }),

        initialize: async () => {
          // Always sync with the configured data source on initialization
          await get().syncIncidents();
        }
      })),
      {
        name: 'incident-store',
        partialize: (state) => ({
          incidents: state.incidents,
          filter: state.filter
        })
      }
    )
  )
);