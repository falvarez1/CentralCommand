import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('/');
  });

  test('should redirect to login when not authenticated', async ({ page }) => {
    // Should be redirected to login page
    await expect(page).toHaveURL(/.*\/auth\/login/);

    // Check for login page elements
    await expect(page.getByRole('heading', { name: /Welcome to Central Command/i })).toBeVisible();
    await expect(page.getByPlaceholder('you@example.com')).toBeVisible();
    await expect(page.getByPlaceholder('Enter your password')).toBeVisible();
    await expect(page.getByRole('button', { name: /Sign In/i })).toBeVisible();
  });

  test('should show validation errors for empty form', async ({ page }) => {
    await page.goto('/auth/login');

    // Click sign in without entering credentials
    await page.getByRole('button', { name: /Sign In/i }).click();

    // Check for validation messages
    await expect(page.getByText('Email is required')).toBeVisible();
    await expect(page.getByText('Password is required')).toBeVisible();
  });

  test('should show validation errors for invalid email', async ({ page }) => {
    await page.goto('/auth/login');

    // Enter invalid email
    await page.getByPlaceholder('you@example.com').fill('invalidemail');
    await page.getByPlaceholder('Enter your password').fill('password123');
    await page.getByRole('button', { name: /Sign In/i }).click();

    // Check for validation message
    await expect(page.getByText('Invalid email address')).toBeVisible();
  });

  test('should navigate to register page', async ({ page }) => {
    await page.goto('/auth/login');

    // Click on Sign up link
    await page.getByRole('link', { name: /Sign up/i }).click();

    // Should navigate to register page
    await expect(page).toHaveURL(/.*\/auth\/register/);
    await expect(page.getByRole('heading', { name: /Create an Account/i })).toBeVisible();
  });

  test('should show password strength indicator on register page', async ({ page }) => {
    await page.goto('/auth/register');

    // Enter a weak password
    await page.getByPlaceholder('Create a strong password').fill('weak');

    // Check password strength indicators
    await expect(page.getByText('Password strength:')).toBeVisible();
    await expect(page.getByText('At least 8 characters')).toBeVisible();

    // Enter a strong password
    await page.getByPlaceholder('Create a strong password').fill('StrongP@ssw0rd123');

    // Check that indicators update
    await expect(page.getByText('Strong')).toBeVisible();
  });

  test('should validate password confirmation', async ({ page }) => {
    await page.goto('/auth/register');

    // Fill form with mismatched passwords
    await page.getByPlaceholder('John Doe').fill('Test User');
    await page.getByPlaceholder('you@example.com').fill('test@example.com');
    await page.getByPlaceholder('Create a strong password').fill('StrongP@ssw0rd123');
    await page.getByPlaceholder('Confirm your password').fill('DifferentPassword');

    // Check terms checkbox
    await page.getByLabel(/I agree to the/i).check();

    // Try to submit
    await page.getByRole('button', { name: /Create Account/i }).click();

    // Check for error message
    await expect(page.getByText('Passwords do not match')).toBeVisible();
  });

  test('should require terms acceptance', async ({ page }) => {
    await page.goto('/auth/register');

    // Fill form without checking terms
    await page.getByPlaceholder('John Doe').fill('Test User');
    await page.getByPlaceholder('you@example.com').fill('test@example.com');
    await page.getByPlaceholder('Create a strong password').fill('StrongP@ssw0rd123');
    await page.getByPlaceholder('Confirm your password').fill('StrongP@ssw0rd123');

    // Try to submit without accepting terms
    await page.getByRole('button', { name: /Create Account/i }).click();

    // Check for error message
    await expect(page.getByText('You must accept the terms and conditions')).toBeVisible();
  });

  test('should toggle password visibility', async ({ page }) => {
    await page.goto('/auth/login');

    const passwordInput = page.getByPlaceholder('Enter your password');

    // Initially password should be hidden
    await expect(passwordInput).toHaveAttribute('type', 'password');

    // Fill password
    await passwordInput.fill('TestPassword123');

    // Click eye icon to show password
    await page.locator('button:has(svg)').filter({ hasText: '' }).first().click();

    // Password should now be visible
    await expect(passwordInput).toHaveAttribute('type', 'text');

    // Click again to hide
    await page.locator('button:has(svg)').filter({ hasText: '' }).first().click();

    // Password should be hidden again
    await expect(passwordInput).toHaveAttribute('type', 'password');
  });

  test('should handle remember me checkbox', async ({ page }) => {
    await page.goto('/auth/login');

    const rememberCheckbox = page.getByLabel(/Remember me/i);

    // Initially unchecked
    await expect(rememberCheckbox).not.toBeChecked();

    // Check it
    await rememberCheckbox.check();
    await expect(rememberCheckbox).toBeChecked();

    // Uncheck it
    await rememberCheckbox.uncheck();
    await expect(rememberCheckbox).not.toBeChecked();
  });

  test('should show user menu when authenticated', async ({ page, context }) => {
    // Mock authentication by setting auth token
    await context.addCookies([{
      name: 'auth-storage',
      value: JSON.stringify({
        state: {
          user: {
            id: 'test-user-id',
            email: 'test@example.com',
            name: 'Test User',
            role: 'viewer'
          },
          isAuthenticated: true,
          session: {
            access_token: 'mock-token',
            expires_at: Date.now() + 3600000
          }
        }
      }),
      domain: 'localhost',
      path: '/'
    }]);

    // Navigate to the app
    await page.goto('/');

    // Check if user menu is visible
    await expect(page.getByText('Test User')).toBeVisible();

    // Click on user menu
    await page.getByText('Test User').click();

    // Check menu items are visible
    await expect(page.getByRole('menuitem', { name: /Profile/i })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: /Settings/i })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: /Log out/i })).toBeVisible();
  });

  test('should logout successfully', async ({ page, context }) => {
    // Mock authentication
    await context.addCookies([{
      name: 'auth-storage',
      value: JSON.stringify({
        state: {
          user: {
            id: 'test-user-id',
            email: 'test@example.com',
            name: 'Test User',
            role: 'viewer'
          },
          isAuthenticated: true,
          session: {
            access_token: 'mock-token',
            expires_at: Date.now() + 3600000
          }
        }
      }),
      domain: 'localhost',
      path: '/'
    }]);

    await page.goto('/');

    // Open user menu and click logout
    await page.getByText('Test User').click();
    await page.getByRole('menuitem', { name: /Log out/i }).click();

    // Should redirect to login page
    await expect(page).toHaveURL(/.*\/auth\/login/);
  });
});