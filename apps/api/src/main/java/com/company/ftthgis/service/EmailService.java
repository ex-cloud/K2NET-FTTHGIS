package com.company.ftthgis.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.internet.MimeMessage;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Properties;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final SystemSettingService settingsService;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    @Value("${app.gateway.notification-url:http://localhost:5001}")
    private String gatewayUrl;

    @Value("${app.gateway.token:}")
    private String gatewayToken;

    /**
     * Dispatches a 6-digit MFA OTP verification email synchronously via notification-gateway (:5001),
     * falling back to sendEmail if the gateway is unreachable.
     */
    public boolean sendMfaOtpEmail(String to, String recipientName, String otpCode, String clientIp) {
        if (gatewayUrl != null && !gatewayUrl.isBlank()) {
            try {
                String endpoint = gatewayUrl.replaceAll("/+$", "") + "/api/v1/notification/email/mfa-otp";
                Map<String, String> payload = new LinkedHashMap<>();
                payload.put("to", to);
                payload.put("recipient_name", (recipientName != null && !recipientName.isBlank()) ? recipientName : to);
                payload.put("otp_code", otpCode);
                payload.put("expires_in", "5 menit");
                payload.put("client_ip", (clientIp != null && !clientIp.isBlank()) ? clientIp : "unknown");
                payload.put("lang", "id");

                String jsonBody = objectMapper.writeValueAsString(payload);
                HttpRequest.Builder reqBuilder = HttpRequest.newBuilder()
                        .uri(URI.create(endpoint))
                        .header("Content-Type", "application/json")
                        .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
                        .timeout(Duration.ofSeconds(10));

                if (gatewayToken != null && !gatewayToken.isBlank()) {
                    reqBuilder.header("X-Gateway-Token", gatewayToken);
                }

                HttpResponse<String> response = httpClient.send(reqBuilder.build(), HttpResponse.BodyHandlers.ofString());
                if (response.statusCode() >= 200 && response.statusCode() < 300) {
                    log.info("✅ MFA OTP email dispatched via notification-gateway to {}", to);
                    return true;
                } else {
                    log.warn("⚠️ notification-gateway returned HTTP {} for MFA OTP email to {}: {}",
                            response.statusCode(), to, response.body());
                }
            } catch (Exception e) {
                log.warn("⚠️ Failed to dispatch MFA OTP email via notification-gateway to {}: {}", to, e.getMessage());
            }
        }

        String subject = "[K2NET FTTH] Kode Verifikasi Masuk (MFA OTP): " + otpCode;
        String htmlBody = "<div style=\"font-family: Inter, -apple-system, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; background: #09090b; color: #fafafa; border: 1px solid #27272a; border-radius: 12px;\">"
                + "<h2 style=\"margin: 0 0 12px; font-size: 18px; font-weight: 600;\">Verifikasi Autentikasi Dua Faktor Email</h2>"
                + "<p style=\"font-size: 13px; color: #a1a1aa; line-height: 1.6;\">Masukkan kode verifikasi 6 digit berikut untuk mengaktifkan metode <strong>Email Authentication (2FA)</strong> pada akun K2NET FTTH Anda:</p>"
                + "<div style=\"margin: 20px 0; padding: 16px; background: #18181b; border: 1px solid #3f3f46; border-radius: 8px; text-align: center; font-family: monospace; font-size: 28px; font-weight: 700; letter-spacing: 8px; color: #ffffff;\">"
                + otpCode
                + "</div>"
                + "<p style=\"font-size: 12px; color: #71717a;\">Kode ini berlaku selama 5 menit dan hanya dapat digunakan satu kali.</p>"
                + "</div>";
        return sendEmail(to, subject, htmlBody);
    }

    /**
     * Sends an HTML email via notification-gateway (:5001), falling back to direct SMTP from system_settings.
     */
    public boolean sendEmail(String to, String subject, String body) {
        if (gatewayUrl != null && !gatewayUrl.isBlank()) {
            try {
                String endpoint = gatewayUrl.replaceAll("/+$", "") + "/api/v1/notify";
                Map<String, String> payload = new LinkedHashMap<>();
                payload.put("type", "email");
                payload.put("to", to);
                payload.put("subject", subject);
                payload.put("body", body);

                String jsonBody = objectMapper.writeValueAsString(payload);
                HttpRequest.Builder reqBuilder = HttpRequest.newBuilder()
                        .uri(URI.create(endpoint))
                        .header("Content-Type", "application/json")
                        .header("X-Idempotency-Key", UUID.randomUUID().toString())
                        .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
                        .timeout(Duration.ofSeconds(10));

                if (gatewayToken != null && !gatewayToken.isBlank()) {
                    reqBuilder.header("X-Gateway-Token", gatewayToken);
                }

                HttpResponse<String> response = httpClient.send(reqBuilder.build(), HttpResponse.BodyHandlers.ofString());
                if (response.statusCode() >= 200 && response.statusCode() < 300) {
                    log.info("✅ Email enqueued via notification-gateway to {}", to);
                    return true;
                } else {
                    log.warn("⚠️ notification-gateway /api/v1/notify returned HTTP {} for {}: {}",
                            response.statusCode(), to, response.body());
                }
            } catch (Exception e) {
                log.warn("⚠️ notification-gateway unreachable for email to {}, falling back to direct SMTP: {}", to, e.getMessage());
            }
        }

        String host = settingsService.getSettingValue("smtp_host", "mail.kdua.net");
        int port = 587;
        try {
            port = Integer.parseInt(settingsService.getSettingValue("smtp_port", "587"));
        } catch (NumberFormatException e) {
            log.warn("Invalid SMTP port in settings, using default 587");
        }
        String username = settingsService.getSettingValue("smtp_username", "notify@kdua.net");
        String password = settingsService.getSettingValue("smtp_password", "");
        String from = settingsService.getSettingValue("smtp_from", "notify@kdua.net");

        log.info("📧 Sending email to {} via SMTP server {}:{} (from: {})...", to, host, port, from);

        try {
            JavaMailSenderImpl mailSender = new JavaMailSenderImpl();
            mailSender.setHost(host);
            mailSender.setPort(port);
            mailSender.setUsername(username);
            mailSender.setPassword(password);

            Properties props = mailSender.getJavaMailProperties();
            props.put("mail.transport.protocol", "smtp");
            props.put("mail.smtp.auth", "true");
            
            // Support SSL for port 465, STARTTLS for others
            if (port == 465) {
                props.put("mail.smtp.socketFactory.port", "465");
                props.put("mail.smtp.socketFactory.class", "javax.net.ssl.SSLSocketFactory");
                props.put("mail.smtp.socketFactory.fallback", "false");
                props.put("mail.smtp.ssl.enable", "true");
            } else {
                props.put("mail.smtp.starttls.enable", "true");
            }
            
            props.put("mail.debug", "false");

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(from, "FTTH GIS Platform");
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(body, true); // HTML content

            mailSender.send(message);
            log.info("✅ Email successfully sent to {}", to);
            return true;
        } catch (Exception e) {
            log.error("❌ Failed to send email to {} via SMTP: {}", to, e.getMessage(), e);
            return false;
        }
    }
}
