package com.company.ftthgis.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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

    /**
     * Send a WhatsApp message to a specific number.
     * If the gateway is disabled, logs the message and returns true.
     */
    public boolean sendMessage(String targetNumber, String message) {
        boolean enabled = settingsService.getSettingBoolean("wa_gateway_enabled", false);
        String apiUrl = settingsService.getSettingValue("wa_gateway_api_url", "https://api.whatsapp-gateway.com/send");
        String token = settingsService.getSettingValue("wa_gateway_token", "");

        if (!enabled) {
            log.info("📢 [WhatsApp Service - MOCK FALLBACK]");
            log.info("To: {}", targetNumber);
            log.info("Message: {}", message);
            return true;
        }

        if (token.isEmpty() || "token_secret_placeholder".equals(token)) {
            log.warn("⚠️ WhatsApp Service is enabled but token is not configured or is placeholder!");
            return false;
        }

        try {
            // Clean number format (remove non-digits, replace starting 0 with 62 for Indonesia)
            String cleanNumber = targetNumber.replaceAll("\\D", "");
            if (cleanNumber.startsWith("0")) {
                cleanNumber = "62" + cleanNumber.substring(1);
            }

            // Support standard JSON body payload: {"target": "...", "message": "..."} or {"to": "...", "text": "..."}
            // For Fonnte style compatibility
            String jsonPayload = String.format("{\"target\":\"%s\",\"message\":\"%s\"}", cleanNumber, message.replace("\"", "\\\""));

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(apiUrl))
                    .header("Content-Type", "application/json")
                    .header("Authorization", token) // Fonnte and many API gateways use direct token in Authorization
                    .POST(HttpRequest.BodyPublishers.ofString(jsonPayload))
                    .timeout(Duration.ofSeconds(8))
                    .build();

            log.info("Sending WhatsApp request to: {}", apiUrl);
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                log.info("✅ WhatsApp message successfully sent to {}. Status: {}", cleanNumber, response.statusCode());
                return true;
            } else {
                log.error("❌ Failed to send WhatsApp message. Status: {}, Body: {}", response.statusCode(), response.body());
                return false;
            }
        } catch (Exception e) {
            log.error("❌ Exception occurred while sending WhatsApp message to {}", targetNumber, e);
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
