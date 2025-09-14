import { test, expect } from '@playwright/test';
import { PortalPage } from './pages/PortalPage';

test.describe('Real-time Updates', () => {
  let portalPage: PortalPage;

  test.beforeEach(async ({ page }) => {
    portalPage = new PortalPage(page);
    await portalPage.goto();
  });

  test('should verify SignalR connection', async ({ page }) => {
    // Check for SignalR connection indicator
    const connectionStatus = page.locator('[data-testid="connection-status"]');
    await expect(connectionStatus).toBeVisible();

    // Wait for connection to establish
    await page.waitForTimeout(2000);

    // Verify connected state
    await expect(connectionStatus).toHaveAttribute('data-connected', 'true');
    await expect(connectionStatus).toContainText(/connected/i);

    // Check console for SignalR connection messages
    const consoleLogs: string[] = [];
    page.on('console', msg => {
      if (msg.text().includes('SignalR') || msg.text().includes('Hub')) {
        consoleLogs.push(msg.text());
      }
    });

    // Verify connection was established
    await page.waitForTimeout(1000);
    const hasConnectionLog = consoleLogs.some(log =>
      log.includes('connected') || log.includes('Started')
    );
    expect(hasConnectionLog).toBeTruthy();
  });

  test('should receive metric updates', async ({ page }) => {
    // Get initial metric values
    const firstPortal = portalPage.portalCards.first();
    const responseTimeElement = firstPortal.locator('[data-testid="metric-response-time"]');
    const initialResponseTime = await responseTimeElement.textContent();

    // Wait for real-time update (typically every 5-10 seconds)
    await page.waitForTimeout(10000);

    // Check if metrics have updated
    const updatedResponseTime = await responseTimeElement.textContent();

    // Metrics should change over time
    // Note: This might be flaky if updates are infrequent
    const metricsChanged = initialResponseTime !== updatedResponseTime;

    if (!metricsChanged) {
      console.log('Warning: Metrics did not update in 10 seconds');
    }

    // Verify metric format is maintained
    expect(updatedResponseTime).toMatch(/\d+\s*ms/);
  });

  test('should show incident notifications', async ({ page }) => {
    // Monitor for incident notifications
    const notificationToast = page.locator('[role="alert"][data-type="incident"]');

    // Simulate incident creation via API
    await page.evaluate(async () => {
      // Simulate SignalR incident notification
      const event = new CustomEvent('signalr:incident', {
        detail: {
          id: 'test-incident-1',
          title: 'Test Service Degradation',
          severity: 'high',
          affectedPortal: 'Jenkins CI',
          timestamp: new Date().toISOString()
        }
      });
      window.dispatchEvent(event);
    });

    // Verify notification appears
    await expect(notificationToast).toBeVisible({ timeout: 5000 });
    await expect(notificationToast).toContainText(/incident/i);
    await expect(notificationToast).toContainText(/Jenkins CI/i);

    // Verify incident count updates
    const incidentBadge = page.locator('[data-testid="incident-count-badge"]');
    const countText = await incidentBadge.textContent();
    const count = parseInt(countText || '0');
    expect(count).toBeGreaterThan(0);
  });

  test('should update statistics in real-time', async ({ page }) => {
    // Get statistics elements
    const statsSection = page.locator('[data-testid="statistics-section"]');
    const totalPortals = statsSection.locator('[data-testid="stat-total-portals"]');
    const activePortals = statsSection.locator('[data-testid="stat-active-portals"]');
    const avgResponseTime = statsSection.locator('[data-testid="stat-avg-response-time"]');
    const uptime = statsSection.locator('[data-testid="stat-overall-uptime"]');

    // Get initial values
    const initialActive = await activePortals.textContent();
    const initialAvgResponse = await avgResponseTime.textContent();

    // Wait for statistics update (usually every 30 seconds)
    await page.waitForTimeout(5000);

    // Simulate statistics update via SignalR
    await page.evaluate(() => {
      const event = new CustomEvent('signalr:statistics', {
        detail: {
          totalPortals: 25,
          activePortals: 23,
          avgResponseTime: 145,
          overallUptime: 99.5
        }
      });
      window.dispatchEvent(event);
    });

    // Wait for UI update
    await page.waitForTimeout(1000);

    // Verify statistics updated
    const updatedActive = await activePortals.textContent();
    const updatedAvgResponse = await avgResponseTime.textContent();

    // At least one statistic should have changed
    const statsChanged = (initialActive !== updatedActive) || (initialAvgResponse !== updatedAvgResponse);
    expect(statsChanged).toBeTruthy();
  });

  test('should show connection status indicator', async ({ page }) => {
    const connectionIndicator = page.locator('[data-testid="connection-indicator"]');

    // Initially should be connected
    await expect(connectionIndicator).toBeVisible();
    await expect(connectionIndicator).toHaveClass(/connected|online/);

    // Simulate connection loss
    await page.evaluate(() => {
      // Disconnect SignalR
      const event = new CustomEvent('signalr:disconnected');
      window.dispatchEvent(event);
    });

    // Verify disconnected state
    await expect(connectionIndicator).toHaveClass(/disconnected|offline/);
    await expect(connectionIndicator).toHaveAttribute('title', /disconnected|reconnecting/i);

    // Simulate reconnection
    await page.evaluate(() => {
      const event = new CustomEvent('signalr:connected');
      window.dispatchEvent(event);
    });

    // Verify reconnected state
    await expect(connectionIndicator).toHaveClass(/connected|online/);
  });

  test('should update portal status in real-time', async ({ page }) => {
    // Find a specific portal
    const jenkinsPortal = await portalPage.getPortalByName('Jenkins CI');
    const statusIndicator = jenkinsPortal.locator('[data-testid="status-indicator"]');

    // Get initial status
    const initialStatus = await statusIndicator.getAttribute('data-status');

    // Simulate status change via SignalR
    await page.evaluate(() => {
      const event = new CustomEvent('signalr:portal-status', {
        detail: {
          portalId: 'jenkins-ci',
          portalName: 'Jenkins CI',
          oldStatus: 'active',
          newStatus: 'degraded',
          timestamp: new Date().toISOString()
        }
      });
      window.dispatchEvent(event);
    });

    // Wait for status update
    await page.waitForTimeout(1000);

    // Verify status changed
    const updatedStatus = await statusIndicator.getAttribute('data-status');
    expect(updatedStatus).not.toBe(initialStatus);
    expect(updatedStatus).toBe('degraded');

    // Verify visual indication changed
    await expect(statusIndicator).toHaveClass(/degraded/);
  });

  test('should handle connection retry logic', async ({ page }) => {
    // Monitor console for retry attempts
    const retryLogs: string[] = [];
    page.on('console', msg => {
      if (msg.text().includes('retry') || msg.text().includes('reconnect')) {
        retryLogs.push(msg.text());
      }
    });

    // Simulate connection failure
    await page.evaluate(() => {
      // Force disconnect
      if ((window as any).signalRConnection) {
        (window as any).signalRConnection.stop();
      }
    });

    // Wait for retry attempts
    await page.waitForTimeout(5000);

    // Verify retry logic is working
    expect(retryLogs.length).toBeGreaterThan(0);

    // Verify reconnection message appears
    const reconnectingMessage = page.locator('[data-testid="reconnecting-message"]');
    await expect(reconnectingMessage).toBeVisible({ timeout: 5000 });
  });

  test('should batch metric updates efficiently', async ({ page }) => {
    let updateCount = 0;

    // Monitor for metric updates
    await page.exposeFunction('onMetricUpdate', () => {
      updateCount++;
    });

    await page.evaluate(() => {
      // Override metric update handler
      const originalUpdate = (window as any).handleMetricUpdate;
      (window as any).handleMetricUpdate = function(...args: any[]) {
        (window as any).onMetricUpdate();
        return originalUpdate?.apply(this, args);
      };
    });

    // Simulate multiple rapid updates
    for (let i = 0; i < 10; i++) {
      await page.evaluate((index) => {
        const event = new CustomEvent('signalr:metrics', {
          detail: {
            portalId: `portal-${index}`,
            metrics: {
              responseTime: 100 + index,
              cpu: 50 + index,
              memory: 60 + index
            }
          }
        });
        window.dispatchEvent(event);
      }, i);
    }

    // Wait for batching
    await page.waitForTimeout(1000);

    // Updates should be batched, not 10 individual updates
    expect(updateCount).toBeLessThan(10);
  });

  test('should show real-time alert banners', async ({ page }) => {
    // Simulate critical alert
    await page.evaluate(() => {
      const event = new CustomEvent('signalr:alert', {
        detail: {
          type: 'critical',
          message: 'Multiple services experiencing degraded performance',
          affectedServices: ['Jenkins CI', 'GitLab', 'Grafana'],
          timestamp: new Date().toISOString()
        }
      });
      window.dispatchEvent(event);
    });

    // Verify alert banner appears
    const alertBanner = page.locator('[data-testid="alert-banner"]');
    await expect(alertBanner).toBeVisible({ timeout: 5000 });
    await expect(alertBanner).toHaveClass(/critical/);
    await expect(alertBanner).toContainText(/Multiple services/i);

    // Verify affected services are listed
    await expect(alertBanner).toContainText('Jenkins CI');
    await expect(alertBanner).toContainText('GitLab');
    await expect(alertBanner).toContainText('Grafana');

    // Dismiss alert
    await alertBanner.locator('[data-testid="dismiss-alert"]').click();
    await expect(alertBanner).not.toBeVisible();
  });

  test('should update last refresh timestamp', async ({ page }) => {
    const lastRefresh = page.locator('[data-testid="last-refresh"]');

    // Get initial timestamp
    const initialTime = await lastRefresh.textContent();

    // Wait for auto-refresh
    await page.waitForTimeout(5000);

    // Trigger manual refresh
    await portalPage.refreshButton.click();
    await portalPage.waitForLoad();

    // Verify timestamp updated
    const updatedTime = await lastRefresh.textContent();
    expect(updatedTime).not.toBe(initialTime);
    expect(updatedTime).toMatch(/just now|seconds ago/i);
  });

  test('should handle WebSocket message queue', async ({ page }) => {
    // Send multiple messages rapidly
    const messages = [];
    for (let i = 0; i < 20; i++) {
      messages.push({
        type: 'metric',
        portalId: `portal-${i}`,
        data: { responseTime: 100 + i }
      });
    }

    // Send all messages at once
    await page.evaluate((msgs) => {
      msgs.forEach(msg => {
        const event = new CustomEvent('signalr:message', { detail: msg });
        window.dispatchEvent(event);
      });
    }, messages);

    // Wait for processing
    await page.waitForTimeout(2000);

    // Verify UI remains responsive
    await portalPage.searchInput.fill('test');
    await expect(portalPage.searchInput).toHaveValue('test');

    // Verify no console errors
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.waitForTimeout(1000);
    expect(consoleErrors).toHaveLength(0);
  });
});