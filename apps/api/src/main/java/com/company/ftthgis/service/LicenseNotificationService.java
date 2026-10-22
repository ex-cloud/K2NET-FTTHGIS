package com.company.ftthgis.service;

import com.company.ftthgis.api.system.dto.LicenseNotificationLogDto;
import com.company.ftthgis.api.tenant.dto.BillingContactsDto;
import com.company.ftthgis.domain.tenant.entity.LicenseNotificationLog;
import com.company.ftthgis.domain.tenant.entity.LicenseNotificationStage;
import com.company.ftthgis.domain.tenant.entity.LicenseStatus;
import com.company.ftthgis.domain.tenant.entity.Organization;
import com.company.ftthgis.domain.tenant.entity.TenantLicense;
import com.company.ftthgis.domain.tenant.entity.MessageTemplate;
import com.company.ftthgis.domain.tenant.entity.BillingPolicy;
import com.company.ftthgis.domain.tenant.repository.BillingPolicyRepository;
import com.company.ftthgis.domain.tenant.repository.LicenseNotificationLogRepository;
import com.company.ftthgis.domain.tenant.repository.MessageTemplateRepository;
import com.company.ftthgis.domain.tenant.repository.OrganizationRepository;
import com.company.ftthgis.domain.tenant.repository.TenantLicenseRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Service orkestrator notifikasi pengingat proaktif lisensi (Email & WhatsApp WABA).
 * Menghubungkan OrganizationJanitorJob dengan EmailService dan notification-gateway (WhatsAppService).
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class LicenseNotificationService {

    private final EmailService emailService;
    private final WhatsAppService whatsAppService;
    private final LicenseNotificationLogRepository logRepository;
    private final TenantLicenseRepository licenseRepository;
    private final OrganizationRepository organizationRepository;
    private final MessageTemplateRepository messageTemplateRepository;
    private final BillingPolicyRepository billingPolicyRepository;

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd MMM yyyy, HH:mm");

    /**
     * Mengirim notifikasi pengingat lisensi multi-channel secara aman.
     */
    @Transactional
    public void dispatchLicenseReminder(TenantLicense license, LicenseNotificationStage stage, String triggeredBy) {
        if (license == null) return;

        Organization org = license.getOrganization();
        String orgName = org != null ? org.getName() : "Tenant FTTH";
        String orgSlug = org != null ? org.getSlug() : "unknown";

        String targetEmail = resolveRecipientEmail(license, org);
        String targetPhone = resolveRecipientPhone(license);

        log.info("📢 [LICENSE NOTIFIER] Dispatching stage '{}' for tenant '{}' ({}) via '{}'. Email: {}, Phone: {}",
                stage, orgName, orgSlug, triggeredBy, targetEmail, targetPhone);

        // 1. Kirim Email Notifikasi
        if (license.isNotifyEmailEnabled()) {
            if (targetEmail != null && !targetEmail.isBlank()) {
                sendEmailNotification(license, orgName, targetEmail, stage, triggeredBy);
            } else {
                log.warn("⚠️ [LICENSE NOTIFIER] Skipped email reminder for tenant '{}' - no billing contact email configured", orgSlug);
                logRepository.save(LicenseNotificationLog.builder()
                        .organization(license.getOrganization())
                        .license(license)
                        .channel("EMAIL")
                        .stage(stage)
                        .recipient("UNCONFIGURED")
                        .subject(buildEmailSubject(stage, orgName))
                        .status("FAILED")
                        .errorDetails("No valid billing contact email configured for organization or license")
                        .triggeredBy(triggeredBy)
                        .sentAt(LocalDateTime.now())
                        .build());
            }
        }

        // 2. Kirim WhatsApp Notifikasi
        if (license.isNotifyWhatsappEnabled() && targetPhone != null && !targetPhone.isBlank()) {
            sendWhatsAppNotification(license, orgName, targetPhone, stage, triggeredBy);
        }

        // 3. Update status stage terakhir pada lisensi
        license.setLastNotifiedStage(stage);
        license.setLastNotifiedAt(LocalDateTime.now());
        licenseRepository.save(license);
    }

    private void sendEmailNotification(TenantLicense license, String orgName, String targetEmail,
                                        LicenseNotificationStage stage, String triggeredBy) {
        String subject = null;
        String body = null;

        // 1. Cek dynamic template aktif dari catalog/templates di database
        if (messageTemplateRepository != null) {
            try {
                MessageTemplate tpl = messageTemplateRepository.findByCode(stage.name())
                        .filter(MessageTemplate::isActive)
                        .orElse(null);

                if (tpl != null && ("EMAIL".equalsIgnoreCase(tpl.getChannel()) || "ALL".equalsIgnoreCase(tpl.getChannel()))) {
                    subject = renderTemplateString(tpl.getSubjectTemplate(), license, orgName, stage);
                    body = renderTemplateString(tpl.getBodyTemplate(), license, orgName, stage);
                }
            } catch (Exception ex) {
                log.warn("⚠️ Failed to load message template for email stage '{}': {}", stage, ex.getMessage());
            }
        }

        // Fallback jika tidak ada template kustom aktif
        if (subject == null || subject.isBlank()) {
            subject = buildEmailSubject(stage, orgName);
        }
        if (body == null || body.isBlank()) {
            body = buildEmailHtmlBody(license, orgName, stage);
        }

        try {
            boolean sent = emailService.sendEmail(targetEmail, subject, body);
            String status = sent ? "SENT" : "FAILED";

            logRepository.save(LicenseNotificationLog.builder()
                    .organization(license.getOrganization())
                    .license(license)
                    .channel("EMAIL")
                    .stage(stage)
                    .recipient(targetEmail)
                    .subject(subject)
                    .status(status)
                    .messageContent("HTML Content dispatched for stage " + stage)
                    .triggeredBy(triggeredBy)
                    .sentAt(LocalDateTime.now())
                    .build());
        } catch (Exception e) {
            log.error("❌ Failed to dispatch license email to {}: {}", targetEmail, e.getMessage());
            logRepository.save(LicenseNotificationLog.builder()
                    .organization(license.getOrganization())
                    .license(license)
                    .channel("EMAIL")
                    .stage(stage)
                    .recipient(targetEmail)
                    .subject(subject)
                    .status("FAILED")
                    .errorDetails(e.getMessage())
                    .triggeredBy(triggeredBy)
                    .sentAt(LocalDateTime.now())
                    .build());
        }
    }

    private void sendWhatsAppNotification(TenantLicense license, String orgName, String targetPhone,
                                           LicenseNotificationStage stage, String triggeredBy) {
        String message = null;

        // 1. Cek dynamic template aktif dari catalog/templates di database
        if (messageTemplateRepository != null) {
            try {
                MessageTemplate tpl = messageTemplateRepository.findByCode("WHATSAPP_" + stage.name())
                        .filter(MessageTemplate::isActive)
                        .orElseGet(() -> messageTemplateRepository.findByCode(stage.name())
                                .filter(t -> t.isActive() && ("WHATSAPP".equalsIgnoreCase(t.getChannel()) || "ALL".equalsIgnoreCase(t.getChannel())))
                                .orElse(null));

                if (tpl != null) {
                    message = renderTemplateString(tpl.getBodyTemplate(), license, orgName, stage);
                }
            } catch (Exception ex) {
                log.warn("⚠️ Failed to load message template for WhatsApp stage '{}': {}", stage, ex.getMessage());
            }
        }

        // Fallback jika tidak ada template kustom aktif
        if (message == null || message.isBlank()) {
            message = buildWhatsAppMessage(license, orgName, stage);
        }

        try {
            boolean sent = whatsAppService.sendMessage(targetPhone, message);
            String status = sent ? "SENT" : "FAILED";

            logRepository.save(LicenseNotificationLog.builder()
                    .organization(license.getOrganization())
                    .license(license)
                    .channel("WHATSAPP")
                    .stage(stage)
                    .recipient(targetPhone)
                    .subject("WA Reminder: " + stage)
                    .status(status)
                    .messageContent(message)
                    .triggeredBy(triggeredBy)
                    .sentAt(LocalDateTime.now())
                    .build());
        } catch (Exception e) {
            log.error("❌ Failed to dispatch license WhatsApp to {}: {}", targetPhone, e.getMessage());
            logRepository.save(LicenseNotificationLog.builder()
                    .organization(license.getOrganization())
                    .license(license)
                    .channel("WHATSAPP")
                    .stage(stage)
                    .recipient(targetPhone)
                    .subject("WA Reminder: " + stage)
                    .status("FAILED")
                    .errorDetails(e.getMessage())
                    .triggeredBy(triggeredBy)
                    .sentAt(LocalDateTime.now())
                    .build());
        }
    }

    private String renderTemplateString(String templateStr, TenantLicense license, String orgName, LicenseNotificationStage stage) {
        if (templateStr == null) return "";

        String validUntilStr = license.getValidUntil() != null ? license.getValidUntil().format(DATE_FMT) : "-";
        String tier = license.getSubscriptionPlan() != null ? license.getSubscriptionPlan().getName() : "Enterprise";
        String licenseKey = license.getLicenseKey() != null ? license.getLicenseKey() : "-";
        String graceDays = "14";
        if (billingPolicyRepository != null) {
            graceDays = billingPolicyRepository.findByPolicyKey("grace_period_days")
                    .map(BillingPolicy::getPolicyValue)
                    .orElse("14");
        }
        String paymentLink = "https://app.kdua.net/billing";
        if (license.getOrganization() != null && license.getOrganization().getSlug() != null) {
            paymentLink = "https://" + license.getOrganization().getSlug() + ".kdua.net/billing/invoices";
        }

        Map<String, String> replacements = new HashMap<>();
        replacements.put("tenant_name", orgName);
        replacements.put("plan_name", tier);
        replacements.put("due_date", validUntilStr);
        replacements.put("license_key", licenseKey);
        replacements.put("grace_days_remaining", graceDays);
        replacements.put("payment_link", paymentLink);

        String result = templateStr;
        for (Map.Entry<String, String> entry : replacements.entrySet()) {
            result = result.replace("{{" + entry.getKey() + "}}", entry.getValue())
                           .replace("{" + entry.getKey() + "}", entry.getValue());
        }
        return result;
    }

    private String buildEmailSubject(LicenseNotificationStage stage, String orgName) {
        return switch (stage) {
            case EXPIRING_7D -> String.format("[K2NET FTTH GIS] Pengingat H-7: Masa Aktif Lisensi %s Segera Berakhir", orgName);
            case EXPIRING_3D -> String.format("[URGENT - H-3] Masa Aktif Lisensi %s Berakhir dalam 3 Hari", orgName);
            case GRACE_PERIOD -> String.format("[PERINGATAN] Lisensi %s Kedaluwarsa - Masa Tenggang 7 Hari Aktif", orgName);
            case READ_ONLY_LOCKED -> String.format("[AKSES DIBATASI] Lisensi %s Masuk Mode Read-Only", orgName);
            case SUSPENDED -> String.format("[SUSPENDED] Akses Organisasi %s Ditangguhkan", orgName);
            case MANUAL_REMINDER -> String.format("[Pemberitahuan Lisensi] Informasi Masa Berlaku Layanan K2NET FTTH GIS (%s)", orgName);
            default -> String.format("[K2NET FTTH GIS] Informasi Lisensi Organisasi %s", orgName);
        };
    }

    private String buildEmailHtmlBody(TenantLicense license, String orgName, LicenseNotificationStage stage) {
        String validUntilStr = license.getValidUntil() != null ? license.getValidUntil().format(DATE_FMT) : "-";
        String tier = license.getSubscriptionPlan() != null ? license.getSubscriptionPlan().getName() : "Enterprise";

        String headline = switch (stage) {
            case EXPIRING_7D -> "Masa aktif lisensi Anda tersisa 7 hari.";
            case EXPIRING_3D -> "PENTING: Masa aktif lisensi Anda tersisa 3 hari lagi!";
            case GRACE_PERIOD -> "Lisensi Anda telah jatuh tempo. Anda memasuki Masa Tenggang (Grace Period) 7 hari.";
            case READ_ONLY_LOCKED -> "Masa tenggang telah berakhir. Operasi penulisan jaringan dikunci ke mode Read-Only.";
            case SUSPENDED -> "Akun organisasi Anda telah disuspend karena tagihan tertunggak melebihi batas waktu.";
            default -> "Pemberitahuan resmi mengenai status perizinan operasional platform GIS Anda.";
        };

        return String.format("""
            <!DOCTYPE html>
            <html>
            <head><meta charset="utf-8"/></head>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f4f5; margin: 0; padding: 24px;">
              <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; border: 1px solid #e4e4e7; overflow: hidden;">
                <div style="background: #18181b; padding: 20px 24px; color: #ffffff;">
                  <h2 style="margin: 0; font-size: 18px; font-weight: 600; letter-spacing: -0.5px;">K2NET FTTH GIS Platform</h2>
                  <p style="margin: 4px 0 0; font-size: 13px; color: #a1a1aa;">Sistem Notifikasi Lisensi & Operasional Jaringan</p>
                </div>
                <div style="padding: 24px; color: #27272a;">
                  <p style="font-size: 15px; line-height: 1.5; margin-top: 0;">Halo Rekan <strong>%s</strong>,</p>
                  <p style="font-size: 14px; line-height: 1.6; color: #52525b;">%s</p>
                  
                  <div style="background: #fafafa; border: 1px solid #e4e4e7; border-radius: 6px; padding: 16px; margin: 20px 0;">
                    <table style="width: 100%%; font-size: 13px; border-collapse: collapse;">
                      <tr><td style="color: #71717a; padding: 4px 0;">Paket Layanan:</td><td style="font-weight: 600; text-align: right;">%s</td></tr>
                      <tr><td style="color: #71717a; padding: 4px 0;">Nomor Lisensi:</td><td style="font-family: monospace; font-weight: 600; text-align: right;">%s</td></tr>
                      <tr><td style="color: #71717a; padding: 4px 0;">Jatuh Tempo:</td><td style="font-weight: 600; color: #dc2626; text-align: right;">%s</td></tr>
                    </table>
                  </div>

                  <p style="font-size: 13px; line-height: 1.5; color: #52525b;">
                    Untuk menjaga kontinuitas inventarisasi jaringan dan integrasi OLT/ODP secara mulus, silakan lakukan pembayaran atau hubungi sales representatif Anda sebelum batas waktu berakhir.
                  </p>
                  <div style="margin-top: 24px; text-align: center;">
                    <a href="https://app.kdua.net/billing/license" style="background: #18181b; color: #ffffff; text-decoration: none; padding: 10px 20px; font-size: 13px; font-weight: 500; border-radius: 6px; display: inline-block;">
                      Perpanjang Lisensi Sekarang &rarr;
                    </a>
                  </div>
                </div>
                <div style="background: #fafafa; border-top: 1px solid #e4e4e7; padding: 14px 24px; font-size: 11px; color: #a1a1aa; text-align: center;">
                  Pesan otomatis ini dikirimkan oleh K2NET Enterprise Telecom SaaS. Mohon tidak membalas email ini secara langsung.
                </div>
              </div>
            </body>
            </html>
            """,
                orgName,
                headline,
                tier,
                license.getLicenseKey(),
                validUntilStr
        );
    }

    private String buildWhatsAppMessage(TenantLicense license, String orgName, LicenseNotificationStage stage) {
        String validUntilStr = license.getValidUntil() != null ? license.getValidUntil().format(DATE_FMT) : "-";
        String tier = license.getSubscriptionPlan() != null ? license.getSubscriptionPlan().getName() : "Enterprise";

        String tag = switch (stage) {
            case EXPIRING_7D -> "⏳ *PENGINGAT H-7 LISENSI FTTH GIS*";
            case EXPIRING_3D -> "🚨 *PERINGATAN URGENT H-3 LISENSI*";
            case GRACE_PERIOD -> "⚠️ *MASA TENGGANG AKTIF (GRACE PERIOD)*";
            case READ_ONLY_LOCKED -> "🔒 *AKSES JARINGAN READ-ONLY*";
            case SUSPENDED -> "🚫 *LAYANAN DITANGGUHKAN (SUSPENDED)*";
            default -> "📢 *PEMBERITAHUAN LISENSI K2NET*";
        };

        return String.format("""
            %s
            
            Halo Tim *%s*,
            
            Berikut informasi status lisensi platform FTTH GIS Anda:
            • Paket: *%s*
            • Kode Lisensi: `%s`
            • Batas Waktu: *%s*
            
            Silakan lakukan perpanjangan langganan via tautan berikut untuk menghindari gangguan pada mutasi aset jaringan:
            👉 https://app.kdua.net/billing/license
            
            _Pesan otomatis dikirim oleh K2NET Notification Engine._
            """,
                tag,
                orgName,
                tier,
                license.getLicenseKey(),
                validUntilStr
        ).trim();
    }

    private String resolveRecipientEmail(TenantLicense license, Organization org) {
        if (license.getBillingContactEmail() != null && !license.getBillingContactEmail().isBlank()) {
            return license.getBillingContactEmail().trim();
        }
        if (org != null) {
            java.util.Map<String, String> settings = org.getSettingsMap();
            if (settings != null) {
                String configEmail = settings.get("billing_contact_email");
                if (configEmail != null && !configEmail.isBlank()) return configEmail.trim();
                String adminEmail = settings.get("admin_email");
                if (adminEmail != null && !adminEmail.isBlank()) return adminEmail.trim();
                String contactEmail = settings.get("contact_email");
                if (contactEmail != null && !contactEmail.isBlank()) return contactEmail.trim();
                String email = settings.get("email");
                if (email != null && !email.isBlank()) return email.trim();
            }
        }
        return null;
    }

    private String resolveRecipientPhone(TenantLicense license) {
        if (license.getBillingContactPhone() != null && !license.getBillingContactPhone().isBlank()) {
            return license.getBillingContactPhone().trim();
        }
        Organization org = license.getOrganization();
        if (org != null) {
            java.util.Map<String, String> settings = org.getSettingsMap();
            if (settings != null) {
                String configPhone = settings.get("billing_contact_phone");
                if (configPhone != null && !configPhone.isBlank()) return configPhone.trim();
                String contactPhone = settings.get("contact_phone");
                if (contactPhone != null && !contactPhone.isBlank()) return contactPhone.trim();
                String phone = settings.get("phone");
                if (phone != null && !phone.isBlank()) return phone.trim();
            }
        }
        return null;
    }

    /**
     * Mengambil riwayat log notifikasi untuk lisensi tertentu.
     */
    @Transactional(readOnly = true)
    public List<LicenseNotificationLogDto> getNotificationLogs(UUID organizationId, UUID licenseId) {
        return logRepository.findByOrganizationIdAndLicenseIdOrderBySentAtDesc(organizationId, licenseId)
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    /**
     * Mengambil kontak penagihan dan preferensi notifikasi lisensi aktif.
     */
    @Transactional(readOnly = true)
    public BillingContactsDto getBillingContacts(UUID organizationId) {
        TenantLicense license = licenseRepository.findFirstByOrganizationIdAndStatusInOrderByCreatedAtDesc(
                organizationId, List.of(LicenseStatus.ACTIVE, LicenseStatus.GRACE_PERIOD, LicenseStatus.RESTRICTED_READ_ONLY)
        ).orElse(null);

        if (license == null) {
            return BillingContactsDto.builder().build();
        }

        return BillingContactsDto.builder()
                .billingContactName(license.getBillingContactName())
                .billingContactEmail(license.getBillingContactEmail())
                .billingContactPhone(license.getBillingContactPhone())
                .notifyEmailEnabled(license.isNotifyEmailEnabled())
                .notifyWhatsappEnabled(license.isNotifyWhatsappEnabled())
                .build();
    }

    /**
     * Memperbarui kontak penagihan dan preferensi notifikasi oleh tenant.
     */
    @Transactional
    public BillingContactsDto updateBillingContacts(UUID organizationId, BillingContactsDto dto) {
        TenantLicense license = licenseRepository.findFirstByOrganizationIdAndStatusInOrderByCreatedAtDesc(
                organizationId, List.of(LicenseStatus.ACTIVE, LicenseStatus.GRACE_PERIOD, LicenseStatus.RESTRICTED_READ_ONLY)
        ).orElseThrow(() -> new IllegalArgumentException("Tidak ada lisensi aktif yang dapat diperbarui"));

        license.setBillingContactName(dto.getBillingContactName());
        license.setBillingContactEmail(dto.getBillingContactEmail());
        license.setBillingContactPhone(dto.getBillingContactPhone());
        if (dto.getNotifyEmailEnabled() != null) license.setNotifyEmailEnabled(dto.getNotifyEmailEnabled());
        if (dto.getNotifyWhatsappEnabled() != null) license.setNotifyWhatsappEnabled(dto.getNotifyWhatsappEnabled());

        licenseRepository.save(license);
        log.info("✅ Updated billing contacts for organization '{}': Email={}, Phone={}",
                organizationId, dto.getBillingContactEmail(), dto.getBillingContactPhone());

        return getBillingContacts(organizationId);
    }

    /**
     * Mengambil seluruh riwayat log notifikasi pengingat lisensi lintas tenant (Super Admin).
     */
    @Transactional(readOnly = true)
    public List<LicenseNotificationLogDto> getAllNotificationLogs() {
        return logRepository.findAllByOrderBySentAtDesc()
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    private LicenseNotificationLogDto mapToDto(LicenseNotificationLog entity) {
        String rawKey = entity.getLicense() != null ? entity.getLicense().getLicenseKey() : null;
        String maskedKey = rawKey != null ? maskKey(rawKey) : null;

        return LicenseNotificationLogDto.builder()
                .id(entity.getId())
                .organizationId(entity.getOrganization() != null ? entity.getOrganization().getId() : null)
                .organizationName(entity.getOrganization() != null ? entity.getOrganization().getName() : null)
                .organizationSlug(entity.getOrganization() != null ? entity.getOrganization().getSlug() : null)
                .licenseId(entity.getLicense() != null ? entity.getLicense().getId() : null)
                .licenseKey(rawKey)
                .maskedLicenseKey(maskedKey)
                .channel(entity.getChannel())
                .stage(entity.getStage())
                .recipient(entity.getRecipient())
                .subject(entity.getSubject())
                .status(entity.getStatus())
                .messageContent(entity.getMessageContent())
                .errorDetails(entity.getErrorDetails())
                .triggeredBy(entity.getTriggeredBy())
                .sentAt(entity.getSentAt())
                .build();
    }

    private String maskKey(String key) {
        if (key == null || key.length() < 12) return "K2NET-****-****-****";
        String[] parts = key.split("-");
        if (parts.length == 4) {
            return parts[0] + "-" + parts[1] + "-****-" + parts[3];
        }
        return key.substring(0, 8) + "-****-" + key.substring(key.length() - 4);
    }

    /**
     * Mengambil daftar tenant yang berada dalam antrean dunning & renewal (Super Admin).
     */
    @Transactional(readOnly = true)
    public List<com.company.ftthgis.api.system.dto.RenewalQueueItemDto> getRenewalQueue() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime threshold = now.plusDays(30);

        List<TenantLicense> candidates = licenseRepository.findAll().stream()
                .filter(lic -> {
                    if (lic.getOrganization() != null && "default".equalsIgnoreCase(lic.getOrganization().getSlug())) {
                        return false;
                    }
                    if (lic.getStatus() == LicenseStatus.GRACE_PERIOD || lic.getStatus() == LicenseStatus.RESTRICTED_READ_ONLY) {
                        return true;
                    }
                    if (lic.getStatus() == LicenseStatus.ACTIVE && lic.getValidUntil() != null && lic.getValidUntil().isBefore(threshold)) {
                        return true;
                    }
                    return false;
                })
                .sorted((a, b) -> {
                    if (a.getValidUntil() == null) return 1;
                    if (b.getValidUntil() == null) return -1;
                    return a.getValidUntil().compareTo(b.getValidUntil());
                })
                .toList();

        return candidates.stream().map(lic -> {
            Organization org = lic.getOrganization();
            long daysRemaining = lic.getValidUntil() != null 
                    ? java.time.temporal.ChronoUnit.DAYS.between(now, lic.getValidUntil())
                    : 0;

            String stage;
            if (lic.getStatus() == LicenseStatus.RESTRICTED_READ_ONLY) {
                stage = "RESTRICTED_READ_ONLY";
            } else if (lic.getStatus() == LicenseStatus.GRACE_PERIOD || daysRemaining < 0) {
                stage = "GRACE_PERIOD";
            } else if (daysRemaining <= 1) {
                stage = "EXPIRING_1D";
            } else if (daysRemaining <= 7) {
                stage = "EXPIRING_7D";
            } else {
                stage = "EXPIRING_30D";
            }

            return com.company.ftthgis.api.system.dto.RenewalQueueItemDto.builder()
                    .licenseId(lic.getId())
                    .organizationId(org != null ? org.getId() : null)
                    .organizationName(org != null ? org.getName() : "Unknown")
                    .organizationSlug(org != null ? org.getSlug() : null)
                    .planName(lic.getSubscriptionPlan() != null ? lic.getSubscriptionPlan().getName() : "STANDARD")
                    .status(lic.getStatus())
                    .validUntil(lic.getValidUntil())
                    .daysRemaining(daysRemaining)
                    .dunningStage(stage)
                    .lastNotifiedStage(lic.getLastNotifiedStage())
                    .lastNotifiedAt(lic.getLastNotifiedAt())
                    .billingContactEmail(resolveRecipientEmail(lic, org))
                    .billingContactPhone(resolveRecipientPhone(lic))
                    .build();
        }).toList();
    }

    /**
     * Melakukan pengiriman ulang secara manual atas notifikasi pengingat yang berstatus GAGAL (Super Admin).
     */
    @Transactional
    public LicenseNotificationLogDto retryFailedNotification(UUID logId, String actor) {
        LicenseNotificationLog oldLog = logRepository.findById(logId)
                .orElseThrow(() -> new java.util.NoSuchElementException("Notification log not found: " + logId));

        TenantLicense lic = oldLog.getLicense();
        if (lic == null) {
            throw new IllegalStateException("Cannot retry notification without associated license");
        }

        Organization org = lic.getOrganization();
        String orgName = org != null ? org.getName() : "Tenant FTTH";
        LicenseNotificationStage stage = oldLog.getStage() != null ? oldLog.getStage() : LicenseNotificationStage.MANUAL_REMINDER;

        if ("EMAIL".equalsIgnoreCase(oldLog.getChannel())) {
            String targetEmail = resolveRecipientEmail(lic, org);
            if (targetEmail != null && !targetEmail.isBlank()) {
                sendEmailNotification(lic, orgName, targetEmail, stage, "RETRY:" + actor);
            } else {
                throw new IllegalStateException("Recipient email not configured for organization");
            }
        } else if ("WHATSAPP".equalsIgnoreCase(oldLog.getChannel())) {
            String targetPhone = resolveRecipientPhone(lic);
            if (targetPhone != null && !targetPhone.isBlank()) {
                sendWhatsAppNotification(lic, orgName, targetPhone, stage, "RETRY:" + actor);
            } else {
                throw new IllegalStateException("Recipient phone not configured for organization");
            }
        } else {
            throw new IllegalArgumentException("Unsupported notification channel: " + oldLog.getChannel());
        }

        return logRepository.findAllByOrderBySentAtDesc().stream().findFirst().map(this::mapToDto).orElse(mapToDto(oldLog));
    }
}
