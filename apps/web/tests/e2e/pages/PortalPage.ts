import { Page, Locator } from '@playwright/test';

export class PortalPage {
  readonly page: Page;
  readonly searchInput: Locator;
  readonly categoryFilter: Locator;
  readonly statusFilter: Locator;
  readonly viewToggle: Locator;
  readonly addPortalButton: Locator;
  readonly refreshButton: Locator;
  readonly exportButton: Locator;
  readonly portalCards: Locator;
  readonly portalListItems: Locator;
  readonly loadingSpinner: Locator;
  readonly noResultsMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.searchInput = page.getByPlaceholder(/search portals/i);
    this.categoryFilter = page.getByRole('combobox', { name: /category/i });
    this.statusFilter = page.getByRole('combobox', { name: /status/i });
    this.viewToggle = page.getByRole('button', { name: /view/i });
    this.addPortalButton = page.getByRole('button', { name: /add portal/i });
    this.refreshButton = page.getByRole('button', { name: /refresh/i });
    this.exportButton = page.getByRole('button', { name: /export/i });
    this.portalCards = page.locator('[data-testid="portal-card"]');
    this.portalListItems = page.locator('[data-testid="portal-list-item"]');
    this.loadingSpinner = page.locator('[data-testid="loading-spinner"]');
    this.noResultsMessage = page.getByText(/no portals found/i);
  }

  async goto() {
    await this.page.goto('/');
    await this.waitForLoad();
  }

  async waitForLoad() {
    await this.page.waitForLoadState('networkidle');
    await this.loadingSpinner.waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {});
  }

  async searchPortals(searchTerm: string) {
    await this.searchInput.fill(searchTerm);
    await this.page.waitForTimeout(500); // Wait for debounce
    await this.waitForLoad();
  }

  async filterByCategory(category: string) {
    await this.categoryFilter.selectOption(category);
    await this.waitForLoad();
  }

  async filterByStatus(status: string) {
    await this.statusFilter.selectOption(status);
    await this.waitForLoad();
  }

  async clearFilters() {
    await this.page.getByRole('button', { name: /clear/i }).click();
    await this.waitForLoad();
  }

  async toggleView(view: 'grid' | 'list') {
    const currentView = await this.page.getAttribute('[data-testid="view-toggle"]', 'data-view');
    if (currentView !== view) {
      await this.viewToggle.click();
      await this.page.waitForTimeout(300); // Wait for animation
    }
  }

  async addPortal(portalData: {
    name: string;
    url: string;
    category: string;
    description?: string;
  }) {
    await this.addPortalButton.click();

    const modal = this.page.locator('[role="dialog"]');
    await modal.waitFor({ state: 'visible' });

    await modal.getByLabel(/name/i).fill(portalData.name);
    await modal.getByLabel(/url/i).fill(portalData.url);
    await modal.getByLabel(/category/i).selectOption(portalData.category);

    if (portalData.description) {
      await modal.getByLabel(/description/i).fill(portalData.description);
    }

    await modal.getByRole('button', { name: /save|add|create/i }).click();
    await modal.waitFor({ state: 'hidden' });
    await this.waitForLoad();
  }

  async editPortal(portalName: string, updates: Partial<{
    name: string;
    url: string;
    category: string;
    description: string;
  }>) {
    const portal = this.page.locator(`[data-testid="portal-card"]:has-text("${portalName}")`);
    await portal.getByRole('button', { name: /edit/i }).click();

    const modal = this.page.locator('[role="dialog"]');
    await modal.waitFor({ state: 'visible' });

    if (updates.name) {
      await modal.getByLabel(/name/i).clear();
      await modal.getByLabel(/name/i).fill(updates.name);
    }

    if (updates.url) {
      await modal.getByLabel(/url/i).clear();
      await modal.getByLabel(/url/i).fill(updates.url);
    }

    if (updates.category) {
      await modal.getByLabel(/category/i).selectOption(updates.category);
    }

    if (updates.description) {
      await modal.getByLabel(/description/i).clear();
      await modal.getByLabel(/description/i).fill(updates.description);
    }

    await modal.getByRole('button', { name: /save|update/i }).click();
    await modal.waitFor({ state: 'hidden' });
    await this.waitForLoad();
  }

  async deletePortal(portalName: string) {
    const portal = this.page.locator(`[data-testid="portal-card"]:has-text("${portalName}")`);
    await portal.getByRole('button', { name: /delete/i }).click();

    // Handle confirmation dialog
    const dialog = this.page.locator('[role="alertdialog"]');
    await dialog.waitFor({ state: 'visible' });
    await dialog.getByRole('button', { name: /confirm|delete/i }).click();
    await dialog.waitFor({ state: 'hidden' });
    await this.waitForLoad();
  }

  async toggleFavorite(portalName: string) {
    const portal = this.page.locator(`[data-testid="portal-card"]:has-text("${portalName}")`);
    await portal.getByRole('button', { name: /favorite/i }).click();
    await this.page.waitForTimeout(300); // Wait for animation
  }

  async getPortalCount(): Promise<number> {
    const isGridView = await this.portalCards.first().isVisible().catch(() => false);
    if (isGridView) {
      return await this.portalCards.count();
    } else {
      return await this.portalListItems.count();
    }
  }

  async getPortalByName(name: string): Promise<Locator> {
    return this.page.locator(`[data-testid="portal-card"]:has-text("${name}"), [data-testid="portal-list-item"]:has-text("${name}")`).first();
  }

  async refreshPortals() {
    await this.refreshButton.click();
    await this.waitForLoad();
  }

  async exportData() {
    await this.exportButton.click();
    // Wait for download
    const download = await this.page.waitForEvent('download');
    return download;
  }
}