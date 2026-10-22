-- ==============================================================================
-- Flyway Migration V67: Catalog Message Templates & Dunning Notification Engine
-- K2NET FTTH GIS — Enterprise SaaS Multi-Tenant Platform
--
-- Architecture:
--   Catalog: message_templates (SSOT template notifikasi perpanjangan & dunning)
--   Channels: EMAIL, WHATSAPP, SMS
--   Auditing: Hibernate Envers (message_templates_aud)
-- ==============================================================================

-- 1. TABEL MESSAGE_TEMPLATES (DOMAIN: CATALOG)
CREATE TABLE IF NOT EXISTS message_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(64) NOT NULL UNIQUE,
    name VARCHAR(128) NOT NULL,
    channel VARCHAR(32) NOT NULL DEFAULT 'EMAIL', -- EMAIL, WHATSAPP, SMS, ALL
    category VARCHAR(64) NOT NULL DEFAULT 'DUNNING', -- DUNNING, BILLING, SYSTEM
    subject_template VARCHAR(255),
    body_template TEXT NOT NULL,
    variables_description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by VARCHAR(255) DEFAULT 'SYSTEM',
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_by VARCHAR(255) DEFAULT 'SYSTEM'
);

CREATE INDEX IF NOT EXISTS idx_message_templates_code ON message_templates(code);
CREATE INDEX IF NOT EXISTS idx_message_templates_channel ON message_templates(channel, is_active);
CREATE INDEX IF NOT EXISTS idx_message_templates_cat ON message_templates(category, is_active);

COMMENT ON TABLE message_templates IS 'Single Source of Truth untuk template pesan pengingat tagihan, renewal, dan dunning (Email, WhatsApp)';

-- 2. TABEL AUDIT ENVERS MESSAGE_TEMPLATES
CREATE TABLE IF NOT EXISTS message_templates_aud (
    id UUID NOT NULL,
    rev INTEGER NOT NULL REFERENCES revinfo(id),
    revtype SMALLINT,
    code VARCHAR(64),
    name VARCHAR(128),
    channel VARCHAR(32),
    category VARCHAR(64),
    subject_template VARCHAR(255),
    body_template TEXT,
    variables_description TEXT,
    is_active BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE,
    created_by VARCHAR(255),
    updated_at TIMESTAMP WITH TIME ZONE,
    updated_by VARCHAR(255),
    PRIMARY KEY (rev, id)
);

-- 3. SEED INITIAL STANDARD MESSAGE TEMPLATES
INSERT INTO message_templates (
    id, code, name, channel, category, subject_template, body_template, variables_description, is_active
) VALUES
(
    '00000000-0000-0000-0000-000000000071',
    'EXPIRING_30D',
    'Pengingat H-30 Masa Aktif Lisensi',
    'EMAIL',
    'DUNNING',
    '[K2NET FTTH GIS] Pengingat H-30: Masa Aktif Lisensi {{tenant_name}} Berakhir {{due_date}}',
    'Halo Rekan {{tenant_name}},\n\nKami menginformasikan bahwa lisensi paket {{plan_name}} organisasi Anda akan berakhir pada {{due_date}} (sisa 30 hari).\n\nUntuk menjaga kelancaran operasional jaringan FTTH Anda tanpa gangguan, silakan lakukan perpanjangan kontrak melalui portal billing: {{payment_link}}\n\nSalam,\nTim Layanan K2NET FTTH GIS',
    '{"tenant_name": "Nama tenant / organisasi", "plan_name": "Tier paket langganan", "due_date": "Tanggal jatuh tempo", "payment_link": "URL pelunasan atau perpanjangan"}',
    TRUE
),
(
    '00000000-0000-0000-0000-000000000072',
    'EXPIRING_7D',
    'Pengingat H-7 Tagihan & Lisensi',
    'EMAIL',
    'DUNNING',
    '[K2NET FTTH GIS] Pengingat H-7: Masa Aktif Lisensi {{tenant_name}} Segera Berakhir',
    'Halo Rekan {{tenant_name}},\n\nMasa aktif lisensi paket {{plan_name}} Anda tersisa 7 hari lagi (Jatuh tempo: {{due_date}}).\nNomor Lisensi: {{license_key}}\n\nSegera lakukan konfirmasi faktur atau pembayaran sebelum tanggal jatuh tempo agar sinkronisasi perangkat OLT/ODP tetap berjalan normal: {{payment_link}}',
    '{"tenant_name": "Nama tenant", "plan_name": "Tier paket", "due_date": "Tanggal jatuh tempo", "license_key": "Nomor seri lisensi Ed25519", "payment_link": "Tautan bayar"}',
    TRUE
),
(
    '00000000-0000-0000-0000-000000000073',
    'EXPIRING_3D',
    'Peringatan Urgent H-3 Lisensi',
    'EMAIL',
    'DUNNING',
    '[URGENT - H-3] Masa Aktif Lisensi {{tenant_name}} Berakhir dalam 3 Hari',
    'PENTING: Lisensi {{plan_name}} milik {{tenant_name}} akan berakhir dalam 3 hari pada {{due_date}}.\n\nJika tidak diperpanjang, akun akan secara otomatis memasuki Masa Tenggang (Grace Period). Harap segera selesaikan tagihan Anda di: {{payment_link}}',
    '{"tenant_name": "Nama tenant", "plan_name": "Tier paket", "due_date": "Tanggal jatuh tempo", "payment_link": "Tautan bayar"}',
    TRUE
),
(
    '00000000-0000-0000-0000-000000000074',
    'GRACE_PERIOD',
    'Pemberitahuan Masa Tenggang (Grace Period)',
    'EMAIL',
    'DUNNING',
    '[PERINGATAN] Lisensi {{tenant_name}} Kedaluwarsa - Masa Tenggang Aktif',
    'PERHATIAN: Lisensi organisasi {{tenant_name}} telah jatuh tempo pada {{due_date}}. Saat ini akun Anda berada dalam Masa Tenggang (Grace Period) selama {{grace_days_remaining}} hari.\n\nApabila tidak diperpanjang dalam masa tenggang ini, mutasi data dan penambahan perangkat jaringan akan terkunci dalam mode Read-Only.\n\nBayar tagihan sekarang: {{payment_link}}',
    '{"tenant_name": "Nama tenant", "due_date": "Tanggal kedaluwarsa", "grace_days_remaining": "Sisa hari toleransi", "payment_link": "Tautan pembayaran"}',
    TRUE
),
(
    '00000000-0000-0000-0000-000000000075',
    'READ_ONLY_LOCKED',
    'Pemberitahuan Akses Dibatasi (Read-Only Mode)',
    'EMAIL',
    'DUNNING',
    '[AKSES DIBATASI] Lisensi {{tenant_name}} Masuk Mode Read-Only',
    'Pemberitahuan Resmi: Masa tenggang lisensi organisasi {{tenant_name}} telah berakhir. Seluruh hak penulisan, modifikasi rute kabel optik, dan integrasi perangkat OLT telah dibatasi menjadi BACA SAJA (Read-Only).\n\nUntuk membuka kembali akses penuh, silakan selesaikan pembayaran tagihan Anda di: {{payment_link}}',
    '{"tenant_name": "Nama tenant", "payment_link": "Tautan pembayaran"}',
    TRUE
),
(
    '00000000-0000-0000-0000-000000000076',
    'WHATSAPP_EXPIRING_7D',
    'WhatsApp H-7 Pengingat Lisensi',
    'WHATSAPP',
    'DUNNING',
    '⏳ *PENGINGAT H-7 LISENSI FTTH GIS*',
    'Halo *{{tenant_name}}*,\n\nMasa aktif lisensi *{{plan_name}}* Anda tersisa *7 hari* lagi (Jatuh tempo: {{due_date}}).\n\nNomor Lisensi: `{{license_key}}`\n\nUntuk menghindari gangguan operasional jaringan dan pembatasan fitur, silakan perpanjang lisensi Anda melalui tautan resmi:\n{{payment_link}}\n\n_Pesan otomatis K2NET FTTH GIS_',
    '{"tenant_name": "Nama organisasi", "plan_name": "Tier paket", "due_date": "Jatuh tempo", "license_key": "Kunci lisensi", "payment_link": "Tautan bayar"}',
    TRUE
),
(
    '00000000-0000-0000-0000-000000000077',
    'WHATSAPP_GRACE_PERIOD',
    'WhatsApp Masa Tenggang (Grace Period)',
    'WHATSAPP',
    'DUNNING',
    '⚠️ *PERINGATAN: MASA TENGGANG AKTIF*',
    'Halo *{{tenant_name}}*,\n\nLisensi FTTH GIS Anda telah kedaluwarsa pada {{due_date}}. Akun Anda saat ini berada dalam *Masa Tenggang (sisa {{grace_days_remaining}} hari)*.\n\nMohon segera selesaikan tagihan perpanjangan sebelum fitur dikunci ke mode *Read-Only*:\n👉 {{payment_link}}\n\n_Pusat Penagihan K2NET FTTH GIS_',
    '{"tenant_name": "Nama organisasi", "due_date": "Jatuh tempo", "grace_days_remaining": "Sisa hari", "payment_link": "Tautan bayar"}',
    TRUE
),
(
    '00000000-0000-0000-0000-000000000078',
    'INVOICE_PAID',
    'Konfirmasi Pembayaran Faktur Berhasil',
    'EMAIL',
    'BILLING',
    '[LUNAS] Konfirmasi Pembayaran Faktur {{invoice_number}} - {{tenant_name}}',
    'Halo Rekan {{tenant_name}},\n\nTerima kasih, pembayaran faktur {{invoice_number}} sebesar {{invoice_amount}} telah kami terima dan diverifikasi secara otomatis.\n\nDetail Transaksi:\n- Nomor Faktur: {{invoice_number}}\n- Paket Layanan: {{plan_name}}\n- Status: LUNAS (PAID)\n- Masa Berlaku Baru: s/d {{due_date}}\n\nLisensi operasional FTTH GIS Anda telah diperbarui secara otomatis. Anda dapat mengunduh kuitansi resmi di portal tenant.\n\nSalam,\nK2NET Billing & Finance Team',
    '{"tenant_name": "Nama tenant", "invoice_number": "Nomor faktur", "invoice_amount": "Total tagihan", "plan_name": "Tier paket", "due_date": "Masa berlaku baru"}',
    TRUE
)
ON CONFLICT (code) DO NOTHING;
