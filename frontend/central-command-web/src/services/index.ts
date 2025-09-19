// Export all service interfaces
export type {
  IPortalService,
  IIncidentService,
  IStatisticsService
} from './interfaces';

// Export service classes and factory functions
export { PortalService, createPortalService } from './portal.service';
export { IncidentService, createIncidentService } from './incident.service';
export { StatisticsService, createStatisticsService } from './statistics.service';