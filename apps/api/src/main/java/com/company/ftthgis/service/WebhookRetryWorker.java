package com.company.ftthgis.service;

import com.company.ftthgis.config.security.WebhookSecurityValidator;
import com.company.ftthgis.domain.tenant.entity.TenantWebhookLog;
import com.company.ftthgis.domain.tenant.repository.TenantWebhookLogRepository;
import com.company.ftthgis.util.SecretEncryptionUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;

/**
 * WebhookRetryWorker — Background daemon implementing Exponential Backoff retries and Dead Letter Queue (DLQ).
 * 
 * Retry Intervals:
 *  - Attempt 1: Immediate (0s)
 *  - Attempt 2: +30s
 *  - Attempt 3: +5m (300s)
 *  - Attempt 4: +30m (1800s)
 *  - Max attempts: 4 -> Marks status as FAILED_DLQ.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class WebhookRetryWorker {

    private final TenantWebhookLogRepository logRepository;
    private final WebhookSecurityValidator securityValidator;
    private final SecretEncryptionUtil encryptionUtil;

    private static final int[] BACKOFF_SECONDS = {0, 30, 300, 1800};

    @Scheduled(fixedDelay = 15000) // Poll every 15s
    @Transactional
    public void processPendingRetries() {
        List<TenantWebhookLog> pendingLogs = logRepository.findByDeliveryStatusAndNextRetryAtLessThanEqual(
                "RETRYING", LocalDateTime.now()
        );

        if (pendingLogs.isEmpty()) {
            return;
        }

        log.info("Processing {} pending webhook retries from queue...", pendingLogs.size());

        for (TenantWebhookLog item : pendingLogs) {
            retrySingleDelivery(item);
        }
    }

    public void retrySingleDelivery(TenantWebhookLog item) {
        int currentAttempt = item.getRetryCount() + 1;
        item.setRetryCount(currentAttempt);
        item.setLastAttemptAt(LocalDateTime.now());

        String targetUrl = item.getTargetUrl();
        String payload = item.getRequestPayload() != null ? item.getRequestPayload() : "{}";

        // Pre-flight SSRF Guard
        try {
            securityValidator.validateUrl(targetUrl);
        } catch (Exception e) {
            log.warn("Retry SSRF rejected for log '{}': {}", item.getId(), e.getMessage());
            item.setDeliveryStatus("FAILED_DLQ");
            item.setErrorMessage("SSRF Policy Violation during retry: " + e.getMessage());
            item.setNextRetryAt(null);
            logRepository.save(item);
            return;
        }

        long startTime = System.currentTimeMillis();
        int httpStatus = 0;
        int latencyMs = 0;
        String responseBody = "";
        String errorMessage = null;
        boolean success = false;

        try {
            HttpClient client = HttpClient.newBuilder()
                    .connectTimeout(Duration.ofSeconds(5))
                    .build();

            HttpRequest.Builder reqBuilder = HttpRequest.newBuilder()
                    .uri(URI.create(targetUrl))
                    .timeout(Duration.ofSeconds(5))
                    .header("Content-Type", "application/json")
                    .header("User-Agent", "K2NET-FTTH-Webhook-Engine/1.0")
                    .header("X-K2NET-Event", item.getEventName())
                    .header("X-K2NET-Retry-Count", String.valueOf(currentAttempt))
                    .POST(HttpRequest.BodyPublishers.ofString(payload));

            HttpResponse<String> response = client.send(reqBuilder.build(), HttpResponse.BodyHandlers.ofString());
            latencyMs = (int) (System.currentTimeMillis() - startTime);
            httpStatus = response.statusCode();
            responseBody = response.body();
            if (responseBody != null && responseBody.length() > 1000) {
                responseBody = responseBody.substring(0, 1000) + "... [truncated]";
            }
            success = httpStatus >= 200 && httpStatus < 300;
        } catch (Exception e) {
            latencyMs = (int) (System.currentTimeMillis() - startTime);
            errorMessage = e.getMessage();
        }

        item.setHttpStatus(httpStatus);
        item.setLatencyMs(latencyMs);
        item.setResponseBody(responseBody);
        item.setErrorMessage(errorMessage);

        if (success) {
            item.setDeliveryStatus("SUCCESS");
            item.setNextRetryAt(null);
            log.info("Webhook delivery succeeded on retry attempt {} for log '{}'", currentAttempt, item.getId());
        } else {
            if (currentAttempt >= item.getMaxRetries()) {
                item.setDeliveryStatus("FAILED_DLQ");
                item.setNextRetryAt(null);
                log.warn("Webhook delivery failed max retries ({}). Moved log '{}' to FAILED_DLQ.", currentAttempt, item.getId());
            } else {
                item.setDeliveryStatus("RETRYING");
                int delaySec = currentAttempt < BACKOFF_SECONDS.length ? BACKOFF_SECONDS[currentAttempt] : 1800;
                item.setNextRetryAt(LocalDateTime.now().plusSeconds(delaySec));
                log.info("Webhook delivery failed (HTTP {}). Scheduled retry attempt {} at +{}s for log '{}'",
                        httpStatus, currentAttempt + 1, delaySec, item.getId());
            }
        }

        logRepository.save(item);
    }
}
