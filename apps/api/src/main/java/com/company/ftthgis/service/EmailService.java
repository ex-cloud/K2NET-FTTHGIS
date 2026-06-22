package com.company.ftthgis.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.internet.MimeMessage;
import java.util.Properties;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final SystemSettingService settingsService;

    /**
     * Sends an HTML email using SMTP configurations from the database.
     */
    public boolean sendEmail(String to, String subject, String body) {
        String host = settingsService.getSettingValue("smtp_host", "smtp-relay.brevo.com");
        int port = 587;
        try {
            port = Integer.parseInt(settingsService.getSettingValue("smtp_port", "587"));
        } catch (NumberFormatException e) {
            log.warn("Invalid SMTP port in settings, using default 587");
        }
        String username = settingsService.getSettingValue("smtp_username", "smtp_user");
        String password = settingsService.getSettingValue("smtp_password", "smtp_pass");
        String from = settingsService.getSettingValue("smtp_from", "noreply@ftthgis.com");

        log.info("📧 Sending email to {} via SMTP server {}:{}...", to, host, port);

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
            helper.setFrom(from);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(body, true); // HTML content

            mailSender.send(message);
            log.info("✅ Email successfully sent to {}", to);
            return true;
        } catch (Exception e) {
            log.error("❌ Failed to send email to {} via SMTP", to, e);
            return false;
        }
    }
}
