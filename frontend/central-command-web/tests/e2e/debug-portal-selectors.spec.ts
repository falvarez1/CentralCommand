import { test, expect } from '@playwright/test';

test.describe('Debug Portal Selectors', () => {
  test('should inspect DOM for portal elements', async ({ page }) => {
    // Navigate to the page
    await page.goto('http://localhost:5173');

    // Wait for the page to load
    await page.waitForLoadState('networkidle');

    // Wait a bit for React to render
    await page.waitForTimeout(3000);

    // Log all elements with data-testid
    const elementsWithTestId = await page.$$eval('[data-testid]', elements =>
      elements.map(el => ({
        testId: el.getAttribute('data-testid'),
        tagName: el.tagName.toLowerCase(),
        className: el.className,
        text: el.textContent?.substring(0, 50)
      }))
    );
    console.log('Elements with data-testid:', elementsWithTestId);

    // Look for any div with class containing 'card'
    const cardElements = await page.$$eval('div[class*="card"]', elements =>
      elements.map(el => ({
        className: el.className,
        dataTestId: el.getAttribute('data-testid'),
        text: el.textContent?.substring(0, 50)
      }))
    );
    console.log('Card elements found:', cardElements);

    // Look for specific portal-related content
    const portalContent = await page.$$eval('*', elements => {
      const portalElements = [];
      for (const el of elements) {
        const text = el.textContent || '';
        if (text.includes('Portal') || text.includes('portal')) {
          portalElements.push({
            tagName: el.tagName.toLowerCase(),
            className: el.className,
            dataTestId: el.getAttribute('data-testid'),
            id: el.id,
            text: text.substring(0, 100)
          });
        }
      }
      return portalElements.slice(0, 20); // Limit to first 20 to avoid too much output
    });
    console.log('Portal-related elements:', portalContent);

    // Take a screenshot for visual inspection
    await page.screenshot({ path: 'debug-portal-page.png', fullPage: true });

    // Check if the API is returning data
    const apiResponse = await page.evaluate(async () => {
      try {
        const response = await fetch('http://localhost:5000/api/Portals');
        const data = await response.json();
        return { status: response.status, count: data.length };
      } catch (error) {
        return { error: error.message };
      }
    });
    console.log('API Response:', apiResponse);
  });
});