/**
 * Visual Regression Tests - Dashboard
 */

import { test, expect } from '@playwright/test';
import { DashboardPage } from '../utils/page-objects';
import { setThemeMode, waitForAnimations, compareVisualRegression } from '../utils/helpers';

test.describe('Dashboard Visual Regression', () => {
  let dashboard: DashboardPage;

  test.beforeEach(async ({ page }) => {
    dashboard = new DashboardPage(page);
    await dashboard.navigateTo();
    await waitForAnimations(page);
  });

  test('full dashboard - light theme', async ({ page }) => {
    await setThemeMode(page, 'light');
    await compareVisualRegression(page, 'dashboard-light-full');
  });

  test('full dashboard - dark theme', async ({ page }) => {
    await setThemeMode(page, 'dark');
    await compareVisualRegression(page, 'dashboard-dark-full');
  });

  test('dashboard header', async ({ page }) => {
    const header = page.locator('header');
    await expect(header).toHaveScreenshot('dashboard-header.png');
  });

  test('dashboard sidebar', async ({ page }) => {
    const sidebar = page.locator('[data-testid="sidebar"]');
    await expect(sidebar).toHaveScreenshot('dashboard-sidebar.png');
  });

  test('statistics cards', async ({ page }) => {
    const statsSection = page.locator('[data-testid="stats-section"]');
    await expect(statsSection).toHaveScreenshot('dashboard-stats.png');
  });

  test('incidents timeline', async ({ page }) => {
    const incidents = page.locator('[data-testid="incidents-timeline"]');
    await expect(incidents).toHaveScreenshot('dashboard-incidents.png');
  });

  test('category filters', async ({ page }) => {
    const filters = page.locator('[data-testid="category-filter"]');
    await expect(filters).toHaveScreenshot('dashboard-filters.png');
  });

  test('search bar states', async ({ page }) => {
    const searchContainer = page.locator('[data-testid="search-container"]');

    // Default state
    await expect(searchContainer).toHaveScreenshot('search-default.png');

    // Focused state
    await dashboard.searchInput.focus();
    await expect(searchContainer).toHaveScreenshot('search-focused.png');

    // With text
    await dashboard.search('analytics');
    await expect(searchContainer).toHaveScreenshot('search-with-text.png');
  });

  test('notification badge states', async ({ page }) => {
    const notificationButton = dashboard.notificationButton;

    // No notifications
    await expect(notificationButton).toHaveScreenshot('notification-empty.png');

    // With notifications (mock)
    await page.evaluate(() => {
      const button = document.querySelector('[data-testid="notification-button"]');
      if (button) {
        const badge = document.createElement('span');
        badge.className = 'notification-badge';
        badge.textContent = '3';
        button.appendChild(badge);
      }
    });
    await expect(notificationButton).toHaveScreenshot('notification-with-badge.png');
  });

  test('hover states', async ({ page }) => {
    // Button hover
    await dashboard.deployButton.hover();
    await expect(dashboard.deployButton).toHaveScreenshot('button-hover.png');

    // Card hover
    const firstCard = dashboard.portalCards.first();
    await firstCard.hover();
    await expect(firstCard).toHaveScreenshot('card-hover.png');

    // Category button hover
    const categoryButton = page.getByRole('button', { name: 'Core' });
    await categoryButton.hover();
    await expect(categoryButton).toHaveScreenshot('category-hover.png');
  });

  test('loading states', async ({ page }) => {
    // Simulate loading state
    await page.evaluate(() => {
      const grid = document.querySelector('[data-testid="portal-grid"]');
      if (grid) {
        grid.innerHTML = `
          <div class="skeleton-loader">Loading...</div>
          <div class="skeleton-loader">Loading...</div>
          <div class="skeleton-loader">Loading...</div>
        `;
      }
    });
    await expect(page.locator('[data-testid="portal-grid"]')).toHaveScreenshot('dashboard-loading.png');
  });

  test('empty states', async ({ page }) => {
    // Simulate empty state
    await page.evaluate(() => {
      const grid = document.querySelector('[data-testid="portal-grid"]');
      if (grid) {
        grid.innerHTML = `
          <div class="empty-state">
            <h3>No portals found</h3>
            <p>Add your first portal to get started</p>
          </div>
        `;
      }
    });
    await expect(page.locator('[data-testid="portal-grid"]')).toHaveScreenshot('dashboard-empty.png');
  });

  test('error states', async ({ page }) => {
    // Simulate error state
    await page.evaluate(() => {
      const grid = document.querySelector('[data-testid="portal-grid"]');
      if (grid) {
        grid.innerHTML = `
          <div class="error-state">
            <h3>Failed to load portals</h3>
            <p>Please try again later</p>
          </div>
        `;
      }
    });
    await expect(page.locator('[data-testid="portal-grid"]')).toHaveScreenshot('dashboard-error.png');
  });

  test('scrolled state', async ({ page }) => {
    // Scroll down
    await page.evaluate(() => window.scrollTo(0, 500));
    await waitForAnimations(page);
    await expect(page).toHaveScreenshot('dashboard-scrolled.png', { fullPage: false });
  });

  test('focus indicators', async ({ page }) => {
    // Tab through elements and capture focus states
    await page.keyboard.press('Tab');
    await expect(page).toHaveScreenshot('focus-first-element.png', { fullPage: false });

    await page.keyboard.press('Tab');
    await expect(page).toHaveScreenshot('focus-second-element.png', { fullPage: false });

    await page.keyboard.press('Tab');
    await expect(page).toHaveScreenshot('focus-third-element.png', { fullPage: false });
  });
});