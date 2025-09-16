/**
 * Page Object Models for Playwright Tests
 */

import { Page, Locator } from '@playwright/test';

/**
 * Base Page Object
 */
export class BasePage {
  constructor(protected page: Page) {}

  async navigateTo(path: string = '/') {
    await this.page.goto(path);
    await this.page.waitForLoadState('networkidle');
  }

  async takeScreenshot(name: string) {
    await this.page.screenshot({ path: `test-results/screenshots/${name}.png`, fullPage: true });
  }

  async waitForToast() {
    await this.page.locator('[role="status"]').waitFor({ state: 'visible' });
  }

  async dismissToast() {
    const toast = this.page.locator('[role="status"]');
    if (await toast.isVisible()) {
      await toast.locator('button').click();
      await toast.waitFor({ state: 'hidden' });
    }
  }
}

/**
 * Dashboard Page Object
 */
export class DashboardPage extends BasePage {
  // Header elements
  readonly searchInput: Locator;
  readonly viewToggle: Locator;
  readonly themeToggle: Locator;
  readonly notificationButton: Locator;
  readonly commandPaletteButton: Locator;

  // Sidebar elements
  readonly deployButton: Locator;
  readonly healthCheckButton: Locator;
  readonly maintenanceButton: Locator;
  readonly emergencyButton: Locator;
  readonly exportButton: Locator;
  readonly bulkActionsButton: Locator;

  // Stats elements
  readonly totalPortalsCard: Locator;
  readonly operationalCard: Locator;
  readonly avgUptimeCard: Locator;
  readonly activeIncidentsCard: Locator;

  // Category filter
  readonly categoryButtons: Locator;
  readonly allCategoryButton: Locator;

  // Portal grid/list
  readonly portalGrid: Locator;
  readonly portalCards: Locator;
  readonly addPortalButton: Locator;

  constructor(page: Page) {
    super(page);

    // Header
    this.searchInput = page.getByPlaceholder('Search portals...');
    this.viewToggle = page.getByRole('button', { name: /view/i });
    this.themeToggle = page.getByRole('button', { name: /theme/i });
    this.notificationButton = page.getByRole('button', { name: /notifications/i });
    this.commandPaletteButton = page.getByRole('button', { name: /command/i });

    // Sidebar
    this.deployButton = page.getByRole('button', { name: /deploy all/i });
    this.healthCheckButton = page.getByRole('button', { name: /health check/i });
    this.maintenanceButton = page.getByRole('button', { name: /maintenance/i });
    this.emergencyButton = page.getByRole('button', { name: /emergency/i });
    this.exportButton = page.getByRole('button', { name: /export/i });
    this.bulkActionsButton = page.getByRole('button', { name: /bulk actions/i });

    // Stats
    this.totalPortalsCard = page.locator('[data-testid="stats-total-portals"]');
    this.operationalCard = page.locator('[data-testid="stats-operational"]');
    this.avgUptimeCard = page.locator('[data-testid="stats-uptime"]');
    this.activeIncidentsCard = page.locator('[data-testid="stats-incidents"]');

    // Categories
    this.categoryButtons = page.locator('[data-testid="category-filter"] button');
    this.allCategoryButton = page.getByRole('button', { name: /all/i });

    // Portals
    this.portalGrid = page.locator('[data-testid="portal-grid"]');
    this.portalCards = page.locator('[data-testid="portal-card"]');
    this.addPortalButton = page.getByRole('button', { name: /add.*portal/i });
  }

  async search(term: string) {
    await this.searchInput.fill(term);
    await this.page.waitForTimeout(500); // Debounce
  }

  async clearSearch() {
    await this.searchInput.clear();
  }

  async toggleView() {
    await this.viewToggle.click();
    await this.page.waitForTimeout(300); // Animation
  }

  async toggleTheme() {
    await this.themeToggle.click();
    await this.page.waitForTimeout(300); // Animation
  }

  async filterByCategory(category: string) {
    await this.page.getByRole('button', { name: category, exact: true }).click();
    await this.page.waitForTimeout(300); // Animation
  }

  async getPortalCount() {
    return await this.portalCards.count();
  }

  async getPortalByName(name: string) {
    return this.page.locator(`[data-testid="portal-card"]:has-text("${name}")`);
  }

  async toggleFavorite(portalName: string) {
    const portal = await this.getPortalByName(portalName);
    await portal.locator('[data-testid="favorite-button"]').click();
  }

  async openPortalActions(portalName: string) {
    const portal = await this.getPortalByName(portalName);
    await portal.locator('[data-testid="portal-actions"]').click();
  }

  async getStats() {
    return {
      totalPortals: await this.totalPortalsCard.locator('[data-testid="stat-value"]').textContent(),
      operational: await this.operationalCard.locator('[data-testid="stat-value"]').textContent(),
      avgUptime: await this.avgUptimeCard.locator('[data-testid="stat-value"]').textContent(),
      activeIncidents: await this.activeIncidentsCard.locator('[data-testid="stat-value"]').textContent()
    };
  }
}

/**
 * Command Palette Page Object
 */
export class CommandPalettePage extends BasePage {
  readonly trigger: Locator;
  readonly dialog: Locator;
  readonly searchInput: Locator;
  readonly commandList: Locator;
  readonly commandItems: Locator;

  constructor(page: Page) {
    super(page);
    this.trigger = page.getByRole('button', { name: /⌘K/i });
    this.dialog = page.getByRole('dialog', { name: /command/i });
    this.searchInput = this.dialog.getByPlaceholder(/search commands/i);
    this.commandList = this.dialog.locator('[data-testid="command-list"]');
    this.commandItems = this.commandList.locator('[data-testid="command-item"]');
  }

  async open() {
    // Try keyboard shortcut first
    await this.page.keyboard.press('Control+K');

    // Fallback to button click if dialog doesn't appear
    if (!(await this.dialog.isVisible())) {
      await this.trigger.click();
    }

    await this.dialog.waitFor({ state: 'visible' });
  }

  async close() {
    await this.page.keyboard.press('Escape');
    await this.dialog.waitFor({ state: 'hidden' });
  }

  async search(term: string) {
    await this.searchInput.fill(term);
    await this.page.waitForTimeout(100); // Debounce
  }

  async selectCommand(name: string) {
    await this.commandItems.filter({ hasText: name }).click();
  }

  async executeCommand(name: string) {
    await this.search(name);
    await this.selectCommand(name);
  }

  async getCommandCount() {
    return await this.commandItems.count();
  }

  async getVisibleCommands() {
    return await this.commandItems.allTextContents();
  }
}

/**
 * Add Portal Modal Page Object
 */
export class AddPortalModal extends BasePage {
  readonly dialog: Locator;
  readonly nameInput: Locator;
  readonly urlInput: Locator;
  readonly categorySelect: Locator;
  readonly descriptionInput: Locator;
  readonly submitButton: Locator;
  readonly cancelButton: Locator;
  readonly closeButton: Locator;

  constructor(page: Page) {
    super(page);
    this.dialog = page.getByRole('dialog', { name: /add.*portal/i });
    this.nameInput = this.dialog.getByLabel(/name/i);
    this.urlInput = this.dialog.getByLabel(/url/i);
    this.categorySelect = this.dialog.getByLabel(/category/i);
    this.descriptionInput = this.dialog.getByLabel(/description/i);
    this.submitButton = this.dialog.getByRole('button', { name: /add|create|submit/i });
    this.cancelButton = this.dialog.getByRole('button', { name: /cancel/i });
    this.closeButton = this.dialog.getByRole('button', { name: /close/i });
  }

  async fillForm(data: {
    name: string;
    url: string;
    category?: string;
    description?: string;
  }) {
    await this.nameInput.fill(data.name);
    await this.urlInput.fill(data.url);

    if (data.category) {
      await this.categorySelect.selectOption(data.category);
    }

    if (data.description) {
      await this.descriptionInput.fill(data.description);
    }
  }

  async submit() {
    await this.submitButton.click();
    await this.dialog.waitFor({ state: 'hidden' });
  }

  async cancel() {
    await this.cancelButton.click();
    await this.dialog.waitFor({ state: 'hidden' });
  }

  async close() {
    await this.closeButton.click();
    await this.dialog.waitFor({ state: 'hidden' });
  }
}

/**
 * Incidents Modal Page Object
 */
export class IncidentsModal extends BasePage {
  readonly dialog: Locator;
  readonly incidentList: Locator;
  readonly incidentItems: Locator;
  readonly filterButtons: Locator;
  readonly searchInput: Locator;
  readonly createButton: Locator;
  readonly closeButton: Locator;

  constructor(page: Page) {
    super(page);
    this.dialog = page.getByRole('dialog', { name: /incidents/i });
    this.incidentList = this.dialog.locator('[data-testid="incident-list"]');
    this.incidentItems = this.incidentList.locator('[data-testid="incident-item"]');
    this.filterButtons = this.dialog.locator('[data-testid="incident-filter"] button');
    this.searchInput = this.dialog.getByPlaceholder(/search incidents/i);
    this.createButton = this.dialog.getByRole('button', { name: /create.*incident/i });
    this.closeButton = this.dialog.getByRole('button', { name: /close/i });
  }

  async filterBySeverity(severity: 'all' | 'critical' | 'major' | 'minor' | 'informational') {
    await this.filterButtons.filter({ hasText: severity }).click();
    await this.page.waitForTimeout(300); // Animation
  }

  async searchIncidents(term: string) {
    await this.searchInput.fill(term);
    await this.page.waitForTimeout(500); // Debounce
  }

  async selectIncident(title: string) {
    await this.incidentItems.filter({ hasText: title }).click();
  }

  async getIncidentCount() {
    return await this.incidentItems.count();
  }

  async close() {
    await this.closeButton.click();
    await this.dialog.waitFor({ state: 'hidden' });
  }
}

/**
 * Notification Center Page Object
 */
export class NotificationCenter extends BasePage {
  readonly panel: Locator;
  readonly notificationList: Locator;
  readonly notificationItems: Locator;
  readonly clearAllButton: Locator;
  readonly markAllReadButton: Locator;
  readonly settingsButton: Locator;

  constructor(page: Page) {
    super(page);
    this.panel = page.locator('[data-testid="notification-center"]');
    this.notificationList = this.panel.locator('[data-testid="notification-list"]');
    this.notificationItems = this.notificationList.locator('[data-testid="notification-item"]');
    this.clearAllButton = this.panel.getByRole('button', { name: /clear all/i });
    this.markAllReadButton = this.panel.getByRole('button', { name: /mark.*read/i });
    this.settingsButton = this.panel.getByRole('button', { name: /settings/i });
  }

  async open() {
    const trigger = this.page.getByRole('button', { name: /notifications/i });
    await trigger.click();
    await this.panel.waitFor({ state: 'visible' });
  }

  async close() {
    await this.page.keyboard.press('Escape');
    await this.panel.waitFor({ state: 'hidden' });
  }

  async getNotificationCount() {
    return await this.notificationItems.count();
  }

  async dismissNotification(index: number) {
    const notification = this.notificationItems.nth(index);
    await notification.locator('[data-testid="dismiss-button"]').click();
  }

  async clearAll() {
    await this.clearAllButton.click();
    await this.page.waitForTimeout(300); // Animation
  }

  async markAllAsRead() {
    await this.markAllReadButton.click();
    await this.page.waitForTimeout(300); // Animation
  }
}