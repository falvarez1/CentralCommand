# Central Command Authentication System - Phase 1

## Overview

Phase 1 of the authentication system has been successfully implemented with the following features:

- **Entity Framework Core with PostgreSQL** database integration
- **ASP.NET Core Identity** for user management
- **JWT (JSON Web Token)** authentication with refresh token support
- **Comprehensive user model** based on TypeScript types
- **Full authentication endpoints** (login, register, refresh, logout)
- **Audit logging** for security tracking
- **Session management** with device tracking

## Prerequisites

1. **PostgreSQL Database** - Ensure PostgreSQL is installed and running
   - Default connection string expects:
     - Host: localhost
     - Port: 5432
     - Database: centralcommand
     - Username: postgres
     - Password: postgres

2. **.NET 8 SDK** - Required to build and run the application

## Project Structure

```
CentralCommand.MockApi/
├── Data/
│   ├── ApplicationDbContext.cs       # EF Core DbContext with Identity
│   ├── Entities/
│   │   ├── ApplicationUser.cs        # Custom user entity
│   │   ├── UserSession.cs           # Session tracking
│   │   ├── RefreshToken.cs          # Refresh token management
│   │   └── UserAuditLog.cs          # Audit logging
│   └── Migrations/                   # Database migrations
├── Models/
│   └── Auth/
│       ├── LoginRequest.cs          # Login DTO
│       ├── RegisterRequest.cs       # Registration DTO
│       ├── RefreshTokenRequest.cs   # Token refresh DTO
│       └── AuthResponse.cs          # Authentication response DTO
├── Services/
│   ├── IJwtTokenService.cs          # JWT service interface
│   └── JwtTokenService.cs           # JWT implementation
├── Controllers/
│   └── AuthController.cs            # Authentication endpoints
└── Program.cs                        # Application configuration

```

## Configuration

### Connection String (appsettings.json)
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Database=centralcommand;Username=postgres;Password=postgres;Include Error Detail=true"
  }
}
```

### JWT Settings (appsettings.json)
```json
{
  "JwtSettings": {
    "Secret": "ThisIsAVerySecureSecretKeyForJWTTokenGenerationPleaseChangeInProduction2024!",
    "Issuer": "CentralCommand.API",
    "Audience": "CentralCommand.Client",
    "AccessTokenExpirationMinutes": 15,
    "RefreshTokenExpirationDays": 7
  }
}
```

## Running the Application

1. **Install PostgreSQL** if not already installed:
   - Windows: Download from https://www.postgresql.org/download/windows/
   - macOS: `brew install postgresql`
   - Linux: `sudo apt-get install postgresql`

2. **Create the database**:
   ```sql
   CREATE DATABASE centralcommand;
   ```

3. **Build the project**:
   ```bash
   cd apps/api/CentralCommand.MockApi
   dotnet restore
   dotnet build
   ```

4. **Apply database migrations**:
   ```bash
   dotnet ef database update
   ```

   Or the application will automatically apply migrations on startup in Development mode.

5. **Run the application**:
   ```bash
   dotnet run --urls http://localhost:5000
   ```

## API Endpoints

### Authentication Endpoints

#### 1. Register
- **POST** `/api/auth/register`
- **Body**:
```json
{
  "email": "user@example.com",
  "username": "johndoe",
  "password": "SecureP@ssw0rd!",
  "confirmPassword": "SecureP@ssw0rd!",
  "firstName": "John",
  "lastName": "Doe",
  "acceptTerms": true
}
```

#### 2. Login
- **POST** `/api/auth/login`
- **Body**:
```json
{
  "usernameOrEmail": "user@example.com",
  "password": "SecureP@ssw0rd!",
  "rememberMe": false
}
```

#### 3. Refresh Token
- **POST** `/api/auth/refresh`
- **Body**:
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "base64-refresh-token"
}
```

#### 4. Logout
- **POST** `/api/auth/logout`
- **Headers**: `Authorization: Bearer {access_token}`

#### 5. Get Current User
- **GET** `/api/auth/me`
- **Headers**: `Authorization: Bearer {access_token}`

## Features Implemented

### User Model
- Extended `IdentityUser` with custom properties:
  - Personal information (FirstName, LastName, DisplayName, Avatar)
  - Role-based authorization (SuperAdmin, Admin, Manager, Developer, Analyst, Viewer, Guest)
  - User status tracking (Active, Inactive, Suspended, Pending, Deleted)
  - Organization details (Department, JobTitle, TeamId, ManagerId)
  - User preferences (Theme, Notifications, DefaultView)
  - API rate limiting tiers
  - Permission lists
  - Portal access restrictions

### Security Features
- **Password Requirements**:
  - Minimum 8 characters
  - Requires uppercase, lowercase, number, and special character
  - 4 unique characters minimum

- **Account Lockout**:
  - 5 failed attempts trigger 15-minute lockout
  - Prevents brute force attacks

- **Session Management**:
  - Tracks active sessions per user
  - Device information collection
  - IP address logging
  - Session revocation support

- **Audit Logging**:
  - All authentication actions logged
  - Tracks IP addresses and user agents
  - Success/failure status recording
  - Before/after change tracking

### JWT Implementation
- **Access Tokens**: 15-minute expiration
- **Refresh Tokens**: 7-day expiration
- **Token Rotation**: Old refresh tokens revoked on use
- **Claims Include**:
  - User ID, Email, Username
  - Roles and Permissions
  - Department and Job Title
  - Rate Limit Tier

### Database Schema
- **Schema**: `auth` (segregated from application data)
- **Tables**:
  - Users (ApplicationUser)
  - Roles (IdentityRole)
  - UserRoles (mapping)
  - UserClaims
  - UserLogins (external providers)
  - UserTokens
  - UserSessions
  - RefreshTokens
  - UserAuditLogs

## Testing with Swagger

1. Navigate to http://localhost:5000 (Swagger UI)
2. Use the **Authorize** button to add JWT token
3. Format: `Bearer {your_access_token}`
4. Test authenticated endpoints

## Testing with cURL

### Register
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "username": "testuser",
    "password": "Test@1234",
    "confirmPassword": "Test@1234",
    "firstName": "Test",
    "lastName": "User",
    "acceptTerms": true
  }'
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "usernameOrEmail": "test@example.com",
    "password": "Test@1234"
  }'
```

## Integration with Existing Features

The authentication system is fully integrated with:
- **CORS Configuration**: Supports all localhost ports
- **SignalR Hub**: JWT authentication for WebSocket connections
- **Health Checks**: Database connectivity monitoring
- **Existing Mock Data Services**: Portals and Incidents remain functional

## Next Steps (Phase 2 Recommendations)

1. **Email Verification**: Implement email confirmation for new accounts
2. **Two-Factor Authentication**: Add TOTP/SMS 2FA support
3. **External Authentication**: Integrate OAuth providers (Google, Microsoft, GitHub)
4. **Password Reset**: Implement forgot password flow
5. **Role Management API**: CRUD operations for roles and permissions
6. **User Management API**: Admin endpoints for user administration
7. **API Key Authentication**: Alternative authentication for service-to-service
8. **Rate Limiting**: Implement per-user/tier rate limiting
9. **Security Headers**: Add HSTS, CSP, X-Frame-Options
10. **Token Blacklisting**: Redis cache for revoked tokens

## Troubleshooting

### Database Connection Issues
- Ensure PostgreSQL is running: `pg_ctl status` or `systemctl status postgresql`
- Verify connection string in appsettings.json
- Check PostgreSQL logs for authentication errors

### Migration Errors
- Delete existing migrations: `rm -rf Data/Migrations`
- Recreate: `dotnet ef migrations add InitialCreate`
- Force update: `dotnet ef database update --force`

### JWT Token Issues
- Verify secret key in appsettings.json
- Check token expiration times
- Ensure clock synchronization between client and server

## Security Considerations

⚠️ **For Production Deployment**:
1. Change the JWT secret key
2. Use HTTPS only
3. Implement rate limiting
4. Enable email confirmation
5. Use secure password reset tokens
6. Implement IP-based blocking for suspicious activity
7. Add security headers
8. Use environment variables for sensitive configuration
9. Enable detailed logging and monitoring
10. Regular security audits and updates