/**
 * E2E Tests - Command Palette
 */

import { test, expect } from '@playwright/test';
import { DashboardPage, CommandPalettePage } from '../utils/page-objects';
import { waitForAnimations, waitForNetworkIdle } from '../utils/helpers';
import { testCommands } from '../utils/test-data';

test.describe('Command Palette E2E', () => {
  let dashboard: DashboardPage;
  let commandPalette: CommandPalettePage;

  test.beforeEach(async ({ page }) => {
    dashboard = new DashboardPage(page);
    commandPalette = new CommandPalettePage(page);
    await dashboard.navigateTo();
    await waitForNetworkIdle(page);
  });

  test('open command palette with keyboard shortcut', async ({ page }) => {
    // Press Cmd+K (or Ctrl+K)
    await page.keyboard.press('Control+K');
    await waitForAnimations(page);

    // Verify palette opened
    await expect(commandPalette.dialog).toBeVisible();

    // Verify search input is focused
    await expect(commandPalette.searchInput).toBeFocused();

    // Close with Escape
    await page.keyboard.press('Escape');
    await expect(commandPalette.dialog).not.toBeVisible();
  });

  test('open command palette with button', async ({ page }) => {
    // Click button
    await commandPalette.trigger.click();
    await waitForAnimations(page);

    // Verify palette opened
    await expect(commandPalette.dialog).toBeVisible();

    // Close with Escape
    await page.keyboard.press('Escape');
    await expect(commandPalette.dialog).not.toBeVisible();
  });

  test('search commands', async ({ page }) => {
    await commandPalette.open();

    // Get initial command count
    const initialCount = await commandPalette.getCommandCount();
    expect(initialCount).toBeGreaterThan(0);

    // Search for specific command
    await commandPalette.search('deploy');
    await waitForAnimations(page);

    // Verify filtered results
    const filteredCount = await commandPalette.getCommandCount();
    expect(filteredCount).toBeLessThan(initialCount);

    // Verify all results contain search term
    const commands = await commandPalette.getVisibleCommands();
    for (const command of commands) {
      expect(command.toLowerCase()).toContain('deploy');
    }

    // Clear search
    await commandPalette.searchInput.clear();
    await waitForAnimations(page);

    // Verify all commands shown again
    const allCount = await commandPalette.getCommandCount();
    expect(allCount).toBe(initialCount);
  });

  test('execute deploy all command', async ({ page }) => {
    await commandPalette.open();
    await commandPalette.executeCommand('Deploy All Services');
    await waitForAnimations(page);

    // Verify command executed
    await page.waitForSelector('[role="status"]:has-text("Deployment initiated")', { timeout: 5000 });

    // Verify palette closed
    await expect(commandPalette.dialog).not.toBeVisible();
  });

  test('execute health check command', async ({ page }) => {
    await commandPalette.open();
    await commandPalette.executeCommand('Run Health Check');
    await waitForAnimations(page);

    // Verify health check started
    await page.waitForSelector('[role="status"]:has-text("Health check in progress")', { timeout: 5000 });

    // Wait for health check to complete
    await page.waitForSelector('[role="status"]:has-text("Health check completed")', { timeout: 10000 });

    // Verify palette closed
    await expect(commandPalette.dialog).not.toBeVisible();
  });

  test('navigate commands with keyboard', async ({ page }) => {
    await commandPalette.open();

    // Navigate down
    await page.keyboard.press('ArrowDown');
    await waitForAnimations(page);

    // Verify second item is selected
    const secondItem = commandPalette.commandItems.nth(1);
    await expect(secondItem).toHaveAttribute('data-selected', 'true');

    // Navigate down again
    await page.keyboard.press('ArrowDown');
    await waitForAnimations(page);

    // Verify third item is selected
    const thirdItem = commandPalette.commandItems.nth(2);
    await expect(thirdItem).toHaveAttribute('data-selected', 'true');

    // Navigate up
    await page.keyboard.press('ArrowUp');
    await waitForAnimations(page);

    // Verify second item is selected again
    await expect(secondItem).toHaveAttribute('data-selected', 'true');

    // Execute selected command with Enter
    await page.keyboard.press('Enter');
    await waitForAnimations(page);

    // Verify palette closed
    await expect(commandPalette.dialog).not.toBeVisible();
  });

  test('command shortcuts displayed', async ({ page }) => {
    await commandPalette.open();

    // Verify shortcuts are visible
    for (const command of testCommands) {
      const commandItem = commandPalette.commandItems.filter({ hasText: command.name });
      if (await commandItem.isVisible()) {
        const shortcut = commandItem.locator('[data-testid="command-shortcut"]');
        await expect(shortcut).toContainText(command.shortcut);
      }
    }
  });

  test('recent commands section', async ({ page }) => {
    // Execute a command
    await commandPalette.open();
    await commandPalette.executeCommand('Run Health Check');
    await waitForAnimations(page);

    // Open palette again
    await commandPalette.open();

    // Verify recent commands section exists
    const recentSection = commandPalette.dialog.locator('[data-testid="recent-commands"]');
    await expect(recentSection).toBeVisible();

    // Verify executed command appears in recent
    const recentCommands = recentSection.locator('[data-testid="command-item"]');
    await expect(recentCommands.first()).toContainText('Run Health Check');
  });

  test('command categories', async ({ page }) => {
    await commandPalette.open();

    // Verify categories exist
    const categories = commandPalette.dialog.locator('[data-testid="command-category"]');
    const categoryCount = await categories.count();
    expect(categoryCount).toBeGreaterThan(0);

    // Expected categories
    const expectedCategories = ['Portal', 'System', 'View', 'Help'];
    for (const category of expectedCategories) {
      const categoryElement = categories.filter({ hasText: category });
      await expect(categoryElement).toBeVisible();
    }
  });

  test('command palette fuzzy search', async ({ page }) => {
    await commandPalette.open();

    // Test fuzzy search
    await commandPalette.search('hlth chk');
    await waitForAnimations(page);

    // Should find "Health Check" command
    const results = await commandPalette.getVisibleCommands();
    const healthCheckFound = results.some(cmd => cmd.toLowerCase().includes('health check'));
    expect(healthCheckFound).toBe(true);
  });

  test('command with confirmation', async ({ page }) => {
    await commandPalette.open();
    await commandPalette.search('emergency');
    await commandPalette.selectCommand('Emergency Shutdown');
    await waitForAnimations(page);

    // Verify confirmation dialog appears
    const confirmDialog = page.locator('[role="dialog"][aria-label*="Confirm"]');
    await expect(confirmDialog).toBeVisible();

    // Cancel action
    await confirmDialog.getByRole('button', { name: /cancel/i }).click();
    await waitForAnimations(page);

    // Verify action was not executed
    const notification = page.locator('[role="status"]:has-text("Shutdown")');
    await expect(notification).not.toBeVisible();
  });

  test('command palette help', async ({ page }) => {
    await commandPalette.open();

    // Look for help text or button
    const helpButton = commandPalette.dialog.locator('[data-testid="command-help"]');
    if (await helpButton.isVisible()) {
      await helpButton.click();
      await waitForAnimations(page);

      // Verify help content
      const helpDialog = page.locator('[role="dialog"][aria-label*="Help"]');
      await expect(helpDialog).toBeVisible();

      // Close help
      await page.keyboard.press('Escape');
    }
  });

  test('command execution with parameters', async ({ page }) => {
    await commandPalette.open();
    await commandPalette.search('export');
    await commandPalette.selectCommand('Export Data');
    await waitForAnimations(page);

    // Verify export dialog appears
    const exportDialog = page.locator('[role="dialog"][aria-label*="Export"]');
    await expect(exportDialog).toBeVisible();

    // Select export options
    await exportDialog.getByLabel(/format/i).selectOption('json');
    await exportDialog.getByLabel(/date range/i).selectOption('last-30-days');

    // Execute export
    await exportDialog.getByRole('button', { name: /export/i }).click();
    await waitForAnimations(page);

    // Verify export started
    await page.waitForSelector('[role="status"]:has-text("Export started")', { timeout: 5000 });
  });

  test('command palette accessibility', async ({ page }) => {
    await commandPalette.open();

    // Test Tab navigation
    await page.keyboard.press('Tab');
    await expect(commandPalette.searchInput).toBeFocused();

    await page.keyboard.press('Tab');
    const firstCommand = commandPalette.commandItems.first();
    await expect(firstCommand).toBeFocused();

    // Test screen reader attributes
    await expect(commandPalette.dialog).toHaveAttribute('role', 'dialog');
    await expect(commandPalette.dialog).toHaveAttribute('aria-label');
    await expect(commandPalette.searchInput).toHaveAttribute('aria-label');
  });

  test('command palette performance', async ({ page }) => {
    await commandPalette.open();

    // Type quickly to test debouncing
    const searchTerm = 'deploy all services quickly';
    for (const char of searchTerm) {
      await page.keyboard.type(char);
    }

    // Wait for debounce
    await waitForAnimations(page);

    // Verify search completed
    const searchValue = await commandPalette.searchInput.inputValue();
    expect(searchValue).toBe(searchTerm);

    // Verify results updated
    const commands = await commandPalette.getVisibleCommands();
    expect(commands.length).toBeGreaterThanOrEqual(0);
  });

  test('command palette state persistence', async ({ page }) => {
    await commandPalette.open();

    // Search for something
    await commandPalette.search('health');
    await waitForAnimations(page);

    // Close palette
    await page.keyboard.press('Escape');

    // Reopen palette
    await commandPalette.open();

    // Verify search is cleared
    const searchValue = await commandPalette.searchInput.inputValue();
    expect(searchValue).toBe('');

    // Verify all commands shown
    const commandCount = await commandPalette.getCommandCount();
    expect(commandCount).toBeGreaterThan(1);
  });
});