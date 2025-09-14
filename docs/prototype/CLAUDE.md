# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Central Command Panel - A single-file enterprise portal management dashboard built as a standalone HTML application with embedded CSS and JavaScript. The application provides monitoring and management capabilities for internal service portals with real-time metrics, incident tracking, and SSO integration.

## Architecture

### File Structure
- **Single HTML file**: `central-command-panel.html` (3352 lines)
  - Embedded CSS styles (lines 1-1969)
  - HTML structure with modal overlays and main content (lines 1970-2432)
  - JavaScript application logic (lines 2433-3351)

### Key Components

1. **Data Models**
   - `portals[]`: Array of service portal objects with comprehensive monitoring metrics:
     - Basic info: id, name, url, description, category
     - Status: operational, degraded, maintenance, outage
     - Metrics: responseTime, uptime, cpu, memory, requests, errors
     - Features: favorited status, lastChecked timestamp
   - `incidents[]`: Recent system incidents with severity levels (critical, warning, info, success)
   - `commands[]`: Command palette actions for quick operations with keyboard shortcuts

2. **UI Components**
   - **Header Section**
     - Global search with real-time filtering
     - View toggle (Grid/List views)
     - Theme switcher button (visual only)
     - Notification bell with counter

   - **Sidebar Components**
     - Quick actions panel with system operations
     - Real-time statistics grid with sparkline visualizations
     - Favorites list for quick portal access
     - Incidents timeline with filtering options

   - **Main Content Area**
     - Scrollable category filter tabs with status indicators
     - Portal cards (grid view) or list items (list view)
     - Dynamic portal metrics and performance graphs
     - Action buttons for login, open, and menu options

   - **Modal Overlays**
     - Add Portal modal (structure only)
     - Incidents management modal with filtering

   - **Interactive Elements**
     - Command palette (⌘K) with search functionality
     - Toast notification system with auto-dismiss
     - Alert banner for critical system messages

3. **Core Functionality**
   - **Monitoring & Metrics**
     - Real-time metrics updates (30-second intervals)
     - Portal status monitoring with visual indicators
     - Performance tracking (response time, CPU, memory)
     - Request/error rate calculations
     - Time range selector (1H, 24H, 7D, 30D)

   - **User Interactions**
     - SSO quick login simulation
     - Portal favoriting system
     - Category-based filtering with issue indicators
     - Search across portal names and descriptions
     - Keyboard shortcuts for common actions

   - **System Operations**
     - Deploy all services simulation
     - Health check execution
     - Emergency shutdown capability
     - Data export functionality
     - Bulk operations placeholder

   - **Visual Features**
     - Sparkline graphs for statistics
     - 24-hour performance graphs per portal
     - Status-based color coding
     - Smooth scroll for filter tabs
     - Responsive grid/list layouts

## Development Commands

### Running the Application
```bash
# Open directly in browser (no build required)
start central-command-panel.html  # Windows
open central-command-panel.html   # macOS
xdg-open central-command-panel.html  # Linux
```

### Testing
No test framework configured. Application can be tested by opening in browser and manually verifying functionality.

## Missing Implementations

The following functions are referenced in HTML but not implemented in JavaScript:
- `toggleTheme()` - Theme switching functionality (button exists in UI)
- `openModal()` / `closeModal()` - Generic modal window controls
- `openIncidentsModal()` - Opens the incidents management modal
- `submitPortal()` - Form submission for adding new portals
- `filterModalIncidents(filter)` - Filters incidents in the modal view
- `exportIncidents()` - Exports incident report
- `createIncident()` - Creates new incident report

## Key Functions

### Portal Management
- `renderPortals()`: Renders portal cards or list items based on current view
- `renderPortalCard(portal)`: Creates HTML for grid view portal card
- `renderPortalListItem(portal)`: Creates HTML for list view item
- `getFilteredPortals()`: Filters portals by category and search term
- `toggleFavorite(portalId)`: Toggles favorite status for a portal
- `openPortal(url)`: Simulates opening portal URL
- `handleLogin(portalName, portalId)`: Initiates SSO login simulation
- `quickLogin(portalName, portalId)`: Quick login from favorites/command palette
- `showPortalMenu(portalId)`: Shows portal options menu

### Metrics & Monitoring
- `updateMetrics()`: Updates portal metrics based on selected time range
- `calculateStats()`: Calculates aggregate statistics (operational count, avg response, error rate, etc.)
- `renderStats()`: Updates statistics display with sparkline graphs
- `refreshData()`: Manual data refresh with loading indicator

### Incident Management
- `renderIncidents()`: Displays incident timeline in sidebar
- `filterIncidents(filter)`: Filters incidents by status type
- `viewIncidentDetails(incidentId)`: Shows notification with incident details
- `viewIncidents()`: Opens incident management panel

### System Operations
- `deployAll()`: Simulates deployment for all services with progress notifications
- `runHealthCheck()`: Performs health check and updates metrics
- `scheduleMaintenace()`: Opens maintenance scheduler (placeholder)
- `emergencyShutdown()`: Simulates emergency shutdown for non-critical services
- `bulkActions()`: Enables bulk operations (placeholder)
- `exportData()`: Generates and logs system report to console
- `addNewPortal()`: Opens portal configuration wizard (placeholder)

### UI Controls
- `toggleCommandPalette()`: Opens/closes command palette (⌘K)
- `handleCommandSearch(query)`: Filters command palette results
- `renderCommandResults(query)`: Renders filtered commands and portals
- `showNotification(type, title, message)`: Displays toast notifications with auto-dismiss
- `setView(view)`: Switches between grid and list views
- `setCategory(category)`: Filters portals by category with status indicators
- `renderFilters()`: Creates category filter tabs with issue indicators
- `scrollFilters(direction)`: Handles horizontal scrolling of filter tabs
- `checkScrollButtons()`: Updates scroll button visibility
- `dismissAlert()`: Hides the alert banner
- `toggleNotifications()`: Shows notification count

### Favorites & Search
- `renderFavorites()`: Updates favorites list in sidebar
- `setupEventListeners()`: Initializes all event handlers
- Search functionality integrated into event listeners

## State Management

Global variables manage application state:
- `currentView`: 'grid' or 'list' (default: 'grid')
- `currentCategory`: Active filter category (default: 'all')
- `searchTerm`: Current search query (default: '')
- `commandPaletteOpen`: Command palette visibility (default: false)
- `selectedTimeRange`: '1H', '24H', '7D', or '30D' (default: '1H')

## Event Listeners

### Keyboard Shortcuts
- `⌘K` / `Ctrl+K`: Open command palette
- `Escape`: Close command palette or modals
- `Arrow Left/Right`: Navigate filter tabs when focused

### Mouse Interactions
- Click handlers for all buttons and interactive elements
- Horizontal scroll wheel support for filter tabs
- Outside click to close command palette

### Automatic Updates
- Metrics refresh every 30 seconds
- Welcome notification after 1 second on load

## Notes for Development

1. **Single File Architecture**: All functionality contained in one HTML file for maximum portability
2. **No Dependencies**: No external libraries, frameworks, or build process required
3. **CSS Variables**: Extensive use of CSS custom properties for theming
4. **Simulated Data**: All metrics and updates are simulated for demonstration purposes
5. **Internal Domains**: Portal URLs use `.internal` domains (not real endpoints)
6. **Placeholder Functions**: Several UI functions are placeholders awaiting implementation
7. **Responsive Design**: Grid automatically adjusts based on viewport width
8. **Browser Compatibility**: Modern browser required for CSS Grid, Flexbox, and ES6+ features

## Performance Considerations

- Sparkline graphs use simple CSS bars for minimal overhead
- Notification auto-dismiss after 5 seconds
- Smooth scrolling and transitions via CSS
- Efficient DOM updates for real-time metrics
- Category filter tabs with overflow handling