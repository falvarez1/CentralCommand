# Central Command

An enterprise portal management system for monitoring and managing service portals, tracking incidents, and providing real-time metrics.

## 🏗️ Architecture

Central Command follows clean architecture principles with a monorepo structure:

- **Clean Architecture** - Domain-driven design with clear layer separation
- **CQRS Pattern** - Command/Query separation using MediatR
- **Repository Pattern** - Data access abstraction
- **No AutoMapper** - Simple extension methods for object mapping
- **Rich Domain Models** - Business logic in entities

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed architecture documentation.

## 📁 Project Structure

```
CentralCommand/
├── apps/api/                    # Backend applications
│   ├── CentralCommand.Api/      # Main API (.NET 9)
│   └── CentralCommand.MockApi/  # Mock API for development
├── libs/                         # Shared libraries
│   └── CentralCommand.Core/     # Domain models, DTOs, interfaces
├── central-command-react/        # React frontend
├── prototype/                    # HTML prototype
└── docs/                        # Documentation
```

## 🚀 Quick Start

### Prerequisites
- .NET 9 SDK
- Node.js 18+
- SQL Server (or use in-memory database for development)

### Backend API

```bash
# Build the solution
dotnet build

# Run the main API
cd backend/src/CentralCommand.Api
dotnet run --urls http://localhost:5000

# Or run the mock API for development
cd backend/src/CentralCommand.MockApi
dotnet run --urls http://localhost:5001
```

### Frontend Application

```bash
cd central-command-react
npm install
npm run dev
```

Access the application at http://localhost:5173

## 🛠️ Technology Stack

### Backend
- **.NET 9** - Latest framework features
- **ASP.NET Core** - Web API
- **Entity Framework Core** - ORM
- **MediatR** - CQRS implementation
- **FluentValidation** - Input validation
- **SignalR** - Real-time updates
- **Serilog** - Structured logging

### Frontend
- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tooling
- **Zustand** - State management
- **TanStack Query** - Server state
- **Tailwind CSS** - Styling

## 📚 Documentation

- [Architecture Overview](./ARCHITECTURE.md) - System design and patterns
- [Development Guidelines](./CLAUDE.md) - Coding standards and practices
- [Software Design Standards](./docs/SOFTWARE-DESIGN-STANDARDS.md) - Design principles
- [API Design](./API-Design-Document.md) - API specifications

## 🔑 Key Features

### Portal Management
- Monitor service portals with real-time metrics
- Track portal health and availability
- Configure health checks and alerts
- Organize portals by category and environment

### Incident Tracking
- Create and manage incidents
- Track incident timeline and comments
- Assign priorities and severities
- Link incidents to affected portals

### Metrics & Analytics
- Real-time performance metrics
- Historical data visualization
- System-wide statistics
- Sparkline charts for trends

### Real-time Updates
- SignalR for live metric updates
- Automatic dashboard refresh
- Push notifications for critical events
- Background metric collection

## 🏛️ Architecture Highlights

### Clean Architecture Layers
1. **Domain Layer** (Core) - Business logic and entities
2. **Application Layer** - Use cases and orchestration
3. **Infrastructure Layer** - External concerns
4. **Presentation Layer** - API controllers

### Key Patterns
- **CQRS** - Separate commands and queries
- **Repository Pattern** - Abstract data access
- **Value Objects** - Encapsulate domain concepts
- **Extension Methods** - Simple object mapping
- **Domain Events** - Decouple business logic

## 🧪 Testing

```bash
# Run backend tests
dotnet test

# Run frontend tests
cd central-command-react
npm run test
npm run test:e2e
```

## 🔧 Configuration

### API Configuration
Configuration is managed through `appsettings.json`:
- Connection strings
- JWT settings
- CORS policies
- Logging configuration

### Environment Variables
```bash
# Database
ConnectionStrings__DefaultConnection=Server=...

# Authentication
Jwt__Key=your-secret-key
Jwt__Issuer=your-issuer
Jwt__Audience=your-audience

# API Keys
ApiKey__Value=your-api-key
```

## 📦 Building for Production

### Backend
```bash
dotnet publish -c Release -o ./publish
```

### Frontend
```bash
cd central-command-react
npm run build
```

## 🤝 Contributing

1. Follow the [Software Design Standards](./docs/SOFTWARE-DESIGN-STANDARDS.md)
2. Write tests for new features
3. Update documentation as needed
4. Submit pull requests for review

## 📄 License

[Your License Here]

## 🔗 Related Projects

- [Central Command React](./central-command-react/README.md) - Frontend documentation
- [Mock API](./backend/src/CentralCommand.MockApi/README.md) - Mock API documentation

## 👥 Team

[Your Team Information]

## 📞 Support

[Your Support Information]