package com.company.ftthgis.service;

import com.company.ftthgis.domain.user.entity.User;
import com.company.ftthgis.domain.user.entity.UserDevice;
import com.company.ftthgis.domain.user.repository.UserDeviceRepository;
import com.company.ftthgis.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Optional;
import java.util.UUID;

/**
 * <h1>Device Verification & Session Tracking Service</h1>
 * <p>
 * Standardized in Phase 5E following the Google, GitHub, and Cloudflare architectural pattern:
 * <ul>
 *   <li>Authentication & MFA are 100% centralized in Keycloak (TOTP RFC 6238 & FIDO2 Passkeys).</li>
 *   <li>{@code user_devices} table serves as the authoritative active session & device inventory.</li>
 *   <li>New unrecognized devices trigger automated asynchronous Security Alert Notifications via Email and WhatsApp.</li>
 *   <li>Legacy custom in-memory OTP verification is deprecated and removed to eliminate attack surface.</li>
 * </ul>
 * </p>
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class DeviceVerificationService {

    private final UserDeviceRepository userDeviceRepository;
    private final UserRepository userRepository;
    private final WhatsAppService whatsAppService;
    private final SystemSettingService settingsService;
    private final EmailService emailService;

    private static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    /**
     * Checks if a device is registered and trusted for the specified user.
     */
    public boolean isDeviceVerified(UUID userId, String deviceFingerprint) {
        if (deviceFingerprint == null || deviceFingerprint.trim().isEmpty()) {
            return false;
        }

        return userDeviceRepository.findByUserIdAndDeviceFingerprint(userId, deviceFingerprint)
                .map(UserDevice::isVerified)
                .orElse(false);
    }

    /**
     * Records device activity. If the device is newly encountered for the user,
     * registers it and triggers an asynchronous New Device Security Alert Notification.
     */
    @Transactional
    public boolean recordDeviceActivity(UUID userId, String deviceFingerprint, String browser, String os, String ipAddress) {
        if (deviceFingerprint == null || deviceFingerprint.trim().isEmpty()) {
            return false;
        }

        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) {
            log.error("❌ User {} not found in system database when recording device", userId);
            return false;
        }

        User user = userOpt.get();
        Optional<UserDevice> existingOpt = userDeviceRepository.findByUserIdAndDeviceFingerprint(userId, deviceFingerprint);

        String cleanBrowser = (browser != null && !browser.isBlank()) ? browser : "Web Browser";
        String cleanOs = (os != null && !os.isBlank()) ? os : "Unknown OS";
        String cleanIp = (ipAddress != null && !ipAddress.isBlank()) ? ipAddress : "0.0.0.0";

        if (existingOpt.isPresent()) {
            UserDevice device = existingOpt.get();
            device.setVerified(true);
            device.setLastUsedAt(LocalDateTime.now());
            device.setIpAddress(cleanIp);
            device.setBrowser(cleanBrowser);
            device.setOs(cleanOs);
            userDeviceRepository.save(device);
            log.debug("🔄 Updated existing device activity for user {} / device {}", userId, deviceFingerprint);
            return true;
        }

        // Newly encountered device!
        UserDevice newDevice = UserDevice.builder()
                .user(user)
                .deviceFingerprint(deviceFingerprint)
                .browser(cleanBrowser)
                .os(cleanOs)
                .ipAddress(cleanIp)
                .verified(true)
                .createdAt(LocalDateTime.now())
                .lastUsedAt(LocalDateTime.now())
                .build();

        userDeviceRepository.save(newDevice);
        log.info("🛡️ New device registered for user {} [{} on {} from IP {}]", userId, cleanBrowser, cleanOs, cleanIp);

        // Dispatch asynchronous Security Alert Notification (Google / GitHub pattern)
        sendNewDeviceSecurityAlert(user, cleanBrowser, cleanOs, cleanIp);

        return true;
    }

    /**
     * Directly marks/records a device as trusted for a user.
     */
    @Transactional
    public boolean trustDeviceDirectly(UUID userId, String deviceFingerprint, String browser, String os, String ipAddress) {
        return recordDeviceActivity(userId, deviceFingerprint, browser, os, ipAddress);
    }

    /**
     * Sends a security alert notification to the user via Email and WhatsApp (if configured).
     */
    public void sendNewDeviceSecurityAlert(User user, String browser, String os, String ipAddress) {
        String formattedTime = LocalDateTime.now().format(TIME_FORMATTER);
        String userEmail = user.getEmail();
        String userPhone = user.getPhone();

        // 1. Send HTML Security Alert Email
        if (userEmail != null && !userEmail.isBlank()) {
            String subject = "Peringatan Keamanan K2NET: Deteksi Masuk dari Perangkat Baru";
            String emailBody = buildSecurityAlertEmailHtml(
                    user.getFullName() != null ? user.getFullName() : user.getUsername(),
                    browser, os, ipAddress, formattedTime
            );
            try {
                emailService.sendEmail(userEmail, subject, emailBody);
                log.info("📧 New device security alert email dispatched to {}", userEmail);
            } catch (Exception e) {
                log.warn("⚠️ Failed to dispatch security alert email to {}: {}", userEmail, e.getMessage());
            }
        }

        // 2. Send WhatsApp Security Alert Notification (if WhatsApp gateway enabled and phone configured)
        boolean waEnabled = settingsService.getSettingBoolean("wa_gateway_enabled", false);
        if (waEnabled && userPhone != null && !userPhone.isBlank()) {
            String waMessage = String.format(
                    "🛡️ *Peringatan Keamanan K2NET*\n\n" +
                    "Aktivitas masuk terdeteksi dari perangkat/peramban baru pada akun Anda (%s):\n" +
                    "• *Perangkat*: %s (%s)\n" +
                    "• *Alamat IP*: %s\n" +
                    "• *Waktu*: %s\n\n" +
                    "Jika ini adalah Anda, abaikan pesan ini. Jika Anda tidak mengenali aktivitas ini, segera amankan akun Anda dengan mencabut sesi di menu Preferensi Akun: https://gis.kdua.net/account/preferences",
                    user.getUsername(),
                    browser, os,
                    ipAddress,
                    formattedTime
            );
            try {
                whatsAppService.sendMessage(userPhone, waMessage);
                log.info("📱 New device security alert WhatsApp message dispatched to {}", userPhone);
            } catch (Exception e) {
                log.warn("⚠️ Failed to dispatch WhatsApp security alert to {}: {}", userPhone, e.getMessage());
            }
        }
    }

    private String buildSecurityAlertEmailHtml(String displayName, String browser, String os, String ipAddress, String timestamp) {
        return "<!DOCTYPE html>" +
                "<html><head><meta charset='UTF-8'></head>" +
                "<body style='font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; padding: 24px; color: #1e293b;'>" +
                "  <div style='max-width: 560px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);'>" +
                "    <div style='display: flex; align-items: center; gap: 8px; margin-bottom: 24px; border-bottom: 1px solid #f1f5f9; padding-bottom: 16px;'>" +
                "      <h2 style='font-size: 18px; font-weight: 700; color: #0f172a; margin: 0;'>🛡️ Peringatan Keamanan Akun K2NET</h2>" +
                "    </div>" +
                "    <p style='font-size: 14px; line-height: 1.5; color: #334155;'>Halo <strong>" + displayName + "</strong>,</p>" +
                "    <p style='font-size: 14px; line-height: 1.5; color: #334155;'>Kami mendeteksi aktivitas masuk dari peramban atau perangkat baru yang belum pernah digunakan sebelumnya:</p>" +
                "    <div style='background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 20px 0; font-size: 13px;'>" +
                "      <p style='margin: 4px 0;'><strong>Peramban / Browser:</strong> " + browser + "</p>" +
                "      <p style='margin: 4px 0;'><strong>Sistem Operasi:</strong> " + os + "</p>" +
                "      <p style='margin: 4px 0;'><strong>Alamat IP:</strong> <code style='background: #e2e8f0; padding: 2px 6px; border-radius: 4px; font-family: monospace;'>" + ipAddress + "</code></p>" +
                "      <p style='margin: 4px 0;'><strong>Waktu Deteksi:</strong> " + timestamp + "</p>" +
                "    </div>" +
                "    <p style='font-size: 13px; line-height: 1.5; color: #64748b;'>Jika aktivitas ini dilakukan oleh Anda, Anda dapat mengabaikan email ini. Perangkat tersebut telah ditambahkan ke daftar sesi aktif Anda.</p>" +
                "    <div style='margin-top: 24px; padding-top: 16px; border-top: 1px solid #f1f5f9;'>" +
                "      <p style='font-size: 12px; color: #e11d48; margin: 0 0 12px 0;'><strong>Bukan Anda?</strong> Amankan akun Anda segera:</p>" +
                "      <a href='https://gis.kdua.net/account/preferences' style='display: inline-block; background-color: #0f172a; color: #ffffff; text-decoration: none; font-size: 12px; font-weight: 600; padding: 8px 16px; border-radius: 6px;'>Cabut Akses Sesi di Preferensi Akun</a>" +
                "    </div>" +
                "  </div>" +
                "</body></html>";
    }

    /**
     * @deprecated Deprecated in Phase 5E. Authentication and MFA are 100% standardized on Keycloak Zero Trust (TOTP / Passkeys).
     */
    @Deprecated(since = "Phase 5E", forRemoval = true)
    public boolean requestOtp(UUID userId, String deviceFingerprint, String phoneNumber) {
        log.warn("⚠️ Legacy requestOtp called for user {}. Custom OTP is deprecated in favor of Keycloak TOTP/Passkeys.", userId);
        return false;
    }

    /**
     * @deprecated Deprecated in Phase 5E. Authentication and MFA are 100% standardized on Keycloak Zero Trust (TOTP / Passkeys).
     */
    @Deprecated(since = "Phase 5E", forRemoval = true)
    public boolean verifyOtp(UUID userId, String deviceFingerprint, String otpCode, String browser, String os, String ipAddress) {
        log.warn("⚠️ Legacy verifyOtp called for user {}. Custom OTP is deprecated in favor of Keycloak TOTP/Passkeys.", userId);
        return false;
    }
}
