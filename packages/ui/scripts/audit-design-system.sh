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
    DIRS_TO_SCAN=("/opt/project5/packages/ui/src" "/opt/project5/packages/auth/src" "/opt/project5/packages/design-system/src")
    ;;
  all)
    DIRS_TO_SCAN=(
      "/opt/project5/apps/studio-admin/src"
      "/opt/project5/apps/studio-tenant/src"
      "/opt/project5/packages/ui/src"
      "/opt/project5/packages/auth/src"
      "/opt/project5/packages/design-system/src"
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
echo -e "${CYAN}▶ [1/11] Memeriksa Pelanggaran Warna Hardcode (Zero Hardcoded Colors)...${NC}"
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
# ATURAN 2: Button & Control Typography Standard (Supabase: font-medium, bukan bold)
# ------------------------------------------------------------------------------
echo -e "${CYAN}▶ [2/11] Memeriksa Standar Tipografi Tombol (Supabase: font-medium)...${NC}"
BTN_FONT_VIOLATIONS=$(grep -rnE '(<Button|<button|<SelectTrigger)[^>]*font-(bold|black|extrabold|semibold)' "${VALID_DIRS[@]}" \
  --include="*.tsx" --include="*.ts" 2>/dev/null \
  | grep -v "node_modules" || true)

BTN_FONT_COUNT=0
if [ -n "$BTN_FONT_VIOLATIONS" ]; then
  BTN_FONT_COUNT=$(echo "$BTN_FONT_VIOLATIONS" | wc -l | tr -d ' ')
fi

if [ "$BTN_FONT_COUNT" -gt 0 ]; then
  echo -e "  ${RED}❌ Ditemukan $BTN_FONT_COUNT tombol/kontrol dengan font weight non-standar (Gunakan 'font-medium'):${NC}"
  echo "$BTN_FONT_VIOLATIONS" | head -n 8 | while read -r line; do
    echo -e "     ${RED}•${NC} $line"
  done
  FATAL_ERRORS=$((FATAL_ERRORS + BTN_FONT_COUNT))
else
  echo -e "  ${GREEN}✓ 0 pelanggaran font weight tombol (100% font-medium standard).${NC}"
fi
echo ""

# ------------------------------------------------------------------------------
# ATURAN 3: Badge Typography Standard (Supabase: font-medium, bukan bold)
# ------------------------------------------------------------------------------
echo -e "${CYAN}▶ [3/11] Memeriksa Standar Tipografi Badge (Supabase: font-medium)...${NC}"
BADGE_FONT_VIOLATIONS=$(grep -rnE '<Badge[^>]*font-(bold|black|extrabold)' "${VALID_DIRS[@]}" \
  --include="*.tsx" --include="*.ts" 2>/dev/null \
  | grep -v "node_modules" || true)

BADGE_FONT_COUNT=0
if [ -n "$BADGE_FONT_VIOLATIONS" ]; then
  BADGE_FONT_COUNT=$(echo "$BADGE_FONT_VIOLATIONS" | wc -l | tr -d ' ')
fi

if [ "$BADGE_FONT_COUNT" -gt 0 ]; then
  echo -e "  ${RED}❌ Ditemukan $BADGE_FONT_COUNT badge dengan font weight non-standar (Gunakan 'font-medium'):${NC}"
  echo "$BADGE_FONT_VIOLATIONS" | head -n 8 | while read -r line; do
    echo -e "     ${RED}•${NC} $line"
  done
  FATAL_ERRORS=$((FATAL_ERRORS + BADGE_FONT_COUNT))
else
  echo -e "  ${GREEN}✓ 0 pelanggaran font weight badge (100% font-medium standard).${NC}"
fi
echo ""

# ------------------------------------------------------------------------------
# ATURAN 4: Control Sizing & Oversized Elements (Supabase: h-6, h-7, h-8, h-9)
# ------------------------------------------------------------------------------
echo -e "${CYAN}▶ [4/11] Memeriksa Standar Ketinggian Kontrol / Tombol (Anti Oversized Control)...${NC}"
OVERSIZED_VIOLATIONS=$(grep -rnE '(<Button[^>]*className=[^>]*\bh-(10|11|12|14|16|20)\b|<Input[^>]*className=[^>]*\bh-(10|11|12|14|16|20)\b|<SelectTrigger[^>]*className=[^>]*\bh-(10|11|12|14|16|20)\b)' "${VALID_DIRS[@]}" \
  --include="*.tsx" --include="*.ts" 2>/dev/null \
  | grep -v "node_modules" \
  | grep -v 'size="lg"' || true)

OVERSIZED_COUNT=0
if [ -n "$OVERSIZED_VIOLATIONS" ]; then
  OVERSIZED_COUNT=$(echo "$OVERSIZED_VIOLATIONS" | wc -l | tr -d ' ')
fi

if [ "$OVERSIZED_COUNT" -gt 0 ]; then
  echo -e "  ${RED}❌ Ditemukan $OVERSIZED_COUNT kontrol dengan ukuran oversized (h-10+ pada kontrol compact):${NC}"
  echo "$OVERSIZED_VIOLATIONS" | head -n 5 | while read -r line; do
    echo -e "     ${RED}•${NC} $line"
  done
  FATAL_ERRORS=$((FATAL_ERRORS + OVERSIZED_COUNT))
else
  echo -e "  ${GREEN}✓ 0 kontrol oversized (Kepatuhan scale compact h-6..h-9 terpenuhi).${NC}"
fi
echo ""

# ------------------------------------------------------------------------------
# ATURAN 5: Inline Hex & RGB Styles Audit (Zero Hardcoded Inline Color Styles)
# ------------------------------------------------------------------------------
echo -e "${CYAN}▶ [5/11] Memeriksa Inline Hex/RGB Color Styles (style={{ color/bg: '#...' }})...${NC}"
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
# ATURAN 6: Heavy Shadow Degradation (Supabase uses flat border-driven elevation)
# ------------------------------------------------------------------------------
echo -e "${CYAN}▶ [6/11] Memeriksa Konsistensi Elevation & Border-Driven Surface...${NC}"
SHADOW_VIOLATIONS=$(grep -rnE 'className=[^>]*shadow-(2xl|3xl)' "${VALID_DIRS[@]}" \
  --include="*.tsx" --include="*.ts" 2>/dev/null \
  | grep -v "node_modules" || true)

SHADOW_COUNT=0
if [ -n "$SHADOW_VIOLATIONS" ]; then
  SHADOW_COUNT=$(echo "$SHADOW_VIOLATIONS" | wc -l | tr -d ' ')
fi

if [ "$SHADOW_COUNT" -gt 0 ]; then
  if [ "$STRICT_MODE" = true ]; then
    echo -e "  ${RED}❌ Ditemukan $SHADOW_COUNT elemen dengan shadow-2xl/3xl (Gunakan border semantik):${NC}"
    FATAL_ERRORS=$((FATAL_ERRORS + SHADOW_COUNT))
  else
    echo -e "  ${YELLOW}ℹ️  Ditemukan $SHADOW_COUNT elemen dengan shadow-2xl/3xl (Saran: Gunakan border semantik & shadow-md/lg):${NC}"
    ADVISORY_WARNS=$((ADVISORY_WARNS + SHADOW_COUNT))
  fi
else
  echo -e "  ${GREEN}✓ 0 heavy archaic shadows (Desain border-driven konsisten).${NC}"
fi
echo ""

# ------------------------------------------------------------------------------
# ATURAN 7: Control Corner Radius Standard (Supabase: rounded-md / 6px)
# ------------------------------------------------------------------------------
echo -e "${CYAN}▶ [7/11] Memeriksa Standar Corner Radius Kontrol (Supabase: rounded-md / 6px)...${NC}"
RADIUS_VIOLATIONS=$(grep -rnE '(<Button|<button|<Input|<SelectTrigger)[^>]*\brounded-(xl|2xl|3xl)\b' "${VALID_DIRS[@]}" \
  --include="*.tsx" --include="*.ts" 2>/dev/null \
  | grep -v "node_modules" || true)

RADIUS_COUNT=0
if [ -n "$RADIUS_VIOLATIONS" ]; then
  RADIUS_COUNT=$(echo "$RADIUS_VIOLATIONS" | wc -l | tr -d ' ')
fi

if [ "$RADIUS_COUNT" -gt 0 ]; then
  echo -e "  ${RED}❌ Ditemukan $RADIUS_COUNT kontrol dengan corner radius non-standar (Gunakan 'rounded-md'):${NC}"
  echo "$RADIUS_VIOLATIONS" | head -n 5 | while read -r line; do
    echo -e "     ${RED}•${NC} $line"
  done
  FATAL_ERRORS=$((FATAL_ERRORS + RADIUS_COUNT))
else
  echo -e "  ${GREEN}✓ 0 kontrol dengan corner radius oversized (100% rounded-md standard).${NC}"
fi
echo ""

# ------------------------------------------------------------------------------
# ATURAN 8: Segmented Filter & Switcher Active State (Supabase Standard)
# ------------------------------------------------------------------------------
echo -e "${CYAN}▶ [8/11] Memeriksa Standar Segmented Filter & Tabs Active State...${NC}"
FILTER_STATE_VIOLATIONS=$(grep -rnE '(segmented|tab-filter|filter-pill)[^>]*bg-primary text-primary-foreground' "${VALID_DIRS[@]}" \
  --include="*.tsx" --include="*.ts" 2>/dev/null \
  | grep -v "node_modules" || true)

FILTER_STATE_COUNT=0
if [ -n "$FILTER_STATE_VIOLATIONS" ]; then
  FILTER_STATE_COUNT=$(echo "$FILTER_STATE_VIOLATIONS" | wc -l | tr -d ' ')
fi

if [ "$FILTER_STATE_COUNT" -gt 0 ]; then
  echo -e "  ${RED}❌ Ditemukan $FILTER_STATE_COUNT filter tab dengan active state non-standar (Gunakan subtle active pill):${NC}"
  echo "$FILTER_STATE_VIOLATIONS" | head -n 5 | while read -r line; do
    echo -e "     ${RED}•${NC} $line"
  done
  FATAL_ERRORS=$((FATAL_ERRORS + FILTER_STATE_COUNT))
else
  echo -e "  ${GREEN}✓ 0 pelanggaran active state segmented filter (100% subtle standard).${NC}"
fi
echo ""

# ------------------------------------------------------------------------------
# ATURAN 9: Dense Toolbar & Table Header Scale Standard (Supabase: h-7 / h-8)
# ------------------------------------------------------------------------------
echo -e "${CYAN}▶ [9/11] Memeriksa Standar Skala Dense Toolbar & Action Bar (Supabase: h-7/h-8)...${NC}"
TOOLBAR_SCALE_VIOLATIONS=$(grep -rnE '(Toolbar|HeaderBar|ActionBar)[^>]*<Button[^>]*className=[^>]*\bh-(10|11|12|14)\b' "${VALID_DIRS[@]}" \
  --include="*.tsx" --include="*.ts" 2>/dev/null \
  | grep -v "node_modules" || true)

TOOLBAR_SCALE_COUNT=0
if [ -n "$TOOLBAR_SCALE_VIOLATIONS" ]; then
  TOOLBAR_SCALE_COUNT=$(echo "$TOOLBAR_SCALE_VIOLATIONS" | wc -l | tr -d ' ')
fi

if [ "$TOOLBAR_SCALE_COUNT" -gt 0 ]; then
  echo -e "  ${RED}❌ Ditemukan $TOOLBAR_SCALE_COUNT tombol toolbar dengan tinggi oversized (Gunakan h-7 atau h-8):${NC}"
  echo "$TOOLBAR_SCALE_VIOLATIONS" | head -n 5 | while read -r line; do
    echo -e "     ${RED}•${NC} $line"
  done
  FATAL_ERRORS=$((FATAL_ERRORS + TOOLBAR_SCALE_COUNT))
else
  echo -e "  ${GREEN}✓ 0 tombol toolbar oversized (100% dense h-7/h-8 standard).${NC}"
fi
echo ""

# ------------------------------------------------------------------------------
# ATURAN 10: Fluid & Density Token Integrity Check
# ------------------------------------------------------------------------------
echo -e "${CYAN}▶ [10/11] Memeriksa Integritas File Token Modular (Typography, Spacing, Semantic, Density)...${NC}"
TOKEN_FILES=(
  "/opt/project5/packages/design-system/src/tokens/typography.css"
  "/opt/project5/packages/design-system/src/tokens/spacing.css"
  "/opt/project5/packages/design-system/src/tokens/semantic.css"
  "/opt/project5/packages/design-system/src/tokens/density.css"
)

MISSING_TOKENS=0
for tf in "${TOKEN_FILES[@]}"; do
  if [ ! -f "$tf" ]; then
    echo -e "  ${RED}❌ File token tidak ditemukan: $tf${NC}"
    MISSING_TOKENS=$((MISSING_TOKENS + 1))
  fi
done

THEME_CSS="/opt/project5/packages/design-system/src/theme.css"
MISSING_IMPORTS=0
if [ -f "$THEME_CSS" ]; then
  for tname in typography spacing semantic density; do
    if ! grep -q "tokens/$tname.css" "$THEME_CSS"; then
      echo -e "  ${RED}❌ $THEME_CSS tidak meng-import tokens/$tname.css${NC}"
      MISSING_IMPORTS=$((MISSING_IMPORTS + 1))
    fi
  done
fi

TOTAL_TOKEN_ERRORS=$((MISSING_TOKENS + MISSING_IMPORTS))
if [ "$TOTAL_TOKEN_ERRORS" -gt 0 ]; then
  FATAL_ERRORS=$((FATAL_ERRORS + TOTAL_TOKEN_ERRORS))
else
  echo -e "  ${GREEN}✓ Integritas token modular valid (4/4 file token & theme.css @import terverifikasi).${NC}"
fi
echo ""

# ------------------------------------------------------------------------------
# ATURAN 11: Container Queries Adoption Audit (@container/card)
# ------------------------------------------------------------------------------
echo -e "${CYAN}▶ [11/12] Memeriksa Adopsi Container Queries (@container)...${NC}"
CARD_FILE="/opt/project5/packages/ui/src/components/card.tsx"
CONTAINER_QUERY_OK=true

if [ -f "$CARD_FILE" ]; then
  if ! grep -q "@container" "$CARD_FILE"; then
    echo -e "  ${RED}❌ Component Card di $CARD_FILE tidak memiliki class '@container'!${NC}"
    CONTAINER_QUERY_OK=false
    FATAL_ERRORS=$((FATAL_ERRORS + 1))
  fi
fi

if [ "$CONTAINER_QUERY_OK" = true ]; then
  echo -e "  ${GREEN}✓ Adopsi Container Queries valid (@container terpasang pada shared Card component).${NC}"
fi
echo ""

# ------------------------------------------------------------------------------
# ATURAN 12: Sidebar Header & Shell Layout Height Consistency
# ------------------------------------------------------------------------------
echo -e "${CYAN}▶ [12/12] Memeriksa Konsistensi Ketinggian Header Sidebar (Anti Oversized Padding)...${NC}"
OVERSIZED_SIDEBAR_REGEX="py-5.*border-b.*min-w-\[240px\]|py-6.*border-b.*min-w-\[240px\]|py-8.*border-b.*min-w-\[240px\]"
SIDEBAR_VIOLATIONS=$(grep -rnE "$OVERSIZED_SIDEBAR_REGEX" "${VALID_DIRS[@]}" \
  --include="*.tsx" --include="*.ts" 2>/dev/null \
  --exclude="audit-design-system.sh" \
  --exclude="*.test.tsx" --exclude="*.stories.tsx" || true)

if [ -n "$SIDEBAR_VIOLATIONS" ]; then
  echo -e "  ${RED}❌ Ditemukan header sidebar sekunder dengan padding oversized (wajib py-2 / h-12 via SecondarySidebarHeader):${NC}"
  echo "$SIDEBAR_VIOLATIONS" | while IFS= read -r line; do
    echo -e "     ${YELLOW}$line${NC}"
  done
  FATAL_ERRORS=$((FATAL_ERRORS + 1))
else
  echo -e "  ${GREEN}✓ Header sidebar konsisten (100% menggunakan scale compact py-2 / h-12).${NC}"
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
  echo -e "${GREEN}     Codebase 100% selaras dengan 12 Aturan Supabase Design System.   ${NC}"
  echo -e "${BLUE}======================================================================${NC}\n"
  exit 0
else
  echo -e "${RED}  ❌ AUDIT GAGAL: Ditemukan total $FATAL_ERRORS pelanggaran fatal Design System!${NC}"
  echo -e "${YELLOW}     Perbaiki pelanggaran di atas sebelum melakukan push / deploy.    ${NC}"
  echo -e "${BLUE}======================================================================${NC}\n"
  exit 1
fi
