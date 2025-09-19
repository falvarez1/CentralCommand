import { v4 as uuidv4 } from 'uuid';
import {
  Incident,
  CreateIncidentInput,
  IncidentStatus
} from '../types/incident.types';

/**
 * Creates a new Incident entity from input
 */
export function createIncident(input: CreateIncidentInput): Incident {
  const now = new Date();
  const userId = input.reportedBy || uuidv4(); // Would come from auth context in production

  return {
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
    reportedBy: userId,
    createdAt: now,
    updatedAt: now,
    resolvedAt: undefined,
    acknowledgedAt: undefined,
    rootCause: undefined,
    resolution: undefined,
    postmortemUrl: undefined,
    tags: input.tags || [],
    timeline: [
      {
        id: uuidv4(),
        timestamp: now,
        action: 'Incident created',
        description: input.description,
        performedBy: userId
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
    createdBy: userId,
    updatedBy: userId
  };
}