/**
 * E2E Tests - Notifications
 */

import { test, expect } from '@playwright/test';
import { DashboardPage, NotificationCenter } from '../utils/page-objects';
import { waitForAnimations, waitForNetworkIdle } from '../utils/helpers';
import { generateNotification } from '../utils/test-data';

test.describe('Notifications E2E', () => {
  let dashboard: DashboardPage;
  let notificationCenter: NotificationCenter;

  test.beforeEach(async ({ page }) => {
    dashboard = new DashboardPage(page);
    notificationCenter = new NotificationCenter(page);
    await dashboard.navigateTo();
    await waitForNetworkIdle(page);
  });

  test('show success notification', async ({ page }) => {
    // Trigger success notification
    await page.evaluate(() => {
      const event = new CustomEvent('notification:show', {
        detail: {
          type: 'success',
          title: 'Operation Successful',
          message: 'Your changes have been saved.'
        }
      });
      window.dispatchEvent(event);
    });

    // Verify notification appears
    const notification = page.locator('[role="status"]').filter({ hasText: 'Operation Successful' });
    await expect(notification).toBeVisible();

    // Verify success styling
    await expect(notification).toHaveClass(/success/);

    // Auto-dismiss after timeout
    await page.waitForTimeout(5000);
    await expect(notification).not.toBeVisible();
  });

  test('show error notification', async ({ page }) => {
    // Trigger error notification
    await page.evaluate(() => {
      const event = new CustomEvent('notification:show', {
        detail: {
          type: 'error',
          title: 'Operation Failed',
          message: 'An error occurred while processing your request.'
        }
      });
      window.dispatchEvent(event);
    });

    // Verify notification appears
    const notification = page.locator('[role="alert"]').filter({ hasText: 'Operation Failed' });
    await expect(notification).toBeVisible();

    // Verify error styling
    await expect(notification).toHaveClass(/error|danger/);

    // Error notifications should not auto-dismiss
    await page.waitForTimeout(5000);
    await expect(notification).toBeVisible();

    // Manually dismiss
    const dismissButton = notification.locator('[data-testid="dismiss-notification"]');
    await dismissButton.click();
    await waitForAnimations(page);
    await expect(notification).not.toBeVisible();
  });

  test('show warning notification', async ({ page }) => {
    // Trigger warning notification
    await page.evaluate(() => {
      const event = new CustomEvent('notification:show', {
        detail: {
          type: 'warning',
          title: 'Warning',
          message: 'This action may have unintended consequences.'
        }
      });
      window.dispatchEvent(event);
    });

    // Verify notification appears
    const notification = page.locator('[role="alert"]').filter({ hasText: 'Warning' });
    await expect(notification).toBeVisible();

    // Verify warning styling
    await expect(notification).toHaveClass(/warning/);
  });

  test('show info notification', async ({ page }) => {
    // Trigger info notification
    await page.evaluate(() => {
      const event = new CustomEvent('notification:show', {
        detail: {
          type: 'info',
          title: 'Information',
          message: 'New features are available.'
        }
      });
      window.dispatchEvent(event);
    });

    // Verify notification appears
    const notification = page.locator('[role="status"]').filter({ hasText: 'Information' });
    await expect(notification).toBeVisible();

    // Verify info styling
    await expect(notification).toHaveClass(/info/);
  });

  test('notification center', async ({ page }) => {
    // Generate multiple notifications
    const notifications = [
      { type: 'success', title: 'Deployment Complete', message: 'All services deployed' },
      { type: 'error', title: 'Build Failed', message: 'Check logs for details' },
      { type: 'warning', title: 'High Memory Usage', message: 'Service A using 85% memory' },
      { type: 'info', title: 'Maintenance Scheduled', message: 'Tomorrow at 2 AM' }
    ];

    // Trigger notifications
    for (const notif of notifications) {
      await page.evaluate((n) => {
        const event = new CustomEvent('notification:show', { detail: n });
        window.dispatchEvent(event);
      }, notif);
      await page.waitForTimeout(100);
    }

    // Open notification center
    await notificationCenter.open();

    // Verify all notifications appear
    const notificationCount = await notificationCenter.getNotificationCount();
    expect(notificationCount).toBe(notifications.length);

    // Close notification center
    await notificationCenter.close();
  });

  test('dismiss individual notification', async ({ page }) => {
    // Add notifications to center
    await page.evaluate(() => {
      for (let i = 0; i < 3; i++) {
        const event = new CustomEvent('notification:show', {
          detail: {
            type: 'info',
            title: `Notification ${i + 1}`,
            message: `Message ${i + 1}`
          }
        });
        window.dispatchEvent(event);
      }
    });

    // Open notification center
    await notificationCenter.open();

    // Get initial count
    const initialCount = await notificationCenter.getNotificationCount();
    expect(initialCount).toBe(3);

    // Dismiss first notification
    await notificationCenter.dismissNotification(0);
    await waitForAnimations(page);

    // Verify count decreased
    const newCount = await notificationCenter.getNotificationCount();
    expect(newCount).toBe(initialCount - 1);
  });

  test('clear all notifications', async ({ page }) => {
    // Add multiple notifications
    await page.evaluate(() => {
      for (let i = 0; i < 5; i++) {
        const event = new CustomEvent('notification:show', {
          detail: {
            type: 'info',
            title: `Notification ${i + 1}`,
            message: `Message ${i + 1}`
          }
        });
        window.dispatchEvent(event);
      }
    });

    // Open notification center
    await notificationCenter.open();

    // Verify notifications exist
    const initialCount = await notificationCenter.getNotificationCount();
    expect(initialCount).toBe(5);

    // Clear all
    await notificationCenter.clearAll();
    await waitForAnimations(page);

    // Verify all cleared
    const finalCount = await notificationCenter.getNotificationCount();
    expect(finalCount).toBe(0);

    // Verify empty state
    const emptyState = notificationCenter.panel.locator('[data-testid="notifications-empty"]');
    await expect(emptyState).toBeVisible();
  });

  test('mark all as read', async ({ page }) => {
    // Add unread notifications
    await page.evaluate(() => {
      for (let i = 0; i < 3; i++) {
        const event = new CustomEvent('notification:show', {
          detail: {
            type: 'info',
            title: `Unread ${i + 1}`,
            message: `Message ${i + 1}`,
            unread: true
          }
        });
        window.dispatchEvent(event);
      }
    });

    // Open notification center
    await notificationCenter.open();

    // Verify unread indicators
    const unreadIndicators = notificationCenter.panel.locator('[data-testid="unread-indicator"]');
    const unreadCount = await unreadIndicators.count();
    expect(unreadCount).toBe(3);

    // Mark all as read
    await notificationCenter.markAllAsRead();
    await waitForAnimations(page);

    // Verify no unread indicators
    const newUnreadCount = await unreadIndicators.count();
    expect(newUnreadCount).toBe(0);
  });

  test('notification badge count', async ({ page }) => {
    // Check initial badge
    const badge = dashboard.notificationButton.locator('[data-testid="notification-badge"]');
    const initialBadgeVisible = await badge.isVisible();

    // Add notifications
    await page.evaluate(() => {
      for (let i = 0; i < 3; i++) {
        const event = new CustomEvent('notification:show', {
          detail: {
            type: 'info',
            title: `Notification ${i + 1}`,
            message: `Message ${i + 1}`
          }
        });
        window.dispatchEvent(event);
      }
    });

    // Verify badge appears with count
    await expect(badge).toBeVisible();
    await expect(badge).toContainText('3');

    // Open notification center
    await notificationCenter.open();

    // Mark as read
    await notificationCenter.markAllAsRead();

    // Close center
    await notificationCenter.close();

    // Verify badge cleared
    await expect(badge).not.toBeVisible();
  });

  test('notification preferences', async ({ page }) => {
    // Open notification center
    await notificationCenter.open();

    // Open settings
    await notificationCenter.settingsButton.click();
    await waitForAnimations(page);

    // Verify preferences dialog
    const prefsDialog = page.locator('[role="dialog"][aria-label*="Preferences"]');
    await expect(prefsDialog).toBeVisible();

    // Toggle notification types
    const successToggle = prefsDialog.locator('[data-testid="pref-success"]');
    const errorToggle = prefsDialog.locator('[data-testid="pref-error"]');
    const warningToggle = prefsDialog.locator('[data-testid="pref-warning"]');
    const infoToggle = prefsDialog.locator('[data-testid="pref-info"]');

    // Disable info notifications
    await infoToggle.click();
    await waitForAnimations(page);

    // Save preferences
    await prefsDialog.getByRole('button', { name: /save/i }).click();
    await waitForAnimations(page);

    // Test that info notifications don't appear
    await page.evaluate(() => {
      const event = new CustomEvent('notification:show', {
        detail: {
          type: 'info',
          title: 'Should not appear',
          message: 'This is disabled'
        }
      });
      window.dispatchEvent(event);
    });

    // Verify info notification doesn't appear
    const infoNotification = page.locator('[role="status"]').filter({ hasText: 'Should not appear' });
    await expect(infoNotification).not.toBeVisible();

    // Test that error notifications still appear
    await page.evaluate(() => {
      const event = new CustomEvent('notification:show', {
        detail: {
          type: 'error',
          title: 'Should appear',
          message: 'Errors are enabled'
        }
      });
      window.dispatchEvent(event);
    });

    const errorNotification = page.locator('[role="alert"]').filter({ hasText: 'Should appear' });
    await expect(errorNotification).toBeVisible();
  });

  test('notification click action', async ({ page }) => {
    // Trigger notification with action
    await page.evaluate(() => {
      const event = new CustomEvent('notification:show', {
        detail: {
          type: 'info',
          title: 'New Incident',
          message: 'Click to view details',
          action: {
            label: 'View',
            url: '#incidents'
          }
        }
      });
      window.dispatchEvent(event);
    });

    // Click notification
    const notification = page.locator('[role="status"]').filter({ hasText: 'New Incident' });
    const actionButton = notification.locator('[data-testid="notification-action"]');
    await actionButton.click();
    await waitForAnimations(page);

    // Verify action executed (e.g., incidents modal opened)
    const incidentsModal = page.locator('[role="dialog"][aria-label*="Incidents"]');
    await expect(incidentsModal).toBeVisible();
  });

  test('notification sound preferences', async ({ page }) => {
    // Open notification center
    await notificationCenter.open();

    // Open settings
    await notificationCenter.settingsButton.click();
    await waitForAnimations(page);

    const prefsDialog = page.locator('[role="dialog"][aria-label*="Preferences"]');

    // Toggle sound
    const soundToggle = prefsDialog.locator('[data-testid="pref-sound"]');
    const initialSoundState = await soundToggle.isChecked();

    await soundToggle.click();
    await waitForAnimations(page);

    // Save preferences
    await prefsDialog.getByRole('button', { name: /save/i }).click();
    await waitForAnimations(page);

    // Verify sound preference saved
    const newSoundState = await page.evaluate(() => {
      return localStorage.getItem('notification-sound-enabled');
    });

    expect(newSoundState).toBe((!initialSoundState).toString());
  });

  test('notification persistence', async ({ page, context }) => {
    // Add notifications
    await page.evaluate(() => {
      for (let i = 0; i < 3; i++) {
        const event = new CustomEvent('notification:show', {
          detail: {
            type: 'info',
            title: `Persistent ${i + 1}`,
            message: `Message ${i + 1}`,
            persist: true
          }
        });
        window.dispatchEvent(event);
      }
    });

    // Reload page
    await page.reload();
    await waitForNetworkIdle(page);

    // Open notification center
    await dashboard.notificationButton.click();
    await waitForAnimations(page);

    // Verify notifications persisted
    const notifications = page.locator('[data-testid="notification-item"]');
    const count = await notifications.count();
    expect(count).toBe(3);
  });

  test('notification grouping', async ({ page }) => {
    // Add multiple similar notifications
    await page.evaluate(() => {
      for (let i = 0; i < 5; i++) {
        const event = new CustomEvent('notification:show', {
          detail: {
            type: 'warning',
            title: 'High CPU Usage',
            message: `Service ${i + 1} CPU at 85%`,
            group: 'cpu-warnings'
          }
        });
        window.dispatchEvent(event);
      }
    });

    // Open notification center
    await notificationCenter.open();

    // Verify grouped notification
    const groupedNotification = notificationCenter.panel.locator('[data-testid="notification-group"]');
    await expect(groupedNotification).toBeVisible();
    await expect(groupedNotification).toContainText('5 similar notifications');

    // Expand group
    await groupedNotification.click();
    await waitForAnimations(page);

    // Verify individual notifications visible
    const expandedItems = notificationCenter.panel.locator('[data-group="cpu-warnings"]');
    const expandedCount = await expandedItems.count();
    expect(expandedCount).toBe(5);
  });
});