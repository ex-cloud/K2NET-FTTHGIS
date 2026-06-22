package com.company.ftthgis.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

@Service
@RequiredArgsConstructor
@Slf4j
public class WhatsAppService {

    private final SystemSettingService settingsService;
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    @Value("${app.gateway.notification-url}")
    private String gatewayUrl;

    @Value("${app.gateway.token}")
    private String gatewayToken;

    /**
     * Send a WhatsApp message to a specific number via the notification-gateway.
     * If the gateway is disabled, logs the message and returns true.
     */
    public boolean sendMessage(String targetNumber, String message) {
        boolean enabled = settingsService.getSettingBoolean("wa_gateway_enabled", false);

        if (!enabled) {
            log.info("📢 [WhatsApp Service - MOCK FALLBACK]");
            log.info("To: {}", targetNumber);
            log.info("Message: {}", message);
            return true;
        }

        try {
            // Clean number format (remove non-digits, replace starting 0 with 62 for Indonesia)
            String cleanNumber = targetNumber.replaceAll("\\D", "");
            if (cleanNumber.startsWith("0")) {
                cleanNumber = "62" + cleanNumber.substring(1);
            }
            
            // E.164 country code format with '+'
            String formattedNumber = "+" + cleanNumber;

            String apiUrl = gatewayUrl + "/api/v1/notify";

            // Support standard JSON body payload: {"type": "whatsapp", "to": "whatsapp:+62...", "body": "..."}
            String escapedMessage = message
                    .replace("\\", "\\\\")
                    .replace("\"", "\\\"")
                    .replace("\n", "\\n")
                    .replace("\r", "\\r")
                    .replace("\t", "\\t");

            String jsonPayload = String.format(
                    "{\"type\":\"whatsapp\",\"to\":\"%s\",\"body\":\"%s\"}",
                    formattedNumber,
                    escapedMessage
            );

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(apiUrl))
                    .header("Content-Type", "application/json")
                    .header("X-Gateway-Token", gatewayToken)
                    .header("X-Idempotency-Key", java.util.UUID.randomUUID().toString())
                    .POST(HttpRequest.BodyPublishers.ofString(jsonPayload))
                    .timeout(Duration.ofSeconds(8))
                    .build();

            log.info("Sending WhatsApp request to notification-gateway: {}", apiUrl);
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                log.info("✅ WhatsApp message successfully sent via gateway to {}. Status: {}", formattedNumber, response.statusCode());
                return true;
            } else {
                log.error("❌ Failed to send WhatsApp message via gateway. Status: {}, Body: {}", response.statusCode(), response.body());
                return false;
            }
        } catch (Exception e) {
            log.error("❌ Exception occurred while sending WhatsApp message via gateway to {}", targetNumber, e);
            return false;
        }
    }

    /**
     * Send an OTP authentication code via WhatsApp.
     */
    public boolean sendOtp(String targetNumber, String otpCode) {
        String message = String.format("Kode OTP FTTH GIS Anda adalah: *%s*.\n\nJangan bagikan kode ini kepada siapapun termasuk petugas kami. Kode ini valid selama 5 menit.", otpCode);
        return sendMessage(targetNumber, message);
    }
}
