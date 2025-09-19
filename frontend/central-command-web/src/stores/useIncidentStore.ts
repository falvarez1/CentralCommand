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

interface IncidentState {
  // State
  incidents: Incident[];
  filter: IncidentFilter;
  selectedIncident: Incident | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  setIncidents: (incidents: Incident[]) => void;
  createIncident: (incident: Incident) => void;
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

  // State management
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
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


        // Actions
        setIncidents: (incidents) => set(state => {
          state.incidents = incidents;
        }),

        createIncident: (incident) => set(state => {
          state.incidents.push(incident);
        }),

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
          }
        }),

        escalateIncident: (id) => set(state => {
          const incident = state.incidents.find(i => i.id === id);
          if (incident) {
            const severityOrder = [IncidentSeverity.Low, IncidentSeverity.Medium, IncidentSeverity.High, IncidentSeverity.Critical];
            const currentIndex = severityOrder.indexOf(incident.severity);
            if (currentIndex < severityOrder.length - 1) {
              incident.severity = severityOrder[currentIndex + 1];
              incident.metrics.severityChanges++;
              incident.updatedAt = new Date();
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
              performedBy: uuidv4()
            });
            incident.updatedAt = new Date();
          }
        }),

        assignIncident: (id, assigneeId) => set(state => {
          const incident = state.incidents.find(i => i.id === id);
          if (incident) {
            incident.assignee = assigneeId;
            incident.updatedAt = new Date();
          }
        }),

        assignToTeam: (id, teamId) => set(state => {
          const incident = state.incidents.find(i => i.id === id);
          if (incident) {
            incident.team = teamId;
            incident.updatedAt = new Date();
          }
        }),

        linkIncidents: (id, relatedIds) => set(state => {
          const incident = state.incidents.find(i => i.id === id);
          if (incident) {
            incident.relatedIncidents = [...new Set([...incident.relatedIncidents, ...relatedIds])];
            incident.updatedAt = new Date();
          }
        }),

        linkToPortal: (incidentId, portalId) => set(state => {
          const incident = state.incidents.find(i => i.id === incidentId);
          if (incident && !incident.affectedPortals.includes(portalId)) {
            incident.affectedPortals.push(portalId);
            incident.updatedAt = new Date();
          }
        }),


        setError: (error) => set(state => {
          state.error = error;
        }),

        setLoading: (loading) => set(state => {
          state.isLoading = loading;
        })
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