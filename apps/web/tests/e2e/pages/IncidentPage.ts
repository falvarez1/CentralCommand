import { Page, Locator } from '@playwright/test';

export class IncidentPage {
  readonly page: Page;
  readonly incidentList: Locator;
  readonly severityFilter: Locator;
  readonly createIncidentButton: Locator;
  readonly incidentItems: Locator;
  readonly incidentCountBadge: Locator;
  readonly notificationToast: Locator;

  constructor(page: Page) {
    this.page = page;
    this.incidentList = page.locator('[data-testid="incident-list"]');
    this.severityFilter = page.getByRole('combobox', { name: /severity/i });
    this.createIncidentButton = page.getByRole('button', { name: /report incident/i });
    this.incidentItems = page.locator('[data-testid="incident-item"]');
    this.incidentCountBadge = page.locator('[data-testid="incident-count"]');
    this.notificationToast = page.locator('[role="alert"]');
  }

  async goto() {
    await this.page.goto('/incidents');
    await this.page.waitForLoadState('networkidle');
  }

  async filterBySeverity(severity: 'critical' | 'high' | 'medium' | 'low') {
    await this.severityFilter.selectOption(severity);
    await this.page.waitForTimeout(300);
  }

  async createIncident(data: {
    title: string;
    description: string;
    severity: string;
    affectedPortal: string;
  }) {
    await this.createIncidentButton.click();

    const modal = this.page.locator('[role="dialog"]');
    await modal.waitFor({ state: 'visible' });

    await modal.getByLabel(/title/i).fill(data.title);
    await modal.getByLabel(/description/i).fill(data.description);
    await modal.getByLabel(/severity/i).selectOption(data.severity);
    await modal.getByLabel(/affected portal/i).selectOption(data.affectedPortal);

    await modal.getByRole('button', { name: /create|submit/i }).click();
    await modal.waitFor({ state: 'hidden' });
  }

  async viewIncidentDetails(incidentTitle: string) {
    const incident = this.incidentItems.filter({ hasText: incidentTitle });
    await incident.click();

    const detailsModal = this.page.locator('[role="dialog"]');
    await detailsModal.waitFor({ state: 'visible' });
    return detailsModal;
  }

  async getIncidentCount(): Promise<number> {
    const countText = await this.incidentCountBadge.textContent();
    return parseInt(countText || '0', 10);
  }

  async waitForNotification(text?: string) {
    if (text) {
      await this.notificationToast.filter({ hasText: text }).waitFor({ state: 'visible' });
    } else {
      await this.notificationToast.waitFor({ state: 'visible' });
    }
  }

  async dismissNotification() {
    const closeButton = this.notificationToast.getByRole('button', { name: /close|dismiss/i });
    if (await closeButton.isVisible()) {
      await closeButton.click();
    }
  }
}