package com.company.ftthgis.service.organization;

import com.company.ftthgis.domain.tenant.entity.Organization;
import com.company.ftthgis.domain.tenant.repository.OrganizationRepository;
import com.company.ftthgis.domain.user.entity.User;
import com.company.ftthgis.domain.user.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class TenantActivationService {

    private final RedisTemplate<String, Object> redisTemplate;
    private final ObjectMapper objectMapper;
    private final OrganizationRepository organizationRepository;
    private final UserRepository userRepository;

    @Value("${app.gateway.notification-url:http://ftth-notification-gateway:5001}")
    private String notificationGatewayUrl;

    @Value("${app.gateway.token:}")
    private String gatewayToken;

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    /**
     * Generates a 64-char activation token with 24h TTL, stores in Redis,
     * and dispatches activation email via notification-gateway.
     */
    public String createAndDispatchActivation(
            UUID orgId,
            String orgSlug,
            String orgName,
            UUID userId,
            String adminEmail,
            String adminUsername,
            String picName
    ) {
        String token = UUID.randomUUID().toString().replace("-", "") +
                       UUID.randomUUID().toString().replace("-", "");

        Map<String, String> tokenPayload = Map.of(
                "orgId", orgId.toString(),
                "orgSlug", orgSlug,
                "userId", userId.toString(),
                "adminEmail", adminEmail,
                "adminUsername", adminUsername,
                "orgName", orgName
        );

        try {
            String tokenJson = objectMapper.writeValueAsString(tokenPayload);
            String redisKey = "auth:activate:" + token;
            redisTemplate.opsForValue().set(redisKey, tokenJson, Duration.ofHours(24));
            redisTemplate.opsForValue().set("auth:org-activate-token:" + orgSlug, token, Duration.ofHours(24));
            log.info("🔑 Stored activation token in Redis for organization '{}' (TTL: 24h)", orgSlug);
        } catch (Exception e) {
            log.error("Failed storing activation token in Redis: {}", e.getMessage());
        }

        String activationUrl = "https://" + orgSlug + ".kdua.net/activate?token=" + token;

        // Dispatch activation email via notification-gateway asynchronously
        java.util.concurrent.CompletableFuture.runAsync(() -> {
            try {
                String endpoint = notificationGatewayUrl + "/api/v1/notification/email/activation";
                Map<String, String> emailReq = Map.of(
                        "to", adminEmail,
                        "recipient_name", (picName != null && !picName.isBlank()) ? picName : adminUsername,
                        "org_name", orgName,
                        "subdomain", orgSlug + ".kdua.net",
                        "activation_url", activationUrl,
                        "expires_in", "24 jam",
                        "lang", "id"
                );

                String reqBody = objectMapper.writeValueAsString(emailReq);
                HttpRequest request = HttpRequest.newBuilder()
                        .uri(URI.create(endpoint))
                        .header("Content-Type", "application/json")
                        .header("X-Gateway-Token", gatewayToken != null ? gatewayToken : "")
                        .POST(HttpRequest.BodyPublishers.ofString(reqBody))
                        .timeout(Duration.ofSeconds(10))
                        .build();

                HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
                if (response.statusCode() >= 200 && response.statusCode() < 300) {
                    log.info("✅ Magic activation link email successfully dispatched to {} for org {}", adminEmail, orgSlug);
                } else {
                    log.warn("⚠️ notification-gateway returned HTTP {} when sending activation email: {}",
                            response.statusCode(), response.body());
                }
            } catch (Exception ex) {
                log.error("❌ Non-fatal: Failed dispatching activation email to {}: {}", adminEmail, ex.getMessage());
            }
        });

        return activationUrl;
    }

    /**
     * Retrieves active activation link metadata for Super Admin inspection.
     */
    public Map<String, Object> getActiveActivationLink(String slug) {
        String token = (String) redisTemplate.opsForValue().get("auth:org-activate-token:" + slug);
        if (token == null || token.isBlank()) {
            return Map.of("active", false, "slug", slug);
        }
        String activationUrl = "https://" + slug + ".kdua.net/activate?token=" + token;
        Long ttl = redisTemplate.getExpire("auth:org-activate-token:" + slug);
        return Map.of(
                "active", true,
                "slug", slug,
                "token", token,
                "activationUrl", activationUrl,
                "expiresInSeconds", ttl != null ? ttl : 0
        );
    }

    /**
     * Resends activation email to Technical PIC of the organization.
     */
    public Map<String, Object> resendActivationLink(String slug) {
        Organization org = organizationRepository.findBySlug(slug)
                .orElseThrow(() -> new IllegalArgumentException("Organization with slug '" + slug + "' not found"));

        User owner = userRepository.findAll().stream()
                .filter(u -> u.getOrganization() != null && u.getOrganization().getId().equals(org.getId()))
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("Owner user for organization '" + slug + "' not found"));

        String activationUrl = createAndDispatchActivation(
                org.getId(),
                org.getSlug(),
                org.getName(),
                owner.getId(),
                owner.getEmail(),
                owner.getUsername(),
                owner.getFullName()
        );

        return Map.of(
                "success", true,
                "slug", slug,
                "adminEmail", owner.getEmail(),
                "activationUrl", activationUrl,
                "message", "Activation email re-dispatched successfully"
        );
    }
}
