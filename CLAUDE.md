# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Central Command - A multi-component enterprise portal management system consisting of:
1. **central-command-react**: Modern React application with TypeScript, Vite, and enterprise portal management features
2. **CentralCommand.MockApi**: ASP.NET Core 8.0 Mock API with realistic data and SignalR real-time updates
3. **prototype**: Single-file HTML prototype demonstrating core UI concepts

## Commands

### Central Command React

```bash
# Development
npm install          # Install dependencies
npm run dev          # Start development server at http://localhost:5173
npm run build        # Build for production (runs TypeScript check first)
npm run preview      # Preview production build

# Code Quality
npm run lint         # Run ESLint with max warnings 0

# Testing
npm run test         # Run all Playwright tests
npm run test:e2e     # Run end-to-end tests only
npm run test:visual  # Run visual regression tests
npm run test:comparison # Run comparison tests
npm run test:ui      # Run tests with Playwright UI
npm run test:debug   # Debug tests interactively
npm run test:headed  # Run tests with browser visible
npm run test:report  # Show test report
npm run test:update-snapshots # Update visual snapshots
```

### Mock API

```bash
# Development
cd CentralCommand.MockApi
dotnet restore       # Restore NuGet packages
dotnet build         # Build the project
dotnet run --urls http://localhost:5000  # Run API on port 5000

# Access points
# API: http://localhost:5000
# Swagger UI: http://localhost:5000
# SignalR Hub: http://localhost:5000/hubs/metrics
```

### Prototype

```bash
# Open directly in browser (no build required)
start prototype/central-command-panel.html  # Windows
open prototype/central-command-panel.html   # macOS
```

## Architecture

### Central Command React

#### Tech Stack
- **React 19** with TypeScript 5.x
- **Vite** for build tooling
- **React Router 7** for routing
- **Zustand** for state management (persistent stores)
- **TanStack Query** for server state
- **Tailwind CSS** with custom components
- **Playwright** for E2E testing
- **Zod** for runtime validation

#### Project Structure
```
central-command-react/
├── src/
│   ├── components/       # Reusable UI components
│   │   ├── command-palette/  # Command palette (Cmd+K)
│   │   ├── incidents/        # Incident management
│   │   ├── layout/          # Layout components
│   │   ├── notifications/   # Toast notifications
│   │   ├── portals/         # Portal cards and lists
│   │   ├── stats/           # Statistics displays
│   │   └── ui/              # Base UI components
│   ├── pages/           # Page components
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # Utilities and helpers
│   ├── stores/          # Zustand state stores
│   ├── types/           # TypeScript type definitions
│   └── styles/          # Global CSS
├── tests/               # Playwright test suites
│   ├── e2e/            # End-to-end tests
│   ├── visual/         # Visual regression tests
│   └── comparison/     # Comparison tests
└── public/             # Static assets
```

#### Path Aliases
The project uses TypeScript path aliases configured in both `tsconfig.json` and `vite.config.ts`:
- `@/*` → `./src/*`
- `@components/*` → `./src/components/*`
- `@pages/*` → `./src/pages/*`
- `@hooks/*` → `./src/hooks/*`
- `@lib/*` → `./src/lib/*`
- `@stores/*` → `./src/stores/*`
- `@types/*` → `./src/types/*`

#### State Management (Zustand Stores)

Located in `src/stores/`:
- **usePortalStore**: Portal CRUD, favorites, filtering, metrics updates
- **useIncidentStore**: Incident management, filtering, creation
- **useStatsStore**: System statistics, sparkline data, metrics calculations
- **useUIStore**: UI state (theme, view mode, modals, notifications)
- **useCommandStore**: Command palette state and search

All stores use `immer` for immutable updates and `zustand/middleware` for persistence.

#### Key Features
- **Portal Management**: Monitor service portals with real-time metrics
- **Incident Tracking**: Create, view, and manage system incidents
- **Command Palette**: Quick actions via Cmd/Ctrl+K
- **Real-time Updates**: 30-second metric refresh intervals
- **Theme Support**: Dark/light mode with system preference detection
- **View Modes**: Grid and list views for portal display
- **Responsive Design**: Mobile-first with breakpoint utilities

#### Testing Configuration

Playwright configured for:
- Multiple browsers (Chromium, Firefox, WebKit, Edge, Chrome)
- Mobile viewports (Pixel 5, iPhone 12, iPad)
- Automatic dev server startup
- Test artifacts in `test-results/`
- HTML, JSON, and JUnit reporters
- Screenshot/video capture on failure

### Prototype

Single-file HTML application (`prototype/central-command-panel.html`) with:
- Embedded CSS (lines 1-1969)
- HTML structure (lines 1970-2432)
- JavaScript logic (lines 2433-3351)
- No external dependencies
- Simulated data and metrics
- Complete UI implementation

See `prototype/CLAUDE.md` for detailed prototype documentation.

### Mock API

ASP.NET Core 8.0 Web API (`CentralCommand.MockApi/`) with:
- **RESTful Endpoints**: Full CRUD operations for portals, incidents, statistics
- **SignalR Hub**: Real-time metric updates every 30 seconds
- **In-Memory Storage**: No database required for development
- **Realistic Data**: 36+ portals, 15+ incidents with Bogus data generation
- **CORS Support**: Configured for React app on localhost:5173
- **Swagger UI**: Interactive API documentation at root URL

#### API Endpoints
```
GET    /api/v1/portals                     # List portals with pagination
GET    /api/v1/portals/{id}                # Get specific portal
POST   /api/v1/portals/{id}/metrics        # Update portal metrics
GET    /api/v1/portals/{id}/metrics/history # Get metrics history
GET    /api/v1/portals/{id}/health         # Get health check config
POST   /api/v1/portals/batch               # Batch operations

GET    /api/v1/incidents                   # List incidents
POST   /api/v1/incidents                   # Create incident
GET    /api/v1/incidents/{id}/comments     # Get incident comments
POST   /api/v1/incidents/{id}/comments     # Add incident comment

GET    /api/v1/statistics                  # System statistics
GET    /api/v1/statistics/sparklines       # Time-series data
```

#### SignalR Events
- `PortalMetricsUpdated`: Portal metrics changes
- `IncidentStatusChanged`: Incident status updates
- `StatisticsUpdated`: System statistics refresh

### React API Integration

The React app includes full API integration:

#### API Client (`src/lib/api/`)
- **Axios configuration** with interceptors
- **Service modules** for portals, incidents, statistics
- **Error handling** with automatic retry
- **Type-safe responses** with TypeScript

#### TanStack Query Hooks (`src/hooks/queries/`)
- `usePortals`, `usePortal`, `useCreatePortal`, `useUpdatePortal`
- `useIncidents`, `useCreateIncident`, `useResolveIncident`
- `useDashboardStats`, `useSparklineData`
- Automatic caching and background refetching

#### SignalR Integration (`src/lib/signalr/`)
- Auto-reconnection with exponential backoff
- React hooks: `useSignalR`, `useDashboardSignalR`
- Real-time store updates via Zustand

#### Environment Configuration
- `.env` file with `VITE_API_URL=http://localhost:5000`
- Type-safe config with Zod validation
- Feature flags support

## Development Guidelines

### Code Style
- Use TypeScript strict mode
- Follow existing component patterns
- Use path aliases for imports
- Implement proper error boundaries
- Add loading states for async operations

### Component Development
- Check existing components before creating new ones
- Follow the established pattern for similar components
- Use the UI components from `src/components/ui/`
- Implement proper TypeScript types
- Add proper ARIA labels for accessibility

### State Management
- Use Zustand stores for global state
- Keep component state local when possible
- Use TanStack Query for server state
- Implement optimistic updates where appropriate

### Testing
- Run tests before committing changes
- Update snapshots when UI changes are intentional
- Write E2E tests for new features
- Test across different viewports

## Important Notes

1. **TypeScript Strict Mode**: All code must pass TypeScript strict checks
2. **ESLint Zero Warnings**: Linting must pass with no warnings
3. **Path Aliases**: Always use configured aliases for imports
4. **Zustand Patterns**: Follow existing store patterns with immer
5. **Tailwind Classes**: Use Tailwind utilities, avoid inline styles
6. **Component Composition**: Prefer composition over inheritance
7. **Error Handling**: Implement proper error boundaries and fallbacks
8. **Accessibility**: Ensure ARIA labels and keyboard navigation
9. **Performance**: Use React.memo and useMemo where appropriate
10. **Testing**: Maintain test coverage for critical paths

## Running the Full Stack

To run the complete application with API integration:

```bash
# Terminal 1: Start Mock API
cd CentralCommand.MockApi
dotnet run --urls http://localhost:5000

# Terminal 2: Start React App
cd central-command-react
npm run dev

# Access the application
# React App: http://localhost:5173
# API Swagger: http://localhost:5000
```

The React app will automatically connect to the Mock API and SignalR hub for real-time updates.