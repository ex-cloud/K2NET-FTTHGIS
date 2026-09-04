package com.company.ftthgis.api.system;

import com.company.ftthgis.domain.user.entity.UserDevice;
import com.company.ftthgis.domain.user.repository.UserDeviceRepository;
import com.company.ftthgis.service.DeviceVerificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/security/device")
@RequiredArgsConstructor
@Slf4j
@PreAuthorize("hasAuthority('system.security.manage')")
public class DeviceVerificationController {

    private final DeviceVerificationService deviceVerificationService;
    private final UserDeviceRepository userDeviceRepository;

    @GetMapping("/status")
    public ResponseEntity<?> getDeviceStatus(
            @AuthenticationPrincipal Jwt jwt,
            @RequestHeader(value = "X-Device-Fingerprint", required = false) String fingerprint) {
        
        if (fingerprint == null || fingerprint.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Header X-Device-Fingerprint is required"));
        }

        UUID userId = UUID.fromString(jwt.getSubject());
        boolean verified = deviceVerificationService.isDeviceVerified(userId, fingerprint);

        return ResponseEntity.ok(Map.of(
                "success", true,
                "verified", verified,
                "message", verified ? "Device is trusted" : "Verification required"
        ));
    }

    @PostMapping("/request-otp")
    public ResponseEntity<?> requestOtp(
            @AuthenticationPrincipal Jwt jwt,
            @RequestBody RequestOtpPayload payload) {
        
        if (payload.deviceFingerprint() == null || payload.deviceFingerprint().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "deviceFingerprint is required"));
        }

        UUID userId = UUID.fromString(jwt.getSubject());
        String phoneNumber = payload.phoneNumber();
        
        boolean sent = deviceVerificationService.requestOtp(userId, payload.deviceFingerprint(), phoneNumber);

        if (sent) {
            return ResponseEntity.ok(Map.of("success", true, "message", "OTP sent successfully"));
        } else {
            return ResponseEntity.internalServerError().body(Map.of("success", false, "message", "Failed to send OTP code"));
        }
    }

    @PostMapping("/verify")
    public ResponseEntity<?> verifyOtp(
            @AuthenticationPrincipal Jwt jwt,
            @RequestBody VerifyOtpPayload payload,
            HttpServletRequest request) {

        if (payload.deviceFingerprint() == null || payload.otpCode() == null) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "deviceFingerprint and otpCode are required"));
        }

        UUID userId = UUID.fromString(jwt.getSubject());
        String ipAddress = request.getRemoteAddr();

        boolean verified = deviceVerificationService.verifyOtp(
                userId,
                payload.deviceFingerprint(),
                payload.otpCode(),
                payload.browser() != null ? payload.browser() : "Unknown Browser",
                payload.os() != null ? payload.os() : "Unknown OS",
                ipAddress
        );

        if (verified) {
            return ResponseEntity.ok(Map.of("success", true, "message", "Device verified and registered as trusted."));
        } else {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Invalid or expired OTP code"));
        }
    }

    @GetMapping("/my-devices")
    public ResponseEntity<List<UserDeviceDto>> getMyDevices(@AuthenticationPrincipal Jwt jwt) {
        UUID userId = UUID.fromString(jwt.getSubject());
        List<UserDevice> devices = userDeviceRepository.findAllByUserId(userId);
        
        List<UserDeviceDto> dtos = devices.stream()
                .map(d -> new UserDeviceDto(
                        d.getId(),
                        d.getDeviceFingerprint(),
                        d.getBrowser(),
                        d.getOs(),
                        d.getIpAddress(),
                        d.isVerified(),
                        d.getLastUsedAt().toString(),
                        d.getCreatedAt().toString()
                ))
                .collect(Collectors.toList());

        return ResponseEntity.ok(dtos);
    }

    @DeleteMapping("/my-devices/{deviceId}")
    public ResponseEntity<?> revokeDevice(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable Long deviceId) {
        
        UUID userId = UUID.fromString(jwt.getSubject());
        return userDeviceRepository.findById(deviceId)
                .map(device -> {
                    if (!device.getUser().getId().equals(userId)) {
                        return ResponseEntity.status(403).body(Map.of("success", false, "message", "Unauthorized to revoke this device"));
                    }
                    userDeviceRepository.delete(device);
                    return ResponseEntity.ok(Map.of("success", true, "message", "Device untrusted and deleted successfully"));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/trust-current")
    public ResponseEntity<?> trustCurrentDevice(
            @AuthenticationPrincipal Jwt jwt,
            @RequestBody TrustDevicePayload payload,
            HttpServletRequest request) {

        if (payload.deviceFingerprint() == null || payload.deviceFingerprint().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "deviceFingerprint is required"));
        }

        UUID userId = UUID.fromString(jwt.getSubject());
        String ipAddress = request.getRemoteAddr();

        boolean verified = deviceVerificationService.trustDeviceDirectly(
                userId,
                payload.deviceFingerprint(),
                payload.browser() != null ? payload.browser() : "Unknown Browser",
                payload.os() != null ? payload.os() : "Unknown OS",
                ipAddress
        );

        if (verified) {
            return ResponseEntity.ok(Map.of("success", true, "message", "Perangkat berhasil diverifikasi dan ditambahkan ke daftar perangkat terpercaya."));
        } else {
            return ResponseEntity.internalServerError().body(Map.of("success", false, "message", "Gagal mendaftarkan perangkat terpercaya"));
        }
    }

    // --- Records ---
    public record RequestOtpPayload(String deviceFingerprint, String phoneNumber) {}
    public record VerifyOtpPayload(String deviceFingerprint, String otpCode, String browser, String os) {}
    public record TrustDevicePayload(String deviceFingerprint, String browser, String os) {}
    public record UserDeviceDto(
            Long id,
            String deviceFingerprint,
            String browser,
            String os,
            String ipAddress,
            boolean verified,
            String lastUsedAt,
            String createdAt
    ) {}
}
