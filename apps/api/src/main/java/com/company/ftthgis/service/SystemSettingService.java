package com.company.ftthgis.service;

import com.company.ftthgis.domain.common.SystemSetting;
import com.company.ftthgis.domain.common.repository.SystemSettingRepository;
import com.company.ftthgis.domain.tenant.repository.OrganizationRepository;
import com.company.ftthgis.config.logging.AuditRequired;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.annotation.PostConstruct;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.io.PrintWriter;
import java.net.Socket;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.concurrent.CompletableFuture;

@Service
@RequiredArgsConstructor
@Slf4j
public class SystemSettingService {

    private final SystemSettingRepository settingRepository;
    private final KeycloakAdminService keycloakAdminService;
    private final OrganizationRepository organizationRepository;
    private final com.company.ftthgis.util.SecretEncryptionUtil encryptionUtil;
    private final ObjectMapper objectMapper;

    @Value("${app.gateway.notification-url:http://ftth-notification-gateway:5001}")
    private String notificationGatewayUrl = "http://ftth-notification-gateway:5001";

    @Value("${app.gateway.token:}")
    private String gatewayToken = "";

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(5))
            .build();

    public static final java.util.Set<String> SENSITIVE_KEYS = java.util.Set.of(
            "smtp_password",
            "wa_gateway_token"
    );

    public static boolean isSensitiveKey(String key) {
        if (key == null) return false;
        String lower = key.toLowerCase();
        return SENSITIVE_KEYS.contains(lower)
                || (lower.endsWith("_password") && !lower.startsWith("password_"))
                || lower.endsWith("_secret")
                || (lower.endsWith("_token") && !lower.contains("duration") && !lower.contains("ttl"));
    }

    @PostConstruct
    public void initDefaultSettings() {
        log.info("⚙️ Initializing Default System Settings...");
        
        Map<String, String[]> defaults = new HashMap<>();
        // GENERAL
        defaults.put("default_storage_quota", new String[]{"10", "GENERAL", "Default storage quota per organization in Gigabytes (GB)"});
        defaults.put("system_maintenance_mode", new String[]{"false", "GENERAL", "Enables or disables platform-wide maintenance mode"});
        
        // SMTP
        defaults.put("smtp_host", new String[]{"mail.kdua.net", "SMTP", "SMTP outgoing mail server host"});
        defaults.put("smtp_port", new String[]{"587", "SMTP", "SMTP outgoing mail server port"});
        defaults.put("smtp_username", new String[]{"notify@kdua.net", "SMTP", "SMTP username"});
        defaults.put("smtp_password", new String[]{"smtp_pass", "SMTP", "SMTP password"});
        defaults.put("smtp_from", new String[]{"notify@kdua.net", "SMTP", "Sender address for system notifications"});
        
        // SECURITY
        defaults.put("allow_self_registration", new String[]{"false", "SECURITY", "Enables or disables global self-registration for new users"});
        defaults.put("enforce_mfa", new String[]{"false", "SECURITY", "Forces all global and tenant users to set up 2FA/MFA"});
        defaults.put("device_verification_enabled", new String[]{"false", "SECURITY", "Enables step-up device verification with OTP for unrecognized browser/hardware fingerprints"});
        defaults.put("session_idle_timeout", new String[]{"30", "SECURITY", "Idle timeout in minutes before user session is auto-locked or logged out"});
        defaults.put("map_auto_lock_duration", new String[]{"10", "SECURITY", "Inactive duration in minutes before mapping canvas is auto-locked for security"});
        defaults.put("password_min_length", new String[]{"8", "SECURITY", "Minimum password length requirement"});
        defaults.put("password_require_symbols", new String[]{"true", "SECURITY", "Require at least one special character"});
        defaults.put("password_require_numbers", new String[]{"true", "SECURITY", "Require at least one numeric digit"});
        defaults.put("password_require_uppercase", new String[]{"true", "SECURITY", "Require at least one uppercase letter"});
        defaults.put("password_history_limit", new String[]{"3", "SECURITY", "Number of unique previous passwords to remember"});
        defaults.put("password_expiry_days", new String[]{"90", "SECURITY", "Password validity duration in days"});

        // COMMUNICATIONS
        defaults.put("wa_gateway_enabled", new String[]{"false", "COMMUNICATIONS", "Enables or disables WhatsApp notification gateway integration"});
        defaults.put("wa_gateway_api_url", new String[]{"https://api.whatsapp-gateway.com/send", "COMMUNICATIONS", "Base API endpoint for sending WhatsApp messages"});
        defaults.put("wa_gateway_token", new String[]{"token_secret_placeholder", "COMMUNICATIONS", "Secret token/credential key for WhatsApp Notification Gateway authorization"});
        defaults.put("wa_otp_enabled", new String[]{"false", "COMMUNICATIONS", "Enables global WhatsApp OTP multi-factor authentication check upon login"});

        // GIS
        defaults.put("default_map_lat", new String[]{"-6.9175", "GIS", "Default center Latitude of the GIS Map"});
        defaults.put("default_map_lng", new String[]{"107.6191", "GIS", "Default center Longitude of the GIS Map"});
        defaults.put("default_map_zoom", new String[]{"12", "GIS", "Default zoom level of the GIS Map (typically 5 to 20)"});
        defaults.put("default_map_address", new String[]{"Kebon Pisang, Sumur Bandung, Bandung City, West Java", "GIS", "Default address corresponding to the center coordinates"});
        defaults.put("vector_tile_source", new String[]{"http://localhost:3001/tiles/{z}/{x}/{y}.pbf", "GIS", "URL vector tile template source for GIS Mapbox/Maplibre"});

        // BRANDING
        defaults.put("app_name", new String[]{"FTTH GIS Platform", "BRANDING", "Global branding application title"});
        defaults.put("logo_url", new String[]{"/next.svg", "BRANDING", "Global platform logo URL or path"});

        for (Map.Entry<String, String[]> entry : defaults.entrySet()) {
            String key = entry.getKey();
            if (!settingRepository.existsById(key)) {
                String[] details = entry.getValue();
                String rawVal = details[0];
                String storedVal = isSensitiveKey(key) ? encryptionUtil.encrypt(rawVal) : rawVal;
                SystemSetting setting = SystemSetting.builder()
                        .key(key)
                        .value(storedVal)
                        .category(details[1])
                        .description(details[2])
                        .build();
                settingRepository.save(setting);
                log.info("Saved default setting: {} -> [stored]", key);
            }
        }

        // P0 Security: One-time migration to encrypt existing plaintext secrets
        migratePlaintextSecrets();
    }

    private void migratePlaintextSecrets() {
        for (String sensitiveKey : SENSITIVE_KEYS) {
            settingRepository.findById(sensitiveKey).ifPresent(setting -> {
                String val = setting.getValue();
                if (val != null && !val.isBlank()) {
                    try {
                        encryptionUtil.decrypt(val);
                        // Already encrypted!
                    } catch (Exception e) {
                        log.info("🔒 One-time AES-256-GCM encrypting plaintext system setting: {}", sensitiveKey);
                        setting.setValue(encryptionUtil.encrypt(val));
                        settingRepository.save(setting);
                    }
                }
            });
        }
    }

    public List<SystemSetting> getAllSettings() {
        return settingRepository.findAll().stream()
                .map(setting -> {
                    if (isSensitiveKey(setting.getKey()) && setting.getValue() != null && !setting.getValue().isBlank()) {
                        return SystemSetting.builder()
                                .key(setting.getKey())
                                .value("********")
                                .category(setting.getCategory())
                                .description(setting.getDescription())
                                .createdAt(setting.getCreatedAt())
                                .createdBy(setting.getCreatedBy())
                                .updatedAt(setting.getUpdatedAt())
                                .updatedBy(setting.getUpdatedBy())
                                .build();
                    }
                    return setting;
                })
                .toList();
    }

    @Transactional
    @AuditRequired(action = "GLOBAL_SETTINGS_UPDATED", resourceType = "SYSTEM_SETTING")
    public List<SystemSetting> updateSettings(Map<String, String> newSettings) {
        log.info("⚙️ Updating system settings: {}", newSettings.keySet());
        boolean passwordPoliciesChanged = false;
        boolean smtpChanged = false;
        boolean sessionIdleTimeoutChanged = false;
        for (Map.Entry<String, String> entry : newSettings.entrySet()) {
            String key = entry.getKey();
            String value = entry.getValue();

            // P0 Security: Do not overwrite secret if mask placeholder or empty
            if (isSensitiveKey(key) && (value == null || value.isBlank() || "********".equals(value))) {
                log.debug("Preserving existing encrypted secret for key: {}", key);
                continue;
            }

            if (key.startsWith("password_")) {
                passwordPoliciesChanged = true;
            }
            if (key.startsWith("smtp_")) {
                smtpChanged = true;
            }
            if (key.equals("session_idle_timeout")) {
                sessionIdleTimeoutChanged = true;
            }

            SystemSetting setting = settingRepository.findById(key)
                    .orElseGet(() -> SystemSetting.builder()
                            .key(key)
                            .category(determineCategory(key))
                            .description("Dynamically updated system setting")
                            .build());

            if (isSensitiveKey(key)) {
                setting.setValue(encryptionUtil.encrypt(value));
            } else {
                setting.setValue(value);
            }
            settingRepository.save(setting);
        }
        if (passwordPoliciesChanged) {
            syncPasswordPoliciesToKeycloak();
        }
        if (smtpChanged) {
            syncSmtpToKeycloakAndGateways();
        }
        if (sessionIdleTimeoutChanged) {
            syncSessionIdleTimeoutToKeycloak();
        }
        return getAllSettings();
    }

    private String determineCategory(String key) {
        if (key == null) return "GENERAL";
        String lower = key.toLowerCase();
        if (lower.startsWith("wa_")) return "COMMUNICATIONS";
        if (lower.startsWith("smtp_")) return "SMTP";
        if (lower.startsWith("brand_") || lower.equals("app_name") || lower.equals("logo_url") || lower.equals("footer_copyright")) return "BRANDING";
        if (lower.startsWith("default_map_") || lower.equals("vector_tile_source")) return "GIS";
        if (lower.startsWith("password_") || lower.equals("enforce_mfa") || lower.equals("device_verification_enabled") || lower.equals("allow_self_registration") || lower.equals("session_idle_timeout") || lower.equals("map_auto_lock_duration")) return "SECURITY";
        return "GENERAL";
    }

    private void syncPasswordPoliciesToKeycloak() {
        try {
            int minLength = Integer.parseInt(getSettingValue("password_min_length", "8"));
            boolean requireSymbols = "true".equalsIgnoreCase(getSettingValue("password_require_symbols", "true"));
            boolean requireNumbers = "true".equalsIgnoreCase(getSettingValue("password_require_numbers", "true"));
            boolean requireUppercase = "true".equalsIgnoreCase(getSettingValue("password_require_uppercase", "true"));
            int historyLimit = Integer.parseInt(getSettingValue("password_history_limit", "3"));
            int expiryDays = Integer.parseInt(getSettingValue("password_expiry_days", "90"));

            StringBuilder sb = new StringBuilder();
            sb.append("length(").append(minLength).append(")");
            
            if (requireNumbers) {
                sb.append(" and digits(1)");
            }
            if (requireUppercase) {
                sb.append(" and upperCase(1)");
            }
            if (requireSymbols) {
                sb.append(" and specialChars(1)");
            }
            if (historyLimit > 0) {
                sb.append(" and passwordHistory(").append(historyLimit).append(")");
            }
            if (expiryDays > 0) {
                sb.append(" and forceExpiredPasswordChange(").append(expiryDays).append(")");
            }

            String policyString = sb.toString();
            log.info("🔄 Triggering Keycloak sync for all realms with policy: {}", policyString);
            
            // Sync default realm
            keycloakAdminService.syncPasswordPolicyToRealm("ftth-realm", policyString);
            
            // Sync consolidated tenant realm
            keycloakAdminService.syncPasswordPolicyToRealm("k2net-tenants", policyString);
            
            // Sync any dedicated organization realms (if any)
            try {
                List<String> slugs = organizationRepository.findAllSlugs();
                for (String slug : slugs) {
                    if (!"ftth-realm".equals(slug) && !"ex-cloud-org".equals(slug) && !"system".equals(slug)) {
                        keycloakAdminService.syncPasswordPolicyToRealm(slug, policyString);
                    }
                }
            } catch (Exception e) {
                log.error("Failed to sync password policy to organization realms: {}", e.getMessage());
            }
        } catch (Exception e) {
            log.error("Failed to compile or sync password policy: {}", e.getMessage(), e);
        }
    }

    private void syncSmtpToKeycloakAndGateways() {
        try {
            String host = getSettingValue("smtp_host", "mail.kdua.net");
            String port = getSettingValue("smtp_port", "587");
            String username = getSettingValue("smtp_username", "notify@kdua.net");
            String password = getSettingValue("smtp_password", "");
            String from = getSettingValue("smtp_from", "notify@kdua.net");
            boolean isSsl = "465".equals(port);

            log.info("🔄 Triggering unified SMTP synchronization across Keycloak IAM and Notification Gateway ({}:{})...", host, port);

            // 1. Sync to Keycloak Realms
            Map<String, String> keycloakSmtp = new HashMap<>();
            keycloakSmtp.put("host", host);
            keycloakSmtp.put("port", port);
            keycloakSmtp.put("user", username);
            keycloakSmtp.put("password", password);
            keycloakSmtp.put("from", from);
            keycloakSmtp.put("auth", "true");
            keycloakSmtp.put("starttls", isSsl ? "false" : "true");
            keycloakSmtp.put("ssl", isSsl ? "true" : "false");
            keycloakSmtp.put("fromDisplayName", "FTTH GIS Platform");

            keycloakAdminService.syncSmtpServerToRealm("ftth-realm", keycloakSmtp);
            keycloakAdminService.syncSmtpServerToRealm("k2net-tenants", keycloakSmtp);

            try {
                List<String> slugs = organizationRepository.findAllSlugs();
                for (String slug : slugs) {
                    if (!"ftth-realm".equals(slug) && !"ex-cloud-org".equals(slug) && !"system".equals(slug)) {
                        keycloakAdminService.syncSmtpServerToRealm(slug, keycloakSmtp);
                    }
                }
            } catch (Exception e) {
                log.warn("Non-fatal: Could not sync SMTP to dedicated organization realms: {}", e.getMessage());
            }

            // 2. Sync to Go notification-gateway asynchronously
            CompletableFuture.runAsync(() -> {
                try {
                    String endpoint = notificationGatewayUrl + "/api/v1/config";
                    Map<String, Object> payload = Map.of(
                            "updates", Map.of(
                                    "SMTP_HOST", host,
                                    "SMTP_PORT", port,
                                    "SMTP_USER", username,
                                    "SMTP_PASSWORD", password,
                                    "SMTP_FROM", from,
                                    "SMTP_SECURE", isSsl ? "true" : "false"
                            )
                    );
                    String jsonBody = objectMapper.writeValueAsString(payload);
                    HttpRequest req = HttpRequest.newBuilder()
                            .uri(URI.create(endpoint))
                            .header("Content-Type", "application/json")
                            .header("X-Gateway-Token", gatewayToken != null ? gatewayToken : "")
                            .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
                            .timeout(Duration.ofSeconds(5))
                            .build();

                    HttpResponse<String> resp = httpClient.send(req, HttpResponse.BodyHandlers.ofString());
                    if (resp.statusCode() >= 200 && resp.statusCode() < 300) {
                        log.info("✅ SMTP configuration synced successfully to notification-gateway");
                    } else {
                        log.warn("⚠️ notification-gateway /api/v1/config returned HTTP {}: {}", resp.statusCode(), resp.body());
                    }
                } catch (Exception ex) {
                    log.error("Non-fatal: Failed syncing SMTP configuration to notification-gateway: {}", ex.getMessage());
                }
            });

        } catch (Exception e) {
            log.error("Failed unified SMTP synchronization: {}", e.getMessage(), e);
        }
    }

    private void syncSessionIdleTimeoutToKeycloak() {
        try {
            int minutes = Integer.parseInt(getSettingValue("session_idle_timeout", "30"));
            int seconds = Math.max(minutes, 5) * 60;
            log.info("🔄 Triggering Keycloak session idle timeout sync for all realms: {} seconds ({}m)", seconds, minutes);
            keycloakAdminService.syncSessionIdleTimeoutToRealm("ftth-realm", seconds);
            keycloakAdminService.syncSessionIdleTimeoutToRealm("k2net-tenants", seconds);
            try {
                List<String> slugs = organizationRepository.findAllSlugs();
                for (String slug : slugs) {
                    if (!"ftth-realm".equals(slug) && !"ex-cloud-org".equals(slug) && !"system".equals(slug)) {
                        keycloakAdminService.syncSessionIdleTimeoutToRealm(slug, seconds);
                    }
                }
            } catch (Exception e) {
                log.warn("Non-fatal: Could not sync session idle timeout to dedicated organization realms: {}", e.getMessage());
            }
        } catch (Exception e) {
            log.warn("Could not sync session idle timeout to Keycloak realms: {}", e.getMessage());
        }
    }

    public void testSmtpConnection(String host, int port, String username, String password) throws Exception {
        log.info("📧 Testing SMTP Connection to {}:{}...", host, port);
        try (Socket socket = new Socket(host, port);
             BufferedReader reader = new BufferedReader(new InputStreamReader(socket.getInputStream()));
             PrintWriter writer = new PrintWriter(new OutputStreamWriter(socket.getOutputStream()), true)) {
            
            socket.setSoTimeout(5000); // 5 seconds timeout
            
            // 1. Read Greeting
            String line = reader.readLine();
            if (line == null || !line.startsWith("220")) {
                throw new Exception("Invalid greeting from SMTP server: " + (line != null ? line : "No response"));
            }
            
            // 2. Send HELO
            writer.println("HELO localhost");
            line = reader.readLine();
            if (line == null || !line.startsWith("250")) {
                throw new Exception("HELO failed: " + (line != null ? line : "No response"));
            }

            // 3. Connection is reachable and responded to HELO
            log.info("✅ SMTP Connection test to {}:{} succeeded!", host, port);
        }
    }

    public String getSettingValue(String key) {
        return getSettingValue(key, "");
    }

    public String getSettingValue(String key, String defaultValue) {
        return settingRepository.findById(key)
                .map(setting -> {
                    String raw = setting.getValue();
                    if (isSensitiveKey(key)) {
                        return decryptIfEncrypted(raw);
                    }
                    return raw;
                })
                .orElse(defaultValue);
    }

    private String decryptIfEncrypted(String value) {
        if (value == null || value.isBlank()) return value;
        try {
            return encryptionUtil.decrypt(value);
        } catch (Exception e) {
            // Fallback to raw if not yet encrypted or legacy plaintext
            return value;
        }
    }

    public boolean getSettingBoolean(String key, boolean defaultValue) {
        return settingRepository.findById(key)
                .map(setting -> "true".equalsIgnoreCase(setting.getValue()))
                .orElse(defaultValue);
    }
}
