// Re-export from stats.types for backward compatibility
export * from './stats.types';

// Additional service response types
export type StatisticsResponse = import('./stats.types').StatisticsResponse;
export type SystemStatsResponse = import('./stats.types').SystemStats;
export type PortalStatsResponse = import('./stats.types').StatisticsResponse['portalStats'];
export type IncidentStatsResponse = import('./stats.types').StatisticsResponse['incidentStats'];
export type SparklineDataResponse = import('./stats.types').SparklineDataResponse;