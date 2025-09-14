/**
 * Central export file for all type definitions
 * @module types
 */

// Portal types
export * from './portal.types';

// UI types (includes ViewMode)
export enum ViewMode {
  GRID = 'grid',
  LIST = 'list',
  DASHBOARD = 'dashboard'
}

export enum Theme {
  LIGHT = 'light',
  DARK = 'dark',
  AUTO = 'auto'
}

// Incident types
export * from './incident.types';

// Stats and metrics types
export * from './stats.types';

// Command palette types
export * from './command.types';

// Notification types
export * from './notification.types';

// User and authentication types
export * from './user.types';

// API and networking types
export * from './api.types';


