#!/bin/bash
# ==============================================================================
# FTTH GIS - Kong API Gateway Setup Script
# Mendaftarkan seluruh Go Gateways ke Kong Edge API Gateway
# ==============================================================================

# Definisikan base URL Kong Admin API.
# Karena skrip dijalankan dari host VM, kita bisa menggunakan localhost:8001
# (jika port 8001 di-expose ke host) atau port internal kong dalam network.
# Kita gunakan localhost jika port admin di-expose, atau panggil docker exec.
KONG_ADMIN_URL="http://localhost:8001"

# Check apakah Kong Admin API aktif
if ! curl -s --head --request GET "$KONG_ADMIN_URL" | grep "200" > /dev/null; then
  echo "Kong Admin API tidak terdeteksi di $KONG_ADMIN_URL. Mencoba bypass via docker network..."
  KONG_ADMIN_URL="http://127.0.0.1:8001"
  if ! docker exec kong curl -s -o /dev/null -w "%{http_code}" http://localhost:8001 | grep "200" > /dev/null; then
    echo "ERROR: Kong tidak dapat dihubungi. Pastikan kontainer 'kong' sedang berjalan."
    exit 1
  fi
  # Jika Kong hanya bisa diakses lewat docker exec
  USE_DOCKER_EXEC=true
fi

register_service_and_routes() {
  local service_name=$1
  local service_url=$2
  local route_name=$3
  local route_path=$4
  local is_public=$5 # true/false (true bypasses JWT check)

  echo "------------------------------------------------------------"
  echo "Mendaftarkan Service: $service_name ($service_url)..."

  # Register/Update Service
  if [ "$USE_DOCKER_EXEC" = true ]; then
    docker exec kong curl -s -X PUT "http://localhost:8001/services/$service_name" \
      --data "url=$service_url" > /dev/null
  else
    curl -s -X PUT "$KONG_ADMIN_URL/services/$service_name" \
      --data "url=$service_url" > /dev/null
  fi

  # Register/Update Route
  echo "Mendaftarkan Route: $route_name di path $route_path..."
  if [ "$USE_DOCKER_EXEC" = true ]; then
    docker exec kong curl -s -X PUT "http://localhost:8001/services/$service_name/routes/$route_name" \
      --data "paths[]=$route_path" > /dev/null
  else
    curl -s -X PUT "$KONG_ADMIN_URL/services/$service_name/routes/$route_name" \
      --data "paths[]=$route_path" > /dev/null
  fi

  # JWT Plugin Configuration
  if [ "$is_public" != "true" ]; then
    echo "Mengaktifkan JWT Plugin pada $service_name..."
    if [ "$USE_DOCKER_EXEC" = true ]; then
      # Cek apakah plugin sudah terpasang
      local exists
      exists=$(docker exec kong curl -s "http://localhost:8001/services/$service_name/plugins" | grep -o '"name":"jwt"')
      if [ -z "$exists" ]; then
        docker exec kong curl -s -X POST "http://localhost:8001/services/$service_name/plugins" --data "name=jwt" > /dev/null
      fi
    else
      local exists
      exists=$(curl -s "$KONG_ADMIN_URL/services/$service_name/plugins" | grep -o '"name":"jwt"')
      if [ -z "$exists" ]; then
        curl -s -X POST "$KONG_ADMIN_URL/services/$service_name/plugins" --data "name=jwt" > /dev/null
      fi
    fi
  else
    echo "Rute $route_name bersifat PUBLIC (Bypass JWT)."
  fi
}

# ==============================================================================
# Registrasi Rute Gateway
# ==============================================================================

# 1. Notification Gateway (Port 5001)
register_service_and_routes "notification-gateway" "http://ftth-notification-gateway:5001" "notify-route" "/api/v1/notify" "false"

# 2. Payment Gateway (Port 5002)
register_service_and_routes "payment-gateway" "http://ftth-payment-gateway:5002" "payment-invoice-route" "/api/v1/invoice" "false"
# Webhook Payment harus PUBLIC agar dapat diakses Xendit
register_service_and_routes "payment-gateway" "http://ftth-payment-gateway:5002" "payment-webhook-route" "/webhooks/payment" "true"

# 3. Map Gateway (Port 5003)
register_service_and_routes "map-gateway" "http://ftth-map-gateway:5003" "geocode-route" "/api/v1/geocode" "false"

# 4. Storage Gateway (Port 5004)
register_service_and_routes "storage-gateway" "http://ftth-storage-gateway:5004" "storage-route" "/api/v1/storage" "false"

# 5. WhatsApp Gateway (Port 5005)
register_service_and_routes "whatsapp-gateway" "http://ftth-whatsapp-gateway:5005" "wa-api-route" "/api/v1/wa" "false"
# Webhook Meta WhatsApp harus PUBLIC (Diarahkan via prefix /api/v1 agar dilewatkan Traefik)
register_service_and_routes "whatsapp-webhook" "http://ftth-whatsapp-gateway:5005/wa/webhook" "wa-webhook-route" "/api/v1/wa/webhook" "true"

# 6. Scheduler Gateway (Port 5006)
register_service_and_routes "scheduler-gateway" "http://ftth-scheduler-gateway:5006" "scheduler-route" "/api/v1/scheduler" "false"

# 7. Export Gateway (Port 5007)
register_service_and_routes "export-gateway" "http://ftth-export-gateway:5007" "export-route" "/api/v1/export" "false"

# 8. OLT Gateway (Port 5008)
register_service_and_routes "olt-gateway" "http://ftth-olt-gateway:5008" "olt-route" "/api/v1/olt" "false"
register_service_and_routes "olt-gateway" "http://ftth-olt-gateway:5008" "ont-route" "/api/v1/ont" "false"

# 9. Audit Gateway (Port 5009)
register_service_and_routes "audit-gateway" "http://ftth-audit-gateway:5009" "audit-route" "/api/v1/audit" "false"

echo "============================================================"
echo "Selesai! Seluruh Go Gateways telah berhasil didaftarkan ke Kong."
echo "============================================================"
