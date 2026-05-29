package com.company.ftthgis.service;

import com.company.ftthgis.domain.user.entity.User;
import com.company.ftthgis.domain.user.entity.UserDevice;
import com.company.ftthgis.domain.user.repository.UserDeviceRepository;
import com.company.ftthgis.domain.user.repository.UserRepository;
import lombok.Builder;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.security.SecureRandom;

@Service
@RequiredArgsConstructor
@Slf4j
public class DeviceVerificationService {

    private final UserDeviceRepository userDeviceRepository;
    private final UserRepository userRepository;
    private final WhatsAppService whatsAppService;
    private final SystemSettingService settingsService;
    private final EmailService emailService;

    // Thread-safe map to store OTPs. Key: userId + "-" + fingerprint, Value: OtpDetails
    private final Map<String, OtpDetails> otpCache = new ConcurrentHashMap<>();
    private final SecureRandom random = new SecureRandom();

    @Getter
    @Builder
    private static class OtpDetails {
        private final String code;
        private final String phoneNumber;
        private final LocalDateTime expiryTime;
    }

    /**
     * Checks if a device fingerprint is verified for a user.
     */
    public boolean isDeviceVerified(UUID userId, String deviceFingerprint) {
        // If MFA is not globally enforced, we can bypass or require it
        boolean enforceMfa = settingsService.getSettingBoolean("enforce_mfa", false);
        boolean waOtpEnabled = settingsService.getSettingBoolean("wa_otp_enabled", false);
        
        if (!enforceMfa && !waOtpEnabled) {
            return true; // Bypass if security rules are off
        }

        return userDeviceRepository.findByUserIdAndDeviceFingerprint(userId, deviceFingerprint)
                .map(UserDevice::isVerified)
                .orElse(false);
    }

    /**
     * Generates and sends an OTP code for a new device (WhatsApp or Email).
     */
    public boolean requestOtp(UUID userId, String deviceFingerprint, String phoneNumber) {
        String cacheKey = userId.toString() + "-" + deviceFingerprint;
        
        // Generate 6-digit OTP code
        String otpCode = String.format("%06d", 100000 + random.nextInt(900000));
        LocalDateTime expiry = LocalDateTime.now().plusMinutes(5);

        otpCache.put(cacheKey, OtpDetails.builder()
                .code(otpCode)
                .phoneNumber(phoneNumber != null ? phoneNumber : "")
                .expiryTime(expiry)
                .build());

        log.info("🔑 Generated OTP {} for user {} / device {}", otpCode, userId, deviceFingerprint);

        // Retrieve user to check email
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) {
            log.error("❌ Cannot send OTP: User {} not found in system database!", userId);
            return false;
        }
        User user = userOpt.get();
        String userEmail = user.getEmail();

        boolean waOtpEnabled = settingsService.getSettingBoolean("wa_otp_enabled", false);

        // Check if we should send via WhatsApp
        if (waOtpEnabled && phoneNumber != null && !phoneNumber.trim().isEmpty()) {
            log.info("📱 Sending OTP to WhatsApp: {}", phoneNumber);
            return whatsAppService.sendOtp(phoneNumber, otpCode);
        } else {
            // Send via SMTP
            String subject = "Kode OTP Verifikasi Perangkat FTTH GIS";
            String body = String.format(
                    "<div style='font-family: sans-serif; padding: 20px; max-width: 600px; border: 1px solid #eee; border-radius: 8px;'>" +
                    "  <h2 style='color: #0f766e;'>Verifikasi 2 Langkah</h2>" +
                    "  <p>Kode OTP Anda untuk masuk ke sistem FTTH GIS adalah:</p>" +
                    "  <div style='background-color: #f0fdf4; border: 1px dashed #22c55e; padding: 15px; text-align: center; border-radius: 6px; margin: 20px 0;'>" +
                    "    <span style='font-size: 24px; font-weight: bold; color: #166534; letter-spacing: 2px;'>%s</span>" +
                    "  </div>" +
                    "  <p style='color: #666; font-size: 14px;'>Kode OTP ini hanya berlaku selama 5 menit. Jangan berikan kode ini kepada siapa pun.</p>" +
                    "</div>",
                    otpCode
            );
            
            log.info("📧 Sending OTP email to: {}", userEmail);
            boolean sent = emailService.sendEmail(userEmail, subject, body);
            if (!sent) {
                log.warn("⚠️ SMTP delivery failed, falling back to mock log print for recovery");
                log.info("To: {}", userEmail);
                log.info("OTP Code (Recovery): {}", otpCode);
            }
            return true;
        }
    }

    /**
     * Verifies the OTP code. If valid, registers the device as verified.
     */
    @Transactional
    public boolean verifyOtp(UUID userId, String deviceFingerprint, String otpCode, String browser, String os, String ipAddress) {
        String cacheKey = userId.toString() + "-" + deviceFingerprint;
        OtpDetails details = otpCache.get(cacheKey);

        if (details == null) {
            log.warn("❌ Verification failed: No OTP found for user {} / device {}", userId, deviceFingerprint);
            return false;
        }

        if (details.getExpiryTime().isBefore(LocalDateTime.now())) {
            log.warn("❌ Verification failed: OTP expired for user {} / device {}", userId, deviceFingerprint);
            otpCache.remove(cacheKey);
            return false;
        }

        if (!details.getCode().equals(otpCode)) {
            log.warn("❌ Verification failed: Incorrect OTP code for user {} / device {}", userId, deviceFingerprint);
            return false;
        }

        // OTP is correct! Clear from cache
        otpCache.remove(cacheKey);

        // Fetch User
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) {
            log.error("❌ User {} not found in system database!", userId);
            return false;
        }

        User user = userOpt.get();

        // Register/update the UserDevice
        Optional<UserDevice> deviceOpt = userDeviceRepository.findByUserIdAndDeviceFingerprint(userId, deviceFingerprint);
        UserDevice device;
        if (deviceOpt.isPresent()) {
            device = deviceOpt.get();
            device.setVerified(true);
            device.setLastUsedAt(LocalDateTime.now());
            device.setIpAddress(ipAddress);
            device.setBrowser(browser);
            device.setOs(os);
        } else {
            device = UserDevice.builder()
                    .user(user)
                    .deviceFingerprint(deviceFingerprint)
                    .browser(browser)
                    .os(os)
                    .ipAddress(ipAddress)
                    .verified(true)
                    .createdAt(LocalDateTime.now())
                    .lastUsedAt(LocalDateTime.now())
                    .build();
        }

        userDeviceRepository.save(device);
        log.info("✅ Device {} for User {} successfully verified and registered!", deviceFingerprint, userId);
        return true;
    }

    /**
     * Directly marks a device as trusted/verified for a user without checking OTP.
     */
    @Transactional
    public boolean trustDeviceDirectly(UUID userId, String deviceFingerprint, String browser, String os, String ipAddress) {
        // Fetch User
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) {
            log.error("❌ User {} not found in system database!", userId);
            return false;
        }

        User user = userOpt.get();

        // Register/update the UserDevice
        Optional<UserDevice> deviceOpt = userDeviceRepository.findByUserIdAndDeviceFingerprint(userId, deviceFingerprint);
        UserDevice device;
        if (deviceOpt.isPresent()) {
            device = deviceOpt.get();
            device.setVerified(true);
            device.setLastUsedAt(LocalDateTime.now());
            device.setIpAddress(ipAddress);
            device.setBrowser(browser);
            device.setOs(os);
        } else {
            device = UserDevice.builder()
                    .user(user)
                    .deviceFingerprint(deviceFingerprint)
                    .browser(browser)
                    .os(os)
                    .ipAddress(ipAddress)
                    .verified(true)
                    .createdAt(LocalDateTime.now())
                    .lastUsedAt(LocalDateTime.now())
                    .build();
        }

        userDeviceRepository.save(device);
        log.info("🛡️ Device {} for User {} trusted directly via local authentication bypass!", deviceFingerprint, userId);
        return true;
    }
}
