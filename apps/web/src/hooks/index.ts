/**
 * Central export file for all custom hooks
 * @module hooks
 */

// Portal hooks
export {
  usePortals,
  usePortal,
  usePortalBulkOperations
} from './usePortals';

// Real-time metrics hooks
export {
  useRealtimeMetrics,
  useMetricData,
  useMetricComparison,
  usePerformanceBenchmarks,
  useWebSocketSimulation
} from './useRealtimeMetrics';

// Notification hooks
export {
  useNotifications,
  useBrowserNotifications,
  useNotificationPreferences,
  useNotificationSound
} from './useNotifications';

// Command palette hooks
export {
  useCommandPalette,
  useRegisterCommand,
  useCommandCategories,
  useCommandHistory,
  usePinnedCommands
} from './useCommandPalette';