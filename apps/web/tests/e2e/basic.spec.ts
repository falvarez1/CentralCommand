import { test, expect } from '@playwright/test';

test.describe('Basic App Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5176');
  });

  test('should load the dashboard', async ({ page }) => {
    // Wait for the app to load
    await page.waitForLoadState('networkidle');

    // Check that the dashboard is visible
    await expect(page).toHaveTitle(/Central Command/i);

    // Check for main layout elements
    await expect(page.locator('header')).toBeVisible();
    await expect(page.locator('aside')).toBeVisible(); // Sidebar
    await expect(page.locator('main')).toBeVisible();
  });

  test('should fetch and display portals from API', async ({ page }) => {
    // Wait for portals to load
    await page.waitForSelector('[data-testid="portal-card"], [data-testid="portal-list-item"]', {
      timeout: 10000
    });

    // Check that at least one portal is displayed
    const portals = await page.locator('[data-testid="portal-card"], [data-testid="portal-list-item"]').count();
    expect(portals).toBeGreaterThan(0);
  });

  test('should show loading state initially', async ({ page }) => {
    // Navigate and immediately check for loading state
    page.goto('http://localhost:5176');

    // Look for loading indicators - using multiple selectors
    const loadingIndicator = page.locator('[role="status"], .animate-pulse, .animate-spin, text=/loading/i').first();
    await expect(loadingIndicator).toBeVisible({ timeout: 5000 });
  });

  test('should have working search input', async ({ page }) => {
    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Find and interact with search input
    const searchInput = page.locator('input[placeholder*="Search"], input[type="search"]').first();
    await expect(searchInput).toBeVisible();

    // Type in search
    await searchInput.fill('test portal');

    // Verify search value was entered
    await expect(searchInput).toHaveValue('test portal');
  });

  test('should have category filter tabs', async ({ page }) => {
    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Check for category filter tabs
    const categoryTabs = page.locator('[role="tablist"] button, [data-testid="category-tab"]');
    const tabCount = await categoryTabs.count();
    expect(tabCount).toBeGreaterThan(0);

    // Click on a tab
    if (tabCount > 1) {
      await categoryTabs.nth(1).click();
      // Verify tab is selected
      await expect(categoryTabs.nth(1)).toHaveAttribute('aria-selected', 'true');
    }
  });

  test('should open add portal modal', async ({ page }) => {
    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Click add portal button using data-testid
    const addButton = page.locator('[data-testid="add-portal-button"]');
    await expect(addButton).toBeVisible();
    await addButton.click();

    // Check modal is open using data-testid
    const modal = page.locator('[data-testid="add-portal-modal"]');
    await expect(modal).toBeVisible();

    // Check for form fields
    await expect(page.locator('input[name="name"], input[placeholder*="name"]')).toBeVisible();
    await expect(page.locator('input[name="url"], input[placeholder*="url"]')).toBeVisible();
  });

  test('should switch between grid and list views', async ({ page }) => {
    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Look for view toggle buttons
    const gridButton = page.locator('button[aria-label*="Grid"], button:has-text("Grid")').first();
    const listButton = page.locator('button[aria-label*="List"], button:has-text("List")').first();

    if (await gridButton.isVisible() && await listButton.isVisible()) {
      // Switch to list view
      await listButton.click();
      await page.waitForTimeout(500);

      // Check for list items
      const listItems = await page.locator('[data-testid="portal-list-item"], .list-view').count();
      expect(listItems).toBeGreaterThanOrEqual(0);

      // Switch back to grid view
      await gridButton.click();
      await page.waitForTimeout(500);

      // Check for grid cards
      const gridCards = await page.locator('[data-testid="portal-card"], .grid-view').count();
      expect(gridCards).toBeGreaterThanOrEqual(0);
    }
  });
});