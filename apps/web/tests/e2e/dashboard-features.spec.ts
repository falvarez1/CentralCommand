import { test, expect } from '@playwright/test';
import { PortalPage } from './pages/PortalPage';

test.describe('Dashboard Features', () => {
  let portalPage: PortalPage;

  test.beforeEach(async ({ page }) => {
    portalPage = new PortalPage(page);
    await portalPage.goto();
  });

  test('should handle keyboard shortcuts', async ({ page }) => {
    // Test Cmd/Ctrl+K for search focus
    await page.keyboard.press('Control+K');
    await expect(portalPage.searchInput).toBeFocused();

    // Clear and unfocus
    await page.keyboard.press('Escape');
    await expect(portalPage.searchInput).not.toBeFocused();

    // Test Cmd/Ctrl+N for new portal
    await page.keyboard.press('Control+N');
    const addModal = page.locator('[role="dialog"]');
    await expect(addModal).toBeVisible();
    await page.keyboard.press('Escape');

    // Test Cmd/Ctrl+R for refresh
    const refreshPromise = page.waitForResponse(
      response => response.url().includes('/api/portals') && response.status() === 200
    );
    await page.keyboard.press('Control+R');
    await refreshPromise;

    // Test Cmd/Ctrl+E for export
    await page.keyboard.press('Control+E');
    const exportModal = page.locator('[data-testid="export-modal"]');
    if (await exportModal.isVisible({ timeout: 1000 })) {
      await expect(exportModal).toBeVisible();
      await page.keyboard.press('Escape');
    }

    // Test ? for help
    await page.keyboard.press('?');
    const helpModal = page.locator('[data-testid="help-modal"]');
    await expect(helpModal).toBeVisible();
    await expect(helpModal).toContainText(/keyboard shortcuts/i);
    await page.keyboard.press('Escape');

    // Test number keys for quick filters (1-9)
    await page.keyboard.press('1');
    await expect(portalPage.categoryFilter).toHaveValue('Engineering');

    await page.keyboard.press('2');
    await expect(portalPage.categoryFilter).toHaveValue('Operations');

    // Test G then I for Go to Incidents
    await page.keyboard.press('g');
    await page.keyboard.press('i');
    await expect(page).toHaveURL(/.*incidents/);

    // Go back to dashboard
    await portalPage.goto();

    // Test / for search focus (alternative to Cmd+K)
    await page.keyboard.press('/');
    await expect(portalPage.searchInput).toBeFocused();
  });

  test('should export data functionality', async ({ page }) => {
    // Test export via button
    const downloadPromise = page.waitForEvent('download');
    await portalPage.exportButton.click();

    // Handle export options if modal appears
    const exportModal = page.locator('[data-testid="export-modal"]');
    if (await exportModal.isVisible({ timeout: 1000 })) {
      // Select CSV format
      await exportModal.locator('[data-testid="format-csv"]').click();

      // Select data to export
      const includeMetrics = exportModal.locator('[data-testid="include-metrics"]');
      await includeMetrics.check();

      const includeIncidents = exportModal.locator('[data-testid="include-incidents"]');
      await includeIncidents.check();

      // Confirm export
      await exportModal.locator('[data-testid="confirm-export"]').click();
    }

    // Verify download
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/portals.*\.(csv|json|xlsx)/);

    // Test export with filters applied
    await portalPage.filterByCategory('Engineering');
    await portalPage.filterByStatus('active');

    const filteredDownloadPromise = page.waitForEvent('download');
    await portalPage.exportButton.click();

    if (await exportModal.isVisible({ timeout: 1000 })) {
      await exportModal.locator('[data-testid="confirm-export"]').click();
    }

    const filteredDownload = await filteredDownloadPromise;
    expect(filteredDownload.suggestedFilename()).toMatch(/portals.*filtered.*\.(csv|json|xlsx)/);
  });

  test('should refresh all portals', async ({ page }) => {
    // Get initial data
    const firstPortal = portalPage.portalCards.first();
    const initialMetric = await firstPortal.locator('[data-testid="metric-response-time"]').textContent();

    // Set up response monitoring
    let refreshCount = 0;
    page.on('response', response => {
      if (response.url().includes('/api/portals') && response.status() === 200) {
        refreshCount++;
      }
    });

    // Click refresh button
    await portalPage.refreshButton.click();

    // Verify loading state
    await expect(portalPage.loadingSpinner).toBeVisible();

    // Wait for refresh to complete
    await portalPage.waitForLoad();

    // Verify API was called
    expect(refreshCount).toBeGreaterThan(0);

    // Verify "Last updated" timestamp changed
    const lastUpdated = page.locator('[data-testid="last-updated"]');
    await expect(lastUpdated).toContainText(/just now|seconds ago/i);

    // Test bulk refresh with selection
    const selectAllCheckbox = page.locator('[data-testid="select-all"]');
    if (await selectAllCheckbox.isVisible()) {
      await selectAllCheckbox.check();

      const bulkRefreshButton = page.locator('[data-testid="bulk-refresh"]');
      await bulkRefreshButton.click();

      // Verify bulk refresh notification
      const notification = page.locator('[role="status"]');
      await expect(notification).toContainText(/refreshing.*portals/i);
    }
  });

  test('should switch view modes', async ({ page }) => {
    // Test Grid View (default)
    await expect(portalPage.portalCards.first()).toBeVisible();
    const gridViewButton = page.locator('[data-testid="view-grid"]');
    await expect(gridViewButton).toHaveClass(/active|selected/);

    // Count portals in grid view
    const gridCount = await portalPage.portalCards.count();

    // Switch to List View
    const listViewButton = page.locator('[data-testid="view-list"]');
    await listViewButton.click();
    await page.waitForTimeout(300); // Animation

    // Verify list view is active
    await expect(listViewButton).toHaveClass(/active|selected/);
    await expect(portalPage.portalListItems.first()).toBeVisible();
    await expect(portalPage.portalCards.first()).not.toBeVisible();

    // Verify same number of items
    const listCount = await portalPage.portalListItems.count();
    expect(listCount).toBe(gridCount);

    // Test Compact View if available
    const compactViewButton = page.locator('[data-testid="view-compact"]');
    if (await compactViewButton.isVisible()) {
      await compactViewButton.click();
      await page.waitForTimeout(300);

      // Verify compact view
      const compactItems = page.locator('[data-testid="portal-compact-item"]');
      await expect(compactItems.first()).toBeVisible();

      // Compact view should show more items per screen
      const compactCount = await compactItems.count();
      expect(compactCount).toBe(gridCount);
    }

    // Test Card View with details
    const cardViewButton = page.locator('[data-testid="view-card"]');
    if (await cardViewButton.isVisible()) {
      await cardViewButton.click();
      await page.waitForTimeout(300);

      // Verify detailed cards
      const detailedCards = page.locator('[data-testid="portal-detailed-card"]');
      await expect(detailedCards.first()).toBeVisible();

      // Cards should show more information
      const firstCard = detailedCards.first();
      await expect(firstCard.locator('[data-testid="portal-description"]')).toBeVisible();
      await expect(firstCard.locator('[data-testid="portal-metrics-detailed"]')).toBeVisible();
    }

    // Verify view preference is saved
    await page.reload();
    await portalPage.waitForLoad();
    // Should maintain last selected view
    await expect(page.locator('[data-testid*="view-"][class*="active"]')).toBeVisible();
  });

  test('should handle responsive layout', async ({ page, viewport }) => {
    // Test Desktop Layout
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(500);

    // Verify sidebar is visible on desktop
    const sidebar = page.locator('[data-testid="sidebar"]');
    await expect(sidebar).toBeVisible();

    // Verify grid columns on desktop
    const gridContainer = page.locator('[data-testid="portal-grid"]');
    const desktopGridStyle = await gridContainer.getAttribute('style');
    expect(desktopGridStyle).toContain('grid');

    // Test Tablet Layout
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(500);

    // Sidebar might be collapsible on tablet
    const hamburgerMenu = page.locator('[data-testid="hamburger-menu"]');
    if (await hamburgerMenu.isVisible()) {
      // Sidebar should be hidden or collapsed
      await expect(sidebar).not.toBeVisible();

      // Open sidebar
      await hamburgerMenu.click();
      await expect(sidebar).toBeVisible();

      // Close sidebar
      await page.locator('[data-testid="close-sidebar"]').click();
      await expect(sidebar).not.toBeVisible();
    }

    // Test Mobile Layout
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);

    // Verify mobile-specific elements
    const mobileNav = page.locator('[data-testid="mobile-nav"]');
    if (await mobileNav.isVisible()) {
      await expect(mobileNav).toBeVisible();
    }

    // Verify single column layout on mobile
    const mobilePortals = await portalPage.portalCards.all();
    if (mobilePortals.length > 1) {
      const firstPortalBox = await mobilePortals[0].boundingBox();
      const secondPortalBox = await mobilePortals[1].boundingBox();

      if (firstPortalBox && secondPortalBox) {
        // Portals should be stacked vertically
        expect(secondPortalBox.y).toBeGreaterThan(firstPortalBox.y + firstPortalBox.height);
      }
    }

    // Test landscape mobile
    await page.setViewportSize({ width: 667, height: 375 });
    await page.waitForTimeout(500);

    // Might show 2 columns in landscape
    const landscapePortals = await portalPage.portalCards.all();
    if (landscapePortals.length > 1) {
      const firstBox = await landscapePortals[0].boundingBox();
      const secondBox = await landscapePortals[1].boundingBox();

      if (firstBox && secondBox) {
        // Might be side by side in landscape
        const isSideBySide = Math.abs(firstBox.y - secondBox.y) < 50;
        // This depends on the specific responsive design
      }
    }

    // Reset to desktop
    if (viewport) {
      await page.setViewportSize(viewport);
    }
  });

  test('should handle theme switching', async ({ page }) => {
    // Find theme toggle
    const themeToggle = page.locator('[data-testid="theme-toggle"]');
    await expect(themeToggle).toBeVisible();

    // Get initial theme
    const htmlElement = page.locator('html');
    const initialTheme = await htmlElement.getAttribute('data-theme') || 'light';

    // Toggle theme
    await themeToggle.click();

    // Verify theme changed
    const newTheme = await htmlElement.getAttribute('data-theme');
    expect(newTheme).not.toBe(initialTheme);

    // Verify CSS variables updated
    const backgroundColor = await page.evaluate(() => {
      return window.getComputedStyle(document.documentElement).getPropertyValue('--background-color');
    });

    if (newTheme === 'dark') {
      // Dark theme should have dark background
      expect(backgroundColor).toMatch(/#[0-3]/);
    } else {
      // Light theme should have light background
      expect(backgroundColor).toMatch(/#[f-F]/);
    }

    // Verify theme persists on reload
    await page.reload();
    await portalPage.waitForLoad();

    const persistedTheme = await htmlElement.getAttribute('data-theme');
    expect(persistedTheme).toBe(newTheme);
  });

  test('should show dashboard statistics', async ({ page }) => {
    // Verify statistics section
    const statsSection = page.locator('[data-testid="dashboard-stats"]');
    await expect(statsSection).toBeVisible();

    // Check individual statistics
    const totalPortals = statsSection.locator('[data-testid="stat-total"]');
    const activePortals = statsSection.locator('[data-testid="stat-active"]');
    const degradedPortals = statsSection.locator('[data-testid="stat-degraded"]');
    const avgResponseTime = statsSection.locator('[data-testid="stat-avg-response"]');
    const overallUptime = statsSection.locator('[data-testid="stat-uptime"]');

    await expect(totalPortals).toBeVisible();
    await expect(activePortals).toBeVisible();
    await expect(degradedPortals).toBeVisible();
    await expect(avgResponseTime).toBeVisible();
    await expect(overallUptime).toBeVisible();

    // Verify statistics have valid values
    const total = await totalPortals.textContent();
    expect(parseInt(total?.match(/\d+/)?.[0] || '0')).toBeGreaterThan(0);

    const uptime = await overallUptime.textContent();
    expect(uptime).toMatch(/\d+(\.\d+)?%/);
  });

  test('should handle user preferences', async ({ page }) => {
    // Open preferences/settings
    const settingsButton = page.locator('[data-testid="settings-button"]');
    await settingsButton.click();

    const settingsModal = page.locator('[data-testid="settings-modal"]');
    await expect(settingsModal).toBeVisible();

    // Test notification preferences
    const notificationToggle = settingsModal.locator('[data-testid="notifications-toggle"]');
    const initialNotificationState = await notificationToggle.isChecked();
    await notificationToggle.click();
    expect(await notificationToggle.isChecked()).toBe(!initialNotificationState);

    // Test auto-refresh interval
    const refreshInterval = settingsModal.locator('[data-testid="refresh-interval"]');
    await refreshInterval.selectOption('30');

    // Test default view preference
    const defaultView = settingsModal.locator('[data-testid="default-view"]');
    await defaultView.selectOption('list');

    // Test items per page
    const itemsPerPage = settingsModal.locator('[data-testid="items-per-page"]');
    await itemsPerPage.selectOption('50');

    // Save preferences
    await settingsModal.locator('[data-testid="save-preferences"]').click();
    await expect(settingsModal).not.toBeVisible();

    // Verify preferences are applied
    await page.reload();
    await portalPage.waitForLoad();

    // Should show list view as default
    await expect(portalPage.portalListItems.first()).toBeVisible();
  });

  test('should show breadcrumbs navigation', async ({ page }) => {
    // Check breadcrumbs on main dashboard
    const breadcrumbs = page.locator('[data-testid="breadcrumbs"]');
    await expect(breadcrumbs).toBeVisible();
    await expect(breadcrumbs).toContainText('Dashboard');

    // Navigate to incidents
    await page.goto('/incidents');
    await expect(breadcrumbs).toContainText('Incidents');

    // Breadcrumb should be clickable
    const dashboardCrumb = breadcrumbs.locator('a:has-text("Dashboard")');
    await dashboardCrumb.click();
    await expect(page).toHaveURL('/');
  });

  test('should handle quick actions menu', async ({ page }) => {
    // Find quick actions button (floating action button or menu)
    const quickActionsButton = page.locator('[data-testid="quick-actions"]');
    await expect(quickActionsButton).toBeVisible();

    // Open quick actions menu
    await quickActionsButton.click();

    const quickActionsMenu = page.locator('[data-testid="quick-actions-menu"]');
    await expect(quickActionsMenu).toBeVisible();

    // Verify available actions
    const addPortalAction = quickActionsMenu.locator('[data-testid="quick-add-portal"]');
    const reportIncidentAction = quickActionsMenu.locator('[data-testid="quick-report-incident"]');
    const refreshAllAction = quickActionsMenu.locator('[data-testid="quick-refresh-all"]');
    const exportAction = quickActionsMenu.locator('[data-testid="quick-export"]');

    await expect(addPortalAction).toBeVisible();
    await expect(reportIncidentAction).toBeVisible();
    await expect(refreshAllAction).toBeVisible();
    await expect(exportAction).toBeVisible();

    // Test quick add portal
    await addPortalAction.click();
    const addModal = page.locator('[role="dialog"]');
    await expect(addModal).toBeVisible();
    await page.keyboard.press('Escape');

    // Close quick actions menu
    await page.keyboard.press('Escape');
    await expect(quickActionsMenu).not.toBeVisible();
  });
});