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
export NEXT_PUBLIC_GIT_BRANCH=$((git -C apps/studio rev-parse --abbrev-ref HEAD 2>/dev/null || git rev-parse --abbrev-ref HEAD 2>/dev/null) || echo "main")
export NEXT_PUBLIC_GIT_COMMIT=$((git -C apps/studio rev-parse HEAD 2>/dev/null || git rev-parse HEAD 2>/dev/null) || echo "unknown")
echo "Git Branch: $NEXT_PUBLIC_GIT_BRANCH"
echo "Git Commit: $NEXT_PUBLIC_GIT_COMMIT"

# Build and start services
echo "Rebuilding and restarting services..."

# Target service mapping
TARGET_SERVICE=""
IS_GO_GATEWAY="false"

if [ -n "$2" ]; then
  if [ "$ENV" = "staging" ]; then
    case "$2" in
      map-gateway|notification-gateway|payment-gateway|storage-gateway|gateway-whatsapp|gateway-scheduler|gateway-export|gateway-olt|gateway-audit|poller|gateway-task|observability-gateway)
        IS_GO_GATEWAY="true"
        TARGET_SERVICE="$2"
        ;;
      backend|api)
        TARGET_SERVICE="backend-staging"
        ;;
      frontend-admin|studio-admin)
        TARGET_SERVICE="frontend-admin-staging"
        ;;
      frontend-tenant|studio-tenant)
        TARGET_SERVICE="frontend-tenant-staging"
        ;;
      frontend|studio)
        TARGET_SERVICE="frontend-staging"
        ;;
      gateways)
        TARGET_SERVICE="gateways"
        ;;
      *)
        TARGET_SERVICE="$2"
        ;;
    esac
  else
    case "$2" in
      map-gateway|notification-gateway|payment-gateway|storage-gateway|gateway-whatsapp|gateway-scheduler|gateway-export|gateway-olt|gateway-audit|poller|gateway-task|observability-gateway)
        IS_GO_GATEWAY="true"
        TARGET_SERVICE="$2"
        ;;
      backend|api)
        TARGET_SERVICE="backend"
        ;;
      frontend-admin|studio-admin)
        TARGET_SERVICE="frontend-admin"
        ;;
      frontend-tenant|studio-tenant)
        TARGET_SERVICE="frontend-tenant"
        ;;
      frontend|studio)
        TARGET_SERVICE="frontend"
        ;;
      gateways)
        TARGET_SERVICE="gateways"
        ;;
      *)
        TARGET_SERVICE="$2"
        ;;
    esac
  fi
fi

if [ "$ENV" = "production" ]; then
  echo "🔒 Production Mode: Pulling pre-built Docker images from ghcr.io (NO build on server)..."
  if [ "$TARGET_SERVICE" = "frontend-admin" ]; then
    docker pull ghcr.io/ex-cloud/k2net-ftthgis/frontend-admin:latest || true
  elif [ "$TARGET_SERVICE" = "frontend-tenant" ]; then
    docker pull ghcr.io/ex-cloud/k2net-ftthgis/frontend-tenant:latest || true
  elif [ "$TARGET_SERVICE" = "backend" ]; then
    docker pull ghcr.io/ex-cloud/k2net-ftthgis/backend:latest || true
  elif [ "$IS_GO_GATEWAY" = "true" ]; then
    echo "Pulling specific Go gateway: $TARGET_SERVICE..."
    docker pull ghcr.io/ex-cloud/k2net-ftthgis/$TARGET_SERVICE:latest || true
  elif [ "$TARGET_SERVICE" = "gateways" ]; then
    echo "Pulling all Go gateways..."
    docker pull ghcr.io/ex-cloud/k2net-ftthgis/map-gateway:latest || true
    docker pull ghcr.io/ex-cloud/k2net-ftthgis/notification-gateway:latest || true
    docker pull ghcr.io/ex-cloud/k2net-ftthgis/payment-gateway:latest || true
    docker pull ghcr.io/ex-cloud/k2net-ftthgis/storage-gateway:latest || true
    docker pull ghcr.io/ex-cloud/k2net-ftthgis/gateway-whatsapp:latest || true
    docker pull ghcr.io/ex-cloud/k2net-ftthgis/gateway-scheduler:latest || true
    docker pull ghcr.io/ex-cloud/k2net-ftthgis/gateway-export:latest || true
    docker pull ghcr.io/ex-cloud/k2net-ftthgis/gateway-olt:latest || true
    docker pull ghcr.io/ex-cloud/k2net-ftthgis/gateway-audit:latest || true
    docker pull ghcr.io/ex-cloud/k2net-ftthgis/gateway-task:latest || true
    docker pull ghcr.io/ex-cloud/k2net-ftthgis/poller:latest || true
    docker pull ghcr.io/ex-cloud/k2net-ftthgis/observability-gateway:latest || true
  else
    docker pull ghcr.io/ex-cloud/k2net-ftthgis/frontend-admin:latest || true
    docker pull ghcr.io/ex-cloud/k2net-ftthgis/frontend-tenant:latest || true
    docker pull ghcr.io/ex-cloud/k2net-ftthgis/backend:latest || true
    echo "Pulling all Go gateways..."
    docker pull ghcr.io/ex-cloud/k2net-ftthgis/map-gateway:latest || true
    docker pull ghcr.io/ex-cloud/k2net-ftthgis/notification-gateway:latest || true
    docker pull ghcr.io/ex-cloud/k2net-ftthgis/payment-gateway:latest || true
    docker pull ghcr.io/ex-cloud/k2net-ftthgis/storage-gateway:latest || true
    docker pull ghcr.io/ex-cloud/k2net-ftthgis/gateway-whatsapp:latest || true
    docker pull ghcr.io/ex-cloud/k2net-ftthgis/gateway-scheduler:latest || true
    docker pull ghcr.io/ex-cloud/k2net-ftthgis/gateway-export:latest || true
    docker pull ghcr.io/ex-cloud/k2net-ftthgis/gateway-olt:latest || true
    docker pull ghcr.io/ex-cloud/k2net-ftthgis/gateway-audit:latest || true
    docker pull ghcr.io/ex-cloud/k2net-ftthgis/gateway-task:latest || true
    docker pull ghcr.io/ex-cloud/k2net-ftthgis/poller:latest || true
    docker pull ghcr.io/ex-cloud/k2net-ftthgis/observability-gateway:latest || true
  fi

  if [ -n "$TARGET_SERVICE" ]; then
    echo "Starting service: $TARGET_SERVICE"
    if [ "$TARGET_SERVICE" = "gateways" ]; then
      BUILD_CMD="docker compose -f docker-compose.gateways.yml up -d --no-build"
    elif [ "$IS_GO_GATEWAY" = "true" ]; then
      BUILD_CMD="docker compose -f docker-compose.gateways.yml up -d --no-build $TARGET_SERVICE"
    else
      BUILD_CMD="docker compose -f $COMPOSE_FILE up -d --no-build $TARGET_SERVICE"
    fi
  else
    BUILD_CMD="docker compose -f $COMPOSE_FILE up -d --no-build && docker compose -f docker-compose.gateways.yml up -d --no-build"
  fi
else
  if [ -n "$TARGET_SERVICE" ]; then
    echo "Targeting service: $TARGET_SERVICE"
    if [ "$TARGET_SERVICE" = "gateways" ]; then
      BUILD_CMD="docker compose -f docker-compose.gateways.yml up -d --build"
    elif [ "$IS_GO_GATEWAY" = "true" ]; then
      BUILD_CMD="docker compose -f docker-compose.gateways.yml up -d --build $TARGET_SERVICE"
    else
      BUILD_CMD="docker compose -f $COMPOSE_FILE up -d --build $TARGET_SERVICE"
    fi
  else
    BUILD_CMD="docker compose -f $COMPOSE_FILE up -d --build && docker compose -f docker-compose.gateways.yml up -d --build"
  fi
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
      
      if [ "$TARGET_SERVICE" = "backend" ] || [ "$TARGET_SERVICE" = "gateways" ] || [ "$IS_GO_GATEWAY" = "true" ]; then
        HEALTHY=true
        break
      fi

      # Now check frontend
      echo "Checking health of frontend..."
      if [ "$ENV" = "production" ]; then
        CONTAINER_NAME="ftth-frontend"
        CONTAINER_PORT="3000"
        if [ "$TARGET_SERVICE" = "frontend-admin" ] || [ "$TARGET_SERVICE" = "studio-admin" ]; then
          CONTAINER_NAME="ftth-frontend-admin"
          CONTAINER_PORT="3001"
        elif [ "$TARGET_SERVICE" = "frontend-tenant" ] || [ "$TARGET_SERVICE" = "studio-tenant" ]; then
          CONTAINER_NAME="ftth-frontend-tenant"
          CONTAINER_PORT="80"
        fi
        CONTAINER_IP=$(docker inspect -f '{{range.NetworkSettings.Networks}}{{.IPAddress}}{{end}}' "$CONTAINER_NAME" 2>/dev/null || echo "127.0.0.1")
        FRONTEND_URL="http://$CONTAINER_IP:$CONTAINER_PORT"
      else
        CHECK_PORT=$PORT_FRONTEND
        if [ "$TARGET_SERVICE" = "frontend-admin" ] || [ "$TARGET_SERVICE" = "studio-admin" ]; then
          CHECK_PORT=13001
        elif [ "$TARGET_SERVICE" = "frontend-tenant" ] || [ "$TARGET_SERVICE" = "studio-tenant" ]; then
          CHECK_PORT=13002
        fi
        FRONTEND_URL="http://127.0.0.1:$CHECK_PORT"
      fi

      if curl -sI "$FRONTEND_URL" | grep -q -E "HTTP/1\.[01] [23][0-9][0-9]|HTTP/2 [23][0-9][0-9]"; then
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
