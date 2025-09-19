# Migration Guide: From Mock to Real API

## Overview
This guide explains how the application has been configured to support both mock and real API modes, allowing you to transition from prototype to production-ready application.

## What Changed

### 1. Environment Configuration
- Added separate API URLs for Real API (`http://localhost:5000`) and Mock API (`http://localhost:5001`)
- Updated `.env` file with proper configuration variables
- Modified `env.ts` to support both API endpoints

### 2. API Port Standardization
- **Real API (CentralCommand.Api)**: Now runs on port `5000`
- **Mock API (CentralCommand.MockApi)**: Now runs on port `5001`
- Both APIs have consistent launch settings and swagger documentation

### 3. Dynamic API Client
- Created mode-aware API client that switches URLs based on selected mode
- Added connection testing capability
- Automatic URL switching when toggling between modes

### 4. Backend Data Management
- Added `DataSeedingService` for generating sample data
- Created `DevController` with endpoints for data management:
  - `POST /api/v1/dev/seed` - Seeds database with sample data
  - `DELETE /api/v1/dev/clear` - Clears all data
  - `POST /api/v1/dev/reset` - Resets database (clear + seed)
  - `GET /api/v1/dev/stats` - Shows database statistics
  - `GET /api/v1/dev/health` - Tests database connectivity
- Automatic seeding on first startup if database is empty

### 5. Frontend Store Integration
- Refactored `useIncidentStore` to properly use APIs
- Removed embedded mock data generation
- Added automatic database seeding fallback
- Proper error handling and user notifications

### 6. UI Connection Status
- Added real-time connection status indicator
- Visual feedback for API connectivity
- Shows current mode (Mock/Real) with connection status

## How to Run

### Starting the Backend Services

#### Option 1: Real API (Production-like)
```bash
cd backend/src/CentralCommand.Api
dotnet run --urls http://localhost:5000
```

This will:
- Start the real API on port 5000
- Use InMemory database (configurable to SQL Server)
- Automatically seed sample data on first run
- Provide full CRUD operations with data persistence

#### Option 2: Mock API (Lightweight)
```bash
cd backend/src/CentralCommand.MockApi
dotnet run --urls http://localhost:5001
```

This will:
- Start the mock API on port 5001
- Use hardcoded sample data
- Suitable for demos and UI development

#### Option 3: Run Both (Recommended for Development)
Open two terminal windows and run both APIs simultaneously. This allows instant switching between modes.

### Starting the Frontend
```bash
cd frontend/central-command-web
npm install
npm run dev
```

The frontend will start on `http://localhost:5173`

## How to Use

### Switching Between Modes

1. **Using the UI Toggle**:
   - Look for the data source switch in the header
   - Toggle between "Mock" and "Real" modes
   - Connection status indicator shows:
     - 🟢 Green: Connected
     - 🔴 Red: Disconnected
     - 🟡 Yellow: Checking connection

2. **What Happens in Each Mode**:
   - **Mock Mode**: Connects to Mock API (port 5001), uses lightweight sample data
   - **Real Mode**: Connects to Real API (port 5000), uses persistent database

### Managing Data (Real API Only)

#### Seed Sample Data
```bash
curl -X POST http://localhost:5000/api/v1/dev/seed
```

#### Reset Database
```bash
curl -X POST http://localhost:5000/api/v1/dev/reset
```

#### Check Database Stats
```bash
curl http://localhost:5000/api/v1/dev/stats
```

## Troubleshooting

### Frontend always shows mock data
1. Check that the Real API is running on port 5000
2. Verify the mode toggle is set to "Real"
3. Check the connection indicator - should be green
4. Open browser console for any error messages

### Cannot connect to API
1. Ensure the appropriate backend is running:
   - Real API: `http://localhost:5000`
   - Mock API: `http://localhost:5001`
2. Check CORS settings if running from different domain
3. Verify no firewall blocking the ports

### Data not persisting
1. Ensure you're in "Real" mode, not "Mock"
2. Check that Real API is running (not Mock API)
3. Verify database is properly configured

### How to verify it's working
1. Start the Real API
2. Switch to "Real" mode in the UI
3. Create or modify an incident
4. Refresh the page
5. Data should persist (unlike mock mode)

## API Endpoints

### Real API (Port 5000)
- Swagger UI: `http://localhost:5000/swagger`
- Health Check: `http://localhost:5000/health`
- Incidents: `http://localhost:5000/api/v1/incidents`
- Portals: `http://localhost:5000/api/v1/portals`
- Dev Tools: `http://localhost:5000/api/v1/dev/*` (Development only)

### Mock API (Port 5001)
- Swagger UI: `http://localhost:5001/swagger`
- Health Check: `http://localhost:5001/health`
- Incidents: `http://localhost:5001/api/v1/incidents`
- Portals: `http://localhost:5001/api/v1/portals`

## Configuration Files

### Frontend
- `/frontend/central-command-web/.env` - API URLs and feature flags
- `/frontend/central-command-web/src/config/env.ts` - Environment configuration
- `/frontend/central-command-web/src/lib/api/client.ts` - API client with mode switching

### Backend
- `/backend/src/CentralCommand.Api/appsettings.Development.json` - Real API settings
- `/backend/src/CentralCommand.Api/Properties/launchSettings.json` - Real API ports
- `/backend/src/CentralCommand.MockApi/Properties/launchSettings.json` - Mock API ports

## Next Steps

### For Production Deployment
1. Configure SQL Server connection string in `appsettings.json`
2. Set up Entity Framework migrations
3. Configure authentication (currently disabled in dev)
4. Set up proper CORS for production domain
5. Configure SignalR for real-time updates
6. Set up monitoring and logging

### For Development
1. Both APIs can run simultaneously for easy mode switching
2. Use Mock API for UI development without backend dependencies
3. Use Real API for integration testing and feature development
4. Dev endpoints available for data management (development environment only)

## Summary

The application now properly supports both mock and real data modes:

- **Mock Mode**: Fast, lightweight, perfect for UI development and demos
- **Real Mode**: Full backend integration, data persistence, production-ready

The key achievement is that switching between modes actually changes the data source, unlike before where it always showed mock data regardless of the setting. The system is now ready for the transition from prototype to production.