/**
 * Visual Regression Tests - Portals
 */

import { test, expect } from '@playwright/test';
import { DashboardPage } from '../utils/page-objects';
import { waitForAnimations, compareVisualRegression } from '../utils/helpers';

test.describe('Portal Cards Visual Regression', () => {
  let dashboard: DashboardPage;

  test.beforeEach(async ({ page }) => {
    dashboard = new DashboardPage(page);
    await dashboard.navigateTo();
    await waitForAnimations(page);
  });

  test('portal grid view', async ({ page }) => {
    await compareVisualRegression(page, 'portals-grid-view');
  });

  test('portal list view', async ({ page }) => {
    await dashboard.toggleView();
    await waitForAnimations(page);
    await compareVisualRegression(page, 'portals-list-view');
  });

  test('portal card states - grid', async ({ page }) => {
    const portalCard = dashboard.portalCards.first();

    // Normal state
    await expect(portalCard).toHaveScreenshot('portal-card-normal.png');

    // Hover state
    await portalCard.hover();
    await expect(portalCard).toHaveScreenshot('portal-card-hover.png');

    // Favorite state
    await portalCard.locator('[data-testid="favorite-button"]').click();
    await waitForAnimations(page);
    await expect(portalCard).toHaveScreenshot('portal-card-favorite.png');
  });

  test('portal status indicators', async ({ page }) => {
    // Operational
    const operational = page.locator('[data-status="operational"]').first();
    await expect(operational).toHaveScreenshot('portal-status-operational.png');

    // Degraded
    const degraded = page.locator('[data-status="degraded"]').first();
    if (await degraded.isVisible()) {
      await expect(degraded).toHaveScreenshot('portal-status-degraded.png');
    }

    // Maintenance
    const maintenance = page.locator('[data-status="maintenance"]').first();
    if (await maintenance.isVisible()) {
      await expect(maintenance).toHaveScreenshot('portal-status-maintenance.png');
    }

    // Outage
    const outage = page.locator('[data-status="outage"]').first();
    if (await outage.isVisible()) {
      await expect(outage).toHaveScreenshot('portal-status-outage.png');
    }
  });

  test('portal metrics display', async ({ page }) => {
    const metricsSection = page.locator('[data-testid="portal-metrics"]').first();
    await expect(metricsSection).toHaveScreenshot('portal-metrics.png');
  });

  test('portal action menu', async ({ page }) => {
    const firstCard = dashboard.portalCards.first();
    const actionsButton = firstCard.locator('[data-testid="portal-actions"]');

    await actionsButton.click();
    await waitForAnimations(page);

    const actionMenu = page.locator('[data-testid="portal-action-menu"]');
    await expect(actionMenu).toHaveScreenshot('portal-action-menu.png');
  });

  test('filtered portals - by category', async ({ page }) => {
    // Core category
    await dashboard.filterByCategory('Core');
    await waitForAnimations(page);
    await expect(dashboard.portalGrid).toHaveScreenshot('portals-filtered-core.png');

    // Analytics category
    await dashboard.filterByCategory('Analytics');
    await waitForAnimations(page);
    await expect(dashboard.portalGrid).toHaveScreenshot('portals-filtered-analytics.png');

    // Support category
    await dashboard.filterByCategory('Support');
    await waitForAnimations(page);
    await expect(dashboard.portalGrid).toHaveScreenshot('portals-filtered-support.png');
  });

  test('filtered portals - by search', async ({ page }) => {
    await dashboard.search('admin');
    await waitForAnimations(page);
    await expect(dashboard.portalGrid).toHaveScreenshot('portals-search-admin.png');

    await dashboard.clearSearch();
    await dashboard.search('analytics');
    await waitForAnimations(page);
    await expect(dashboard.portalGrid).toHaveScreenshot('portals-search-analytics.png');
  });

  test('portal loading skeleton', async ({ page }) => {
    // Inject skeleton cards
    await page.evaluate(() => {
      const grid = document.querySelector('[data-testid="portal-grid"]');
      if (grid) {
        const skeleton = `
          <div class="portal-skeleton">
            <div class="skeleton-header"></div>
            <div class="skeleton-content"></div>
            <div class="skeleton-footer"></div>
          </div>
        `;
        grid.innerHTML = skeleton.repeat(6);
      }
    });
    await expect(dashboard.portalGrid).toHaveScreenshot('portals-skeleton.png');
  });

  test('portal card animations', async ({ page }) => {
    // Capture card appearance animation
    await page.reload();

    // Capture at different animation stages
    await page.waitForTimeout(100);
    await expect(dashboard.portalGrid).toHaveScreenshot('portals-animation-start.png');

    await page.waitForTimeout(300);
    await expect(dashboard.portalGrid).toHaveScreenshot('portals-animation-mid.png');

    await page.waitForTimeout(500);
    await expect(dashboard.portalGrid).toHaveScreenshot('portals-animation-end.png');
  });

  test('bulk selection mode', async ({ page }) => {
    // Enable bulk selection
    await dashboard.bulkActionsButton.click();
    await waitForAnimations(page);

    // Capture bulk selection UI
    await expect(dashboard.portalGrid).toHaveScreenshot('portals-bulk-selection.png');

    // Select some portals
    const checkboxes = page.locator('[data-testid="portal-checkbox"]');
    await checkboxes.nth(0).check();
    await checkboxes.nth(2).check();
    await checkboxes.nth(4).check();
    await waitForAnimations(page);

    await expect(dashboard.portalGrid).toHaveScreenshot('portals-bulk-selected.png');
  });

  test('portal sorting indicators', async ({ page }) => {
    // Name sort
    const nameSort = page.locator('[data-testid="sort-name"]');
    await nameSort.click();
    await expect(nameSort).toHaveScreenshot('sort-name-asc.png');

    await nameSort.click();
    await expect(nameSort).toHaveScreenshot('sort-name-desc.png');

    // Status sort
    const statusSort = page.locator('[data-testid="sort-status"]');
    await statusSort.click();
    await expect(statusSort).toHaveScreenshot('sort-status-asc.png');

    // Uptime sort
    const uptimeSort = page.locator('[data-testid="sort-uptime"]');
    await uptimeSort.click();
    await expect(uptimeSort).toHaveScreenshot('sort-uptime-asc.png');
  });

  test('portal pagination', async ({ page }) => {
    const pagination = page.locator('[data-testid="pagination"]');

    // First page
    await expect(pagination).toHaveScreenshot('pagination-first.png');

    // Middle page
    await page.locator('[data-testid="page-3"]').click();
    await waitForAnimations(page);
    await expect(pagination).toHaveScreenshot('pagination-middle.png');

    // Last page
    await page.locator('[data-testid="page-last"]').click();
    await waitForAnimations(page);
    await expect(pagination).toHaveScreenshot('pagination-last.png');
  });
});