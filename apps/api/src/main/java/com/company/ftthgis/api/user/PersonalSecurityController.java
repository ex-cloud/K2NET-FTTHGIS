package com.company.ftthgis.api.user;

import com.company.ftthgis.api.security.dto.EffectiveSecurityPolicyDto;
import com.company.ftthgis.api.system.DeviceVerificationController.TrustDevicePayload;
import com.company.ftthgis.api.system.DeviceVerificationController.UserDeviceDto;
import com.company.ftthgis.api.user.dto.PersonalSecuritySummaryDto;
import com.company.ftthgis.domain.user.entity.User;
import com.company.ftthgis.domain.user.entity.UserDevice;
import com.company.ftthgis.domain.user.entity.UserWebauthnCredential;
import com.company.ftthgis.domain.user.repository.UserDeviceRepository;
import com.company.ftthgis.domain.user.repository.UserRepository;
import com.company.ftthgis.domain.user.repository.UserWebauthnCredentialRepository;
import com.company.ftthgis.service.DeviceVerificationService;
import com.company.ftthgis.service.KeycloakAdminService;
import com.company.ftthgis.service.SecurityPolicyService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;
import java.time.OffsetDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

/**
 * <h1>Personal Caller Self-Service Security Controller</h1>
 * <p>
 * Canonical user-scoped security management under {@code /api/v1/me/...}.
 * Scoped strictly to the caller's JWT subject claim (Anti-IDOR).
 * </p>
 */
@RestController
@RequestMapping("/api/v1/me")
@RequiredArgsConstructor
@Slf4j
public class PersonalSecurityController {

    private final UserDeviceRepository userDeviceRepository;
    private final DeviceVerificationService deviceVerificationService;
    private final UserRepository userRepository;
    private final SecurityPolicyService securityPolicyService;
    private final KeycloakAdminService keycloakAdminService;
    private final UserWebauthnCredentialRepository userWebauthnCredentialRepository;
    private final Optional<StringRedisTemplate> redisTemplate;

    // Fallback challenge in-memory cache if Redis is not bound
    private static final Map<String, Long> challengeExpiryMap = new ConcurrentHashMap<>();
    private static final Map<String, String> challengeStore = new ConcurrentHashMap<>();

    @GetMapping("/devices")
    @PreAuthorize("isAuthenticated()")
    @org.springframework.transaction.annotation.Transactional
    public ResponseEntity<List<UserDeviceDto>> getDevices(
            @AuthenticationPrincipal Jwt jwt,
            HttpServletRequest request) {
        UUID userId = UUID.fromString(jwt.getSubject());
        List<UserDevice> devices = userDeviceRepository.findAllByUserId(userId);

        if (devices.isEmpty()) {
            // Auto-enroll active session device if user has none recorded
            String userAgent = request != null ? request.getHeader("User-Agent") : null;
            String ipAddress = request != null ? request.getHeader("X-Forwarded-For") : null;
            if (ipAddress == null || ipAddress.isBlank()) {
                ipAddress = request != null ? request.getRemoteAddr() : "127.0.0.1";
            } else if (ipAddress.contains(",")) {
                ipAddress = ipAddress.split(",")[0].trim();
            }

            String browser = "Current Web Browser";
            String os = "Current OS";
            if (userAgent != null) {
                if (userAgent.contains("Edg/")) browser = "Microsoft Edge";
                else if (userAgent.contains("Chrome/")) browser = "Google Chrome";
                else if (userAgent.contains("Firefox/")) browser = "Mozilla Firefox";
                else if (userAgent.contains("Safari/")) browser = "Apple Safari";

                if (userAgent.contains("Windows")) os = "Windows";
                else if (userAgent.contains("Macintosh")) os = "macOS";
                else if (userAgent.contains("Linux")) os = "Linux";
                else if (userAgent.contains("Android")) os = "Android";
                else if (userAgent.contains("iPhone") || userAgent.contains("iPad")) os = "iOS";
            }

            User user = userRepository.findById(userId).orElse(null);
            if (user != null) {
                String fingerprint = "session-" + UUID.randomUUID().toString().substring(0, 8);
                UserDevice activeDevice = UserDevice.builder()
                        .user(user)
                        .deviceFingerprint(fingerprint)
                        .browser(browser)
                        .os(os)
                        .ipAddress(ipAddress != null ? ipAddress : "127.0.0.1")
                        .verified(true)
                        .createdAt(java.time.LocalDateTime.now())
                        .lastUsedAt(java.time.LocalDateTime.now())
                        .build();
                userDeviceRepository.save(activeDevice);
                devices = List.of(activeDevice);
            }
        }

        List<UserDeviceDto> dtos = devices.stream()
                .map(d -> new UserDeviceDto(
                        d.getId(),
                        d.getDeviceFingerprint(),
                        d.getBrowser(),
                        d.getOs(),
                        d.getIpAddress(),
                        d.isVerified(),
                        d.getLastUsedAt() != null ? d.getLastUsedAt().toString() : "",
                        d.getCreatedAt() != null ? d.getCreatedAt().toString() : ""
                ))
                .collect(Collectors.toList());

        return ResponseEntity.ok(dtos);
    }

    public ResponseEntity<List<UserDeviceDto>> getDevices(Jwt jwt) {
        return getDevices(jwt, null);
    }

    @DeleteMapping("/devices/{deviceId}")
    @PreAuthorize("isAuthenticated()")
    @org.springframework.transaction.annotation.Transactional
    public ResponseEntity<?> revokeDevice(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable Long deviceId) {

        UUID userId = UUID.fromString(jwt.getSubject());
        return userDeviceRepository.findById(deviceId)
                .map(device -> {
                    if (!device.getUser().getId().equals(userId)) {
                        return ResponseEntity.status(403).body(Map.of(
                                "success", false,
                                "message", "Unauthorized to revoke this device"
                        ));
                    }
                    userDeviceRepository.delete(device);
                    log.info("🗑️ Caller {} untrusted and revoked device {}", userId, deviceId);
                    return ResponseEntity.ok(Map.of(
                            "success", true,
                            "message", "Device untrusted and deleted successfully"
                    ));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/devices/trust-current")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> trustCurrentDevice(
            @AuthenticationPrincipal Jwt jwt,
            @RequestBody TrustDevicePayload payload,
            HttpServletRequest request) {

        if (payload.deviceFingerprint() == null || payload.deviceFingerprint().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "deviceFingerprint is required"
            ));
        }

        UUID userId = UUID.fromString(jwt.getSubject());
        String ipAddress = request.getRemoteAddr();

        boolean verified = deviceVerificationService.trustDeviceDirectly(
                userId,
                payload.deviceFingerprint(),
                payload.browser() != null ? payload.browser() : "Current Browser",
                payload.os() != null ? payload.os() : "Current OS",
                ipAddress
        );

        if (verified) {
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Perangkat berhasil diverifikasi dan ditambahkan ke daftar perangkat terpercaya."
            ));
        } else {
            return ResponseEntity.internalServerError().body(Map.of(
                    "success", false,
                    "message", "Gagal mendaftarkan perangkat terpercaya"
            ));
        }
    }

    private String resolveRealmFromJwt(Jwt jwt) {
        if (jwt != null && jwt.getIssuer() != null) {
            String iss = jwt.getIssuer().toString();
            if (iss.endsWith("/realms/ftth-realm")) {
                return "ftth-realm";
            }
        }
        return "k2net-tenants";
    }

    @GetMapping("/security")
    @PreAuthorize("isAuthenticated()")
    @org.springframework.transaction.annotation.Transactional
    public ResponseEntity<PersonalSecuritySummaryDto> getSecuritySummary(@AuthenticationPrincipal Jwt jwt) {
        UUID userId = UUID.fromString(jwt.getSubject());
        User user = userRepository.findById(userId).orElse(null);

        String email = jwt.getClaimAsString("email");
        String username = jwt.getClaimAsString("preferred_username");
        String phone = user != null ? user.getPhone() : "";
        String targetRealm = resolveRealmFromJwt(jwt);

        // Resolve organization slug ("system" for platform internal staff, or tenant slug)
        String orgSlug = "system";
        if (user != null && user.getOrganization() != null) {
            orgSlug = user.getOrganization().getSlug();
        }

        EffectiveSecurityPolicyDto effectivePolicy = securityPolicyService.resolveEffectivePolicy(orgSlug);

        // Check Keycloak credentials live and registered WebAuthn passkeys
        String lookupIdentifier = (email != null && !email.isBlank()) ? email : (username != null && !username.isBlank() ? username : userId.toString());
        boolean hasKeycloakMfa = keycloakAdminService.hasMfaConfigured(targetRealm, lookupIdentifier);
        if (!hasKeycloakMfa && !lookupIdentifier.equals(userId.toString())) {
            hasKeycloakMfa = keycloakAdminService.hasMfaConfigured(targetRealm, userId.toString());
        }
        boolean hasWebauthnCreds = !userWebauthnCredentialRepository.findAllByUserId(userId).isEmpty();
        boolean totpActive = hasKeycloakMfa || (user != null && user.isMfaEnabled() && !hasWebauthnCreds);
        boolean mfaActive = (user != null && user.isMfaEnabled()) || hasKeycloakMfa || hasWebauthnCreds;

        if (user != null && (hasKeycloakMfa || hasWebauthnCreds) && !user.isMfaEnabled()) {
            user.setMfaEnabled(true);
            userRepository.save(user);
        }

        int devicesCount = userDeviceRepository.findAllByUserId(userId).size();

        // Linked social identities
        List<String> linkedProviders = new ArrayList<>();
        try {
            var identities = keycloakAdminService.getUserFederatedIdentities(targetRealm, userId.toString());
            for (var idp : identities) {
                linkedProviders.add(idp.getIdentityProvider());
            }
        } catch (Exception ignored) {}

        String fullName = user != null && user.getFullName() != null && !user.getFullName().isBlank()
                ? user.getFullName()
                : (jwt.getClaimAsString("name") != null ? jwt.getClaimAsString("name") : "");

        PersonalSecuritySummaryDto summary = PersonalSecuritySummaryDto.builder()
                .fullName(fullName)
                .email(email != null ? email : "")
                .username(username != null ? username : "")
                .phone(phone != null ? phone : "")
                .mfaEnabled(mfaActive)
                .totpEnabled(totpActive)
                .passkeyEnabled(hasWebauthnCreds)
                .mfaEnforced(effectivePolicy.isMfaRequired())
                .mfaEnforcementSource(effectivePolicy.getEffectiveSource())
                .trustedDevicesCount(devicesCount)
                .activeSessionsCount(1) // current session minimum
                .linkedProviders(linkedProviders)
                .build();

        return ResponseEntity.ok(summary);
    }

    public record TotpVerifyPayload(String secret, String code) {}

    @PostMapping("/mfa/totp/setup")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, String>> generateTotpSetup(@AuthenticationPrincipal Jwt jwt) {
        String email = jwt.getClaimAsString("email");
        String username = jwt.getClaimAsString("preferred_username");
        String accountLabel = (email != null && !email.isBlank()) ? email : (username != null ? username : jwt.getSubject());
        String issuer = "K2NET FTTH";

        String base32Secret = generateRandomBase32Secret(20);
        String formattedSecret = base32Secret.replaceAll("(.{4})", "$1 ").trim();
        String encodedIssuer = java.net.URLEncoder.encode(issuer, java.nio.charset.StandardCharsets.UTF_8).replace("+", "%20");
        // Keep account label unencoded for '@' per RFC 6238 & Google Authenticator URI specification
        String safeAccount = accountLabel.replace(":", "");

        String otpauthUri = String.format(
                "otpauth://totp/%s:%s?secret=%s&issuer=%s",
                encodedIssuer,
                safeAccount,
                base32Secret,
                encodedIssuer
        );

        return ResponseEntity.ok(Map.of(
                "secret", base32Secret,
                "formattedSecret", formattedSecret,
                "otpauthUri", otpauthUri,
                "accountName", accountLabel,
                "issuer", issuer
        ));
    }

    @PostMapping("/mfa/totp/verify")
    @PreAuthorize("isAuthenticated()")
    @org.springframework.transaction.annotation.Transactional
    public ResponseEntity<?> verifyAndActivateTotp(
            @AuthenticationPrincipal Jwt jwt,
            @RequestBody TotpVerifyPayload payload) {

        if (payload == null || payload.secret() == null || payload.secret().isBlank()
                || payload.code() == null || !payload.code().trim().matches("^[0-9]{6}$")) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Kode autentikator 6 digit dan kunci rahasia wajib diisi."
            ));
        }

        String cleanSecret = payload.secret().replaceAll("\\s+", "").toUpperCase(Locale.ROOT);
        String cleanCode = payload.code().trim();

        if (!verifyTotpCode(cleanSecret, cleanCode)) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Kode 6 digit tidak valid atau telah kedaluwarsa. Pastikan waktu perangkat Anda sinkron."
            ));
        }

        UUID userId = UUID.fromString(jwt.getSubject());
        String email = jwt.getClaimAsString("email");
        String username = jwt.getClaimAsString("preferred_username");
        String targetRealm = resolveRealmFromJwt(jwt);
        String lookupEmail = (email != null && !email.isBlank()) ? email : (username != null && !username.isBlank() ? username : userId.toString());

        keycloakAdminService.saveUserTotpSecret(targetRealm, lookupEmail, cleanSecret);

        userRepository.findById(userId).ifPresent(u -> {
            u.setMfaEnabled(true);
            userRepository.save(u);
        });

        log.info("🛡️ Caller {} activated TOTP 2FA in realm {}", lookupEmail, targetRealm);
        return ResponseEntity.ok(Map.of(
                "success", true,
                "mfaEnabled", true,
                "totpEnabled", true,
                "message", "Authenticator App (2FA/TOTP) berhasil diaktifkan."
        ));
    }

    @DeleteMapping("/mfa/totp")
    @PreAuthorize("isAuthenticated()")
    @org.springframework.transaction.annotation.Transactional
    public ResponseEntity<?> disableTotp(@AuthenticationPrincipal Jwt jwt) {
        UUID userId = UUID.fromString(jwt.getSubject());
        User user = userRepository.findById(userId).orElse(null);
        String orgSlug = (user != null && user.getOrganization() != null) ? user.getOrganization().getSlug() : "system";
        EffectiveSecurityPolicyDto effectivePolicy = securityPolicyService.resolveEffectivePolicy(orgSlug);

        if (effectivePolicy.isMfaRequired()) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Tidak dapat menonaktifkan 2FA karena organisasi atau platform mewajibkan MFA."
            ));
        }

        String email = jwt.getClaimAsString("email");
        String username = jwt.getClaimAsString("preferred_username");
        String targetRealm = resolveRealmFromJwt(jwt);
        String lookupEmail = (email != null && !email.isBlank()) ? email : (username != null && !username.isBlank() ? username : userId.toString());

        keycloakAdminService.disableUserTotp(targetRealm, lookupEmail);

        boolean hasRemainingPasskeys = !userWebauthnCredentialRepository.findAllByUserId(userId).isEmpty();
        if (user != null) {
            user.setMfaEnabled(hasRemainingPasskeys);
            userRepository.save(user);
        }

        return ResponseEntity.ok(Map.of(
                "success", true,
                "mfaEnabled", hasRemainingPasskeys,
                "totpEnabled", false,
                "message", "Authenticator App (2FA/TOTP) berhasil dinonaktifkan."
        ));
    }

    // =========================================================================
    // WebAuthn / FIDO2 Passkeys Self-Service Endpoints
    // =========================================================================

    public record WebauthnCredentialDto(
            UUID id,
            String credentialId,
            String deviceName,
            Integer algorithm,
            Long signCounter,
            String createdAt,
            String lastUsedAt
    ) {}

    @GetMapping("/webauthn/credentials")
    @PreAuthorize("isAuthenticated()")
    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public ResponseEntity<List<WebauthnCredentialDto>> getWebauthnCredentials(@AuthenticationPrincipal Jwt jwt) {
        UUID userId = UUID.fromString(jwt.getSubject());
        List<UserWebauthnCredential> creds = userWebauthnCredentialRepository.findAllByUserId(userId);
        List<WebauthnCredentialDto> dtos = creds.stream()
                .map(c -> new WebauthnCredentialDto(
                        c.getId(),
                        c.getCredentialId(),
                        c.getDeviceName(),
                        c.getAlgorithm(),
                        c.getSignCounter(),
                        c.getCreatedAt() != null ? c.getCreatedAt().toString() : "",
                        c.getLastUsedAt() != null ? c.getLastUsedAt().toString() : ""
                ))
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    @PostMapping("/webauthn/register/challenge")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Object>> getWebauthnRegisterChallenge(
            @AuthenticationPrincipal Jwt jwt,
            HttpServletRequest request) {

        UUID userId = UUID.fromString(jwt.getSubject());
        byte[] challengeBytes = new byte[32];
        new java.security.SecureRandom().nextBytes(challengeBytes);
        String challengeStr = Base64.getUrlEncoder().withoutPadding().encodeToString(challengeBytes);

        String cacheKey = "auth:webauthn-reg-challenge:" + userId;
        if (redisTemplate.isPresent()) {
            redisTemplate.get().opsForValue().set(cacheKey, challengeStr, Duration.ofMinutes(2));
        } else {
            challengeStore.put(cacheKey, challengeStr);
            challengeExpiryMap.put(cacheKey, System.currentTimeMillis() + 120_000L);
        }

        String host = request.getHeader("Host");
        String rpId = (host != null && host.contains("localhost")) ? "localhost" : "kdua.net";
        String email = jwt.getClaimAsString("email");
        String username = jwt.getClaimAsString("preferred_username");
        String displayName = (email != null && !email.isBlank()) ? email : (username != null ? username : jwt.getSubject());

        return ResponseEntity.ok(Map.of(
                "challenge", challengeStr,
                "rp", Map.of("id", rpId, "name", "K2NET FTTH GIS"),
                "user", Map.of(
                        "id", Base64.getUrlEncoder().withoutPadding().encodeToString(userId.toString().getBytes(java.nio.charset.StandardCharsets.UTF_8)),
                        "name", displayName,
                        "displayName", displayName
                ),
                "pubKeyCredParams", List.of(
                        Map.of("type", "public-key", "alg", -7),  // ES256
                        Map.of("type", "public-key", "alg", -257) // RS256
                ),
                "timeout", 60000,
                "attestation", "none"
        ));
    }

    public record WebauthnRegisterVerifyPayload(
            String credentialId,
            String clientDataJSON,
            String attestationObject,
            String deviceName
    ) {}

    @PostMapping("/webauthn/register/verify")
    @PreAuthorize("isAuthenticated()")
    @org.springframework.transaction.annotation.Transactional
    public ResponseEntity<?> verifyWebauthnRegister(
            @AuthenticationPrincipal Jwt jwt,
            @RequestBody WebauthnRegisterVerifyPayload payload) {

        if (payload == null || payload.credentialId() == null || payload.credentialId().isBlank()
                || payload.clientDataJSON() == null || payload.clientDataJSON().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Payload pendaftaran Passkey tidak lengkap."
            ));
        }

        UUID userId = UUID.fromString(jwt.getSubject());
        String cacheKey = "auth:webauthn-reg-challenge:" + userId;
        String expectedChallenge = null;

        if (redisTemplate.isPresent()) {
            expectedChallenge = redisTemplate.get().opsForValue().get(cacheKey);
            redisTemplate.get().delete(cacheKey);
        } else {
            Long expiry = challengeExpiryMap.get(cacheKey);
            if (expiry != null && System.currentTimeMillis() < expiry) {
                expectedChallenge = challengeStore.remove(cacheKey);
            }
            challengeExpiryMap.remove(cacheKey);
        }

        if (expectedChallenge == null || expectedChallenge.isBlank()) {
            return ResponseEntity.status(401).body(Map.of(
                    "success", false,
                    "message", "Sesi challenge pendaftaran telah kedaluwarsa. Silakan coba lagi."
            ));
        }

        // Validate clientDataJSON challenge match
        try {
            byte[] clientDataBytes = Base64.getUrlDecoder().decode(payload.clientDataJSON());
            String clientDataStr = new String(clientDataBytes, java.nio.charset.StandardCharsets.UTF_8);
            if (!clientDataStr.contains(expectedChallenge)) {
                return ResponseEntity.badRequest().body(Map.of(
                        "success", false,
                        "message", "Challenge pendaftaran biometrik tidak cocok."
                ));
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Format clientDataJSON tidak valid."
            ));
        }

        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            return ResponseEntity.status(404).body(Map.of("success", false, "message", "User tidak ditemukan"));
        }

        String rawCredId = payload.credentialId().trim();
        String deviceName = (payload.deviceName() != null && !payload.deviceName().isBlank())
                ? payload.deviceName().trim()
                : "Passkey Security Key";

        var existingOpt = userWebauthnCredentialRepository.findByCredentialId(rawCredId);
        if (existingOpt.isPresent()) {
            UserWebauthnCredential existing = existingOpt.get();
            existing.setDeviceName(deviceName);
            existing.setLastUsedAt(OffsetDateTime.now());
            if (existing.getTransports() == null || existing.getTransports().isBlank()) {
                existing.setTransports("[\"internal\",\"hybrid\"]");
            }
            userWebauthnCredentialRepository.save(existing);
        } else {
            UserWebauthnCredential credential = UserWebauthnCredential.builder()
                    .user(user)
                    .credentialId(rawCredId)
                    .publicKeyCose(payload.attestationObject() != null ? payload.attestationObject() : rawCredId)
                    .algorithm(-7)
                    .signCounter(0L)
                    .deviceName(deviceName)
                    .transports("[\"internal\",\"hybrid\"]")
                    .lastUsedAt(OffsetDateTime.now())
                    .build();
            userWebauthnCredentialRepository.save(credential);
        }

        user.setMfaEnabled(true);
        userRepository.save(user);

        log.info("✅ WebAuthn Passkey '{}' registered successfully for user '{}' ({})",
                deviceName, user.getEmail(), user.getId());

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Passkey / Kunci Keamanan berhasil didaftarkan.",
                "credentialId", rawCredId,
                "deviceName", deviceName
        ));
    }

    @DeleteMapping("/webauthn/credentials/{credentialId}")
    @PreAuthorize("isAuthenticated()")
    @org.springframework.transaction.annotation.Transactional
    public ResponseEntity<?> deleteWebauthnCredential(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable String credentialId) {

        UUID userId = UUID.fromString(jwt.getSubject());
        var opt = userWebauthnCredentialRepository.findByCredentialId(credentialId);
        if (opt.isEmpty() || !opt.get().getUser().getId().equals(userId)) {
            return ResponseEntity.status(404).body(Map.of(
                    "success", false,
                    "message", "Kredensial Passkey tidak ditemukan atau tidak memiliki hak akses."
            ));
        }

        userWebauthnCredentialRepository.delete(opt.get());

        // Check if any MFA remains
        List<UserWebauthnCredential> remaining = userWebauthnCredentialRepository.findAllByUserId(userId);
        String targetRealm = resolveRealmFromJwt(jwt);
        String email = jwt.getClaimAsString("email");
        String username = jwt.getClaimAsString("preferred_username");
        boolean hasKeycloakMfa = keycloakAdminService.hasMfaConfigured(targetRealm, email != null ? email : username);

        User user = userRepository.findById(userId).orElse(null);
        if (remaining.isEmpty() && !hasKeycloakMfa && user != null) {
            user.setMfaEnabled(false);
            userRepository.save(user);
        }

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Kredensial Passkey berhasil dihapus."
        ));
    }

    private static final String BASE32_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

    private static String generateRandomBase32Secret(int byteLength) {
        byte[] bytes = new byte[byteLength];
        new java.security.SecureRandom().nextBytes(bytes);
        StringBuilder sb = new StringBuilder((byteLength * 8 + 4) / 5);
        int buffer = bytes[0] & 0xFF;
        int next = 1;
        int bitsLeft = 8;
        while (bitsLeft > 0 || next < bytes.length) {
            if (bitsLeft < 5) {
                if (next < bytes.length) {
                    buffer <<= 8;
                    buffer |= (bytes[next++] & 0xFF);
                    bitsLeft += 8;
                } else {
                    int pad = 5 - bitsLeft;
                    buffer <<= pad;
                    bitsLeft += pad;
                }
            }
            int index = 0x1F & (buffer >> (bitsLeft - 5));
            bitsLeft -= 5;
            sb.append(BASE32_CHARS.charAt(index));
        }
        return sb.toString();
    }

    private static byte[] decodeBase32(String base32) {
        String clean = base32.replaceAll("[=\\s]", "").toUpperCase(Locale.ROOT);
        int outLength = clean.length() * 5 / 8;
        byte[] result = new byte[outLength];
        int buffer = 0;
        int bitsLeft = 0;
        int count = 0;
        for (int i = 0; i < clean.length(); i++) {
            int val = BASE32_CHARS.indexOf(clean.charAt(i));
            if (val < 0) continue;
            buffer <<= 5;
            buffer |= val & 0x1F;
            bitsLeft += 5;
            if (bitsLeft >= 8) {
                result[count++] = (byte) ((buffer >> (bitsLeft - 8)) & 0xFF);
                bitsLeft -= 8;
            }
        }
        return result;
    }

    public static boolean verifyTotpCode(String base32Secret, String code) {
        try {
            byte[] keyBytes = decodeBase32(base32Secret);
            long currentWindow = System.currentTimeMillis() / 1000L / 30L;
            for (long offset = -1; offset <= 1; offset++) {
                String candidate = generateTotpAtWindow(keyBytes, currentWindow + offset);
                if (candidate.equals(code)) {
                    return true;
                }
            }
            return false;
        } catch (Exception e) {
            return false;
        }
    }

    private static String generateTotpAtWindow(byte[] key, long window) throws Exception {
        byte[] data = new byte[8];
        long value = window;
        for (int i = 7; i >= 0; i--) {
            data[i] = (byte) (value & 0xFF);
            value >>= 8;
        }
        javax.crypto.Mac mac = javax.crypto.Mac.getInstance("HmacSHA1");
        mac.init(new javax.crypto.spec.SecretKeySpec(key, "HmacSHA1"));
        byte[] hash = mac.doFinal(data);
        int offset = hash[hash.length - 1] & 0x0F;
        int binary = ((hash[offset] & 0x7F) << 24)
                | ((hash[offset + 1] & 0xFF) << 16)
                | ((hash[offset + 2] & 0xFF) << 8)
                | (hash[offset + 3] & 0xFF);
        int otp = binary % 1_000_000;
        return String.format("%06d", otp);
    }
}

