/**
 * Test Data Generators for Playwright Tests
 */

export interface TestPortal {
  id: string;
  name: string;
  url: string;
  category: string;
  status: 'operational' | 'degraded' | 'maintenance' | 'outage';
  responseTime: number;
  uptime: number;
  cpu: number;
  memory: number;
  requests: number;
  errors: number;
  isFavorite: boolean;
}

export interface TestIncident {
  id: string;
  title: string;
  severity: 'critical' | 'major' | 'minor' | 'informational';
  timestamp: string;
  status: 'active' | 'investigating' | 'resolved';
  affectedServices: string[];
  description: string;
}

export interface TestNotification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: string;
}

// Generate random test portal
export function generatePortal(overrides?: Partial<TestPortal>): TestPortal {
  const statuses: TestPortal['status'][] = ['operational', 'degraded', 'maintenance', 'outage'];
  const categories = ['Core', 'Analytics', 'Support', 'Infrastructure'];

  return {
    id: `portal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name: `Test Portal ${Math.floor(Math.random() * 1000)}`,
    url: `https://test-portal-${Math.random().toString(36).substr(2, 9)}.internal`,
    category: categories[Math.floor(Math.random() * categories.length)],
    status: statuses[Math.floor(Math.random() * statuses.length)],
    responseTime: Math.floor(Math.random() * 500) + 50,
    uptime: 95 + Math.random() * 4.9,
    cpu: Math.floor(Math.random() * 100),
    memory: Math.floor(Math.random() * 100),
    requests: Math.floor(Math.random() * 10000),
    errors: Math.floor(Math.random() * 100),
    isFavorite: Math.random() > 0.7,
    ...overrides
  };
}

// Generate multiple test portals
export function generatePortals(count: number): TestPortal[] {
  return Array.from({ length: count }, () => generatePortal());
}

// Generate test incident
export function generateIncident(overrides?: Partial<TestIncident>): TestIncident {
  const severities: TestIncident['severity'][] = ['critical', 'major', 'minor', 'informational'];
  const statuses: TestIncident['status'][] = ['active', 'investigating', 'resolved'];

  return {
    id: `incident-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    title: `Test Incident ${Math.floor(Math.random() * 1000)}`,
    severity: severities[Math.floor(Math.random() * severities.length)],
    timestamp: new Date(Date.now() - Math.random() * 86400000).toISOString(),
    status: statuses[Math.floor(Math.random() * statuses.length)],
    affectedServices: ['Service A', 'Service B', 'Service C'].slice(0, Math.floor(Math.random() * 3) + 1),
    description: 'This is a test incident description for automated testing.',
    ...overrides
  };
}

// Generate multiple test incidents
export function generateIncidents(count: number): TestIncident[] {
  return Array.from({ length: count }, () => generateIncident());
}

// Generate test notification
export function generateNotification(overrides?: Partial<TestNotification>): TestNotification {
  const types: TestNotification['type'][] = ['success', 'error', 'warning', 'info'];

  return {
    id: `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type: types[Math.floor(Math.random() * types.length)],
    title: `Test Notification ${Math.floor(Math.random() * 1000)}`,
    message: 'This is a test notification message for automated testing.',
    timestamp: new Date().toISOString(),
    ...overrides
  };
}

// Mock API responses
export const mockResponses = {
  portals: generatePortals(12),
  incidents: generateIncidents(5),
  notifications: [
    generateNotification({ type: 'success', title: 'Deployment Successful' }),
    generateNotification({ type: 'error', title: 'Service Error' }),
    generateNotification({ type: 'warning', title: 'High CPU Usage' }),
    generateNotification({ type: 'info', title: 'Maintenance Scheduled' })
  ]
};

// Test user credentials
export const testUsers = {
  admin: {
    username: 'admin@test.com',
    password: 'Admin123!',
    role: 'admin'
  },
  user: {
    username: 'user@test.com',
    password: 'User123!',
    role: 'user'
  },
  viewer: {
    username: 'viewer@test.com',
    password: 'Viewer123!',
    role: 'viewer'
  }
};

// Common test search terms
export const searchTerms = [
  'analytics',
  'admin',
  'portal',
  'service',
  'dashboard',
  'monitoring',
  'api',
  'test'
];

// Command palette commands for testing
export const testCommands = [
  { name: 'Deploy All Services', shortcut: 'Ctrl+D' },
  { name: 'Run Health Check', shortcut: 'Ctrl+H' },
  { name: 'View Incidents', shortcut: 'Ctrl+I' },
  { name: 'Emergency Shutdown', shortcut: 'Ctrl+E' },
  { name: 'Export Data', shortcut: 'Ctrl+X' }
];