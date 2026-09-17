#!/usr/bin/env bash
# ==============================================================================
# K2NET FTTH GIS — Design System & UI Consistency Auditor (Supabase Alignment)
# ==============================================================================
# Script ini memindai seluruh codebase frontend monorepo untuk memastikan kepatuhan
# terhadap Design System (Supabase Alignment), Semantic Tokens, Typography, dan Sizing.
#
# Penggunaan:
#   bash packages/ui/scripts/audit-design-system.sh [all|admin|tenant|ui] [--strict]
#   pnpm audit:design-system
# ==============================================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
BOLD='\033[1m'
NC='\033[0m' # No Color

TARGET="all"
STRICT_MODE=false

for arg in "$@"; do
  case "$arg" in
    --strict)
      STRICT_MODE=true
      ;;
    admin|tenant|ui|packages|all)
      TARGET="$arg"
      ;;
  esac
done

FATAL_ERRORS=0
ADVISORY_WARNS=0

echo -e "\n${BLUE}======================================================================${NC}"
echo -e "${BLUE}  🎨 K2NET FTTH GIS — Design System & UI Consistency Auditor          ${NC}"
echo -e "${BLUE}     Alignment: Supabase Design System Specification                  ${NC}"
echo -e "${BLUE}     Target: ${CYAN}${TARGET}${BLUE} | Strict Mode: ${CYAN}${STRICT_MODE}${BLUE}                              ${NC}"
echo -e "${BLUE}======================================================================${NC}\n"

# Tentukan direktori pemindaian berdasarkan TARGET
DIRS_TO_SCAN=()
case "$TARGET" in
  admin)
    DIRS_TO_SCAN=("/opt/project5/apps/studio-admin/src")
    ;;
  tenant)
    DIRS_TO_SCAN=("/opt/project5/apps/studio-tenant/src")
    ;;
  ui|packages)
    DIRS_TO_SCAN=("/opt/project5/packages/ui/src")
    ;;
  all)
    DIRS_TO_SCAN=(
      "/opt/project5/apps/studio-admin/src"
      "/opt/project5/apps/studio-tenant/src"
      "/opt/project5/packages/ui/src"
    )
    ;;
  *)
    echo -e "${RED}❌ Target '$TARGET' tidak dikenal! Gunakan: all, admin, tenant, atau ui.${NC}"
    exit 1
    ;;
esac

# Filter direktori yang benar-benar ada
VALID_DIRS=()
for d in "${DIRS_TO_SCAN[@]}"; do
  if [ -d "$d" ]; then
    VALID_DIRS+=("$d")
  fi
done

if [ ${#VALID_DIRS[@]} -eq 0 ]; then
  echo -e "${YELLOW}⚠️ Tidak ada direktori target yang ditemukan untuk dipindai.${NC}"
  exit 0
fi

echo -e "📁 ${BOLD}Direktori yang dipindai:${NC}"
for d in "${VALID_DIRS[@]}"; do
  echo -e "   • $d"
done
echo ""

# ------------------------------------------------------------------------------
# ATURAN 1: Semantic Color Token Compliance (Hardcoded Tailwind Colors)
# ------------------------------------------------------------------------------
echo -e "${CYAN}▶ [1/5] Memeriksa Pelanggaran Warna Hardcode (Zero Hardcoded Colors)...${NC}"
COLOR_REGEX="text-zinc-|bg-zinc-|border-zinc-|text-slate-|bg-slate-|border-slate-|text-gray-|bg-gray-|border-gray-|text-neutral-|bg-neutral-|border-neutral-|text-emerald-|bg-emerald-|border-emerald-"

COLOR_VIOLATIONS=$(grep -rnE "$COLOR_REGEX" "${VALID_DIRS[@]}" \
  --include="*.tsx" --include="*.ts" 2>/dev/null \
  | grep -v "node_modules" \
  | grep -v "theme.css" \
  | grep -v "colors.ts" \
  | grep -v ".d.ts" || true)

COLOR_COUNT=0
if [ -n "$COLOR_VIOLATIONS" ]; then
  COLOR_COUNT=$(echo "$COLOR_VIOLATIONS" | wc -l | tr -d ' ')
fi

if [ "$COLOR_COUNT" -gt 0 ]; then
  echo -e "  ${RED}❌ Ditemukan $COLOR_COUNT pelanggaran warna hardcode (WAJIB Semantic Tokens):${NC}"
  echo "$COLOR_VIOLATIONS" | head -n 10 | while read -r line; do
    echo -e "     ${RED}•${NC} $line"
  done
  if [ "$COLOR_COUNT" -gt 10 ]; then
    echo -e "     ${YELLOW}... dan $((COLOR_COUNT - 10)) pelanggaran lainnya.${NC}"
  fi
  FATAL_ERRORS=$((FATAL_ERRORS + COLOR_COUNT))
else
  echo -e "  ${GREEN}✓ 0 pelanggaran warna hardcode (100% semantic tokens compliant).${NC}"
fi
echo ""

# ------------------------------------------------------------------------------
# ATURAN 2: Button & Action Typography Standard (Supabase: font-medium, bukan bold)
# ------------------------------------------------------------------------------
echo -e "${CYAN}▶ [2/5] Memeriksa Standar Tipografi Tombol (Supabase: font-medium)...${NC}"
# Cari pemanggilan Button atau kelas tombol yang menimpa ke font-bold / font-black / font-extrabold
BTN_FONT_VIOLATIONS=$(grep -rnE '(<Button[^>]*className=[^>]*font-(bold|black|extrabold)|class(Name)?="[^"]*btn[^"]*font-(bold|black|extrabold))' "${VALID_DIRS[@]}" \
  --include="*.tsx" --include="*.ts" 2>/dev/null \
  | grep -v "node_modules" || true)

BTN_FONT_COUNT=0
if [ -n "$BTN_FONT_VIOLATIONS" ]; then
  BTN_FONT_COUNT=$(echo "$BTN_FONT_VIOLATIONS" | wc -l | tr -d ' ')
fi

if [ "$BTN_FONT_COUNT" -gt 0 ]; then
  echo -e "  ${RED}❌ Ditemukan $BTN_FONT_COUNT tombol dengan font weight non-standar (Gunakan 'font-medium'):${NC}"
  echo "$BTN_FONT_VIOLATIONS" | head -n 8 | while read -r line; do
    echo -e "     ${RED}•${NC} $line"
  done
  FATAL_ERRORS=$((FATAL_ERRORS + BTN_FONT_COUNT))
else
  echo -e "  ${GREEN}✓ 0 pelanggaran font weight tombol (100% font-medium standard).${NC}"
fi
echo ""

# ------------------------------------------------------------------------------
# ATURAN 3: Control Sizing & Oversized Elements (Supabase: h-6, h-7, h-8, h-9)
# ------------------------------------------------------------------------------
echo -e "${CYAN}▶ [3/5] Memeriksa Standar Ketinggian Kontrol / Tombol (Anti Oversized Control)...${NC}"
# Flag oversized button classes like h-14, h-16, h-20 on buttons/inputs
OVERSIZED_VIOLATIONS=$(grep -rnE '(<Button[^>]*className=[^>]*h-(14|16|20|24)|<Input[^>]*className=[^>]*h-(14|16|20|24))' "${VALID_DIRS[@]}" \
  --include="*.tsx" --include="*.ts" 2>/dev/null \
  | grep -v "node_modules" || true)

OVERSIZED_COUNT=0
if [ -n "$OVERSIZED_VIOLATIONS" ]; then
  OVERSIZED_COUNT=$(echo "$OVERSIZED_VIOLATIONS" | wc -l | tr -d ' ')
fi

if [ "$OVERSIZED_COUNT" -gt 0 ]; then
  echo -e "  ${RED}❌ Ditemukan $OVERSIZED_COUNT kontrol dengan ukuran oversized (h-14+):${NC}"
  echo "$OVERSIZED_VIOLATIONS" | head -n 5 | while read -r line; do
    echo -e "     ${RED}•${NC} $line"
  done
  FATAL_ERRORS=$((FATAL_ERRORS + OVERSIZED_COUNT))
else
  echo -e "  ${GREEN}✓ 0 kontrol oversized (Kepatuhan scale compact h-6..h-9 terpenuhi).${NC}"
fi
echo ""

# ------------------------------------------------------------------------------
# ATURAN 4: Inline Hex & RGB Styles Audit (Zero Hardcoded Inline Color Styles)
# ------------------------------------------------------------------------------
echo -e "${CYAN}▶ [4/5] Memeriksa Inline Hex/RGB Color Styles (style={{ color/bg: '#...' }})...${NC}"
INLINE_COLOR_VIOLATIONS=$(grep -rnE 'style=\{\{[^}]*(color|backgroundColor|borderColor|background):[[:space:]]*["\x27]#[0-9a-fA-F]{3,8}' "${VALID_DIRS[@]}" \
  --include="*.tsx" --include="*.ts" 2>/dev/null \
  | grep -v "node_modules" \
  | grep -v "map" \
  | grep -v "gis" || true)

INLINE_COLOR_COUNT=0
if [ -n "$INLINE_COLOR_VIOLATIONS" ]; then
  INLINE_COLOR_COUNT=$(echo "$INLINE_COLOR_VIOLATIONS" | wc -l | tr -d ' ')
fi

if [ "$INLINE_COLOR_COUNT" -gt 0 ]; then
  echo -e "  ${RED}❌ Ditemukan $INLINE_COLOR_COUNT inline hex/rgb color styles:${NC}"
  echo "$INLINE_COLOR_VIOLATIONS" | head -n 5 | while read -r line; do
    echo -e "     ${RED}•${NC} $line"
  done
  FATAL_ERRORS=$((FATAL_ERRORS + INLINE_COLOR_COUNT))
else
  echo -e "  ${GREEN}✓ 0 inline hex/rgb color styles.${NC}"
fi
echo ""

# ------------------------------------------------------------------------------
# ATURAN 5: Heavy Shadow Degradation (Advisory — Supabase uses flat border-driven elevation)
# ------------------------------------------------------------------------------
echo -e "${CYAN}▶ [5/5] Memeriksa Konsistensi Elevation & Border-Driven Surface (Advisory)...${NC}"
SHADOW_VIOLATIONS=$(grep -rnE 'className=[^>]*shadow-(2xl|3xl)' "${VALID_DIRS[@]}" \
  --include="*.tsx" --include="*.ts" 2>/dev/null \
  | grep -v "node_modules" || true)

SHADOW_COUNT=0
if [ -n "$SHADOW_VIOLATIONS" ]; then
  SHADOW_COUNT=$(echo "$SHADOW_VIOLATIONS" | wc -l | tr -d ' ')
fi

if [ "$SHADOW_COUNT" -gt 0 ]; then
  echo -e "  ${YELLOW}ℹ️  Ditemukan $SHADOW_COUNT elemen dengan shadow-2xl/3xl (Saran: Gunakan border semantik & shadow-md/lg):${NC}"
  ADVISORY_WARNS=$((ADVISORY_WARNS + SHADOW_COUNT))
else
  echo -e "  ${GREEN}✓ 0 heavy archaic shadows (Desain border-driven konsisten).${NC}"
fi
echo ""

# ------------------------------------------------------------------------------
# RINGKASAN HASIL AUDIT
# ------------------------------------------------------------------------------
echo -e "${BLUE}======================================================================${NC}"
if [ "$FATAL_ERRORS" -eq 0 ]; then
  if [ "$STRICT_MODE" = true ] && [ "$ADVISORY_WARNS" -gt 0 ]; then
    echo -e "${RED}  ❌ STRICT AUDIT GAGAL: Ditemukan $ADVISORY_WARNS advisory warnings!           ${NC}"
    echo -e "${BLUE}======================================================================${NC}\n"
    exit 1
  fi
  echo -e "${GREEN}  🎉 AUDIT SUKSES: 0 Fatal Errors Ditemukan!                          ${NC}"
  if [ "$ADVISORY_WARNS" -gt 0 ]; then
    echo -e "${YELLOW}     (Catatan: Ada $ADVISORY_WARNS advisory warnings untuk optimasi visual)     ${NC}"
  fi
  echo -e "${GREEN}     Codebase selaras dengan Supabase Design System Standards.        ${NC}"
  echo -e "${BLUE}======================================================================${NC}\n"
  exit 0
else
  echo -e "${RED}  ❌ AUDIT GAGAL: Ditemukan total $FATAL_ERRORS pelanggaran fatal Design System!${NC}"
  echo -e "${YELLOW}     Perbaiki pelanggaran di atas sebelum melakukan push / deploy.    ${NC}"
  echo -e "${BLUE}======================================================================${NC}\n"
  exit 1
fi
