# Central Command React - Test Suite

Comprehensive Playwright test suite for the Central Command React application, including E2E tests, visual regression tests, and comparison tests with the original HTML implementation.

## Test Structure

```
tests/
├── visual/          # Visual regression tests
│   ├── dashboard.spec.ts
│   ├── portals.spec.ts
│   ├── themes.spec.ts
│   ├── responsive.spec.ts
│   └── modals.spec.ts
├── e2e/            # End-to-end tests
│   ├── portal-management.spec.ts
│   ├── incident-flow.spec.ts
│   ├── command-palette.spec.ts
│   └── notifications.spec.ts
├── comparison/     # Original vs React comparison
│   └── original-vs-react.spec.ts
└── utils/          # Test utilities
    ├── test-data.ts
    ├── page-objects.ts
    └── helpers.ts
```

## Running Tests

### Prerequisites

```bash
# Install dependencies
npm install

# Install Playwright browsers
npx playwright install
```

### Test Commands

```bash
# Run all tests
npm test

# Run specific test suites
npm run test:e2e          # E2E tests only
npm run test:visual       # Visual regression tests only
npm run test:comparison   # Comparison tests only

# Interactive mode
npm run test:ui           # Open Playwright UI
npm run test:debug        # Debug mode
npm run test:headed       # Run in headed browser

# Update snapshots
npm run test:update-snapshots

# View test report
npm run test:report
```

## Test Categories

### Visual Regression Tests

Capture and compare screenshots to detect visual changes:

- **dashboard.spec.ts**: Full dashboard layouts, themes, states
- **portals.spec.ts**: Portal cards in grid/list views
- **themes.spec.ts**: Light/dark theme consistency
- **responsive.spec.ts**: Mobile, tablet, desktop layouts
- **modals.spec.ts**: All modal dialogs and overlays

### E2E Tests

Test complete user workflows:

- **portal-management.spec.ts**: CRUD operations on portals
- **incident-flow.spec.ts**: Incident creation, updates, resolution
- **command-palette.spec.ts**: Command palette interactions
- **notifications.spec.ts**: Notification system behavior

### Comparison Tests

Compare React implementation with original HTML:

- Visual comparison of layouts
- Feature parity verification
- Performance metrics comparison
- Accessibility comparison
- Responsive behavior comparison

## Configuration

### Browsers

Tests run on:
- Chromium
- Firefox
- WebKit (Safari)
- Mobile Chrome (Pixel 5)
- Mobile Safari (iPhone 12)

### Viewports

Responsive tests cover:
- Mobile: 375x812 (iPhone X)
- Tablet: 768x1024 (iPad)
- Desktop: 1280x720, 1920x1080
- 4K: 2560x1440

### Test Options

- **Screenshots**: Captured on failure
- **Videos**: Recorded on failure
- **Traces**: Collected on retry
- **Timeout**: 30 seconds per test
- **Retries**: 2 on CI, 0 locally

## Page Objects

The test suite uses Page Object Model for maintainability:

```typescript
// Example usage
const dashboard = new DashboardPage(page);
await dashboard.navigateTo();
await dashboard.search('admin');
await dashboard.toggleView();
```

## Test Data

Mock data generators for consistent testing:

```typescript
// Generate test data
const portal = generatePortal({
  name: 'Test Portal',
  status: 'operational'
});

const incident = generateIncident({
  severity: 'critical'
});
```

## CI/CD Integration

GitHub Actions workflow runs:

1. **Test Matrix**: Node 18.x/20.x, all browsers
2. **Visual Regression**: Chromium only
3. **E2E Tests**: Full suite
4. **Comparison**: Original vs React
5. **Artifacts**: Screenshots, videos, reports

## Writing New Tests

### Visual Test Template

```typescript
test('component visual test', async ({ page }) => {
  // Navigate and setup
  await dashboard.navigateTo();

  // Take screenshot
  await expect(page).toHaveScreenshot('component.png');
});
```

### E2E Test Template

```typescript
test('user workflow', async ({ page }) => {
  // Setup
  const dashboard = new DashboardPage(page);
  await dashboard.navigateTo();

  // Actions
  await dashboard.addPortal();

  // Assertions
  await expect(notification).toBeVisible();
});
```

## Debugging

### Debug Single Test

```bash
npx playwright test path/to/test.spec.ts --debug
```

### View Trace

```bash
npx playwright show-trace trace.zip
```

### Update Snapshots

```bash
npx playwright test --update-snapshots
```

## Best Practices

1. **Use Page Objects**: Encapsulate page logic
2. **Data-testid Attributes**: Reliable selectors
3. **Wait for Animations**: Ensure UI stability
4. **Mock External APIs**: Consistent test data
5. **Parallel Execution**: Fast test runs
6. **Descriptive Names**: Clear test purposes
7. **Cleanup**: Reset state between tests

## Troubleshooting

### Common Issues

1. **Flaky Tests**: Add explicit waits or increase timeouts
2. **Screenshot Mismatches**: Update snapshots after intentional changes
3. **Network Errors**: Mock API responses
4. **Performance**: Use selective test runs
5. **CI Failures**: Check browser installation

### Support

For issues or questions, please refer to:
- [Playwright Documentation](https://playwright.dev)
- Project issue tracker
- Team chat channel