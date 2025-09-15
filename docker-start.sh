#!/bin/bash

# Bash script to start self-hosted Supabase with Central Command

echo -e "\033[32mStarting Central Command with Self-Hosted Supabase...\033[0m"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "\033[31mDocker is not running. Please start Docker first.\033[0m"
    exit 1
fi

# Load environment variables
if [ -f ".env.supabase" ]; then
    echo -e "\033[33mLoading environment variables from .env.supabase...\033[0m"
    export $(cat .env.supabase | grep -v '^#' | xargs)
else
    echo -e "\033[33mWarning: .env.supabase file not found. Using default values.\033[0m"
fi

# Pull latest images
echo -e "\n\033[33mPulling latest Docker images...\033[0m"
docker-compose pull

# Start services
echo -e "\n\033[33mStarting services...\033[0m"
docker-compose up -d

# Wait for services to be healthy
echo -e "\n\033[33mWaiting for services to be healthy...\033[0m"
sleep 10

# Check service status
echo -e "\n\033[33mChecking service status...\033[0m"
docker-compose ps

# Display access URLs
echo -e "\n\033[36m==================================================\033[0m"
echo -e "\033[32mServices are starting up!\033[0m"
echo -e "\033[36m==================================================\033[0m"
echo ""
echo -e "\033[33mAccess URLs:\033[0m"
echo -e "  Supabase Studio:  \033[37mhttp://localhost:54323\033[0m"
echo -e "  Supabase API:     \033[37mhttp://localhost:54321\033[0m"
echo -e "  PostgreSQL:       \033[37mlocalhost:54322\033[0m"
echo -e "  API (Production): \033[37mhttp://localhost:5001\033[0m"
echo -e "  React App:        \033[37mhttp://localhost:5173 (run 'cd apps/web && npm run dev')\033[0m"
echo ""
echo -e "\033[33mDefault Credentials:\033[0m"
echo -e "  Studio Username:  \033[37madmin\033[0m"
echo -e "  Studio Password:  \033[37madmin\033[0m"
echo ""
echo -e "\033[90mTo stop services, run: docker-compose down\033[0m"
echo -e "\033[90mTo view logs, run: docker-compose logs -f [service-name]\033[0m"
echo ""