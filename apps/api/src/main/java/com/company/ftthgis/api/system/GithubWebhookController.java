package com.company.ftthgis.api.system;

import com.company.ftthgis.service.GithubAppConfigService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Map;

@RestController
@RequestMapping("/api/github")
@RequiredArgsConstructor
@Slf4j
public class GithubWebhookController {

    private final GithubAppConfigService githubAppConfigService;

    @Value("${app.devops.github.webhook-secret:}")
    private String webhookSecret;

    @PostMapping("/webhook")
    public ResponseEntity<?> handleWebhook(
            @RequestHeader(value = "X-Hub-Signature-256", required = false) String signatureHeader,
            @RequestHeader(value = "X-GitHub-Event", required = false) String event,
            @RequestBody byte[] payload
    ) {
        log.info("Received GitHub webhook event: {}", event);

        String secret = webhookSecret;
        if ((secret == null || secret.isBlank())) {
            secret = githubAppConfigService.getConfig("github_app_webhook_secret")
                    .map(config -> config.getValue())
                    .orElse(null);
        }

        if (secret == null || secret.isBlank()) {
            log.warn("GitHub webhook secret is not configured. Rejecting request.");
            return ResponseEntity.status(500).body(Map.of("error", "Webhook secret not configured"));
        }

        if (signatureHeader == null || !signatureHeader.startsWith("sha256=")) {
            log.warn("Missing or invalid GitHub webhook signature header.");
            return ResponseEntity.badRequest().body(Map.of("error", "Missing or invalid signature header"));
        }

        byte[] expectedBytes = hexToBytes(signatureHeader.substring(7));
        byte[] actualBytes = calculateSignature(payload, secret);

        if (!MessageDigest.isEqual(expectedBytes, actualBytes)) {
            log.warn("GitHub webhook signature verification failed. Event: {}", event);
            return ResponseEntity.status(401).body(Map.of("error", "Invalid signature"));
        }

        log.info("GitHub webhook payload verified successfully for event: {}", event);

        // Additional webhook handling logic can be added here
        return ResponseEntity.ok(Map.of("success", true, "event", event));
    }

    private byte[] calculateSignature(byte[] payload, String secret) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            return mac.doFinal(payload);
        } catch (Exception e) {
            throw new IllegalStateException("Failed to calculate webhook signature", e);
        }
    }

    private byte[] hexToBytes(String hex) {
        int len = hex.length();
        byte[] data = new byte[len / 2];
        for (int i = 0; i < len; i += 2) {
            data[i / 2] = (byte) ((Character.digit(hex.charAt(i), 16) << 4)
                    + Character.digit(hex.charAt(i + 1), 16));
        }
        return data;
    }
}
