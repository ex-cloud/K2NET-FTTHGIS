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

# Check apakah Kong Admin API aktif di localhost
USE_DOCKER_EXEC=false
if curl -s -o /dev/null -w "%{http_code}" "$KONG_ADMIN_URL" | grep -q "200"; then
  echo "Kong Admin API terdeteksi aktif di $KONG_ADMIN_URL"
else
  KONG_ADMIN_URL="http://127.0.0.1:8001"
  if curl -s -o /dev/null -w "%{http_code}" "$KONG_ADMIN_URL" | grep -q "200"; then
    echo "Kong Admin API terdeteksi aktif di $KONG_ADMIN_URL"
  else
    echo "ERROR: Kong Admin API tidak dapat dihubungi dari host di localhost:8001 atau 127.0.0.1:8001."
    exit 1
  fi
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

# ==============================================================================
# Keamanan Tambahan & Pengerasan (Security Hardening)
# ==============================================================================

echo "------------------------------------------------------------"
echo "Mengonfigurasi Pengerasan Keamanan (Security Hardening)..."

# 1. Rate Limiting Global (100 request per menit per IP)
echo "Mengaktifkan Global Rate Limiting (100 req/min)..."
if [ "$USE_DOCKER_EXEC" = true ]; then
  local_exists=$(docker exec kong curl -s "http://localhost:8001/plugins" | grep -o '"name":"rate-limiting"' || true)
  if [ -z "$local_exists" ]; then
    docker exec kong curl -s -X POST "http://localhost:8001/plugins" \
      --data "name=rate-limiting" \
      --data "config.minute=100" \
      --data "config.policy=local" > /dev/null
  fi
else
  exists=$(curl -s "$KONG_ADMIN_URL/plugins" | grep -o '"name":"rate-limiting"' || true)
  if [ -z "$exists" ]; then
    curl -s -X POST "$KONG_ADMIN_URL/plugins" \
      --data "name=rate-limiting" \
      --data "config.minute=100" \
      --data "config.policy=local" > /dev/null
  fi
fi

# 2. IP Restriction pada Webhook WhatsApp (Hanya menerima dari IP Meta/Facebook dan localhost)
META_IPS="163.70.0.0/16,129.134.0.0/16,157.240.0.0/16,173.252.64.0/18,185.89.216.0/22,31.13.64.0/18,127.0.0.1,172.18.0.1"
echo "Mengaktifkan IP Restriction untuk webhook WhatsApp..."
if [ "$USE_DOCKER_EXEC" = true ]; then
  local_exists=$(docker exec kong curl -s "http://localhost:8001/services/whatsapp-webhook/plugins" | grep -o '"name":"ip-restriction"' || true)
  if [ -z "$local_exists" ]; then
    docker exec kong curl -s -X POST "http://localhost:8001/services/whatsapp-webhook/plugins" \
      --data "name=ip-restriction" \
      --data "config.allow=$META_IPS" > /dev/null
  else
    plugin_id=$(docker exec kong curl -s "http://localhost:8001/services/whatsapp-webhook/plugins" | python3 -c "import json,sys; d=json.load(sys.stdin); print(next(p['id'] for p in d['data'] if p['name']=='ip-restriction'))" 2>/dev/null || true)
    if [ -n "$plugin_id" ]; then
      docker exec kong curl -s -X PATCH "http://localhost:8001/plugins/$plugin_id" --data "config.allow=$META_IPS" > /dev/null
    fi
  fi
else
  exists=$(curl -s "$KONG_ADMIN_URL/services/whatsapp-webhook/plugins" | grep -o '"name":"ip-restriction"' || true)
  if [ -z "$exists" ]; then
    curl -s -X POST "$KONG_ADMIN_URL/services/whatsapp-webhook/plugins" \
      --data "name=ip-restriction" \
      --data "config.allow=$META_IPS" > /dev/null
  else
    plugin_id=$(curl -s "$KONG_ADMIN_URL/services/whatsapp-webhook/plugins" | python3 -c "import json,sys; d=json.load(sys.stdin); print(next(p['id'] for p in d['data'] if p['name']=='ip-restriction'))" 2>/dev/null || true)
    if [ -n "$plugin_id" ]; then
      curl -s -X PATCH "$KONG_ADMIN_URL/plugins/$plugin_id" --data "config.allow=$META_IPS" > /dev/null
    fi
  fi
fi

echo "============================================================"
echo "Selesai! Seluruh Go Gateways telah berhasil didaftarkan ke Kong."
echo "============================================================"
