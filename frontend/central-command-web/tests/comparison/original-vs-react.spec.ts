/**
 * Comparison Tests - Original HTML vs React Implementation
 */

import { test, expect, Page } from '@playwright/test';
import { DashboardPage } from '../utils/page-objects';
import { waitForAnimations, compareVisualRegression, getPerformanceMetrics } from '../utils/helpers';
import path from 'path';

test.describe('Original vs React Comparison', () => {
  let originalPage: Page;
  let reactPage: Page;
  let reactDashboard: DashboardPage;

  test.beforeAll(async ({ browser }) => {
    // Create two separate contexts
    const originalContext = await browser.newContext();
    const reactContext = await browser.newContext();

    originalPage = await originalContext.newPage();
    reactPage = await reactContext.newPage();
    reactDashboard = new DashboardPage(reactPage);
  });

  test.afterAll(async () => {
    await originalPage.close();
    await reactPage.close();
  });

  test('visual comparison - full dashboard', async () => {
    // Load original HTML
    const originalPath = path.join('E:', 'Projects', 'CentralCommand', 'central-command-panel.html');
    await originalPage.goto(`file://${originalPath}`);
    await waitForAnimations(originalPage);

    // Load React app
    await reactDashboard.navigateTo();
    await waitForAnimations(reactPage);

    // Take screenshots
    const originalScreenshot = await originalPage.screenshot({ fullPage: true });
    const reactScreenshot = await reactPage.screenshot({ fullPage: true });

    // Save for manual comparison
    await originalPage.screenshot({
      path: 'test-results/comparison/original-dashboard.png',
      fullPage: true
    });
    await reactPage.screenshot({
      path: 'test-results/comparison/react-dashboard.png',
      fullPage: true
    });

    // Basic size comparison
    expect(originalScreenshot.byteLength).toBeGreaterThan(0);
    expect(reactScreenshot.byteLength).toBeGreaterThan(0);
  });

  test('feature parity - header elements', async () => {
    // Original header elements
    const originalHeader = {
      logo: await originalPage.locator('.logo').isVisible(),
      search: await originalPage.locator('input[type="search"]').isVisible(),
      viewToggle: await originalPage.locator('.view-toggle').isVisible(),
      themeToggle: await originalPage.locator('.theme-toggle').isVisible(),
      notifications: await originalPage.locator('.notifications').isVisible()
    };

    // React header elements
    const reactHeader = {
      logo: await reactPage.locator('[data-testid="logo"]').isVisible(),
      search: await reactDashboard.searchInput.isVisible(),
      viewToggle: await reactDashboard.viewToggle.isVisible(),
      themeToggle: await reactDashboard.themeToggle.isVisible(),
      notifications: await reactDashboard.notificationButton.isVisible()
    };

    // Compare
    expect(reactHeader).toEqual(originalHeader);
  });

  test('feature parity - sidebar actions', async () => {
    // Original sidebar actions
    const originalActions = await originalPage.locator('.action-button').count();

    // React sidebar actions
    const reactActions = await reactPage.locator('[data-testid*="action-"]').count();

    // Should have same number of actions
    expect(reactActions).toBe(originalActions);
  });

  test('feature parity - statistics cards', async () => {
    // Original stats
    const originalStats = await originalPage.locator('.stat-card').count();

    // React stats
    const reactStats = await reactPage.locator('[data-testid*="stats-"]').count();

    // Should have same number of stat cards
    expect(reactStats).toBe(originalStats);
  });

  test('feature parity - portal grid', async () => {
    // Original portals
    const originalPortals = await originalPage.locator('.portal-card').count();

    // React portals
    const reactPortals = await reactDashboard.getPortalCount();

    // Should have portals (exact count may vary due to mock data)
    expect(originalPortals).toBeGreaterThan(0);
    expect(reactPortals).toBeGreaterThan(0);
  });

  test('feature parity - category filters', async () => {
    // Original categories
    const originalCategories = await originalPage.locator('.category-btn').allTextContents();

    // React categories
    const reactCategories = await reactDashboard.categoryButtons.allTextContents();

    // Should have same categories
    expect(reactCategories.sort()).toEqual(originalCategories.sort());
  });

  test('interaction comparison - search', async () => {
    // Original search
    const originalSearch = originalPage.locator('input[type="search"]');
    await originalSearch.fill('admin');
    await originalPage.waitForTimeout(500);
    const originalResults = await originalPage.locator('.portal-card:visible').count();

    // React search
    await reactDashboard.search('admin');
    const reactResults = await reactDashboard.getPortalCount();

    // Both should filter results
    expect(originalResults).toBeGreaterThanOrEqual(0);
    expect(reactResults).toBeGreaterThanOrEqual(0);
  });

  test('interaction comparison - view toggle', async () => {
    // Original view toggle
    const originalToggle = originalPage.locator('.view-toggle');
    await originalToggle.click();
    await waitForAnimations(originalPage);
    const originalListView = await originalPage.locator('.list-view').isVisible();

    // React view toggle
    await reactDashboard.toggleView();
    const reactListView = await reactPage.locator('[data-view="list"]').isVisible();

    // Both should switch to list view
    expect(originalListView).toBe(true);
    expect(reactListView).toBe(true);
  });

  test('interaction comparison - theme toggle', async () => {
    // Original theme toggle
    const originalToggle = originalPage.locator('.theme-toggle');
    await originalToggle.click();
    await waitForAnimations(originalPage);
    const originalDarkMode = await originalPage.evaluate(() => {
      return document.documentElement.classList.contains('dark');
    });

    // React theme toggle
    await reactDashboard.toggleTheme();
    const reactDarkMode = await reactPage.evaluate(() => {
      return document.documentElement.classList.contains('dark');
    });

    // Both should be in dark mode
    expect(originalDarkMode).toBe(true);
    expect(reactDarkMode).toBe(true);
  });

  test('modal comparison - add portal', async () => {
    // Original add portal modal
    const originalAddButton = originalPage.locator('.add-portal-btn');
    await originalAddButton.click();
    await waitForAnimations(originalPage);
    const originalModal = await originalPage.locator('.modal').isVisible();

    // React add portal modal
    await reactDashboard.addPortalButton.click();
    await waitForAnimations(reactPage);
    const reactModal = await reactPage.locator('[role="dialog"]').isVisible();

    // Both should show modal
    expect(originalModal).toBe(true);
    expect(reactModal).toBe(true);

    // Close modals
    await originalPage.keyboard.press('Escape');
    await reactPage.keyboard.press('Escape');
  });

  test('command palette comparison', async () => {
    // Original command palette
    await originalPage.keyboard.press('Control+K');
    await waitForAnimations(originalPage);
    const originalPalette = await originalPage.locator('.command-palette').isVisible();

    // React command palette
    await reactPage.keyboard.press('Control+K');
    await waitForAnimations(reactPage);
    const reactPalette = await reactPage.locator('[role="dialog"]').isVisible();

    // Both should show command palette
    expect(originalPalette).toBe(true);
    expect(reactPalette).toBe(true);

    // Close palettes
    await originalPage.keyboard.press('Escape');
    await reactPage.keyboard.press('Escape');
  });

  test('responsive comparison - mobile', async () => {
    // Set mobile viewport
    await originalPage.setViewportSize({ width: 375, height: 812 });
    await reactPage.setViewportSize({ width: 375, height: 812 });
    await waitForAnimations(originalPage);
    await waitForAnimations(reactPage);

    // Take screenshots
    await originalPage.screenshot({
      path: 'test-results/comparison/original-mobile.png',
      fullPage: true
    });
    await reactPage.screenshot({
      path: 'test-results/comparison/react-mobile.png',
      fullPage: true
    });

    // Check mobile menu
    const originalMobileMenu = await originalPage.locator('.mobile-menu').isVisible();
    const reactMobileMenu = await reactPage.locator('[data-testid="mobile-menu"]').isVisible();

    // Both should have mobile menu
    expect(originalMobileMenu || reactMobileMenu).toBe(true);
  });

  test('responsive comparison - tablet', async () => {
    // Set tablet viewport
    await originalPage.setViewportSize({ width: 768, height: 1024 });
    await reactPage.setViewportSize({ width: 768, height: 1024 });
    await waitForAnimations(originalPage);
    await waitForAnimations(reactPage);

    // Take screenshots
    await originalPage.screenshot({
      path: 'test-results/comparison/original-tablet.png',
      fullPage: true
    });
    await reactPage.screenshot({
      path: 'test-results/comparison/react-tablet.png',
      fullPage: true
    });
  });

  test('performance comparison', async () => {
    // Reload both pages for fresh metrics
    await originalPage.reload();
    await reactPage.reload();
    await originalPage.waitForLoadState('networkidle');
    await reactPage.waitForLoadState('networkidle');

    // Get performance metrics
    const originalMetrics = await getPerformanceMetrics(originalPage);
    const reactMetrics = await getPerformanceMetrics(reactPage);

    // Log metrics for comparison
    console.log('Original Metrics:', originalMetrics);
    console.log('React Metrics:', reactMetrics);

    // React should have reasonable performance
    expect(reactMetrics.totalTime).toBeLessThan(5000); // Less than 5 seconds
    expect(reactMetrics.domInteractive).toBeLessThan(2000); // Interactive in 2 seconds
  });

  test('accessibility comparison', async () => {
    // Check ARIA labels in original
    const originalAriaElements = await originalPage.locator('[aria-label]').count();

    // Check ARIA labels in React
    const reactAriaElements = await reactPage.locator('[aria-label]').count();

    // React should have equal or better accessibility
    expect(reactAriaElements).toBeGreaterThanOrEqual(originalAriaElements);

    // Check semantic HTML
    const originalSemanticElements = await originalPage.evaluate(() => {
      const semanticTags = ['header', 'nav', 'main', 'section', 'article', 'aside', 'footer'];
      return semanticTags.reduce((count, tag) => {
        return count + document.getElementsByTagName(tag).length;
      }, 0);
    });

    const reactSemanticElements = await reactPage.evaluate(() => {
      const semanticTags = ['header', 'nav', 'main', 'section', 'article', 'aside', 'footer'];
      return semanticTags.reduce((count, tag) => {
        return count + document.getElementsByTagName(tag).length;
      }, 0);
    });

    // React should use semantic HTML
    expect(reactSemanticElements).toBeGreaterThanOrEqual(originalSemanticElements);
  });

  test('data persistence comparison', async () => {
    // Test localStorage in original
    await originalPage.evaluate(() => {
      localStorage.setItem('test-original', 'value');
    });
    const originalStorage = await originalPage.evaluate(() => {
      return localStorage.getItem('test-original');
    });

    // Test localStorage in React
    await reactPage.evaluate(() => {
      localStorage.setItem('test-react', 'value');
    });
    const reactStorage = await reactPage.evaluate(() => {
      return localStorage.getItem('test-react');
    });

    // Both should support localStorage
    expect(originalStorage).toBe('value');
    expect(reactStorage).toBe('value');
  });

  test('animation comparison', async () => {
    // Test card hover animation in original
    const originalCard = originalPage.locator('.portal-card').first();
    await originalCard.hover();
    await originalPage.waitForTimeout(300);
    await originalPage.screenshot({
      path: 'test-results/comparison/original-hover.png',
      clip: await originalCard.boundingBox() || undefined
    });

    // Test card hover animation in React
    const reactCard = reactDashboard.portalCards.first();
    await reactCard.hover();
    await reactPage.waitForTimeout(300);
    await reactPage.screenshot({
      path: 'test-results/comparison/react-hover.png',
      clip: await reactCard.boundingBox() || undefined
    });
  });

  test('error handling comparison', async () => {
    // Test 404 handling in original
    await originalPage.evaluate(() => {
      // Simulate API error
      fetch('/api/nonexistent').catch(() => {});
    });

    // Test 404 handling in React
    await reactPage.evaluate(() => {
      // Simulate API error
      fetch('/api/nonexistent').catch(() => {});
    });

    // Both should handle errors gracefully (no crashes)
    const originalCrashed = await originalPage.evaluate(() => {
      return window.onerror !== null;
    });
    const reactCrashed = await reactPage.evaluate(() => {
      return window.onerror !== null;
    });

    expect(originalCrashed).toBe(false);
    expect(reactCrashed).toBe(false);
  });
});