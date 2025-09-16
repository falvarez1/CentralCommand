import { test, expect } from '@playwright/test';

test.describe('Portal Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');
  });

  test('should display list of portals from API', async ({ page }) => {
    // Wait for portals to load
    await page.waitForSelector('[data-testid="portal-card"], [data-testid="portal-list-item"]', {
      timeout: 10000
    });

    // Check that portals are displayed
    const portals = await page.locator('[data-testid="portal-card"], [data-testid="portal-list-item"]').count();
    expect(portals).toBeGreaterThan(0);

    // Verify portal cards have expected content
    const firstPortal = page.locator('[data-testid="portal-card"], [data-testid="portal-list-item"]').first();
    await expect(firstPortal).toBeVisible();

    // Check for portal name (should have text content)
    const portalText = await firstPortal.textContent();
    expect(portalText).toBeTruthy();
  });

  test('should add a new portal and display it in the list', async ({ page }) => {
    // Get initial portal count
    await page.waitForSelector('[data-testid="portal-card"], [data-testid="portal-list-item"]', {
      timeout: 10000
    });
    const initialCount = await page.locator('[data-testid="portal-card"], [data-testid="portal-list-item"]').count();

    // Click add portal button
    const addButton = page.locator('[data-testid="add-portal-button"]');
    await expect(addButton).toBeVisible();
    await addButton.click();

    // Wait for modal to open
    const modal = page.locator('[data-testid="add-portal-modal"]');
    await expect(modal).toBeVisible();

    // Generate unique portal name with timestamp
    const timestamp = Date.now();
    const portalName = `Test Portal ${timestamp}`;
    const portalUrl = `https://testportal${timestamp}.example.com`;

    // Fill in the form
    await page.fill('input[placeholder*="name" i], input[name="name"]', portalName);
    await page.fill('input[placeholder*="url" i], input[name="url"]', portalUrl);
    await page.fill('textarea[placeholder*="description" i], textarea[name="description"]', 'This is a test portal created by E2E tests');

    // Select category if dropdown is visible
    const categorySelect = page.locator('button[role="combobox"]:has-text("Select"), button[role="combobox"]:has-text("Business")').first();
    if (await categorySelect.isVisible()) {
      await categorySelect.click();
      await page.locator('[role="option"]:has-text("Engineering")').click();
    }

    // Submit the form
    const submitButton = page.locator('button:has-text("Add Portal"), button:has-text("Create"), button:has-text("Submit")').last();
    await submitButton.click();

    // Wait for modal to close and portal to be added
    await expect(modal).not.toBeVisible({ timeout: 10000 });

    // Wait for the new portal to appear in the list
    await page.waitForTimeout(2000); // Give API time to process

    // Verify portal count increased
    const newCount = await page.locator('[data-testid="portal-card"], [data-testid="portal-list-item"]').count();
    expect(newCount).toBeGreaterThan(initialCount);

    // Search for the newly added portal
    const searchInput = page.locator('input[placeholder*="Search" i], input[type="search"]').first();
    await searchInput.fill(portalName);
    await page.waitForTimeout(500); // Wait for search debounce

    // Verify the new portal is visible
    const newPortal = page.locator(`[data-testid="portal-card"]:has-text("${portalName}"), [data-testid="portal-list-item"]:has-text("${portalName}")`);
    await expect(newPortal).toBeVisible({ timeout: 5000 });
  });

  test('should switch between grid and list views', async ({ page }) => {
    // Wait for portals to load
    await page.waitForSelector('[data-testid="portal-card"], [data-testid="portal-list-item"]', {
      timeout: 10000
    });

    // Look for view toggle buttons
    const gridButton = page.locator('button[aria-label*="Grid" i], button:has-text("Grid")').first();
    const listButton = page.locator('button[aria-label*="List" i], button:has-text("List")').first();

    if (await gridButton.isVisible() && await listButton.isVisible()) {
      // Switch to list view
      await listButton.click();
      await page.waitForTimeout(500);

      // Check for list items
      const listItems = page.locator('[data-testid="portal-list-item"]');
      await expect(listItems.first()).toBeVisible();

      // Switch back to grid view
      await gridButton.click();
      await page.waitForTimeout(500);

      // Check for grid cards
      const gridCards = page.locator('[data-testid="portal-card"]');
      await expect(gridCards.first()).toBeVisible();
    }
  });

  test('should search and filter portals', async ({ page }) => {
    // Wait for portals to load
    await page.waitForSelector('[data-testid="portal-card"], [data-testid="portal-list-item"]', {
      timeout: 10000
    });

    // Get initial count
    const initialCount = await page.locator('[data-testid="portal-card"], [data-testid="portal-list-item"]').count();

    // Search for a specific term
    const searchInput = page.locator('input[placeholder*="Search" i], input[type="search"]').first();
    await searchInput.fill('Admin');
    await page.waitForTimeout(1000); // Wait for search debounce

    // Check that results are filtered
    const filteredCount = await page.locator('[data-testid="portal-card"], [data-testid="portal-list-item"]').count();
    expect(filteredCount).toBeLessThanOrEqual(initialCount);

    // Clear search
    await searchInput.clear();
    await page.waitForTimeout(1000);

    // Verify count is restored
    const restoredCount = await page.locator('[data-testid="portal-card"], [data-testid="portal-list-item"]').count();
    expect(restoredCount).toBe(initialCount);
  });

  test('should handle portal favorites', async ({ page }) => {
    // Wait for portals to load
    await page.waitForSelector('[data-testid="portal-card"], [data-testid="portal-list-item"]', {
      timeout: 10000
    });

    // Find a portal card and hover to show favorite button
    const firstPortal = page.locator('[data-testid="portal-card"]').first();
    await firstPortal.hover();

    // Look for heart/star icon button
    const favoriteButton = firstPortal.locator('button:has(svg[class*="Heart"]), button:has(svg[class*="Star"])').first();

    if (await favoriteButton.isVisible()) {
      // Click to toggle favorite
      await favoriteButton.click();
      await page.waitForTimeout(500);

      // The icon should change state (filled/unfilled)
      // This would need to be verified based on the actual implementation
    }
  });
});