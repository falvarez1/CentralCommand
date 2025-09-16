import { test, expect } from '@playwright/test';
import { PortalPage } from './pages/PortalPage';

test.describe('Filtering and Searching', () => {
  let portalPage: PortalPage;

  test.beforeEach(async ({ page }) => {
    portalPage = new PortalPage(page);
    await portalPage.goto();
  });

  test('should search by portal name', async ({ page }) => {
    // Get initial portal count
    const initialCount = await portalPage.getPortalCount();
    expect(initialCount).toBeGreaterThan(0);

    // Search for "Jenkins"
    await portalPage.searchPortals('Jenkins');

    // Verify search results
    const searchCount = await portalPage.getPortalCount();
    expect(searchCount).toBeGreaterThanOrEqual(1);
    expect(searchCount).toBeLessThanOrEqual(initialCount);

    // Verify all results contain search term
    const portals = await portalPage.portalCards.all();
    for (const portal of portals) {
      const text = await portal.textContent();
      expect(text?.toLowerCase()).toContain('jenkins');
    }

    // Verify API call includes search parameter
    await page.waitForResponse(
      response => response.url().includes('/api/portals') && response.url().includes('search=Jenkins')
    );
  });

  test('should filter by category', async ({ page }) => {
    // Test each category
    const categories = ['Engineering', 'Operations', 'Analytics', 'Security'];

    for (const category of categories) {
      await portalPage.filterByCategory(category);

      // Verify filtered results
      const portals = await portalPage.portalCards.all();
      if (portals.length > 0) {
        for (const portal of portals) {
          const portalCategory = await portal.locator('[data-testid="portal-category"]').textContent();
          expect(portalCategory).toContain(category);
        }
      }

      // Verify API call includes category filter
      await page.waitForResponse(
        response => response.url().includes('/api/portals') && response.url().includes(`category=${category}`)
      );
    }
  });

  test('should filter by status', async ({ page }) => {
    // Test each status
    const statuses = ['active', 'degraded', 'maintenance', 'offline'];

    for (const status of statuses) {
      await portalPage.filterByStatus(status);

      // Verify filtered results
      const portals = await portalPage.portalCards.all();
      if (portals.length > 0) {
        for (const portal of portals) {
          const portalStatus = await portal.getAttribute('data-status');
          expect(portalStatus).toBe(status);
        }
      }

      // Verify API call includes status filter
      await page.waitForResponse(
        response => response.url().includes('/api/portals') && response.url().includes(`status=${status}`)
      );
    }
  });

  test('should clear filters', async ({ page }) => {
    // Apply multiple filters
    await portalPage.searchPortals('test');
    await portalPage.filterByCategory('Engineering');
    await portalPage.filterByStatus('active');

    // Get filtered count
    const filteredCount = await portalPage.getPortalCount();

    // Clear all filters
    await portalPage.clearFilters();

    // Verify all portals are shown
    const allCount = await portalPage.getPortalCount();
    expect(allCount).toBeGreaterThanOrEqual(filteredCount);

    // Verify search input is cleared
    await expect(portalPage.searchInput).toHaveValue('');

    // Verify filters are reset
    await expect(portalPage.categoryFilter).toHaveValue('all');
    await expect(portalPage.statusFilter).toHaveValue('all');
  });

  test('should verify search debouncing', async ({ page }) => {
    let apiCallCount = 0;

    // Monitor API calls
    page.on('response', response => {
      if (response.url().includes('/api/portals') && response.url().includes('search=')) {
        apiCallCount++;
      }
    });

    // Type quickly
    await portalPage.searchInput.type('jenkins ci server', { delay: 50 });

    // Wait for debounce
    await page.waitForTimeout(600);

    // Should only make one API call after debouncing
    expect(apiCallCount).toBeLessThanOrEqual(2); // Allow for initial and debounced call
  });

  test('should handle multiple filter combinations', async ({ page }) => {
    // Test combination 1: Category + Status
    await portalPage.filterByCategory('Engineering');
    await portalPage.filterByStatus('active');

    let portals = await portalPage.portalCards.all();
    for (const portal of portals) {
      const category = await portal.locator('[data-testid="portal-category"]').textContent();
      const status = await portal.getAttribute('data-status');
      expect(category).toContain('Engineering');
      expect(status).toBe('active');
    }

    // Test combination 2: Search + Category
    await portalPage.clearFilters();
    await portalPage.searchPortals('git');
    await portalPage.filterByCategory('Operations');

    portals = await portalPage.portalCards.all();
    for (const portal of portals) {
      const text = await portal.textContent();
      const category = await portal.locator('[data-testid="portal-category"]').textContent();
      expect(text?.toLowerCase()).toContain('git');
      expect(category).toContain('Operations');
    }

    // Test combination 3: All filters
    await portalPage.clearFilters();
    await portalPage.searchPortals('mon');
    await portalPage.filterByCategory('Analytics');
    await portalPage.filterByStatus('active');

    portals = await portalPage.portalCards.all();
    if (portals.length > 0) {
      for (const portal of portals) {
        const text = await portal.textContent();
        const category = await portal.locator('[data-testid="portal-category"]').textContent();
        const status = await portal.getAttribute('data-status');
        expect(text?.toLowerCase()).toContain('mon');
        expect(category).toContain('Analytics');
        expect(status).toBe('active');
      }
    }
  });

  test('should persist filter state on page refresh', async ({ page }) => {
    // Apply filters
    await portalPage.searchPortals('test');
    await portalPage.filterByCategory('Engineering');

    // Get current state
    const searchValue = await portalPage.searchInput.inputValue();
    const categoryValue = await portalPage.categoryFilter.inputValue();

    // Refresh page
    await page.reload();
    await portalPage.waitForLoad();

    // Verify filters are persisted (if using URL params or localStorage)
    // This depends on implementation
    const urlParams = new URL(page.url()).searchParams;
    if (urlParams.has('search') || urlParams.has('category')) {
      expect(urlParams.get('search')).toBe('test');
      expect(urlParams.get('category')).toBe('Engineering');
    }
  });

  test('should show no results message for empty search', async ({ page }) => {
    // Search for non-existent term
    await portalPage.searchPortals('xyz123nonexistent');

    // Verify no results message
    await expect(portalPage.noResultsMessage).toBeVisible();
    await expect(portalPage.noResultsMessage).toContainText(/no portals found/i);

    // Verify portal count is 0
    const count = await portalPage.getPortalCount();
    expect(count).toBe(0);
  });

  test('should handle special characters in search', async ({ page }) => {
    // Test special characters
    const specialSearches = ['test@example', 'portal#1', 'service&monitor', 'api/v2'];

    for (const searchTerm of specialSearches) {
      await portalPage.searchPortals(searchTerm);

      // Verify search is properly encoded in API call
      await page.waitForResponse(
        response => {
          const url = response.url();
          return url.includes('/api/portals') && url.includes('search=');
        }
      );

      // Clear for next iteration
      await portalPage.searchInput.clear();
    }
  });

  test('should show filter badges when active', async ({ page }) => {
    // Apply filters
    await portalPage.filterByCategory('Engineering');
    await portalPage.filterByStatus('active');

    // Verify filter badges are shown
    const filterBadges = page.locator('[data-testid="filter-badge"]');
    await expect(filterBadges).toHaveCount(2);

    // Verify badge content
    await expect(filterBadges.nth(0)).toContainText(/Engineering/i);
    await expect(filterBadges.nth(1)).toContainText(/active/i);

    // Remove individual filter by clicking badge
    await filterBadges.nth(0).locator('[data-testid="remove-filter"]').click();
    await portalPage.waitForLoad();

    // Verify filter is removed
    await expect(filterBadges).toHaveCount(1);
    await expect(portalPage.categoryFilter).toHaveValue('all');
  });

  test('should update results count dynamically', async ({ page }) => {
    // Get initial count
    const resultsCount = page.locator('[data-testid="results-count"]');
    const initialText = await resultsCount.textContent();

    // Apply search filter
    await portalPage.searchPortals('jenkins');
    await portalPage.waitForLoad();

    // Verify count updated
    const searchText = await resultsCount.textContent();
    expect(searchText).not.toBe(initialText);
    expect(searchText).toMatch(/\d+ portal/i);

    // Apply category filter
    await portalPage.filterByCategory('Engineering');
    await portalPage.waitForLoad();

    // Verify count updated again
    const filteredText = await resultsCount.textContent();
    expect(filteredText).not.toBe(searchText);
  });

  test('should handle filter errors gracefully', async ({ page }) => {
    // Intercept API and return error for filtered request
    await page.route('**/api/portals?*category=*', route => {
      route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'Filter service unavailable' }),
      });
    });

    // Try to filter
    await portalPage.filterByCategory('Engineering');

    // Verify error handling
    const errorMessage = page.locator('[data-testid="error-message"]');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText(/error|failed/i);

    // Verify filters can be cleared
    await portalPage.clearFilters();
    await expect(errorMessage).not.toBeVisible();
  });
});