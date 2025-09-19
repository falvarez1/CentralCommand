import { v4 as uuidv4 } from 'uuid';
import {
  Portal,
  CreatePortalInput,
  PortalEnvironment,
  PortalPriority,
  AuthType
} from '../types/portal.types';

/**
 * Creates a new Portal entity from input
 */
export function createPortal(input: CreatePortalInput): Portal {
  const now = new Date();
  const userId = uuidv4(); // Would come from auth context in production

  return {
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
    lastChecked: now,
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
    createdAt: now,
    updatedAt: now,
    createdBy: userId,
    updatedBy: userId
  };
}