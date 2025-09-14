import { Page } from '@playwright/test';

/**
 * Wait for all network requests to complete
 */
export async function waitForNetworkIdle(page: Page, timeout = 5000) {
  await page.waitForLoadState('networkidle', { timeout });
}

/**
 * Wait for animations to complete
 */
export async function waitForAnimations(page: Page, timeout = 500) {
  await page.waitForTimeout(timeout);
}

/**
 * Check for console errors
 */
export async function checkConsoleErrors(page: Page): Promise<string[]> {
  const errors: string[] = [];

  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });

  return errors;
}

/**
 * Mock API response
 */
export async function mockApiResponse(
  page: Page,
  url: string,
  response: any,
  status = 200
) {
  await page.route(url, route => {
    route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify(response),
    });
  });
}

/**
 * Generate mock portal data
 */
export function generateMockPortal(overrides?: Partial<any>) {
  return {
    id: `portal-${Date.now()}`,
    name: `Test Portal ${Date.now()}`,
    url: 'https://test.example.com',
    category: 'Engineering',
    status: 'active',
    description: 'Test portal description',
    metrics: {
      responseTime: 150,
      uptime: 99.9,
      cpu: 45,
      memory: 60,
    },
    ...overrides,
  };
}

/**
 * Generate mock incident data
 */
export function generateMockIncident(overrides?: Partial<any>) {
  return {
    id: `incident-${Date.now()}`,
    title: `Test Incident ${Date.now()}`,
    description: 'Test incident description',
    severity: 'medium',
    status: 'open',
    affectedPortal: 'Test Portal',
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Setup API mocks for testing
 */
export async function setupApiMocks(page: Page) {
  // Mock portals endpoint
  await mockApiResponse(page, '**/api/portals', [
    generateMockPortal({ name: 'Jenkins CI', category: 'Engineering' }),
    generateMockPortal({ name: 'GitLab', category: 'Engineering' }),
    generateMockPortal({ name: 'Grafana', category: 'Analytics' }),
    generateMockPortal({ name: 'Kibana', category: 'Analytics' }),
    generateMockPortal({ name: 'Prometheus', category: 'Operations' }),
  ]);

  // Mock incidents endpoint
  await mockApiResponse(page, '**/api/incidents', [
    generateMockIncident({ severity: 'critical', title: 'Database Connection Failed' }),
    generateMockIncident({ severity: 'high', title: 'API Response Degradation' }),
    generateMockIncident({ severity: 'medium', title: 'Memory Usage High' }),
  ]);

  // Mock statistics endpoint
  await mockApiResponse(page, '**/api/statistics', {
    totalPortals: 25,
    activePortals: 23,
    degradedPortals: 2,
    avgResponseTime: 145,
    overallUptime: 99.5,
  });
}

/**
 * Login helper (if authentication is required)
 */
export async function login(page: Page, username: string, password: string) {
  await page.goto('/login');
  await page.fill('[data-testid="username"]', username);
  await page.fill('[data-testid="password"]', password);
  await page.click('[data-testid="login-button"]');
  await page.waitForURL('/');
}

/**
 * Take a screenshot with timestamp
 */
export async function takeScreenshot(page: Page, name: string) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  await page.screenshot({
    path: `screenshots/${name}-${timestamp}.png`,
    fullPage: true,
  });
}

/**
 * Wait for SignalR connection
 */
export async function waitForSignalRConnection(page: Page, timeout = 10000) {
  await page.waitForFunction(
    () => {
      return (window as any).signalRConnection?.state === 'Connected';
    },
    { timeout }
  );
}

/**
 * Simulate SignalR message
 */
export async function simulateSignalRMessage(page: Page, type: string, data: any) {
  await page.evaluate(({ messageType, messageData }) => {
    const event = new CustomEvent(`signalr:${messageType}`, {
      detail: messageData,
    });
    window.dispatchEvent(event);
  }, { messageType: type, messageData: data });
}

/**
 * Get portal metrics
 */
export async function getPortalMetrics(page: Page, portalName: string) {
  const portal = page.locator(`[data-testid="portal-card"]:has-text("${portalName}")`);

  return {
    responseTime: await portal.locator('[data-testid="metric-response-time"]').textContent(),
    uptime: await portal.locator('[data-testid="metric-uptime"]').textContent(),
    cpu: await portal.locator('[data-testid="metric-cpu"]').textContent(),
    memory: await portal.locator('[data-testid="metric-memory"]').textContent(),
  };
}

/**
 * Verify accessibility
 */
export async function checkAccessibility(page: Page) {
  // Check for ARIA labels
  const buttons = await page.locator('button:not([aria-label]):not([aria-labelledby])').count();
  const inputs = await page.locator('input:not([aria-label]):not([aria-labelledby])').count();
  const images = await page.locator('img:not([alt])').count();

  return {
    unlabeledButtons: buttons,
    unlabeledInputs: inputs,
    imagesWithoutAlt: images,
  };
}

/**
 * Wait for debounce
 */
export async function waitForDebounce(page: Page, ms = 500) {
  await page.waitForTimeout(ms);
}

/**
 * Clear all filters
 */
export async function clearAllFilters(page: Page) {
  const clearButton = page.locator('[data-testid="clear-filters"]');
  if (await clearButton.isVisible()) {
    await clearButton.click();
    await waitForNetworkIdle(page);
  }
}

/**
 * Get current filter state
 */
export async function getFilterState(page: Page) {
  return {
    search: await page.locator('[data-testid="search-input"]').inputValue(),
    category: await page.locator('[data-testid="category-filter"]').inputValue(),
    status: await page.locator('[data-testid="status-filter"]').inputValue(),
  };
}

/**
 * Verify notification appears
 */
export async function verifyNotification(page: Page, text: string, type?: 'success' | 'error' | 'info') {
  const notification = page.locator('[role="status"], [role="alert"]').filter({ hasText: text });
  await notification.waitFor({ state: 'visible', timeout: 5000 });

  if (type) {
    const classes = await notification.getAttribute('class');
    return classes?.includes(type);
  }

  return true;
}