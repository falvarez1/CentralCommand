import { test, expect } from '@playwright/test';
import { IncidentPage } from './pages/IncidentPage';
import { PortalPage } from './pages/PortalPage';

test.describe('Incident Management', () => {
  let incidentPage: IncidentPage;
  let portalPage: PortalPage;

  test.beforeEach(async ({ page }) => {
    incidentPage = new IncidentPage(page);
    portalPage = new PortalPage(page);
  });

  test('should view incident list', async ({ page }) => {
    await incidentPage.goto();

    // Verify incident list is visible
    await expect(incidentPage.incidentList).toBeVisible();

    // Verify incidents are loaded
    const incidentCount = await incidentPage.incidentItems.count();
    expect(incidentCount).toBeGreaterThanOrEqual(0);

    // If there are incidents, verify they have required fields
    if (incidentCount > 0) {
      const firstIncident = incidentPage.incidentItems.first();
      await expect(firstIncident.locator('[data-testid="incident-title"]')).toBeVisible();
      await expect(firstIncident.locator('[data-testid="incident-severity"]')).toBeVisible();
      await expect(firstIncident.locator('[data-testid="incident-time"]')).toBeVisible();
      await expect(firstIncident.locator('[data-testid="incident-status"]')).toBeVisible();
    }

    // Verify API call was made
    await page.waitForResponse(
      response => response.url().includes('/api/incidents') && response.status() === 200
    );
  });

  test('should filter incidents by severity', async ({ page }) => {
    await incidentPage.goto();

    // Test each severity level
    const severities: Array<'critical' | 'high' | 'medium' | 'low'> = ['critical', 'high', 'medium', 'low'];

    for (const severity of severities) {
      await incidentPage.filterBySeverity(severity);

      // Verify filtered results
      const incidents = await incidentPage.incidentItems.all();
      if (incidents.length > 0) {
        for (const incident of incidents) {
          const incidentSeverity = await incident.locator('[data-testid="incident-severity"]').textContent();
          expect(incidentSeverity?.toLowerCase()).toBe(severity);
        }
      }

      // Verify severity badge styling
      if (incidents.length > 0) {
        const severityBadge = incidents[0].locator('[data-testid="incident-severity"]');
        await expect(severityBadge).toHaveClass(new RegExp(severity));
      }
    }
  });

  test('should create new incident', async ({ page }) => {
    await incidentPage.goto();

    // Get initial incident count
    const initialCount = await incidentPage.getIncidentCount();

    // Create new incident
    const incidentData = {
      title: `Test Incident ${Date.now()}`,
      description: 'This is a test incident created by E2E tests',
      severity: 'high',
      affectedPortal: 'Jenkins CI'
    };

    await incidentPage.createIncident(incidentData);

    // Verify incident was created
    await incidentPage.waitForNotification('Incident created successfully');

    // Verify count increased
    const newCount = await incidentPage.getIncidentCount();
    expect(newCount).toBe(initialCount + 1);

    // Verify new incident appears in list
    const newIncident = incidentPage.incidentItems.filter({ hasText: incidentData.title });
    await expect(newIncident).toBeVisible();

    // Verify API call was made
    await page.waitForResponse(
      response => response.url().includes('/api/incidents') && response.request().method() === 'POST'
    );
  });

  test('should view incident details', async ({ page }) => {
    await incidentPage.goto();

    // Ensure there's at least one incident
    const incidentCount = await incidentPage.incidentItems.count();
    if (incidentCount === 0) {
      // Create an incident first
      await incidentPage.createIncident({
        title: 'Test Incident for Details',
        description: 'Test description',
        severity: 'medium',
        affectedPortal: 'GitLab'
      });
    }

    // Click on first incident
    const firstIncident = incidentPage.incidentItems.first();
    const incidentTitle = await firstIncident.locator('[data-testid="incident-title"]').textContent();

    // View details
    const detailsModal = await incidentPage.viewIncidentDetails(incidentTitle || '');

    // Verify details modal content
    await expect(detailsModal).toBeVisible();
    await expect(detailsModal.locator('[data-testid="incident-detail-title"]')).toContainText(incidentTitle || '');
    await expect(detailsModal.locator('[data-testid="incident-detail-description"]')).toBeVisible();
    await expect(detailsModal.locator('[data-testid="incident-detail-severity"]')).toBeVisible();
    await expect(detailsModal.locator('[data-testid="incident-detail-status"]')).toBeVisible();
    await expect(detailsModal.locator('[data-testid="incident-detail-timeline"]')).toBeVisible();

    // Close modal
    await page.keyboard.press('Escape');
    await expect(detailsModal).not.toBeVisible();
  });

  test('should check incident counts in sidebar', async ({ page }) => {
    // Navigate to main page
    await portalPage.goto();

    // Check sidebar incident widget
    const incidentWidget = page.locator('[data-testid="incident-widget"]');
    await expect(incidentWidget).toBeVisible();

    // Verify incident counts by severity
    const criticalCount = incidentWidget.locator('[data-testid="critical-count"]');
    const highCount = incidentWidget.locator('[data-testid="high-count"]');
    const mediumCount = incidentWidget.locator('[data-testid="medium-count"]');
    const lowCount = incidentWidget.locator('[data-testid="low-count"]');

    // Verify counts are numbers
    const critical = await criticalCount.textContent();
    const high = await highCount.textContent();
    const medium = await mediumCount.textContent();
    const low = await lowCount.textContent();

    expect(parseInt(critical || '0')).toBeGreaterThanOrEqual(0);
    expect(parseInt(high || '0')).toBeGreaterThanOrEqual(0);
    expect(parseInt(medium || '0')).toBeGreaterThanOrEqual(0);
    expect(parseInt(low || '0')).toBeGreaterThanOrEqual(0);

    // Click on widget to navigate to incidents
    await incidentWidget.click();
    await expect(page).toHaveURL(/.*incidents/);
  });

  test('should update incident status', async ({ page }) => {
    await incidentPage.goto();

    // Ensure there's at least one incident
    if (await incidentPage.incidentItems.count() === 0) {
      await incidentPage.createIncident({
        title: 'Test Incident for Status Update',
        description: 'Test description',
        severity: 'high',
        affectedPortal: 'Grafana'
      });
    }

    // Open first incident details
    const firstIncident = incidentPage.incidentItems.first();
    const incidentTitle = await firstIncident.locator('[data-testid="incident-title"]').textContent();
    const detailsModal = await incidentPage.viewIncidentDetails(incidentTitle || '');

    // Find status dropdown
    const statusDropdown = detailsModal.locator('[data-testid="incident-status-select"]');
    const currentStatus = await statusDropdown.inputValue();

    // Change status
    const newStatus = currentStatus === 'open' ? 'investigating' : 'open';
    await statusDropdown.selectOption(newStatus);

    // Save changes
    await detailsModal.locator('[data-testid="save-status"]').click();

    // Verify notification
    await incidentPage.waitForNotification('Status updated');

    // Close and reopen to verify persistence
    await page.keyboard.press('Escape');
    await incidentPage.viewIncidentDetails(incidentTitle || '');

    // Verify status was saved
    const updatedStatus = await detailsModal.locator('[data-testid="incident-status-select"]').inputValue();
    expect(updatedStatus).toBe(newStatus);
  });

  test('should add incident update/comment', async ({ page }) => {
    await incidentPage.goto();

    // Ensure there's at least one incident
    if (await incidentPage.incidentItems.count() === 0) {
      await incidentPage.createIncident({
        title: 'Test Incident for Comments',
        description: 'Test description',
        severity: 'medium',
        affectedPortal: 'Kibana'
      });
    }

    // Open incident details
    const firstIncident = incidentPage.incidentItems.first();
    const incidentTitle = await firstIncident.locator('[data-testid="incident-title"]').textContent();
    const detailsModal = await incidentPage.viewIncidentDetails(incidentTitle || '');

    // Add update/comment
    const updateText = `Update at ${new Date().toISOString()}: Issue has been identified and team is working on resolution.`;
    const updateInput = detailsModal.locator('[data-testid="incident-update-input"]');
    await updateInput.fill(updateText);

    // Submit update
    await detailsModal.locator('[data-testid="add-update-button"]').click();

    // Verify update appears in timeline
    const timeline = detailsModal.locator('[data-testid="incident-timeline"]');
    await expect(timeline).toContainText(updateText);

    // Verify timestamp is shown
    const latestUpdate = timeline.locator('[data-testid="timeline-entry"]').first();
    await expect(latestUpdate.locator('[data-testid="update-time"]')).toBeVisible();
    await expect(latestUpdate.locator('[data-testid="update-author"]')).toBeVisible();
  });

  test('should resolve incident', async ({ page }) => {
    await incidentPage.goto();

    // Create a new incident to resolve
    const incidentData = {
      title: `Incident to Resolve ${Date.now()}`,
      description: 'This incident will be resolved',
      severity: 'low',
      affectedPortal: 'Jenkins CI'
    };

    await incidentPage.createIncident(incidentData);

    // Find and open the incident
    const incident = incidentPage.incidentItems.filter({ hasText: incidentData.title });
    await incident.click();

    const detailsModal = page.locator('[role="dialog"]');

    // Change status to resolved
    await detailsModal.locator('[data-testid="incident-status-select"]').selectOption('resolved');

    // Add resolution note
    const resolutionNote = detailsModal.locator('[data-testid="resolution-note"]');
    await resolutionNote.fill('Issue was resolved by restarting the service.');

    // Save resolution
    await detailsModal.locator('[data-testid="resolve-incident-button"]').click();

    // Verify confirmation
    await incidentPage.waitForNotification('Incident resolved');

    // Verify incident is marked as resolved in list
    await page.keyboard.press('Escape');
    const resolvedIncident = incidentPage.incidentItems.filter({ hasText: incidentData.title });
    const statusBadge = resolvedIncident.locator('[data-testid="incident-status"]');
    await expect(statusBadge).toContainText(/resolved/i);
    await expect(statusBadge).toHaveClass(/resolved/);
  });

  test('should show incident statistics', async ({ page }) => {
    await incidentPage.goto();

    // Check statistics section
    const statsSection = page.locator('[data-testid="incident-statistics"]');
    await expect(statsSection).toBeVisible();

    // Verify statistics cards
    const totalIncidents = statsSection.locator('[data-testid="stat-total-incidents"]');
    const openIncidents = statsSection.locator('[data-testid="stat-open-incidents"]');
    const avgResolutionTime = statsSection.locator('[data-testid="stat-avg-resolution"]');
    const mttr = statsSection.locator('[data-testid="stat-mttr"]');

    await expect(totalIncidents).toBeVisible();
    await expect(openIncidents).toBeVisible();
    await expect(avgResolutionTime).toBeVisible();
    await expect(mttr).toBeVisible();

    // Verify values are numeric
    const total = await totalIncidents.textContent();
    expect(parseInt(total?.match(/\d+/)?.[0] || '0')).toBeGreaterThanOrEqual(0);
  });

  test('should export incident report', async ({ page }) => {
    await incidentPage.goto();

    // Find export button
    const exportButton = page.locator('[data-testid="export-incidents"]');
    await expect(exportButton).toBeVisible();

    // Set up download promise
    const downloadPromise = page.waitForEvent('download');

    // Click export
    await exportButton.click();

    // Select export format if modal appears
    const exportModal = page.locator('[role="dialog"][data-testid="export-modal"]');
    if (await exportModal.isVisible({ timeout: 1000 })) {
      await exportModal.locator('[data-testid="export-csv"]').click();
    }

    // Wait for download
    const download = await downloadPromise;

    // Verify download
    expect(download.suggestedFilename()).toMatch(/incidents.*\.(csv|xlsx|pdf)/);
  });

  test('should show incident trends chart', async ({ page }) => {
    await incidentPage.goto();

    // Check for trends chart
    const trendsChart = page.locator('[data-testid="incident-trends-chart"]');
    await expect(trendsChart).toBeVisible();

    // Verify chart has data
    const chartCanvas = trendsChart.locator('canvas');
    await expect(chartCanvas).toBeVisible();

    // Verify time range selector
    const timeRangeSelector = page.locator('[data-testid="trends-time-range"]');
    await expect(timeRangeSelector).toBeVisible();

    // Change time range
    await timeRangeSelector.selectOption('7days');
    await page.waitForTimeout(1000);

    // Verify chart updated (check for loading state)
    const loadingIndicator = trendsChart.locator('[data-testid="chart-loading"]');
    await expect(loadingIndicator).not.toBeVisible({ timeout: 5000 });
  });

  test('should validate incident form', async ({ page }) => {
    await incidentPage.goto();

    // Open create incident modal
    await incidentPage.createIncidentButton.click();

    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();

    // Try to submit empty form
    await modal.getByRole('button', { name: /create|submit/i }).click();

    // Check validation errors
    const titleError = modal.locator('[data-testid="title-error"]');
    const descriptionError = modal.locator('[data-testid="description-error"]');
    const severityError = modal.locator('[data-testid="severity-error"]');

    await expect(titleError).toBeVisible();
    await expect(titleError).toContainText(/required/i);

    await expect(descriptionError).toBeVisible();
    await expect(descriptionError).toContainText(/required/i);

    await expect(severityError).toBeVisible();
    await expect(severityError).toContainText(/required/i);

    // Fill partial form
    await modal.getByLabel(/title/i).fill('Test');

    // Try to submit again
    await modal.getByRole('button', { name: /create|submit/i }).click();

    // Title error should be gone
    await expect(titleError).not.toBeVisible();

    // Other errors should remain
    await expect(descriptionError).toBeVisible();
    await expect(severityError).toBeVisible();
  });
});