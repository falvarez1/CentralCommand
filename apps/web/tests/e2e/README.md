# Central Command E2E Tests

Comprehensive end-to-end tests for the Central Command React application using Playwright.

## Test Coverage

### 1. Portal Management (`portal-management.spec.ts`)
- View list of portals from API
- Search for portals
- Filter by category
- Add a new portal
- Edit a portal
- Delete a portal
- Toggle favorite status
- Switch between grid and list views
- Handle API errors gracefully
- Display loading states
- Handle empty search results

### 2. Filtering and Searching (`filtering-searching.spec.ts`)
- Search by portal name
- Filter by category (engineering, operations, etc.)
- Filter by status (active, degraded, etc.)
- Clear filters
- Verify search debouncing
- Multiple filter combinations
- Persist filter state
- Handle special characters in search
- Show filter badges
- Update results count dynamically

### 3. Real-time Updates (`real-time-updates.spec.ts`)
- Verify SignalR connection
- Check metric updates
- Incident notifications
- Statistics refresh
- Connection status indicator
- Portal status updates in real-time
- Connection retry logic
- Batch metric updates efficiently
- Real-time alert banners
- Update last refresh timestamp

### 4. Incident Management (`incident-management.spec.ts`)
- View incident list
- Filter incidents by severity
- Create new incident
- View incident details
- Check incident counts in sidebar
- Update incident status
- Add incident updates/comments
- Resolve incidents
- Show incident statistics
- Export incident reports
- Show incident trends chart
- Validate incident form

### 5. Dashboard Features (`dashboard-features.spec.ts`)
- Keyboard shortcuts (Cmd+K, Cmd+N, etc.)
- Export data functionality
- Refresh all portals
- View mode switching
- Responsive layout
- Theme switching
- Dashboard statistics
- User preferences
- Breadcrumb navigation
- Quick actions menu

## Prerequisites

1. **Node.js** - Version 18 or higher
2. **Mock API** - Running on http://localhost:5000
3. **React App** - Running on http://localhost:5173

## Installation

```bash
# Install dependencies
npm install

# Install Playwright browsers
npx playwright install
```

## Running Tests

### Run all E2E tests
```bash
npm run test:e2e
```

### Run specific test file
```bash
npx playwright test tests/e2e/portal-management.spec.ts
```

### Run tests in headed mode (see browser)
```bash
npm run test:headed
```

### Run tests in UI mode (interactive)
```bash
npm run test:ui
```

### Run tests with debugging
```bash
npm run test:debug
```

### Generate test report
```bash
npm run test:report
```

## Configuration

Tests are configured in `playwright.config.ts`:

- **Base URL**: http://localhost:5173
- **API URL**: http://localhost:5000
- **Browsers**: Chrome, Firefox, Safari, Mobile Chrome, Mobile Safari
- **Parallel execution**: Enabled
- **Retries**: 2 on CI, 0 locally
- **Screenshots**: On failure
- **Videos**: On failure
- **Trace**: On first retry

## Environment Variables

Configure test environment in `tests/e2e/.env.test`:

```env
API_BASE_URL=http://localhost:5000
REACT_APP_URL=http://localhost:5173
TEST_TIMEOUT=30000
SCREENSHOT_ON_FAILURE=true
```

## Page Objects

Page objects are located in `tests/e2e/pages/`:

- `PortalPage.ts` - Portal management page interactions
- `IncidentPage.ts` - Incident management page interactions

## Helper Functions

Utility functions in `tests/e2e/helpers/test-utils.ts`:

- `waitForNetworkIdle()` - Wait for network requests to complete
- `mockApiResponse()` - Mock API responses
- `setupApiMocks()` - Setup all API mocks
- `waitForSignalRConnection()` - Wait for SignalR to connect
- `simulateSignalRMessage()` - Simulate real-time messages
- `checkAccessibility()` - Verify accessibility compliance

## Writing New Tests

1. Create a new test file in `tests/e2e/`
2. Import necessary page objects and utilities
3. Use the test structure:

```typescript
import { test, expect } from '@playwright/test';
import { PortalPage } from './pages/PortalPage';

test.describe('Feature Name', () => {
  let portalPage: PortalPage;

  test.beforeEach(async ({ page }) => {
    portalPage = new PortalPage(page);
    await portalPage.goto();
  });

  test('should do something', async ({ page }) => {
    // Test implementation
    await expect(something).toBe(expected);
  });
});
```

## Best Practices

1. **Use Page Objects** - Encapsulate page interactions
2. **Wait for Network** - Use `waitForNetworkIdle()` after actions
3. **Mock External APIs** - Use `mockApiResponse()` for consistent tests
4. **Check Accessibility** - Include accessibility checks
5. **Use Data Attributes** - Target elements with `data-testid`
6. **Handle Timing** - Use proper wait strategies, not hard delays
7. **Clean State** - Reset state between tests
8. **Descriptive Names** - Use clear test descriptions

## Debugging Failed Tests

1. **View test report**: `npm run test:report`
2. **Check screenshots**: Located in `test-results/`
3. **View videos**: Available for failed tests
4. **Review traces**: Use Playwright trace viewer
5. **Run in headed mode**: See the browser actions
6. **Use debugger**: Run with `test:debug` script

## CI/CD Integration

For CI environments:

```yaml
- name: Install dependencies
  run: npm ci

- name: Install Playwright browsers
  run: npx playwright install --with-deps

- name: Start Mock API
  run: |
    cd ../MockAPI
    dotnet run &

- name: Start React app
  run: |
    npm run dev &
    npx wait-on http://localhost:5173

- name: Run E2E tests
  run: npm run test:e2e

- name: Upload test artifacts
  if: failure()
  uses: actions/upload-artifact@v3
  with:
    name: test-results
    path: test-results/
```

## Troubleshooting

### Tests failing with timeout
- Increase timeout in playwright.config.ts
- Check if services are running (API and React app)
- Verify network connectivity

### SignalR connection issues
- Ensure Mock API has SignalR hub configured
- Check CORS settings
- Verify hub URL in configuration

### Element not found
- Check data-testid attributes in React components
- Verify selectors in page objects
- Use Playwright inspector to debug

### Flaky tests
- Add proper wait conditions
- Avoid hard-coded delays
- Use retry mechanism for network requests
- Mock time-dependent features

## Contact

For questions or issues with the E2E tests, please contact the development team.