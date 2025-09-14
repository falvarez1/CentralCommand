@echo off
echo Starting Central Command Mock API...
echo.
echo API will be available at:
echo   - Swagger UI: http://localhost:5000
echo   - Health Check: http://localhost:5000/health
echo   - SignalR Hub: http://localhost:5000/hubs/metrics
echo.
echo Press Ctrl+C to stop the server
echo.
dotnet run --urls "http://localhost:5000"