/**
 * Visual Regression Tests - Responsive Design
 */

import { test, expect } from '@playwright/test';
import { DashboardPage } from '../utils/page-objects';
import { waitForAnimations, checkResponsive } from '../utils/helpers';

const viewports = [
  { name: 'mobile-portrait', width: 375, height: 812 }, // iPhone X
  { name: 'mobile-landscape', width: 812, height: 375 },
  { name: 'tablet-portrait', width: 768, height: 1024 }, // iPad
  { name: 'tablet-landscape', width: 1024, height: 768 },
  { name: 'desktop-small', width: 1280, height: 720 },
  { name: 'desktop-medium', width: 1440, height: 900 },
  { name: 'desktop-large', width: 1920, height: 1080 },
  { name: 'desktop-xlarge', width: 2560, height: 1440 } // 4K
];

test.describe('Responsive Design Visual Regression', () => {
  let dashboard: DashboardPage;

  test.beforeEach(async ({ page }) => {
    dashboard = new DashboardPage(page);
    await dashboard.navigateTo();
    await waitForAnimations(page);
  });

  test('dashboard at all breakpoints', async ({ page }) => {
    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await waitForAnimations(page);
      await expect(page).toHaveScreenshot(`responsive-${viewport.name}.png`, { fullPage: true });
    }
  });

  test('mobile navigation', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await waitForAnimations(page);

    // Closed mobile menu
    await expect(page).toHaveScreenshot('mobile-nav-closed.png', { fullPage: false });

    // Open mobile menu
    const menuButton = page.locator('[data-testid="mobile-menu-button"]');
    if (await menuButton.isVisible()) {
      await menuButton.click();
      await waitForAnimations(page);
      await expect(page).toHaveScreenshot('mobile-nav-open.png', { fullPage: false });
    }
  });

  test('tablet sidebar behavior', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await waitForAnimations(page);

    // Check if sidebar is collapsible
    const sidebarToggle = page.locator('[data-testid="sidebar-toggle"]');
    if (await sidebarToggle.isVisible()) {
      // Expanded sidebar
      await expect(page).toHaveScreenshot('tablet-sidebar-expanded.png', { fullPage: false });

      // Collapsed sidebar
      await sidebarToggle.click();
      await waitForAnimations(page);
      await expect(page).toHaveScreenshot('tablet-sidebar-collapsed.png', { fullPage: false });
    }
  });

  test('grid columns at different sizes', async ({ page }) => {
    const gridViewports = [
      { name: 'mobile-1col', width: 375, height: 812, columns: 1 },
      { name: 'tablet-2col', width: 768, height: 1024, columns: 2 },
      { name: 'desktop-3col', width: 1280, height: 720, columns: 3 },
      { name: 'desktop-4col', width: 1920, height: 1080, columns: 4 }
    ];

    for (const viewport of gridViewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await waitForAnimations(page);
      await expect(dashboard.portalGrid).toHaveScreenshot(`grid-${viewport.name}.png`);
    }
  });

  test('text scaling', async ({ page }) => {
    const sizes = [
      { name: 'small', width: 375 },
      { name: 'medium', width: 768 },
      { name: 'large', width: 1920 }
    ];

    for (const size of sizes) {
      await page.setViewportSize({ width: size.width, height: 800 });
      await waitForAnimations(page);

      // Check heading sizes
      const heading = page.locator('h1').first();
      await expect(heading).toHaveScreenshot(`text-heading-${size.name}.png`);

      // Check body text
      const bodyText = page.locator('p').first();
      await expect(bodyText).toHaveScreenshot(`text-body-${size.name}.png`);
    }
  });

  test('modal responsiveness', async ({ page }) => {
    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await waitForAnimations(page);

      // Open add portal modal
      await dashboard.addPortalButton.click();
      await waitForAnimations(page);

      const modal = page.locator('[role="dialog"]');
      await expect(modal).toHaveScreenshot(`modal-${viewport.name}.png`);

      await page.keyboard.press('Escape');
      await waitForAnimations(page);
    }
  });

  test('command palette responsiveness', async ({ page }) => {
    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await waitForAnimations(page);

      // Open command palette
      await page.keyboard.press('Control+K');
      await waitForAnimations(page);

      await expect(page).toHaveScreenshot(`command-palette-${viewport.name}.png`, { fullPage: false });

      await page.keyboard.press('Escape');
      await waitForAnimations(page);
    }
  });

  test('touch targets on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await waitForAnimations(page);

    // Verify minimum touch target sizes (44x44px)
    const buttons = await page.locator('button').all();
    for (let i = 0; i < Math.min(buttons.length, 5); i++) {
      const button = buttons[i];
      const box = await button.boundingBox();
      if (box) {
        expect(box.width).toBeGreaterThanOrEqual(44);
        expect(box.height).toBeGreaterThanOrEqual(44);
      }
    }

    await expect(page).toHaveScreenshot('mobile-touch-targets.png', { fullPage: false });
  });

  test('horizontal scrolling prevention', async ({ page }) => {
    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await waitForAnimations(page);

      // Check for horizontal overflow
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });

      expect(hasHorizontalScroll).toBe(false);
    }
  });

  test('list view responsiveness', async ({ page }) => {
    await dashboard.toggleView(); // Switch to list view
    await waitForAnimations(page);

    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await waitForAnimations(page);
      await expect(dashboard.portalGrid).toHaveScreenshot(`list-view-${viewport.name}.png`);
    }
  });

  test('notification center responsiveness', async ({ page }) => {
    const notificationButton = dashboard.notificationButton;

    for (const viewport of [viewports[0], viewports[2], viewports[4]]) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await waitForAnimations(page);

      await notificationButton.click();
      await waitForAnimations(page);

      const notificationPanel = page.locator('[data-testid="notification-center"]');
      await expect(notificationPanel).toHaveScreenshot(`notifications-${viewport.name}.png`);

      await page.keyboard.press('Escape');
      await waitForAnimations(page);
    }
  });

  test('footer responsiveness', async ({ page }) => {
    const footer = page.locator('footer');

    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await waitForAnimations(page);

      // Scroll to footer
      await footer.scrollIntoViewIfNeeded();
      await waitForAnimations(page);

      await expect(footer).toHaveScreenshot(`footer-${viewport.name}.png`);
    }
  });

  test('orientation changes', async ({ page }) => {
    // Portrait to landscape
    await page.setViewportSize({ width: 375, height: 812 });
    await waitForAnimations(page);
    await expect(page).toHaveScreenshot('orientation-portrait.png', { fullPage: false });

    // Rotate to landscape
    await page.setViewportSize({ width: 812, height: 375 });
    await waitForAnimations(page);
    await expect(page).toHaveScreenshot('orientation-landscape.png', { fullPage: false });
  });
});