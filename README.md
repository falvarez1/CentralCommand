# Central Command - Enterprise Portal Management System

A comprehensive enterprise portal management system built with React, TypeScript, and .NET Core, organized as a monorepo for optimal development experience.

## 🏗️ Architecture

This project uses a monorepo structure managed with npm workspaces and Turbo for efficient builds.

```
central-command/
├── apps/                   # Applications
│   ├── web/               # React frontend application
│   └── api/               # Backend services
│       ├── CentralCommand.Api/      # Main API service
│       └── CentralCommand.MockApi/  # Mock API for development
├── packages/              # Shared packages
│   ├── shared-types/     # TypeScript types shared across projects
│   └── ui-components/    # Shared React components
├── docs/                  # Documentation
│   ├── api/              # API documentation
│   ├── architecture/     # Architecture decisions
│   └── prototype/        # HTML prototypes
├── scripts/              # Build and deployment scripts
└── docker/               # Docker configurations
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm 9+
- .NET 8.0 or 9.0 SDK
- Git
- Supabase account (for Production API with authentication)
- Optional: Docker for containerized development

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/central-command.git
cd central-command

# Install all dependencies
npm install
npm run install:all
```

### Development

```bash
# Run all services (recommended)
npm run dev:all

# Or run services individually
npm run dev:web    # Start React app only
npm run dev:api    # Start Mock API only
```

### Access Points

- **React App**: http://localhost:5173
- **Mock API**: http://localhost:5000 (Development)
- **Production API**: http://localhost:5001 (Requires PostgreSQL)
- **API Swagger**: http://localhost:5000/swagger (Mock) or http://localhost:5001/swagger (Production)

## 📦 Project Structure

### Apps

#### Web (`apps/web`)
- Modern React 19 application
- TypeScript 5.x with strict mode
- Vite for fast development
- TailwindCSS for styling
- Zustand for state management
- TanStack Query for server state

#### API (`apps/api`)
- **CentralCommand.Api**: Production API service (Port 5001)
  - Supabase Authentication (JWT-based)
  - PostgreSQL via Supabase
  - Row Level Security (RLS) for data access
  - OAuth providers support (Google, GitHub, etc.)
  - Magic link authentication
  - SignalR for real-time updates with Supabase JWT validation

- **CentralCommand.MockApi**: Development mock API (Port 5000)
  - In-memory data storage
  - Bogus for realistic data generation
  - No authentication required
  - SignalR for real-time updates
  - Perfect for frontend development

### Packages

#### Shared Types (`packages/shared-types`)
Shared TypeScript definitions used across web and API projects.

#### UI Components (`packages/ui-components`)
Reusable React components that can be shared across multiple frontend applications.

## 🛠️ Available Scripts

### Root Level Commands

```bash
# Development
npm run dev          # Start web app
npm run dev:all      # Start all services
npm run dev:web      # Start web app only
npm run dev:api      # Start API only

# Building
npm run build        # Build web app
npm run build:all    # Build everything
npm run build:web    # Build web app only
npm run build:api    # Build API only

# Testing
npm run test         # Run tests
npm run test:e2e     # Run E2E tests

# Code Quality
npm run lint         # Lint code
npm run format       # Format code with Prettier

# Maintenance
npm run clean        # Clean all build artifacts
```

## 🧪 Testing

```bash
# Unit tests
npm run test

# E2E tests with Playwright
npm run test:e2e

# Visual regression tests
npm run test:visual

# Test with UI
npm run test:ui
```

## 📚 Documentation

- [API Architecture](./API_ARCHITECTURE.md) - Dual API setup explanation
- [Supabase Setup Guide](./SUPABASE_SETUP.md) - Complete Supabase configuration guide
- [Implementation Status](./IMPLEMENTATION_STATUS.md) - Current progress and roadmap
- [Claude Instructions](./CLAUDE.md) - AI assistant guidelines
- [API Documentation](./docs/api/README.md)
- [Architecture Decisions](./docs/architecture/README.md)
- [Development Guide](./docs/DEVELOPMENT.md)
- [Deployment Guide](./docs/DEPLOYMENT.md)

## 🏃‍♂️ Features

### Portal Management
- Real-time portal monitoring
- Health check configuration
- Metrics tracking and visualization
- Alert management

### Incident Management
- Create and track incidents
- Severity levels and prioritization
- Comment system
- Resolution tracking

### Dashboard Features
- Real-time metrics updates via SignalR
- Command palette (Cmd/Ctrl + K)
- Dark/Light theme support
- Responsive design
- Keyboard shortcuts

### Security Features (Production API)
- ✅ Supabase JWT authentication
- ✅ Row Level Security (RLS) policies
- ✅ Rate limiting via Supabase
- ✅ Security headers (XSS, clickjacking protection)
- ✅ Session management via Supabase
- ✅ Built-in user management
- ✅ Role-based access control via Supabase Auth
- ✅ OAuth 2.0 support (Google, GitHub, etc.)
- ✅ Magic link authentication
- ✅ Email verification
- ✅ Password reset functionality

## 🐳 Docker Support

```bash
# Build and run with Docker Compose
docker-compose up

# Build images individually
docker build -f docker/Dockerfile.web -t central-command-web .
docker build -f docker/Dockerfile.api -t central-command-api .
```

## 🤝 Contributing

Please read [CONTRIBUTING.md](./CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## 🙏 Acknowledgments

- Built with React, TypeScript, and .NET Core
- UI components from shadcn/ui
- Icons from Lucide React
- Real-time updates powered by SignalR

## 📞 Support

For support, please create an issue in the GitHub repository or contact the development team.

---

**Central Command** - Unified Portal Management for the Enterprise