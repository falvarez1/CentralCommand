import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { v4 as uuidv4 } from 'uuid';
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

/**
 * Mock data generator for incidents
 */
const generateMockIncidents = (): Incident[] => {
  const severities = Object.values(IncidentSeverity);
  const types = Object.values(IncidentType);
  const statuses = Object.values(IncidentStatus);

  const incidentTemplates = [
    {
      title: 'Database connection timeout',
      description: 'PostgreSQL primary database experiencing connection timeouts',
      type: IncidentType.DATABASE,
      severity: IncidentSeverity.High
    },
    {
      title: 'API Gateway high latency',
      description: 'Response times exceeding 5 seconds for API endpoints',
      type: IncidentType.PERFORMANCE,
      severity: IncidentSeverity.Medium
    },
    {
      title: 'Security vulnerability detected',
      description: 'Critical CVE found in dependency package',
      type: IncidentType.SECURITY,
      severity: IncidentSeverity.Critical
    },
    {
      title: 'Kubernetes pod crashes',
      description: 'Multiple pod restarts in production cluster',
      type: IncidentType.INFRASTRUCTURE,
      severity: IncidentSeverity.High
    },
    {
      title: 'Payment service outage',
      description: 'Payment processing service returning 503 errors',
      type: IncidentType.SERVICE,
      severity: IncidentSeverity.Critical
    },
    {
      title: 'Network connectivity issues',
      description: 'Intermittent packet loss between data centers',
      type: IncidentType.NETWORK,
      severity: IncidentSeverity.Medium
    },
    {
      title: 'Storage capacity warning',
      description: 'Primary storage cluster at 85% capacity',
      type: IncidentType.INFRASTRUCTURE,
      severity: IncidentSeverity.Low
    },
    {
      title: 'Authentication service degraded',
      description: 'OAuth provider experiencing intermittent failures',
      type: IncidentType.SERVICE,
      severity: IncidentSeverity.High
    },
    {
      title: 'Memory leak detected',
      description: 'Application server memory usage continuously increasing',
      type: IncidentType.PERFORMANCE,
      severity: IncidentSeverity.Medium
    },
    {
      title: 'SSL certificate expiring',
      description: 'Production SSL certificate expires in 7 days',
      type: IncidentType.SECURITY,
      severity: IncidentSeverity.Low
    }
  ];

  return incidentTemplates.map((template, index) => {
    const createdAt = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000);
    const isResolved = Math.random() > 0.3;
    const resolvedAt = isResolved ? new Date(createdAt.getTime() + Math.random() * 24 * 60 * 60 * 1000) : undefined;

    return {
      id: uuidv4(),
      title: template.title,
      description: template.description,
      type: template.type,
      severity: template.severity,
      status: isResolved ? IncidentStatus.Resolved : statuses[Math.floor(Math.random() * 3)],
      affectedPortals: [uuidv4()],
      affectedServices: [`service-${index}`, `service-${index + 10}`],
      impactedUsers: Math.floor(Math.random() * 1000),
      assignee: uuidv4(),
      team: uuidv4(),
      reportedBy: uuidv4(),
      createdAt,
      updatedAt: new Date(),
      resolvedAt,
      acknowledgedAt: isResolved || Math.random() > 0.5 ? new Date(createdAt.getTime() + Math.random() * 60 * 60 * 1000) : undefined,
      rootCause: isResolved ? 'Configuration issue in production environment' : undefined,
      resolution: isResolved ? 'Applied configuration patch and restarted services' : undefined,
      postmortemUrl: isResolved && Math.random() > 0.5 ? `https://wiki.internal/postmortem/${uuidv4()}` : undefined,
      tags: ['production', 'critical', 'automated-detection'].slice(0, Math.floor(Math.random() * 3) + 1),
      timeline: [
        {
          id: uuidv4(),
          timestamp: createdAt,
          action: 'Incident created',
          description: 'Automated monitoring detected the issue',
          performedBy: uuidv4()
        }
      ],
      metrics: {
        mttr: isResolved ? Math.floor(Math.random() * 120) : undefined, // minutes
        mtbf: Math.floor(Math.random() * 10000), // minutes
        impactDuration: isResolved ? Math.floor(Math.random() * 240) : undefined, // minutes
        severityChanges: Math.floor(Math.random() * 3)
      },
      notifications: {
        emailSent: true,
        slackSent: true,
        smsSent: template.severity === IncidentSeverity.Critical,
        teamsNotified: [uuidv4()]
      },
      relatedIncidents: index > 0 ? [uuidv4()] : [],
      isPublic: Math.random() > 0.7,
      createdBy: uuidv4(),
      updatedBy: uuidv4()
    };
  });
};

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
  setError: (error: string | null) => void;

  // Initialize
  initialize: () => void;
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
            acknowledged: incidents.filter(i => i.status === IncidentStatus.Acknowledged).length,
            resolved: incidents.filter(i => i.status === IncidentStatus.Resolved).length,
            closed: incidents.filter(i => i.status === IncidentStatus.Closed).length,
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
          set(state => {
            state.isLoading = true;
            state.error = null;
          });

          try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));

            // In real app, would fetch from API
            // const response = await fetch('/api/incidents');
            // const incidents = await response.json();

            set(state => {
              state.isLoading = false;
            });
          } catch (error) {
            set(state => {
              state.error = error instanceof Error ? error.message : 'Failed to sync incidents';
              state.isLoading = false;
            });
          }
        },

        setError: (error) => set(state => {
          state.error = error;
        }),

        initialize: () => {
          const { incidents } = get();
          if (incidents.length === 0) {
            set(state => {
              state.incidents = generateMockIncidents();
            });
          }
        },

        // Aliases for App.tsx compatibility
        initializeIncidents: () => {
          get().initialize();
        },

        startIncidentSimulation: () => {
          // Simulation can be added later
          // Return cleanup function
          return () => {
            // In a real app, we'd clear intervals here
          };
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