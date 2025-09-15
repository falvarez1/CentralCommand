# PowerShell script to test Supabase Cloud connection
# Run this script after updating your .env files with real values

Write-Host "Testing Supabase Cloud Connection..." -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Green

# Load environment variables from .env file
function Load-EnvFile {
    param($Path)

    if (Test-Path $Path) {
        Get-Content $Path | ForEach-Object {
            if ($_ -match '^([^#=]+)=(.*)$') {
                $name = $matches[1].Trim()
                $value = $matches[2].Trim()
                if ($name -and $value) {
                    [Environment]::SetEnvironmentVariable($name, $value, "Process")
                    Write-Host "Loaded: $name" -ForegroundColor Gray
                }
            }
        }
    } else {
        Write-Host "File not found: $Path" -ForegroundColor Red
        return $false
    }
    return $true
}

# Load API environment variables
Write-Host "`nLoading API environment variables..." -ForegroundColor Yellow
$apiEnvLoaded = Load-EnvFile "apps/api/CentralCommand.Api/.env"

if ($apiEnvLoaded) {
    $supabaseUrl = [Environment]::GetEnvironmentVariable("SUPABASE_URL", "Process")
    $anonKey = [Environment]::GetEnvironmentVariable("SUPABASE_ANON_KEY", "Process")

    if ($supabaseUrl -and $anonKey -and $supabaseUrl -ne "https://YOUR-PROJECT-REF.supabase.co") {
        Write-Host "`nTesting Supabase API connection..." -ForegroundColor Yellow

        try {
            # Test the Supabase REST API
            $headers = @{
                "apikey" = $anonKey
                "Authorization" = "Bearer $anonKey"
            }

            $response = Invoke-RestMethod -Uri "$supabaseUrl/rest/v1/" -Headers $headers -Method GET
            Write-Host "✅ Successfully connected to Supabase REST API!" -ForegroundColor Green

            # Test Auth endpoint
            $authResponse = Invoke-RestMethod -Uri "$supabaseUrl/auth/v1/health" -Headers $headers -Method GET
            Write-Host "✅ Supabase Auth service is healthy!" -ForegroundColor Green

        } catch {
            Write-Host "❌ Failed to connect to Supabase: $_" -ForegroundColor Red
        }

        # Display connection info
        Write-Host "`nConnection Details:" -ForegroundColor Cyan
        Write-Host "  Project URL: $supabaseUrl" -ForegroundColor White
        Write-Host "  Project Ref: $($supabaseUrl -replace 'https://(.+)\.supabase\.co', '$1')" -ForegroundColor White

    } else {
        Write-Host "❌ Please update your .env file with real Supabase credentials!" -ForegroundColor Red
        Write-Host "   Current URL: $supabaseUrl" -ForegroundColor Yellow
    }
} else {
    Write-Host "❌ Could not load environment file!" -ForegroundColor Red
}

# Load Web environment variables
Write-Host "`nLoading Web environment variables..." -ForegroundColor Yellow
$webEnvLoaded = Load-EnvFile "apps/web/.env"

if ($webEnvLoaded) {
    $viteSupabaseUrl = [Environment]::GetEnvironmentVariable("VITE_SUPABASE_URL", "Process")
    $viteAnonKey = [Environment]::GetEnvironmentVariable("VITE_SUPABASE_ANON_KEY", "Process")

    if ($viteSupabaseUrl -and $viteSupabaseUrl -ne "https://YOUR-PROJECT-REF.supabase.co") {
        Write-Host "✅ Web app environment configured!" -ForegroundColor Green
    } else {
        Write-Host "❌ Please update your web app .env file with real Supabase credentials!" -ForegroundColor Red
    }
}

Write-Host "`n====================================" -ForegroundColor Green
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "1. If not configured, create a Supabase project at: https://supabase.com" -ForegroundColor White
Write-Host "2. Update both .env files with your project credentials" -ForegroundColor White
Write-Host "3. Run this script again to verify connection" -ForegroundColor White
Write-Host "4. Start your API: cd apps/api/CentralCommand.Api && dotnet run" -ForegroundColor White
Write-Host "5. Start your web app: cd apps/web && npm run dev" -ForegroundColor White