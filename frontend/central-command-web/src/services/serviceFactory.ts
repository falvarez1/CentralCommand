import type { AxiosInstance } from 'axios';
import { apiClient } from '../lib/api/client';
import {
  createPortalService,
  createIncidentService,
  createStatisticsService,
  type IPortalService,
  type IIncidentService,
  type IStatisticsService
} from './index';

/**
 * Service factory configuration
 */
export interface IServiceFactoryConfig {
  apiClient?: AxiosInstance;
}

/**
 * Container for all application services
 */
export interface IServiceContainer {
  portalService: IPortalService;
  incidentService: IIncidentService;
  statisticsService: IStatisticsService;
}

/**
 * Factory function to create all services with dependency injection
 * @param config - Configuration for service creation
 * @returns Container with all service instances
 */
export function createServiceContainer(config?: IServiceFactoryConfig): IServiceContainer {
  const client = config?.apiClient || apiClient;

  return {
    portalService: createPortalService(client),
    incidentService: createIncidentService(client),
    statisticsService: createStatisticsService(client)
  };
}

/**
 * Default service container using the default API client
 * Note: This should only be used for backwards compatibility or simple cases.
 * For proper dependency injection, use createServiceContainer() or ServiceProvider.
 */
export const defaultServices = createServiceContainer();