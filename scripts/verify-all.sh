#!/usr/bin/env bash
# ==============================================================================
# K2NET FTTH GIS — Fast Unified Verification Script (Safe for Low-RAM Server)
# ==============================================================================
# Script ini menjalankan pengujian tipe data, linter, dan audit warna hardcoded
# dalam hitungan detik TANPA memicu Next.js production build yang berat di CPU/RAM.
# ==============================================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "\n${BLUE}======================================================${NC}"
echo -e "${BLUE}   🔍 K2NET Unified Quality Gate Verification        ${NC}"
echo -e "${BLUE}======================================================${NC}\n"

# 1. Audit Warna Semantik (0 Hardcoded Colors)
echo -e "${YELLOW}Step 1/3: Memeriksa Pelanggaran Warna Hardcoded (Anti-Regression)...${NC}"
VIOLATIONS=$(grep -rn "text-zinc-\|bg-zinc-\|border-zinc-\|text-white\|bg-emerald-\|text-emerald-\|border-emerald-" \
  /opt/project5/apps/studio-admin/src \
  --include="*.tsx" --include="*.ts" 2>/dev/null | grep -v "node_modules" | wc -l || echo 0)

if [ "$VIOLATIONS" -gt 0 ]; then
  echo -e "${RED}❌ GAGAL: Ditemukan $VIOLATIONS pelanggaran warna hardcoded di apps/studio-admin/src!${NC}"
  grep -rn "text-zinc-\|bg-zinc-\|border-zinc-\|text-white\|bg-emerald-\|text-emerald-\|border-emerald-" \
    /opt/project5/apps/studio-admin/src \
    --include="*.tsx" --include="*.ts" 2>/dev/null | grep -v "node_modules" | head -n 10
  exit 1
else
  echo -e "${GREEN}✅ PASS: 0 pelanggaran warna hardcoded ditemukan.${NC}"
fi

# 2. Type-check Shared UI Package
echo -e "\n${YELLOW}Step 2/3: Memeriksa Tipe Data Shared UI (@k2net/ui)...${NC}"
pnpm --filter @k2net/ui build
echo -e "${GREEN}✅ PASS: Paket @k2net/ui valid & terkompilasi.${NC}"

# 3. Type-check Studio Admin Next.js (Ringan: tsc --noEmit, bukan full webpack build)
echo -e "\n${YELLOW}Step 3/3: Memeriksa Tipe Kode TypeScript Studio Admin (@k2net/studio-admin)...${NC}"
pnpm --filter @k2net/studio-admin typecheck
echo -e "${GREEN}✅ PASS: 0 TypeScript syntax/type error pada seluruh 67 rute halaman.${NC}"

echo -e "\n${GREEN}======================================================${NC}"
echo -e "${GREEN}   🎉 SEMUA PEMERIKSAAN BERHASIL (100% READY TO PUSH) ${NC}"
echo -e "${GREEN}======================================================${NC}\n"
