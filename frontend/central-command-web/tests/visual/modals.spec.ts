/**
 * Visual Regression Tests - Modals
 */

import { test, expect } from '@playwright/test';
import { DashboardPage, AddPortalModal, IncidentsModal } from '../utils/page-objects';
import { waitForAnimations, setThemeMode } from '../utils/helpers';

test.describe('Modal Visual Regression', () => {
  let dashboard: DashboardPage;

  test.beforeEach(async ({ page }) => {
    dashboard = new DashboardPage(page);
    await dashboard.navigateTo();
    await waitForAnimations(page);
  });

  test('add portal modal - light theme', async ({ page }) => {
    await setThemeMode(page, 'light');
    await dashboard.addPortalButton.click();
    await waitForAnimations(page);

    const modal = page.locator('[role="dialog"]');
    await expect(modal).toHaveScreenshot('add-portal-modal-light.png');

    // With form filled
    const addPortalModal = new AddPortalModal(page);
    await addPortalModal.fillForm({
      name: 'Test Portal',
      url: 'https://test.example.com',
      category: 'Core',
      description: 'This is a test portal description'
    });
    await expect(modal).toHaveScreenshot('add-portal-modal-filled.png');
  });

  test('add portal modal - dark theme', async ({ page }) => {
    await setThemeMode(page, 'dark');
    await dashboard.addPortalButton.click();
    await waitForAnimations(page);

    const modal = page.locator('[role="dialog"]');
    await expect(modal).toHaveScreenshot('add-portal-modal-dark.png');
  });

  test('incidents modal', async ({ page }) => {
    // Open incidents modal
    const incidentsButton = page.locator('[data-testid="view-incidents"]');
    await incidentsButton.click();
    await waitForAnimations(page);

    const modal = page.locator('[role="dialog"]');
    await expect(modal).toHaveScreenshot('incidents-modal.png');

    // Filter states
    const incidentsModal = new IncidentsModal(page);
    await incidentsModal.filterBySeverity('critical');
    await waitForAnimations(page);
    await expect(modal).toHaveScreenshot('incidents-modal-critical.png');

    await incidentsModal.filterBySeverity('major');
    await waitForAnimations(page);
    await expect(modal).toHaveScreenshot('incidents-modal-major.png');
  });

  test('edit portal modal', async ({ page }) => {
    // Open portal actions
    await dashboard.openPortalActions('Admin Portal');
    await page.locator('[data-testid="edit-portal"]').click();
    await waitForAnimations(page);

    const modal = page.locator('[role="dialog"]');
    await expect(modal).toHaveScreenshot('edit-portal-modal.png');
  });

  test('delete confirmation modal', async ({ page }) => {
    // Open portal actions
    await dashboard.openPortalActions('Admin Portal');
    await page.locator('[data-testid="delete-portal"]').click();
    await waitForAnimations(page);

    const modal = page.locator('[role="dialog"]');
    await expect(modal).toHaveScreenshot('delete-confirmation-modal.png');
  });

  test('maintenance scheduler modal', async ({ page }) => {
    await dashboard.maintenanceButton.click();
    await waitForAnimations(page);

    const modal = page.locator('[role="dialog"]');
    await expect(modal).toHaveScreenshot('maintenance-scheduler-modal.png');
  });

  test('export data modal', async ({ page }) => {
    await dashboard.exportButton.click();
    await waitForAnimations(page);

    const modal = page.locator('[role="dialog"]');
    await expect(modal).toHaveScreenshot('export-data-modal.png');
  });

  test('modal overlay backdrop', async ({ page }) => {
    await dashboard.addPortalButton.click();
    await waitForAnimations(page);

    // Capture full page with overlay
    await expect(page).toHaveScreenshot('modal-with-backdrop.png', { fullPage: true });

    // Check backdrop blur effect
    const backdrop = page.locator('[data-testid="modal-backdrop"]');
    await expect(backdrop).toHaveScreenshot('modal-backdrop-blur.png');
  });

  test('modal animations', async ({ page }) => {
    // Opening animation
    await dashboard.addPortalButton.click();

    // Capture at different animation stages
    await page.waitForTimeout(50);
    await expect(page).toHaveScreenshot('modal-animation-start.png', { fullPage: false });

    await page.waitForTimeout(150);
    await expect(page).toHaveScreenshot('modal-animation-mid.png', { fullPage: false });

    await page.waitForTimeout(300);
    await expect(page).toHaveScreenshot('modal-animation-end.png', { fullPage: false });

    // Closing animation
    await page.keyboard.press('Escape');
    await page.waitForTimeout(50);
    await expect(page).toHaveScreenshot('modal-close-animation.png', { fullPage: false });
  });

  test('modal form validation states', async ({ page }) => {
    await dashboard.addPortalButton.click();
    await waitForAnimations(page);

    const addPortalModal = new AddPortalModal(page);
    const modal = page.locator('[role="dialog"]');

    // Empty form validation
    await addPortalModal.submitButton.click();
    await waitForAnimations(page);
    await expect(modal).toHaveScreenshot('modal-validation-errors.png');

    // Invalid URL
    await addPortalModal.nameInput.fill('Test Portal');
    await addPortalModal.urlInput.fill('not-a-valid-url');
    await addPortalModal.submitButton.click();
    await waitForAnimations(page);
    await expect(modal).toHaveScreenshot('modal-invalid-url.png');

    // Valid form
    await addPortalModal.urlInput.clear();
    await addPortalModal.urlInput.fill('https://valid.example.com');
    await expect(modal).toHaveScreenshot('modal-valid-form.png');
  });

  test('modal scroll behavior', async ({ page }) => {
    // Create a modal with long content
    await page.evaluate(() => {
      const modal = document.createElement('div');
      modal.setAttribute('role', 'dialog');
      modal.style.cssText = 'position: fixed; inset: 0; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.5);';

      const content = document.createElement('div');
      content.style.cssText = 'background: white; padding: 2rem; max-height: 80vh; overflow-y: auto; width: 500px;';
      content.innerHTML = '<h2>Long Content Modal</h2>' + '<p>Lorem ipsum dolor sit amet.</p>'.repeat(50);

      modal.appendChild(content);
      document.body.appendChild(modal);
    });

    await waitForAnimations(page);
    const modal = page.locator('[role="dialog"]');

    // Top of scroll
    await expect(modal).toHaveScreenshot('modal-scroll-top.png');

    // Scroll to middle
    await page.evaluate(() => {
      const content = document.querySelector('[role="dialog"] > div');
      if (content) content.scrollTop = content.scrollHeight / 2;
    });
    await expect(modal).toHaveScreenshot('modal-scroll-middle.png');

    // Scroll to bottom
    await page.evaluate(() => {
      const content = document.querySelector('[role="dialog"] > div');
      if (content) content.scrollTop = content.scrollHeight;
    });
    await expect(modal).toHaveScreenshot('modal-scroll-bottom.png');
  });

  test('modal responsive sizes', async ({ page }) => {
    const viewports = [
      { name: 'mobile', width: 375, height: 812 },
      { name: 'tablet', width: 768, height: 1024 },
      { name: 'desktop', width: 1920, height: 1080 }
    ];

    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await dashboard.addPortalButton.click();
      await waitForAnimations(page);

      const modal = page.locator('[role="dialog"]');
      await expect(modal).toHaveScreenshot(`modal-${viewport.name}.png`);

      await page.keyboard.press('Escape');
      await waitForAnimations(page);
    }
  });

  test('nested modals', async ({ page }) => {
    // Open first modal
    await dashboard.addPortalButton.click();
    await waitForAnimations(page);

    // Trigger second modal (e.g., help modal from within add portal modal)
    const helpButton = page.locator('[data-testid="modal-help-button"]');
    if (await helpButton.isVisible()) {
      await helpButton.click();
      await waitForAnimations(page);
      await expect(page).toHaveScreenshot('nested-modals.png', { fullPage: false });
    }
  });

  test('modal focus trap', async ({ page }) => {
    await dashboard.addPortalButton.click();
    await waitForAnimations(page);

    // Tab through modal elements
    const modal = page.locator('[role="dialog"]');

    await page.keyboard.press('Tab');
    await expect(modal).toHaveScreenshot('modal-focus-first.png');

    await page.keyboard.press('Tab');
    await expect(modal).toHaveScreenshot('modal-focus-second.png');

    await page.keyboard.press('Tab');
    await expect(modal).toHaveScreenshot('modal-focus-third.png');

    // Should cycle back to first element
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await expect(modal).toHaveScreenshot('modal-focus-cycled.png');
  });
});