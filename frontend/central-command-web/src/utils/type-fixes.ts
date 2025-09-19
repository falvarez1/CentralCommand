/**
 * Type fixes and compatibility helpers
 */

// Button variant mapping for compatibility
export type ButtonVariantCompat = 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';

export function mapNotificationVariantToButton(variant: string): ButtonVariantCompat {
  switch (variant) {
    case 'warning':
      return 'destructive';
    case 'success':
      return 'secondary';
    default:
      return variant as ButtonVariantCompat;
  }
}

// System stats compatibility
export interface SystemStatsComplete {
  // Portal statistics
  totalPortals: number;
  operationalPortals: number;
  activePortals: number;
  inactivePortals: number;

  // Health statistics
  healthScore: number;
  systemUptime: number;
  averageResponseTime: number;

  // Performance statistics
  totalRequests: number;
  totalErrors: number;
  errorRate: number;
  throughput: number;

  // Resource statistics
  averageCpu: number;
  averageMemory: number;
  diskUsage: number;
  networkLatency: number;

  // Incident statistics
  activeIncidents: number;
  resolvedToday: number;
  mttr: number;
  mtbf: number;

  // User statistics
  activeUsers: number;
  totalUsers: number;
  concurrentSessions: number;

  // Time-based statistics
  lastUpdated: Date;
  timeRange: any;
  dataQuality: number;

  // Additional fields for compatibility
  avgResponseTime?: number;
  incidents?: any[];
}

// Create default system stats
export function createDefaultSystemStats(): SystemStatsComplete {
  return {
    totalPortals: 0,
    operationalPortals: 0,
    activePortals: 0,
    inactivePortals: 0,
    healthScore: 100,
    systemUptime: 100,
    averageResponseTime: 0,
    totalRequests: 0,
    totalErrors: 0,
    errorRate: 0,
    throughput: 0,
    averageCpu: 0,
    averageMemory: 0,
    diskUsage: 0,
    networkLatency: 0,
    activeIncidents: 0,
    resolvedToday: 0,
    mttr: 0,
    mtbf: 0,
    activeUsers: 0,
    totalUsers: 0,
    concurrentSessions: 0,
    lastUpdated: new Date(),
    timeRange: '24h',
    dataQuality: 100,
    avgResponseTime: 0,
    incidents: []
  };
}

// Notification preferences extended
export interface UIPreferencesExtended {
  compactMode: boolean;
  showTutorials: boolean;
  autoRefresh: boolean;
  refreshInterval: number;
  soundEnabled: boolean;
  keyboardShortcutsEnabled: boolean;
  animations: boolean;
  defaultView: any;
  defaultCategory: any;
  defaultTimeRange: any;

  // Additional notification preferences
  pushNotifications?: boolean;
  emailNotifications?: boolean;
}

// Type guards
export function hasActionUrl(obj: any): obj is { actionUrl: string } {
  return typeof obj?.actionUrl === 'string';
}

export function hasActionLabel(obj: any): obj is { actionLabel: string } {
  return typeof obj?.actionLabel === 'string';
}

// Enum converters for legacy compatibility
export function convertToNewEnumFormat(value: string, enumType: 'status' | 'severity' | 'priority'): string {
  if (!value) return value;

  // Convert from lowercase/snake_case to PascalCase
  if (enumType === 'status') {
    const statusMap: Record<string, string> = {
      'operational': 'Operational',
      'degraded': 'Degraded',
      'maintenance': 'Maintenance',
      'outage': 'Outage',
      'resolved': 'Resolved',
      'open': 'Open',
      'in_progress': 'InProgress',
      'closed': 'Closed'
    };
    return statusMap[value.toLowerCase()] || value;
  }

  if (enumType === 'severity' || enumType === 'priority') {
    const severityMap: Record<string, string> = {
      'critical': 'Critical',
      'high': 'High',
      'medium': 'Medium',
      'low': 'Low'
    };
    return severityMap[value.toLowerCase()] || value;
  }

  return value;
}