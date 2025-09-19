/**
 * Visual Regression Tests - Themes
 */

import { test, expect } from '@playwright/test';
import { DashboardPage } from '../utils/page-objects';
import { setThemeMode, waitForAnimations, getComputedStyles } from '../utils/helpers';

test.describe('Theme Visual Regression', () => {
  let dashboard: DashboardPage;

  test.beforeEach(async ({ page }) => {
    dashboard = new DashboardPage(page);
    await dashboard.navigateTo();
    await waitForAnimations(page);
  });

  test('light theme - full page', async ({ page }) => {
    await setThemeMode(page, 'light');
    await expect(page).toHaveScreenshot('theme-light-full.png', { fullPage: true });
  });

  test('dark theme - full page', async ({ page }) => {
    await setThemeMode(page, 'dark');
    await expect(page).toHaveScreenshot('theme-dark-full.png', { fullPage: true });
  });

  test('theme transition', async ({ page }) => {
    // Start with light theme
    await setThemeMode(page, 'light');
    await page.waitForTimeout(100);

    // Capture mid-transition
    await dashboard.themeToggle.click();
    await page.waitForTimeout(150); // Mid-transition
    await expect(page).toHaveScreenshot('theme-transition-mid.png', { fullPage: false });

    // Final dark theme
    await waitForAnimations(page);
    await expect(page).toHaveScreenshot('theme-transition-complete.png', { fullPage: false });
  });

  test('component colors - light theme', async ({ page }) => {
    await setThemeMode(page, 'light');

    // Header
    await expect(page.locator('header')).toHaveScreenshot('light-header.png');

    // Sidebar
    await expect(page.locator('[data-testid="sidebar"]')).toHaveScreenshot('light-sidebar.png');

    // Cards
    await expect(dashboard.portalCards.first()).toHaveScreenshot('light-card.png');

    // Buttons
    await expect(dashboard.deployButton).toHaveScreenshot('light-button.png');

    // Inputs
    await expect(dashboard.searchInput).toHaveScreenshot('light-input.png');
  });

  test('component colors - dark theme', async ({ page }) => {
    await setThemeMode(page, 'dark');

    // Header
    await expect(page.locator('header')).toHaveScreenshot('dark-header.png');

    // Sidebar
    await expect(page.locator('[data-testid="sidebar"]')).toHaveScreenshot('dark-sidebar.png');

    // Cards
    await expect(dashboard.portalCards.first()).toHaveScreenshot('dark-card.png');

    // Buttons
    await expect(dashboard.deployButton).toHaveScreenshot('dark-button.png');

    // Inputs
    await expect(dashboard.searchInput).toHaveScreenshot('dark-input.png');
  });

  test('contrast ratios', async ({ page }) => {
    const themes = ['light', 'dark'] as const;

    for (const theme of themes) {
      await setThemeMode(page, theme);

      // Text on background
      const textStyles = await getComputedStyles(page, 'body', ['color', 'background-color']);
      await page.evaluate((styles) => {
        console.log(`${styles.theme} theme - Text contrast:`, styles);
      }, { theme, ...textStyles });

      // Button text
      const buttonStyles = await getComputedStyles(page, '[data-testid="deploy-button"]', [
        'color',
        'background-color'
      ]);
      await page.evaluate((styles) => {
        console.log(`${styles.theme} theme - Button contrast:`, styles);
      }, { theme, ...buttonStyles });

      // Take screenshots for manual contrast verification
      await expect(page).toHaveScreenshot(`contrast-${theme}.png`, { fullPage: false });
    }
  });

  test('shadows and borders', async ({ page }) => {
    const themes = ['light', 'dark'] as const;

    for (const theme of themes) {
      await setThemeMode(page, theme);

      // Card shadows
      const card = dashboard.portalCards.first();
      await expect(card).toHaveScreenshot(`${theme}-shadows-card.png`);

      // Modal shadows (if visible)
      await dashboard.addPortalButton.click();
      await waitForAnimations(page);
      const modal = page.locator('[role="dialog"]');
      await expect(modal).toHaveScreenshot(`${theme}-shadows-modal.png`);
      await page.keyboard.press('Escape');
    }
  });

  test('status colors consistency', async ({ page }) => {
    const themes = ['light', 'dark'] as const;
    const statuses = ['operational', 'degraded', 'maintenance', 'outage'];

    for (const theme of themes) {
      await setThemeMode(page, theme);

      for (const status of statuses) {
        const element = page.locator(`[data-status="${status}"]`).first();
        if (await element.isVisible()) {
          await expect(element).toHaveScreenshot(`${theme}-status-${status}.png`);
        }
      }
    }
  });

  test('chart colors', async ({ page }) => {
    const themes = ['light', 'dark'] as const;

    for (const theme of themes) {
      await setThemeMode(page, theme);

      const chart = page.locator('[data-testid="performance-chart"]');
      if (await chart.isVisible()) {
        await expect(chart).toHaveScreenshot(`${theme}-chart.png`);
      }
    }
  });

  test('gradients and overlays', async ({ page }) => {
    const themes = ['light', 'dark'] as const;

    for (const theme of themes) {
      await setThemeMode(page, theme);

      // Background gradients
      await expect(page.locator('body')).toHaveScreenshot(`${theme}-gradients.png`);

      // Overlay effects
      await dashboard.commandPaletteButton.click();
      await waitForAnimations(page);
      await expect(page).toHaveScreenshot(`${theme}-overlay.png`, { fullPage: false });
      await page.keyboard.press('Escape');
    }
  });

  test('theme persistence', async ({ page, context }) => {
    // Set dark theme
    await setThemeMode(page, 'dark');

    // Reload page
    await page.reload();
    await waitForAnimations(page);

    // Check theme is still dark
    const theme = await page.evaluate(() => {
      return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    });

    expect(theme).toBe('dark');
    await expect(page).toHaveScreenshot('theme-persisted.png', { fullPage: false });
  });

  test('system preference respect', async ({ page }) => {
    // Emulate dark system preference
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.reload();
    await waitForAnimations(page);
    await expect(page).toHaveScreenshot('theme-system-dark.png', { fullPage: false });

    // Emulate light system preference
    await page.emulateMedia({ colorScheme: 'light' });
    await page.reload();
    await waitForAnimations(page);
    await expect(page).toHaveScreenshot('theme-system-light.png', { fullPage: false });
  });
});