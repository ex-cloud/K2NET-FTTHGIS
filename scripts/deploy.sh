#!/bin/bash
set -e

ENV=$1
if [ -z "$ENV" ]; then
  echo "Usage: $0 [staging|production]"
  exit 1
fi

echo "=== Starting deployment for environment: $ENV ==="

# Define Compose files and ports
if [ "$ENV" = "staging" ]; then
  COMPOSE_FILE="docker-compose.staging.yml"
  ENV_FILE=".env.staging"
  PORT_BACKEND=19090
  PORT_FRONTEND=13000
  SERVICE_BACKEND="backend-staging"
elif [ "$ENV" = "production" ]; then
  COMPOSE_FILE="docker-compose.yml"
  ENV_FILE=".env"
  PORT_BACKEND=9090
  PORT_FRONTEND=3000
  SERVICE_BACKEND="backend"
else
  echo "Invalid environment. Must be staging or production."
  exit 1
fi

# Load Env variables
if [ -f "$ENV_FILE" ]; then
  echo "Loading environment variables from $ENV_FILE"
  export $(grep -v '^#' $ENV_FILE | xargs)
else
  echo "Warning: $ENV_FILE not found! Relying on system environment variables."
fi

# Check for Docker
if ! [ -x "$(command -v docker)" ]; then
  echo "Error: docker is not installed." >&2
  exit 1
fi

# Set Git env variables for Frontend build
echo "Fetching frontend git metadata for compilation..."
export NEXT_PUBLIC_GIT_BRANCH=$((git -C frontend rev-parse --abbrev-ref HEAD 2>/dev/null || git rev-parse --abbrev-ref HEAD 2>/dev/null) || echo "main")
export NEXT_PUBLIC_GIT_COMMIT=$((git -C frontend rev-parse HEAD 2>/dev/null || git rev-parse HEAD 2>/dev/null) || echo "unknown")
echo "Git Branch: $NEXT_PUBLIC_GIT_BRANCH"
echo "Git Commit: $NEXT_PUBLIC_GIT_COMMIT"

# Build and start services
echo "Rebuilding and restarting services..."

TARGET_SERVICE=""
if [ -n "$2" ]; then
  if [ "$ENV" = "staging" ]; then
    if [ "$2" = "backend" ]; then
      TARGET_SERVICE="backend-staging"
    elif [ "$2" = "frontend" ]; then
      TARGET_SERVICE="frontend-staging"
    else
      TARGET_SERVICE="$2"
    fi
  else
    TARGET_SERVICE="$2"
  fi
fi

if [ -n "$TARGET_SERVICE" ]; then
  echo "Targeting service: $TARGET_SERVICE"
  BUILD_CMD="docker compose -f $COMPOSE_FILE up -d --build $TARGET_SERVICE"
else
  BUILD_CMD="docker compose -f $COMPOSE_FILE up -d --build"
fi

if $BUILD_CMD; then
  echo "Containers started successfully. Initiating health check..."
  
  # Health check loop
  MAX_RETRIES=30
  RETRY_COUNT=0
  HEALTHY=false
  
  while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    echo "Checking health of backend on port $PORT_BACKEND (Attempt $((RETRY_COUNT+1))/$MAX_RETRIES)..."
    
    # Check if backend responds to actuator health check
    if curl -s "http://127.0.0.1:$PORT_BACKEND/actuator/health" | grep -q "UP"; then
      echo "Backend is healthy!"
      
      # Now check frontend
      echo "Checking health of frontend on port $PORT_FRONTEND..."
      if curl -sI "http://127.0.0.1:$PORT_FRONTEND" | grep -q -E "HTTP/1\.[01] [23][0-9][0-9]|HTTP/2 [23][0-9][0-9]"; then
        echo "Frontend is healthy!"
        HEALTHY=true
        break
      else
        echo "Frontend not ready yet."
      fi
    else
      echo "Backend not ready yet."
    fi
    
    RETRY_COUNT=$((RETRY_COUNT+1))
    sleep 5
  done
  
  if [ "$HEALTHY" = true ]; then
    echo "=== Deployment successful and verified! ==="
  else
    echo "=== Health check failed! === "
    echo "Logs for backend:"
    docker compose -f $COMPOSE_FILE logs --tail=100 $SERVICE_BACKEND
    exit 1
  fi
else
  echo "=== Docker Compose Build/Up failed! ==="
  exit 1
fi
