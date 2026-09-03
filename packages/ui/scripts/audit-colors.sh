#!/bin/bash
set -e

VIOLATIONS=$(grep -rn 'text-zinc-\|bg-zinc-\|border-zinc-\|text-white\|bg-emerald-\|text-emerald-\|border-emerald-' apps/studio-admin/src --include='*.tsx' --include='*.ts' 2>/dev/null | grep -v 'node_modules' || true)

if [ -n "$VIOLATIONS" ]; then
  echo "❌ Found hardcoded color violations:"
  echo "$VIOLATIONS"
  exit 1
else
  echo "✓ 0 pelanggaran warna hardcoded."
  exit 0
fi
