/**
 * E2E Tests - Incident Management Flow
 */

import { test, expect } from '@playwright/test';
import { DashboardPage, IncidentsModal } from '../utils/page-objects';
import { waitForAnimations, waitForNetworkIdle } from '../utils/helpers';
import { generateIncident } from '../utils/test-data';

test.describe('Incident Management E2E', () => {
  let dashboard: DashboardPage;

  test.beforeEach(async ({ page }) => {
    dashboard = new DashboardPage(page);
    await dashboard.navigateTo();
    await waitForNetworkIdle(page);
  });

  test('view incidents from dashboard', async ({ page }) => {
    // Click on active incidents stat card
    await dashboard.activeIncidentsCard.click();
    await waitForAnimations(page);

    // Verify incidents modal opened
    const incidentsModal = new IncidentsModal(page);
    await expect(incidentsModal.dialog).toBeVisible();

    // Verify incidents are displayed
    const incidentCount = await incidentsModal.getIncidentCount();
    expect(incidentCount).toBeGreaterThan(0);

    // Close modal
    await incidentsModal.close();
    await expect(incidentsModal.dialog).not.toBeVisible();
  });

  test('create new incident', async ({ page }) => {
    // Open incidents modal
    const viewIncidentsButton = page.locator('[data-testid="view-incidents"]');
    await viewIncidentsButton.click();
    await waitForAnimations(page);

    const incidentsModal = new IncidentsModal(page);

    // Get initial count
    const initialCount = await incidentsModal.getIncidentCount();

    // Click create incident button
    await incidentsModal.createButton.click();
    await waitForAnimations(page);

    // Fill incident form
    const createDialog = page.locator('[role="dialog"][aria-label*="Create"]');
    await createDialog.getByLabel(/title/i).fill('Test Incident E2E');
    await createDialog.getByLabel(/severity/i).selectOption('major');
    await createDialog.getByLabel(/description/i).fill('This is a test incident created by E2E test');

    // Select affected services
    const serviceCheckboxes = createDialog.locator('[data-testid="service-checkbox"]');
    await serviceCheckboxes.nth(0).check();
    await serviceCheckboxes.nth(1).check();

    // Submit form
    await createDialog.getByRole('button', { name: /create|submit/i }).click();
    await waitForAnimations(page);

    // Verify incident was created
    const newCount = await incidentsModal.getIncidentCount();
    expect(newCount).toBe(initialCount + 1);

    // Verify new incident appears
    await incidentsModal.searchIncidents('Test Incident E2E');
    const newIncident = incidentsModal.incidentItems.filter({ hasText: 'Test Incident E2E' });
    await expect(newIncident).toBeVisible();

    // Verify notification
    await page.waitForSelector('[role="status"]:has-text("Incident created")', { timeout: 5000 });
  });

  test('update incident status', async ({ page }) => {
    // Open incidents modal
    const viewIncidentsButton = page.locator('[data-testid="view-incidents"]');
    await viewIncidentsButton.click();
    await waitForAnimations(page);

    const incidentsModal = new IncidentsModal(page);

    // Select first active incident
    const activeIncident = incidentsModal.incidentItems
      .filter({ has: page.locator('[data-status="active"]') })
      .first();

    const incidentTitle = await activeIncident.locator('[data-testid="incident-title"]').textContent();

    // Click on incident to view details
    await activeIncident.click();
    await waitForAnimations(page);

    // Update status
    const detailsDialog = page.locator('[role="dialog"][aria-label*="Details"]');
    const statusSelect = detailsDialog.getByLabel(/status/i);
    await statusSelect.selectOption('investigating');

    // Add update note
    const updateNote = detailsDialog.getByLabel(/update note/i);
    await updateNote.fill('Team is investigating the issue');

    // Save changes
    await detailsDialog.getByRole('button', { name: /update|save/i }).click();
    await waitForAnimations(page);

    // Verify status updated
    const updatedIncident = incidentsModal.incidentItems.filter({ hasText: incidentTitle || '' });
    const newStatus = await updatedIncident.locator('[data-testid="incident-status"]').textContent();
    expect(newStatus).toBe('investigating');

    // Verify notification
    await page.waitForSelector('[role="status"]:has-text("Incident updated")', { timeout: 5000 });
  });

  test('resolve incident', async ({ page }) => {
    // Open incidents modal
    const viewIncidentsButton = page.locator('[data-testid="view-incidents"]');
    await viewIncidentsButton.click();
    await waitForAnimations(page);

    const incidentsModal = new IncidentsModal(page);

    // Find an active or investigating incident
    const unresolvedIncident = incidentsModal.incidentItems
      .filter({ has: page.locator('[data-status="active"], [data-status="investigating"]') })
      .first();

    const incidentTitle = await unresolvedIncident.locator('[data-testid="incident-title"]').textContent();

    // Click on incident
    await unresolvedIncident.click();
    await waitForAnimations(page);

    // Resolve incident
    const detailsDialog = page.locator('[role="dialog"][aria-label*="Details"]');
    const resolveButton = detailsDialog.getByRole('button', { name: /resolve/i });
    await resolveButton.click();
    await waitForAnimations(page);

    // Add resolution note
    const resolutionDialog = page.locator('[role="dialog"][aria-label*="Resolve"]');
    const resolutionNote = resolutionDialog.getByLabel(/resolution/i);
    await resolutionNote.fill('Issue has been resolved. Services are operational.');

    // Confirm resolution
    await resolutionDialog.getByRole('button', { name: /confirm|resolve/i }).click();
    await waitForAnimations(page);

    // Verify incident resolved
    const resolvedIncident = incidentsModal.incidentItems.filter({ hasText: incidentTitle || '' });
    const status = await resolvedIncident.locator('[data-testid="incident-status"]').textContent();
    expect(status).toBe('resolved');

    // Verify badge color changed
    const statusBadge = resolvedIncident.locator('[data-testid="status-badge"]');
    await expect(statusBadge).toHaveClass(/resolved|success|green/);

    // Verify notification
    await page.waitForSelector('[role="status"]:has-text("Incident resolved")', { timeout: 5000 });
  });

  test('filter incidents by severity', async ({ page }) => {
    // Open incidents modal
    const viewIncidentsButton = page.locator('[data-testid="view-incidents"]');
    await viewIncidentsButton.click();
    await waitForAnimations(page);

    const incidentsModal = new IncidentsModal(page);

    // Test each severity filter
    const severities = ['critical', 'major', 'minor', 'informational'] as const;

    for (const severity of severities) {
      await incidentsModal.filterBySeverity(severity);
      await waitForAnimations(page);

      // Verify filtered results
      const incidents = await incidentsModal.incidentItems.all();
      if (incidents.length > 0) {
        for (const incident of incidents) {
          const incidentSeverity = await incident.locator('[data-testid="incident-severity"]').textContent();
          expect(incidentSeverity?.toLowerCase()).toBe(severity);
        }
      }
    }

    // Test 'all' filter
    await incidentsModal.filterBySeverity('all');
    await waitForAnimations(page);

    // Should show all incidents
    const allCount = await incidentsModal.getIncidentCount();
    expect(allCount).toBeGreaterThan(0);
  });

  test('search incidents', async ({ page }) => {
    // Open incidents modal
    const viewIncidentsButton = page.locator('[data-testid="view-incidents"]');
    await viewIncidentsButton.click();
    await waitForAnimations(page);

    const incidentsModal = new IncidentsModal(page);

    // Search for specific term
    await incidentsModal.searchIncidents('database');
    await waitForAnimations(page);

    // Verify search results
    const incidents = await incidentsModal.incidentItems.all();
    for (const incident of incidents) {
      const incidentText = await incident.textContent();
      expect(incidentText?.toLowerCase()).toContain('database');
    }

    // Clear search
    await incidentsModal.searchInput.clear();
    await waitForAnimations(page);

    // Verify all incidents shown
    const allCount = await incidentsModal.getIncidentCount();
    expect(allCount).toBeGreaterThan(incidents.length);
  });

  test('incident timeline view', async ({ page }) => {
    // Check incidents timeline in sidebar
    const timeline = page.locator('[data-testid="incidents-timeline"]');
    await expect(timeline).toBeVisible();

    // Verify timeline items
    const timelineItems = timeline.locator('[data-testid="timeline-item"]');
    const itemCount = await timelineItems.count();
    expect(itemCount).toBeGreaterThan(0);

    // Click on timeline item
    const firstItem = timelineItems.first();
    await firstItem.click();
    await waitForAnimations(page);

    // Verify incident details modal opened
    const detailsDialog = page.locator('[role="dialog"][aria-label*="Details"]');
    await expect(detailsDialog).toBeVisible();

    // Close modal
    await page.keyboard.press('Escape');
    await expect(detailsDialog).not.toBeVisible();
  });

  test('incident notifications', async ({ page }) => {
    // Simulate new incident creation
    await page.evaluate(() => {
      // Trigger incident notification
      const event = new CustomEvent('incident:created', {
        detail: {
          id: 'test-incident',
          title: 'New Critical Incident',
          severity: 'critical'
        }
      });
      window.dispatchEvent(event);
    });

    // Wait for notification
    await page.waitForSelector('[role="alert"]:has-text("New Critical Incident")', { timeout: 5000 });

    // Verify notification appears
    const notification = page.locator('[role="alert"]').filter({ hasText: 'New Critical Incident' });
    await expect(notification).toBeVisible();

    // Click notification to view incident
    await notification.click();
    await waitForAnimations(page);

    // Verify incidents modal opened
    const incidentsModal = page.locator('[role="dialog"][aria-label*="Incidents"]');
    await expect(incidentsModal).toBeVisible();
  });

  test('bulk incident actions', async ({ page }) => {
    // Open incidents modal
    const viewIncidentsButton = page.locator('[data-testid="view-incidents"]');
    await viewIncidentsButton.click();
    await waitForAnimations(page);

    const incidentsModal = new IncidentsModal(page);

    // Enable bulk selection
    const bulkSelectButton = incidentsModal.dialog.locator('[data-testid="bulk-select"]');
    await bulkSelectButton.click();
    await waitForAnimations(page);

    // Select multiple incidents
    const checkboxes = incidentsModal.dialog.locator('[data-testid="incident-checkbox"]');
    await checkboxes.nth(0).check();
    await checkboxes.nth(1).check();
    await checkboxes.nth(2).check();

    // Perform bulk action
    const bulkActionsMenu = incidentsModal.dialog.locator('[data-testid="bulk-actions"]');
    await bulkActionsMenu.click();
    await page.locator('[data-testid="bulk-acknowledge"]').click();
    await waitForAnimations(page);

    // Confirm action
    const confirmDialog = page.locator('[role="dialog"][aria-label*="Confirm"]');
    await confirmDialog.getByRole('button', { name: /confirm/i }).click();
    await waitForAnimations(page);

    // Verify incidents updated
    await page.waitForSelector('[role="status"]:has-text("3 incidents acknowledged")', { timeout: 5000 });
  });

  test('incident export', async ({ page }) => {
    // Open incidents modal
    const viewIncidentsButton = page.locator('[data-testid="view-incidents"]');
    await viewIncidentsButton.click();
    await waitForAnimations(page);

    const incidentsModal = new IncidentsModal(page);

    // Click export button
    const exportButton = incidentsModal.dialog.locator('[data-testid="export-incidents"]');
    await exportButton.click();
    await waitForAnimations(page);

    // Select export format
    const exportDialog = page.locator('[role="dialog"][aria-label*="Export"]');
    await exportDialog.getByLabel(/format/i).selectOption('csv');

    // Select date range
    await exportDialog.getByLabel(/from/i).fill('2024-01-01');
    await exportDialog.getByLabel(/to/i).fill('2024-12-31');

    // Download
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      exportDialog.getByRole('button', { name: /export|download/i }).click()
    ]);

    // Verify download
    expect(download.suggestedFilename()).toContain('incidents');
    expect(download.suggestedFilename()).toContain('.csv');
  });

  test('incident impact assessment', async ({ page }) => {
    // Open incidents modal
    const viewIncidentsButton = page.locator('[data-testid="view-incidents"]');
    await viewIncidentsButton.click();
    await waitForAnimations(page);

    const incidentsModal = new IncidentsModal(page);

    // Select critical incident
    const criticalIncident = incidentsModal.incidentItems
      .filter({ has: page.locator('[data-severity="critical"]') })
      .first();

    await criticalIncident.click();
    await waitForAnimations(page);

    // View impact assessment
    const detailsDialog = page.locator('[role="dialog"][aria-label*="Details"]');
    const impactTab = detailsDialog.locator('[data-testid="tab-impact"]');
    await impactTab.click();
    await waitForAnimations(page);

    // Verify impact information
    const affectedServices = detailsDialog.locator('[data-testid="affected-services"]');
    await expect(affectedServices).toBeVisible();

    const affectedUsers = detailsDialog.locator('[data-testid="affected-users"]');
    await expect(affectedUsers).toBeVisible();

    const estimatedDowntime = detailsDialog.locator('[data-testid="estimated-downtime"]');
    await expect(estimatedDowntime).toBeVisible();
  });
});