/**
 * Common Test Helpers for Playwright Tests
 */

import { Page, expect } from '@playwright/test';
import path from 'path';

/**
 * Wait for animations to complete
 */
export async function waitForAnimations(page: Page, timeout: number = 500) {
  await page.waitForTimeout(timeout);
}

/**
 * Check if element is in viewport
 */
export async function isInViewport(page: Page, selector: string) {
  return await page.evaluate((sel) => {
    const element = document.querySelector(sel);
    if (!element) return false;

    const rect = element.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  }, selector);
}

/**
 * Scroll element into view
 */
export async function scrollIntoView(page: Page, selector: string) {
  await page.evaluate((sel) => {
    const element = document.querySelector(sel);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, selector);
  await waitForAnimations(page, 300);
}

/**
 * Get computed styles for an element
 */
export async function getComputedStyles(page: Page, selector: string, properties: string[]) {
  return await page.evaluate(
    ({ sel, props }) => {
      const element = document.querySelector(sel);
      if (!element) return null;

      const styles = window.getComputedStyle(element);
      const result: Record<string, string> = {};

      props.forEach((prop) => {
        result[prop] = styles.getPropertyValue(prop);
      });

      return result;
    },
    { sel: selector, props: properties }
  );
}

/**
 * Check theme mode
 */
export async function getThemeMode(page: Page): Promise<'light' | 'dark'> {
  return await page.evaluate(() => {
    const htmlElement = document.documentElement;
    return htmlElement.classList.contains('dark') || htmlElement.getAttribute('data-theme') === 'dark'
      ? 'dark'
      : 'light';
  });
}

/**
 * Set theme mode
 */
export async function setThemeMode(page: Page, mode: 'light' | 'dark') {
  await page.evaluate((themeMode) => {
    const htmlElement = document.documentElement;
    if (themeMode === 'dark') {
      htmlElement.classList.add('dark');
      htmlElement.setAttribute('data-theme', 'dark');
    } else {
      htmlElement.classList.remove('dark');
      htmlElement.setAttribute('data-theme', 'light');
    }
  }, mode);
  await waitForAnimations(page, 300);
}

/**
 * Mock API response
 */
export async function mockApiResponse(page: Page, url: string, response: any) {
  await page.route(url, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(response)
    });
  });
}

/**
 * Mock API error
 */
export async function mockApiError(page: Page, url: string, status: number = 500, message: string = 'Server Error') {
  await page.route(url, async (route) => {
    await route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify({ error: message })
    });
  });
}

/**
 * Mock network delay
 */
export async function mockNetworkDelay(page: Page, url: string, delay: number) {
  await page.route(url, async (route) => {
    await page.waitForTimeout(delay);
    await route.continue();
  });
}

/**
 * Take screenshot with timestamp
 */
export async function takeTimestampedScreenshot(page: Page, name: string) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `${name}-${timestamp}.png`;
  await page.screenshot({
    path: path.join('test-results', 'screenshots', filename),
    fullPage: true
  });
  return filename;
}

/**
 * Compare visual regression
 */
export async function compareVisualRegression(page: Page, name: string, threshold: number = 0.2) {
  await expect(page).toHaveScreenshot(`${name}.png`, {
    maxDiffPixels: 100,
    threshold,
    fullPage: true
  });
}

/**
 * Wait for network idle
 */
export async function waitForNetworkIdle(page: Page, timeout: number = 30000) {
  await page.waitForLoadState('networkidle', { timeout });
}

/**
 * Check accessibility
 */
export async function checkAccessibility(page: Page, selector?: string) {
  const violations = await page.evaluate((sel) => {
    // This is a simplified accessibility check
    // In production, you would use axe-core or similar
    const issues: string[] = [];
    const elements = sel ? document.querySelectorAll(sel) : document.querySelectorAll('*');

    elements.forEach((element: Element) => {
      // Check for alt text on images
      if (element.tagName === 'IMG' && !element.getAttribute('alt')) {
        issues.push(`Image missing alt text: ${element.outerHTML.substring(0, 50)}`);
      }

      // Check for labels on form inputs
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes(element.tagName)) {
        const input = element as HTMLInputElement;
        if (input.type !== 'hidden' && !input.getAttribute('aria-label') && !input.id) {
          issues.push(`Form input missing label: ${element.outerHTML.substring(0, 50)}`);
        }
      }

      // Check for button text
      if (element.tagName === 'BUTTON') {
        const button = element as HTMLButtonElement;
        if (!button.textContent?.trim() && !button.getAttribute('aria-label')) {
          issues.push(`Button missing text or aria-label: ${element.outerHTML.substring(0, 50)}`);
        }
      }
    });

    return issues;
  }, selector);

  return violations;
}

/**
 * Get performance metrics
 */
export async function getPerformanceMetrics(page: Page) {
  return await page.evaluate(() => {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    return {
      domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
      loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
      domInteractive: navigation.domInteractive - navigation.fetchStart,
      timeToFirstByte: navigation.responseStart - navigation.requestStart,
      totalTime: navigation.loadEventEnd - navigation.fetchStart
    };
  });
}

/**
 * Check console errors
 */
export async function checkConsoleErrors(page: Page) {
  const errors: string[] = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });

  page.on('pageerror', (error) => {
    errors.push(error.message);
  });

  return errors;
}

/**
 * Mock local storage
 */
export async function setLocalStorage(page: Page, data: Record<string, any>) {
  await page.evaluate((storageData) => {
    Object.entries(storageData).forEach(([key, value]) => {
      localStorage.setItem(key, JSON.stringify(value));
    });
  }, data);
}

/**
 * Get local storage
 */
export async function getLocalStorage(page: Page, key: string) {
  return await page.evaluate((storageKey) => {
    const value = localStorage.getItem(storageKey);
    return value ? JSON.parse(value) : null;
  }, key);
}

/**
 * Clear all storage
 */
export async function clearStorage(page: Page) {
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
}

/**
 * Check if responsive
 */
export async function checkResponsive(page: Page, viewports: Array<{ width: number; height: number; name: string }>) {
  const results: Array<{ name: string; screenshot: string }> = [];

  for (const viewport of viewports) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await waitForAnimations(page, 500);
    const screenshot = await takeTimestampedScreenshot(page, `responsive-${viewport.name}`);
    results.push({ name: viewport.name, screenshot });
  }

  return results;
}

/**
 * Test keyboard navigation
 */
export async function testKeyboardNavigation(page: Page, expectedFocusOrder: string[]) {
  const actualFocusOrder: string[] = [];

  for (let i = 0; i < expectedFocusOrder.length; i++) {
    await page.keyboard.press('Tab');
    const focusedElement = await page.evaluate(() => {
      const element = document.activeElement;
      return element ? element.getAttribute('data-testid') || element.tagName : null;
    });

    if (focusedElement) {
      actualFocusOrder.push(focusedElement);
    }
  }

  return actualFocusOrder;
}

/**
 * Wait for element with retry
 */
export async function waitForElementWithRetry(
  page: Page,
  selector: string,
  options: { timeout?: number; retries?: number } = {}
) {
  const { timeout = 5000, retries = 3 } = options;

  for (let i = 0; i < retries; i++) {
    try {
      await page.waitForSelector(selector, { timeout, state: 'visible' });
      return true;
    } catch (error) {
      if (i === retries - 1) throw error;
      await page.waitForTimeout(1000);
    }
  }

  return false;
}