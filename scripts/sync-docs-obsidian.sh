#!/bin/bash
# ==============================================================================
# SINKRONISASI DOKUMENTASI LOKAL KE OBSIDIAN VAULT (NEXTCLOUD WebDAV)
# Mengirim seluruh berkas /opt/project5/docs ke K2NET_Engineering_Vault/05_Documentation
# ==============================================================================

set -euo pipefail

DOCS_DIR="/opt/project5/docs"
REMOTE="nextcloud"
TARGET_VAULT="K2NET_Engineering_Vault/05_Documentation"

echo "=== Memulai Sinkronisasi Docs ke Obsidian Vault [$(date '+%Y-%m-%d %H:%M:%S')] ==="

# Verifikasi direktori lokal
if [ ! -d "$DOCS_DIR" ]; then
  echo "Error: Direktori $DOCS_DIR tidak ditemukan!"
  exit 1
fi

# Verifikasi remote rclone
if ! rclone listremotes | grep -q "^${REMOTE}:"; then
  echo "Error: Rclone remote '$REMOTE' belum dikonfigurasi!"
  exit 1
fi

echo "--- Mengunggah pembaruan berkas dari $DOCS_DIR ke ${REMOTE}:${TARGET_VAULT} ---"
rclone copy "$DOCS_DIR/" "${REMOTE}:${TARGET_VAULT}/" \
  --include "*.md" \
  --include "*.png" \
  --include "*.jpg" \
  --include "*.jpeg" \
  --include "*.svg" \
  --include "*.pdf" \
  --transfers 4 \
  --checkers 8 \
  --retries 3 \
  --low-level-retries 10 \
  -v

echo "=== Sinkronisasi Docs ke Obsidian Selesai [$(date '+%Y-%m-%d %H:%M:%S')] ==="
