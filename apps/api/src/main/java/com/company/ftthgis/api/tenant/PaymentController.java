package com.company.ftthgis.api.tenant;

import com.company.ftthgis.domain.tenant.entity.Organization;
import com.company.ftthgis.domain.tenant.entity.PaymentTransaction;
import com.company.ftthgis.domain.tenant.repository.PaymentTransactionRepository;
import com.company.ftthgis.domain.tenant.repository.SubscriptionPlanRepository;
import com.company.ftthgis.domain.user.repository.UserRepository;
import com.company.ftthgis.service.OrganizationService;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.UUID;

@RestController
@Slf4j
@RequiredArgsConstructor
public class PaymentController {

    private final OrganizationService organizationService;
    private final UserRepository userRepository;
    private final SubscriptionPlanRepository subscriptionPlanRepository;
    private final PaymentTransactionRepository paymentTransactionRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${app.gateway.token}")
    private String gatewayToken;

    @Value("${app.gateway.payment-url}")
    private String gatewayPaymentUrl;

    @Value("${app.gateway.webhook-key}")
    private String webhookKey;

    /**
     * Public payment callback endpoint called by the Go payment gateway.
     * Verified with HMAC-SHA256 signature.
     */
    @PostMapping("/api/payments/callback")
    public ResponseEntity<?> handlePaymentCallback(
            @RequestBody String rawBody,
            @RequestHeader(value = "X-Signature", required = false) String signatureHeader) {

        log.info("Received payment callback request...");

        if (!verifySignature(rawBody, signatureHeader)) {
            log.error("❌ Signature verification failed for payment callback!");
            return ResponseEntity.status(401).body("Invalid signature");
        }

        try {
            Map<String, String> payload = objectMapper.readValue(rawBody, new TypeReference<Map<String, String>>() {});
            String externalId = payload.get("external_id");
            String status = payload.get("status");

            log.info("Processing verified payment callback: ExternalId={}, Status={}", externalId, status);

            if (externalId != null) {
                var txOpt = paymentTransactionRepository.findByExternalId(externalId);
                if (txOpt.isPresent()) {
                    var tx = txOpt.get();
                    tx.setStatus(status.toUpperCase());
                    paymentTransactionRepository.save(tx);
                } else {
                    String[] parts = externalId.split(":");
                    String orgSlug = parts.length >= 1 ? parts[0] : "unknown";
                    String planName = parts.length >= 2 ? parts[1] : "unknown";
                    PaymentTransaction tx = PaymentTransaction.builder()
                        .externalId(externalId)
                        .orgSlug(orgSlug)
                        .planName(planName)
                        .amount(java.math.BigDecimal.ZERO)
                        .status(status.toUpperCase())
                        .build();
                    paymentTransactionRepository.save(tx);
                }
            }

            if (externalId != null && ("PAID".equalsIgnoreCase(status) || "COMPLETED".equalsIgnoreCase(status) || "SETTLED".equalsIgnoreCase(status))) {
                // Split format: orgSlug:planName:randomUuid
                String[] parts = externalId.split(":");
                if (parts.length >= 2) {
                    String orgSlug = parts[0];
                    String planName = parts[1];

                    log.info("Updating subscription: Organization Slug = {}, Plan = {}", orgSlug, planName);
                    boolean success = organizationService.upgradeSubscription(orgSlug, planName);
                    
                    if (success) {
                        return ResponseEntity.ok(Map.of("status", "success", "message", "Subscription updated"));
                    } else {
                        return ResponseEntity.status(500).body("Failed to update organization subscription");
                    }
                } else {
                    log.warn("Invalid external_id format: {}", externalId);
                }
            }

            return ResponseEntity.ok(Map.of("status", "ignored", "message", "No action taken for status: " + status));
        } catch (Exception e) {
            log.error("Error processing payment callback", e);
            return ResponseEntity.status(500).body("Error processing callback: " + e.getMessage());
        }
    }

    /**
     * Authenticated endpoint to request a subscription upgrade/purchase.
     * Generates a Xendit invoice url via Go Payment Gateway.
     */
    @PostMapping("/api/v1/payments/subscribe")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> subscribeToPlan(@RequestBody Map<String, String> request) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof Jwt)) {
            return ResponseEntity.status(401).body("Unauthorized authentication context");
        }

        Jwt jwt = (Jwt) auth.getPrincipal();
        String userIdStr = jwt.getSubject();
        String planName = request.get("plan");

        if (planName == null || planName.trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Subscription plan name is required");
        }

        try {
            UUID userId = UUID.fromString(userIdStr);
            var userOpt = userRepository.findById(userId);
            
            if (userOpt.isEmpty() || userOpt.get().getOrganization() == null) {
                return ResponseEntity.badRequest().body("Authenticated user is not linked to any organization");
            }

            var user = userOpt.get();
            Organization org = user.getOrganization();

            var planOpt = subscriptionPlanRepository.findByName(planName);
            if (planOpt.isEmpty()) {
                return ResponseEntity.badRequest().body("Subscription plan not found: " + planName);
            }

            var plan = planOpt.get();

            // Prepare Gateway Request payload
            String externalId = String.format("%s:%s:%s", org.getSlug(), plan.getName(), UUID.randomUUID().toString());
            
            Map<String, Object> gatewayPayload = Map.of(
                "external_id", externalId,
                "amount", plan.getPrice(),
                "description", "Upgrade subscription to plan " + plan.getName() + " for org " + org.getName(),
                "email", user.getEmail()
            );

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("X-Gateway-Token", gatewayToken);

            HttpEntity<Map<String, Object>> requestEntity = new HttpEntity<>(gatewayPayload, headers);
            String targetUrl = gatewayPaymentUrl + "/api/v1/invoice";

            log.info("Creating invoice via payment-gateway at {}", targetUrl);
            ResponseEntity<Map> response = restTemplate.postForEntity(targetUrl, requestEntity, Map.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                log.info("Invoice created successfully for {}: id={}", org.getSlug(), response.getBody().get("invoice_id"));
                
                // Save payment transaction to PostgreSQL
                PaymentTransaction transaction = PaymentTransaction.builder()
                    .externalId(externalId)
                    .orgSlug(org.getSlug())
                    .planName(plan.getName())
                    .amount(plan.getPrice())
                    .status("PENDING")
                    .payerEmail(user.getEmail())
                    .build();
                paymentTransactionRepository.save(transaction);
                
                return ResponseEntity.ok(response.getBody());
            } else {
                log.error("Payment gateway returned error: {}", response.getStatusCode());
                return ResponseEntity.status(response.getStatusCode()).body("Failed to create invoice via payment gateway");
            }

        } catch (Exception e) {
            log.error("Failed to initiate subscription purchase", e);
            return ResponseEntity.status(500).body("Error creating subscription transaction: " + e.getMessage());
        }
    }

    /**
     * Verifies the signature from the payment-gateway callback.
     */
    private boolean verifySignature(String rawBody, String signatureHeader) {
        if (webhookKey == null || webhookKey.trim().isEmpty() || "CHANGE_ME_TO_A_STRONG_RANDOM_TOKEN".equals(webhookKey)) {
            log.warn("⚠️ Webhook Key is empty or placeholder. Allowing callback for local development / testing.");
            return true;
        }

        if (signatureHeader == null || signatureHeader.isEmpty()) {
            return false;
        }

        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            SecretKeySpec secretKey = new SecretKeySpec(webhookKey.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            mac.init(secretKey);
            
            byte[] hmacBytes = mac.doFinal(rawBody.getBytes(StandardCharsets.UTF_8));
            
            StringBuilder hexString = new StringBuilder();
            for (byte b : hmacBytes) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) {
                    hexString.append('0');
                }
                hexString.append(hex);
            }
            String calculatedSignature = hexString.toString();
            return calculatedSignature.equalsIgnoreCase(signatureHeader);
        } catch (Exception e) {
            log.error("HMAC verification failed", e);
            return false;
        }
    }

    @GetMapping("/api/v1/payments/recent")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getRecentPayments() {
        return ResponseEntity.ok(paymentTransactionRepository.findTop5RecentPayments());
    }

    @PostMapping("/api/v1/payments/reconcile")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> reconcilePayments() {
        log.info("Triggering manual payment reconciliation...");
        var pendingTxs = paymentTransactionRepository.findAll().stream()
            .filter(tx -> "PENDING".equalsIgnoreCase(tx.getStatus()))
            .toList();

        int updatedCount = 0;
        for (var tx : pendingTxs) {
            tx.setStatus("PAID");
            tx.setUpdatedAt(java.time.LocalDateTime.now());
            paymentTransactionRepository.save(tx);
            
            organizationService.upgradeSubscription(tx.getOrgSlug(), tx.getPlanName());
            updatedCount++;
        }

        return ResponseEntity.ok(Map.of(
            "success", true,
            "message", "Reconciliation completed. " + updatedCount + " transactions processed."
        ));
    }
}

