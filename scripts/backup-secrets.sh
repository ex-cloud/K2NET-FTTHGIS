#!/bin/bash
# =============================================================================
# backup-secrets.sh
# Backup kredensial kritis (OLT_ENCRYPTION_KEY, dll.) ke MinIO dan Nextcloud
# Dijalankan manual atau via cron setelah ada perubahan .env
#
# PENTING: Script ini mengenkripsi file secrets dengan AES-256-CBC + passphrase
# sebelum upload. Passphrase HARUS Anda ingat atau simpan di password manager.
# =============================================================================

set -euo pipefail

# ─── Load env ────────────────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$SCRIPT_DIR/../.env"

if [[ -f "$ENV_FILE" ]]; then
    set -a; source "$ENV_FILE"; set +a
fi

# ─── Config ──────────────────────────────────────────────────────────────────
MINIO_ALIAS="ftth-minio"
MINIO_ENDPOINT="http://100.110.205.109:9005"
MINIO_BUCKET="db-backups"
MINIO_KEY_PATH="secrets/olt_encryption_key_backup.enc"

NEXTCLOUD_REMOTE="nextcloud"
NEXTCLOUD_REMOTE_PATH="FTTH-GIS-Backups/secrets/"

TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
TMP_DIR=$(mktemp -d)
PLAINTEXT_FILE="$TMP_DIR/secrets_${TIMESTAMP}.txt"
ENCRYPTED_FILE="$TMP_DIR/secrets_${TIMESTAMP}.enc"

# Discord / Telegram alert (opsional)
DISCORD_URL="${DISCORD_WEBHOOK_URL:-}"

# ─── Helper functions ─────────────────────────────────────────────────────────
log()   { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"; }
error() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] ❌ ERROR: $*" >&2; }

cleanup() { rm -rf "$TMP_DIR"; }
trap cleanup EXIT

send_alert() {
    local msg="$1"
    if [[ -n "$DISCORD_URL" ]]; then
        curl -s -X POST "$DISCORD_URL" \
            -H "Content-Type: application/json" \
            -d "{\"content\":\"$msg\"}" > /dev/null 2>&1 || true
    fi
}

# ─── 1. Prompt untuk passphrase enkripsi ────────────────────────────────────
log "🔐 K2NET Secrets Backup — Starting..."
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  PERINGATAN: Masukkan passphrase untuk mengenkripsi"
echo "  file backup. Passphrase ini WAJIB Anda ingat."
echo "  Tanpa passphrase ini, file backup tidak bisa dibuka."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Jika passphrase diberikan via env var (untuk otomatisasi), gunakan itu
if [[ -z "${BACKUP_PASSPHRASE:-}" ]]; then
    # Cek apakah stdin adalah TTY (interactive terminal)
    if [ -t 0 ]; then
        read -rsp "Masukkan passphrase enkripsi: " BACKUP_PASSPHRASE
        echo ""
        read -rsp "Konfirmasi passphrase: " BACKUP_PASSPHRASE_CONFIRM
        echo ""

        if [[ "$BACKUP_PASSPHRASE" != "$BACKUP_PASSPHRASE_CONFIRM" ]]; then
            error "Passphrase tidak cocok. Batalkan."
            exit 1
        fi

        if [[ ${#BACKUP_PASSPHRASE} -lt 8 ]]; then
            error "Passphrase terlalu pendek (minimum 8 karakter)."
            exit 1
        fi
    else
        log "ℹ️  Non-interactive shell detected. Using BACKUP_PASSPHRASE from environment or security fallback."
        # Use GATEWAY_TOKEN if available, otherwise secure default
        BACKUP_PASSPHRASE="${GATEWAY_TOKEN:-k2net_gis_secure_secrets_aes256_passphrase}"
    fi
fi

# ─── 2. Buat file plaintext berisi secrets ───────────────────────────────────
log "📝 Membuat file secrets..."
cat > "$PLAINTEXT_FILE" << SECRETS_EOF
# K2NET FTTH GIS — Critical Secrets Backup
# Generated: $TIMESTAMP
# Server: $(hostname)
# ============================================================

[OLT Gateway Encryption Key]
# Digunakan oleh ftth-olt-gateway untuk enkripsi/dekripsi credential SSH OLT
# Jika key ini hilang, data OLT di database tidak dapat didekripsi
OLT_ENCRYPTION_KEY=${OLT_ENCRYPTION_KEY:-NOT_SET}

[Gateway Token]
GATEWAY_TOKEN=${GATEWAY_TOKEN:-NOT_SET}

[NextAuth Secret]
AUTH_SECRET=${AUTH_SECRET:-NOT_SET}

[MinIO KMS Key]
MINIO_KMS_SECRET_KEY=${MINIO_KMS_SECRET_KEY:-NOT_SET}

[Keycloak Client Secret]
KEYCLOAK_CLIENT_SECRET=${KEYCLOAK_CLIENT_SECRET:-NOT_SET}

# ============================================================
# CARA DEKRIPSI:
# openssl enc -aes-256-cbc -d -pbkdf2 -in secrets_TIMESTAMP.enc -out decrypted.txt
# Lalu masukkan passphrase saat diminta
# ============================================================
SECRETS_EOF

log "✅ File secrets dibuat: $(wc -l < "$PLAINTEXT_FILE") baris"

# ─── 3. Enkripsi dengan AES-256-CBC + PBKDF2 ─────────────────────────────────
log "🔒 Mengenkripsi file dengan AES-256-CBC..."
echo "$BACKUP_PASSPHRASE" | openssl enc \
    -aes-256-cbc \
    -pbkdf2 \
    -iter 100000 \
    -pass stdin \
    -in  "$PLAINTEXT_FILE" \
    -out "$ENCRYPTED_FILE"

ENCRYPTED_SIZE=$(du -sh "$ENCRYPTED_FILE" | cut -f1)
log "✅ Enkripsi selesai. Ukuran file: $ENCRYPTED_SIZE"

# Hapus plaintext segera setelah enkripsi
shred -u "$PLAINTEXT_FILE" 2>/dev/null || rm -f "$PLAINTEXT_FILE"

# ─── 4. Upload ke MinIO ───────────────────────────────────────────────────────
log "📤 Mengupload ke MinIO ($MINIO_BUCKET/$MINIO_KEY_PATH)..."

# Setup mc alias jika belum ada
if ! mc alias ls "$MINIO_ALIAS" > /dev/null 2>&1; then
    mc alias set "$MINIO_ALIAS" \
        "$MINIO_ENDPOINT" \
        "${MINIO_ROOT_USER:-admin_gis_storage}" \
        "${MINIO_ROOT_PASSWORD:-}" --api S3v4 > /dev/null 2>&1
fi

# Upload file encrypted (versioned: dengan timestamp)
mc cp "$ENCRYPTED_FILE" \
    "$MINIO_ALIAS/$MINIO_BUCKET/secrets/secrets_${TIMESTAMP}.enc" 2>&1 | log

# Juga update file "latest" untuk kemudahan akses
mc cp "$ENCRYPTED_FILE" \
    "$MINIO_ALIAS/$MINIO_BUCKET/$MINIO_KEY_PATH" 2>&1 | log

log "✅ Upload MinIO selesai"

# ─── 5. Copy ke folder untuk sync Nextcloud ───────────────────────────────────
NEXTCLOUD_LOCAL_DIR="$(dirname "$SCRIPT_DIR")/backups/secrets"
mkdir -p "$NEXTCLOUD_LOCAL_DIR"
cp "$ENCRYPTED_FILE" "$NEXTCLOUD_LOCAL_DIR/secrets_${TIMESTAMP}.enc"
cp "$ENCRYPTED_FILE" "$NEXTCLOUD_LOCAL_DIR/olt_key_latest.enc"

log "✅ File disalin ke $NEXTCLOUD_LOCAL_DIR (akan tersync ke Nextcloud via rclone)"

# ─── 6. Cek apakah rclone tersedia untuk sync langsung ───────────────────────
if command -v rclone &>/dev/null && rclone listremotes 2>/dev/null | grep -q "$NEXTCLOUD_REMOTE"; then
    log "☁️  Mensync ke Nextcloud sekarang..."
    rclone copy "$NEXTCLOUD_LOCAL_DIR/" "$NEXTCLOUD_REMOTE:$NEXTCLOUD_REMOTE_PATH" \
        --update --verbose 2>&1 | tail -5
    log "✅ Sync Nextcloud selesai"
else
    log "ℹ️  rclone tidak tersedia atau remote '$NEXTCLOUD_REMOTE' belum dikonfigurasi."
    log "   File akan tersync ke Nextcloud saat sync-nextcloud.sh berjalan (cron 04:00)"
fi

# ─── 7. Verifikasi enkripsi bisa didekripsi ───────────────────────────────────
log "🔍 Memverifikasi integritas enkripsi..."
VERIFY_FILE="$TMP_DIR/verify_decrypt.txt"
echo "$BACKUP_PASSPHRASE" | openssl enc \
    -aes-256-cbc \
    -d \
    -pbkdf2 \
    -iter 100000 \
    -pass stdin \
    -in  "$ENCRYPTED_FILE" \
    -out "$VERIFY_FILE" 2>/dev/null

if grep -q "OLT_ENCRYPTION_KEY" "$VERIFY_FILE"; then
    log "✅ Verifikasi berhasil — file terenkripsi dapat didekripsi dengan benar"
else
    error "Verifikasi gagal! File mungkin rusak."
    exit 1
fi

# ─── Summary ──────────────────────────────────────────────────────────────────
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ✅ Backup Secrets Selesai!"
echo "  📦 MinIO   : $MINIO_BUCKET/$MINIO_KEY_PATH"
echo "  📦 MinIO   : $MINIO_BUCKET/secrets/secrets_${TIMESTAMP}.enc"
echo "  📁 Lokal   : $NEXTCLOUD_LOCAL_DIR/secrets_${TIMESTAMP}.enc"
echo "  ☁️  Nextcloud: (akan tersync malam ini jam 04:00)"
echo ""
echo "  ⚠️  CARA DEKRIPSI:"
echo "  openssl enc -aes-256-cbc -d -pbkdf2 -iter 100000 \\"
echo "    -in secrets_${TIMESTAMP}.enc -out decrypted.txt"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

send_alert "✅ [K2NET] Secrets backup selesai: MinIO + Nextcloud sync dijadwalkan jam 04:00"

exit 0
