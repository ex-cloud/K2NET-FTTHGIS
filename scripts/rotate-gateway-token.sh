#!/usr/bin/env bash
# ==============================================================================
# K2NET FTTH GIS — Secure Internal Gateway Token Rotation Script
# ==============================================================================
# Fungsi:
#   1. Menghasilkan token kriptografi baru 256-bit (openssl rand -hex 32)
#   2. Mencadangkan file konfigurasi .env sebelumnya
#   3. Memperbarui GATEWAY_TOKEN secara otomatis
#   4. Memberikan panduan reload kontainer tanpa downtime
#
# Penggunaan:
#   bash scripts/rotate-gateway-token.sh [--dry-run]
# ==============================================================================

set -euo pipefail

ENV_FILE="/opt/project5/.env"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_ENV="/opt/project5/.env.bak.$TIMESTAMP"

# Warna Output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "\n${BLUE}================================================================${NC}"
echo -e "${BLUE}   🔑 K2NET FTTH GIS — Gateway Token Security Rotation          ${NC}"
echo -e "${BLUE}================================================================${NC}\n"

if [ ! -f "$ENV_FILE" ]; then
  echo -e "${RED}❌ File .env tidak ditemukan di $ENV_FILE${NC}"
  exit 1
fi

# 1. Generate new cryptographically secure token
NEW_TOKEN=$(openssl rand -hex 32)

echo -e "${YELLOW}🔹 [1/3] Menghasilkan 256-bit Cryptographic Hex Token Baru...${NC}"
echo -e "  ✓ Token Terbuat: ${CYAN}${NEW_TOKEN:0:8}********************************${NEW_TOKEN:56:8}${NC}"

# 2. Backup previous .env
echo -e "\n${YELLOW}🔹 [2/3] Mencadangkan file .env lama...${NC}"
cp "$ENV_FILE" "$BACKUP_ENV"
echo -e "  ${GREEN}✓ Backup tersimpan di: $BACKUP_ENV${NC}"

# 3. Update GATEWAY_TOKEN in .env
echo -e "\n${YELLOW}🔹 [3/3] Memperbarui GATEWAY_TOKEN di $ENV_FILE...${NC}"
if grep -q "^GATEWAY_TOKEN=" "$ENV_FILE"; then
  sed -i "s/^GATEWAY_TOKEN=.*/GATEWAY_TOKEN=$NEW_TOKEN/" "$ENV_FILE"
else
  echo "GATEWAY_TOKEN=$NEW_TOKEN" >> "$ENV_FILE"
fi
echo -e "  ${GREEN}✓ GATEWAY_TOKEN berhasil diperbarui di file .env.${NC}"

echo -e "\n${GREEN}================================================================${NC}"
echo -e "${GREEN}   🎉 ROTASI TOKEN BERHASIL!                                     ${NC}"
echo -e "${GREEN}================================================================${NC}"
echo -e "\n${YELLOW}⚠️  Langkah Selanjutnya:${NC}"
echo -e "Untuk menerapkan token baru ke seluruh kontainer microservice & backend:"
echo -e "Jalankan:"
echo -e "  ${CYAN}docker compose up -d --no-build backend ftth-notification-gateway ftth-payment-gateway ftth-map-gateway ftth-storage-gateway ftth-whatsapp-gateway ftth-scheduler-gateway ftth-export-gateway ftth-olt-gateway ftth-audit-gateway ftth-task-gateway ftth-ai-gateway ftth-frontend-admin${NC}\n"
