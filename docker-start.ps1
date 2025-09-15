# PowerShell script to start self-hosted Supabase with Central Command

Write-Host "Starting Central Command with Self-Hosted Supabase..." -ForegroundColor Green

# Check if Docker is running
$dockerRunning = docker info 2>$null
if (-not $?) {
    Write-Host "Docker is not running. Please start Docker Desktop first." -ForegroundColor Red
    exit 1
}

# Load environment variables
if (Test-Path ".env.supabase") {
    Write-Host "Loading environment variables from .env.supabase..." -ForegroundColor Yellow
    Get-Content ".env.supabase" | ForEach-Object {
        if ($_ -match "^([^#][^=]+)=(.*)$") {
            $name = $matches[1].Trim()
            $value = $matches[2].Trim()
            [Environment]::SetEnvironmentVariable($name, $value, "Process")
        }
    }
} else {
    Write-Host "Warning: .env.supabase file not found. Using default values." -ForegroundColor Yellow
}

# Pull latest images
Write-Host "`nPulling latest Docker images..." -ForegroundColor Yellow
docker-compose pull

# Start services
Write-Host "`nStarting services..." -ForegroundColor Yellow
docker-compose up -d

# Wait for services to be healthy
Write-Host "`nWaiting for services to be healthy..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Check service status
Write-Host "`nChecking service status..." -ForegroundColor Yellow
docker-compose ps

# Display access URLs
Write-Host "`n==================================================" -ForegroundColor Cyan
Write-Host "Services are starting up!" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Access URLs:" -ForegroundColor Yellow
Write-Host "  Supabase Studio:  http://localhost:54323" -ForegroundColor White
Write-Host "  Supabase API:     http://localhost:54321" -ForegroundColor White
Write-Host "  PostgreSQL:       localhost:54322" -ForegroundColor White
Write-Host "  API (Production): http://localhost:5001" -ForegroundColor White
Write-Host "  React App:        http://localhost:5173 (run 'cd apps/web && npm run dev')" -ForegroundColor White
Write-Host ""
Write-Host "Default Credentials:" -ForegroundColor Yellow
Write-Host "  Studio Username:  admin" -ForegroundColor White
Write-Host "  Studio Password:  admin" -ForegroundColor White
Write-Host ""
Write-Host "To stop services, run: docker-compose down" -ForegroundColor Gray
Write-Host "To view logs, run: docker-compose logs -f [service-name]" -ForegroundColor Gray
Write-Host ""