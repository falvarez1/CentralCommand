# PowerShell script to find what's locking a folder
param(
    [string]$FolderPath = "E:\Projects\CentralCommand\central-command-react"
)

Write-Host "Checking what's holding folder: $FolderPath" -ForegroundColor Yellow
Write-Host ""

# Method 1: Check if current PowerShell session is in that directory
Write-Host "Method 1: Checking current directory in all PowerShell sessions..." -ForegroundColor Cyan
$currentLocation = Get-Location
if ($currentLocation.Path -like "*central-command-react*") {
    Write-Host "  WARNING: Current PowerShell session is in the target directory!" -ForegroundColor Red
    Write-Host "  Current location: $($currentLocation.Path)" -ForegroundColor Yellow
    Write-Host "  Solution: Change directory with 'cd ..'" -ForegroundColor Green
}

# Method 2: Check for processes with open handles
Write-Host ""
Write-Host "Method 2: Checking for processes with open handles..." -ForegroundColor Cyan

# Check if handle.exe exists
$handlePath = "C:\SysinternalsSuite\handle.exe"
$handle64Path = "C:\SysinternalsSuite\handle64.exe"

if (Test-Path $handle64Path) {
    Write-Host "  Using handle64.exe to check..." -ForegroundColor Gray
    & $handle64Path -accepteula "$FolderPath" 2>$null | ForEach-Object {
        if ($_ -match "^(\S+)\s+pid:\s+(\d+)") {
            Write-Host "  Process: $($Matches[1]) (PID: $($Matches[2]))" -ForegroundColor Yellow
        }
    }
} elseif (Test-Path $handlePath) {
    Write-Host "  Using handle.exe to check..." -ForegroundColor Gray
    & $handlePath -accepteula "$FolderPath" 2>$null | ForEach-Object {
        if ($_ -match "^(\S+)\s+pid:\s+(\d+)") {
            Write-Host "  Process: $($Matches[1]) (PID: $($Matches[2]))" -ForegroundColor Yellow
        }
    }
} else {
    Write-Host "  Handle.exe not found. Download from: https://docs.microsoft.com/en-us/sysinternals/downloads/handle" -ForegroundColor Yellow
}

# Method 3: Check common applications
Write-Host ""
Write-Host "Method 3: Checking common applications that might lock folders..." -ForegroundColor Cyan

# Check VS Code
$vscodeProcesses = Get-Process | Where-Object { $_.ProcessName -like "*code*" }
if ($vscodeProcesses) {
    Write-Host "  VS Code is running - might have folder open" -ForegroundColor Yellow
    $vscodeProcesses | ForEach-Object {
        Write-Host "    $($_.ProcessName) (PID: $($_.Id))" -ForegroundColor Gray
    }
}

# Check Visual Studio
$vsProcesses = Get-Process | Where-Object { $_.ProcessName -like "devenv" }
if ($vsProcesses) {
    Write-Host "  Visual Studio is running - might have folder open" -ForegroundColor Yellow
    $vsProcesses | ForEach-Object {
        Write-Host "    $($_.ProcessName) (PID: $($_.Id))" -ForegroundColor Gray
    }
}

# Check Windows Explorer
$explorerWindows = (New-Object -ComObject Shell.Application).Windows()
foreach ($window in $explorerWindows) {
    if ($window.LocationURL -like "*central-command-react*" -or $window.LocationName -like "*central-command-react*") {
        Write-Host "  Windows Explorer has folder open" -ForegroundColor Yellow
        Write-Host "    Location: $($window.LocationURL)" -ForegroundColor Gray
    }
}

# Check Git Bash / terminals
$bashProcesses = Get-Process | Where-Object { $_.ProcessName -in @("bash", "git-bash", "mintty", "sh") }
if ($bashProcesses) {
    Write-Host "  Git Bash/Terminal is running - might be in folder" -ForegroundColor Yellow
    $bashProcesses | ForEach-Object {
        Write-Host "    $($_.ProcessName) (PID: $($_.Id))" -ForegroundColor Gray
    }
}

# Check Node processes
$nodeProcesses = Get-Process | Where-Object { $_.ProcessName -like "node" }
if ($nodeProcesses) {
    Write-Host "  Node.js processes running - might be serving from folder" -ForegroundColor Yellow
    $nodeProcesses | ForEach-Object {
        Write-Host "    $($_.ProcessName) (PID: $($_.Id))" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "Method 4: Using built-in Windows tools..." -ForegroundColor Cyan

# Try openfiles command (requires admin)
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")
if ($isAdmin) {
    Write-Host "  Checking with openfiles command..." -ForegroundColor Gray
    $openFiles = openfiles /query /fo csv 2>$null | ConvertFrom-Csv | Where-Object { $_.Path -like "*central-command-react*" }
    if ($openFiles) {
        $openFiles | ForEach-Object {
            Write-Host "  File: $($_.Path)" -ForegroundColor Yellow
            Write-Host "    Accessed by: $($_.AccessedBy)" -ForegroundColor Gray
        }
    } else {
        Write-Host "  No open files found in target folder" -ForegroundColor Green
    }
} else {
    Write-Host "  Run PowerShell as Administrator to use openfiles command" -ForegroundColor Gray
}

Write-Host ""
Write-Host "Solutions to try:" -ForegroundColor Green
Write-Host "1. Close all File Explorer windows"
Write-Host "2. Close VS Code and Visual Studio"
Write-Host "3. Close all terminal/command prompt windows"
Write-Host "4. Change directory in all terminals: cd .."
Write-Host "5. Restart Windows Explorer: taskkill /f /im explorer.exe && explorer.exe"
Write-Host "6. As last resort: Restart computer"
Write-Host ""